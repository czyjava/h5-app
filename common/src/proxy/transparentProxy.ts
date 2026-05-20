import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin, ViteDevServer } from 'vite';
import { Buffer } from 'node:buffer';
import type { ReplicaAppConfig, ReplicaHostConfig } from '../types.ts';
import { redactHeaders, redactText, redactUrl } from '../redaction.ts';
import { buildReplicaUpstreamHeaders } from '../network/replicaNetwork.ts';
import { buildSignedReplicaUrl } from './magicSign.ts';

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

export interface ReplicaProxyOptions {
  environmentQueryKey?: string;
  maxEventCount?: number;
  maxBodyPreview?: number;
}

interface BodyPreview {
  size: number;
  text: string;
  truncated: boolean;
  contentType?: string;
}

interface ProxyLifecycleEvent {
  sequence: number;
  time: string;
  id: string;
  phase:
    | 'accepted'
    | 'signing'
    | 'signed-request'
    | 'upstream-request'
    | 'upstream-response'
    | 'response-body'
    | 'completed'
    | 'error'
    | 'cleared';
  method?: string;
  prefix?: string;
  localUrl?: string;
  upstreamUrl?: string;
  status?: number;
  statusText?: string;
  durationMs?: number;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  requestBody?: BodyPreview;
  responseBody?: BodyPreview;
  signing?: {
    algorithm: string;
    addedParams: string[];
    unsignedUrl: string;
    signedUrl: string;
  };
  error?: string;
}

function nowLabel() {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    hour12: false,
  }).format(new Date());
}

function flattenHeaderValue(value: string | string[] | undefined) {
  if (!value) {
    return '';
  }
  return Array.isArray(value) ? value.join(', ') : value;
}

function headersForUpstream(req: IncomingMessage, bodyLength: number) {
  // 上游请求头按 APP 抓包画像重建，不透传浏览器 sec-*、referer、cookie 等本地头。
  return buildReplicaUpstreamHeaders({
    bodyLength,
    contentType: flattenHeaderValue(req.headers['content-type']),
    contentEncoding: flattenHeaderValue(req.headers['content-encoding']),
  });
}

function headersForBrowser(headers: Headers) {
  const safeHeaders = new Headers();
  headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(lowerKey) || lowerKey === 'content-encoding' || lowerKey === 'content-length') {
      return;
    }
    safeHeaders.set(key, value);
  });
  return safeHeaders;
}

async function readRequestBody(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function makeBodyPreview(buffer: Buffer, maxBodyPreview: number, contentType?: string): BodyPreview {
  if (buffer.length === 0) {
    return { size: 0, text: '', truncated: false, contentType };
  }

  const looksTextual = !contentType || /json|text|xml|x-www-form-urlencoded|javascript/i.test(contentType);
  if (!looksTextual) {
    return {
      size: buffer.length,
      text: `二进制内容 ${buffer.length} bytes`,
      truncated: buffer.length > maxBodyPreview,
      contentType,
    };
  }

  const previewBuffer = buffer.subarray(0, maxBodyPreview);
  return {
    size: buffer.length,
    text: redactText(previewBuffer.toString('utf8')),
    truncated: buffer.length > maxBodyPreview,
    contentType,
  };
}

function writeJson(res: ServerResponse, body: unknown) {
  res.statusCode = 200;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function findProxyTarget(url: string, hosts: ReplicaHostConfig[]) {
  return hosts.find((host) => {
    const prefix = host.proxyPrefix;
    return url === prefix || url.startsWith(`${prefix}/`) || url.startsWith(`${prefix}?`);
  });
}

function resolveUpstreamUrl(localUrl: string, host: ReplicaHostConfig, environmentQueryKey: string) {
  const upstreamPath = localUrl.replace(host.proxyPrefix, '') || '/';
  const url = new URL(upstreamPath, host.productionTarget);
  const useTestTarget = url.searchParams.get(environmentQueryKey) === 'test';
  // 环境参数只给本地代理消费，签名和上游请求不能带内部标记。
  url.searchParams.delete(environmentQueryKey);
  const target = useTestTarget && host.testTarget ? host.testTarget : host.productionTarget;
  return new URL(`${url.pathname}${url.search}${url.hash}`, target).toString();
}

function setupLifecycleDebugEndpoints(
  server: ViteDevServer,
  lifecycleEvents: ProxyLifecycleEvent[],
  lifecycleClients: Set<ServerResponse>,
  emitLifecycleEvent: (event: Omit<ProxyLifecycleEvent, 'sequence' | 'time'>) => void,
) {
  server.middlewares.use((req, res, next) => {
    const url = req.url ?? '';
    if (url === '/__replica_proxy_events/snapshot') {
      writeJson(res, { events: lifecycleEvents });
      return;
    }
    if (url === '/__replica_proxy_events/clear') {
      lifecycleEvents.splice(0, lifecycleEvents.length);
      emitLifecycleEvent({ id: 'system', phase: 'cleared' });
      writeJson(res, { success: true });
      return;
    }
    if (url === '/__replica_proxy_events/stream') {
      res.statusCode = 200;
      res.setHeader('content-type', 'text/event-stream; charset=utf-8');
      res.setHeader('cache-control', 'no-cache, no-transform');
      res.setHeader('connection', 'keep-alive');
      res.write('retry: 1000\n\n');
      lifecycleClients.add(res);
      req.on('close', () => lifecycleClients.delete(res));
      return;
    }
    next();
  });
}

export function createReplicaTransparentProxyPlugin(
  config: ReplicaAppConfig,
  options: ReplicaProxyOptions = {},
): Plugin {
  const environmentQueryKey = options.environmentQueryKey ?? '__replica_env';
  const maxEventCount = options.maxEventCount ?? 360;
  const maxBodyPreview = options.maxBodyPreview ?? 1024 * 1024;
  const lifecycleEvents: ProxyLifecycleEvent[] = [];
  const lifecycleClients = new Set<ServerResponse>();
  const hosts = Object.values(config.hosts);
  let eventSequence = 0;
  let requestSequence = 0;

  function emitLifecycleEvent(event: Omit<ProxyLifecycleEvent, 'sequence' | 'time'>) {
    const fullEvent: ProxyLifecycleEvent = {
      sequence: ++eventSequence,
      time: nowLabel(),
      ...event,
    };
    lifecycleEvents.push(fullEvent);
    if (lifecycleEvents.length > maxEventCount) {
      lifecycleEvents.splice(0, lifecycleEvents.length - maxEventCount);
    }

    const payload = `data: ${JSON.stringify(fullEvent)}\n\n`;
    for (const client of lifecycleClients) {
      client.write(payload);
    }

    // 代理生命周期只输出脱敏内容，方便本地调试。
    console.info('[Replica Proxy]', fullEvent);
  }

  return {
    name: `replica-transparent-proxy-${config.appId}`,
    configureServer(server) {
      setupLifecycleDebugEndpoints(server, lifecycleEvents, lifecycleClients, emitLifecycleEvent);
      server.middlewares.use(async (req, res, next) => {
        const localUrl = req.url ?? '';
        const host = findProxyTarget(localUrl, hosts);
        if (!host) {
          next();
          return;
        }

        const id = `${Date.now().toString(36)}-${(++requestSequence).toString(36)}`;
        const startedAt = Date.now();
        const method = req.method ?? 'GET';
        const upstreamUrl = resolveUpstreamUrl(localUrl, host, environmentQueryKey);

        emitLifecycleEvent({
          id,
          phase: 'accepted',
          method,
          prefix: host.proxyPrefix,
          localUrl: redactUrl(localUrl),
          upstreamUrl: redactUrl(upstreamUrl),
          requestHeaders: redactHeaders(req.headers as IncomingHttpHeaders),
        });

        try {
          const requestBody = method === 'GET' || method === 'HEAD' ? Buffer.alloc(0) : await readRequestBody(req);
          const signedUrlResult = buildSignedReplicaUrl(upstreamUrl, host.signKey, host.extraQuery);
          const upstreamHeaders = headersForUpstream(req, requestBody.length);

          emitLifecycleEvent({
            id,
            phase: 'signing',
            method,
            prefix: host.proxyPrefix,
            upstreamUrl: redactUrl(upstreamUrl),
            signing: {
              algorithm: host.signKey ? 'SignUrl1 + _r + _v' : 'none',
              addedParams: signedUrlResult.addedParams,
              unsignedUrl: redactUrl(signedUrlResult.unsignedUrl),
              signedUrl: redactUrl(signedUrlResult.signedUrl),
            },
          });

          emitLifecycleEvent({
            id,
            phase: 'signed-request',
            method,
            prefix: host.proxyPrefix,
            upstreamUrl: redactUrl(signedUrlResult.signedUrl),
          });

          emitLifecycleEvent({
            id,
            phase: 'upstream-request',
            method,
            prefix: host.proxyPrefix,
            upstreamUrl: redactUrl(signedUrlResult.signedUrl),
            requestHeaders: redactHeaders(upstreamHeaders),
            requestBody: makeBodyPreview(requestBody, maxBodyPreview, flattenHeaderValue(req.headers['content-type'])),
          });

          const upstreamResponse = await fetch(signedUrlResult.signedUrl, {
            method,
            headers: upstreamHeaders,
            body: requestBody.length > 0 ? requestBody : undefined,
            redirect: 'manual',
          });

          emitLifecycleEvent({
            id,
            phase: 'upstream-response',
            method,
            prefix: host.proxyPrefix,
            upstreamUrl: redactUrl(signedUrlResult.signedUrl),
            status: upstreamResponse.status,
            statusText: upstreamResponse.statusText,
            responseHeaders: redactHeaders(upstreamResponse.headers),
          });

          const responseBuffer = Buffer.from(await upstreamResponse.arrayBuffer());
          emitLifecycleEvent({
            id,
            phase: 'response-body',
            method,
            prefix: host.proxyPrefix,
            upstreamUrl: redactUrl(signedUrlResult.signedUrl),
            status: upstreamResponse.status,
            responseBody: makeBodyPreview(responseBuffer, maxBodyPreview, upstreamResponse.headers.get('content-type') ?? undefined),
          });

          res.statusCode = upstreamResponse.status;
          res.statusMessage = upstreamResponse.statusText;
          headersForBrowser(upstreamResponse.headers).forEach((value, key) => res.setHeader(key, value));
          res.setHeader('x-replica-proxy-debug-id', id);
          res.end(responseBuffer);

          emitLifecycleEvent({
            id,
            phase: 'completed',
            method,
            prefix: host.proxyPrefix,
            upstreamUrl: redactUrl(signedUrlResult.signedUrl),
            status: upstreamResponse.status,
            durationMs: Date.now() - startedAt,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : '代理请求失败';
          emitLifecycleEvent({
            id,
            phase: 'error',
            method,
            prefix: host.proxyPrefix,
            upstreamUrl: redactUrl(upstreamUrl),
            durationMs: Date.now() - startedAt,
            error: redactText(message),
          });
          res.statusCode = 502;
          res.setHeader('content-type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ success: false, errorCode: 502, message: '本地代理请求失败', data: null }));
        }
      });
    },
  };
}
