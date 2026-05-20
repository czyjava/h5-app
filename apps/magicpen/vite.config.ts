import { defineConfig, type Plugin, type ViteDevServer } from 'vite';
import vue from '@vitejs/plugin-vue';
import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'node:http';
import { Buffer } from 'node:buffer';
import { createHash, randomUUID } from 'node:crypto';
import { gzipSync } from 'node:zlib';

interface ProxyTargetConfig {
  target: string;
  testTarget?: string;
  signKey?: string;
  extraQuery?: Record<string, string>;
}

const BUSINESS_ENV_QUERY_KEY = '__magicpen_env';
const BUSINESS_PRODUCTION_TARGET = 'https://pixel-studio.wanmeixiangsu.cn';
const BUSINESS_TEST_TARGET = 'https://pixel-studio.ttt.wanmeixiangsu.cn';

const PROXY_TARGETS: Record<string, ProxyTargetConfig> = {
  '/magicpen-business': {
    target: BUSINESS_PRODUCTION_TARGET,
    testTarget: BUSINESS_TEST_TARGET,
    signKey: '*#06#RotvnIuEg32QqaOmcqh1qGuN',
  },
  '/magicpen-auth': {
    target: 'https://auth.wanmeixiangsu.cn',
    signKey: '*#06#p52Gj3BJPIp8omqdl3dzeTxC',
    extraQuery: { _authVersion: '2.0' },
  },
  '/magicpen-config': {
    target: 'https://config.wanmeixiangsu.cn',
    signKey: '*#06#bYmCRnJ2jEVreGtEnKKnh6On',
  },
  '/magicpen-cheetah': {
    target: 'https://cheetah.wanmeixiangsu.cn',
  },
  '/magicpen-bugly': {
    target: 'https://bugly.wanmeixiangsu.cn',
  },
};

// API 调试页需要把较大的 JSON 响应解析成树形结构，预览上限放宽到 1MB。
const MAX_BODY_PREVIEW = 1024 * 1024;
const MAX_EVENT_COUNT = 360;
const SENSITIVE_KEYS =
  /(^|[-_])(authorization|cookie|set-cookie|token|authtoken|password|passwd|secret|key|phone|mobile|idcard|smsid|smscode|necaptchavalidate)([-_]|$)/i;
const MAGIC_SIGN_PREFIX = '*#06#';
const MAGIC_XOR = 42;
const CAPTURED_ANDROID_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 15; sdk_gphone64_arm64 Build/AE3A.240806.043; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.6367.219 Mobile Safari/537.36';
const BASIC_PARAM_KEY_MAP: Record<string, string> = {
  _androidId: '1',
  _appUser: '3',
  _gpsCity: '4',
  _longitude: '5',
  _latitude: '6',
  _userCity: '7',
  _ipCity: '8',
  _cityCode: '9',
  _cityName: 'a',
  _device: 'b',
  _imei: 'c',
  _mac: 'e',
  _screenDpi: 'l',
  _screenHeight: 'm',
  _screenWidth: 'n',
  _jail: 'r',
  _gpsType: 'v',
  _firstTime: 'w',
  _srv: 'x',
  _u: 'y',
  _deviceId: 'z',
  _oaid: 'A',
  _it: 'B',
  _ut: 'C',
  _j: 'D',
  _html5: 'E',
  _a: 'G',
  _apiLevel: 'H',
  _rV: 'I',
  _rN: 'J',
  _br: 'K',
  _md: 'L',
};
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

interface BodyPreview {
  size: number;
  text: string;
  truncated: boolean;
  contentType?: string;
}

interface ProxyLifecycleEvent {
  id: string;
  sequence: number;
  time: string;
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
  localUrl?: string;
  upstreamUrl?: string;
  prefix?: string;
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

let eventSequence = 0;
let requestSequence = 0;
const lifecycleEvents: ProxyLifecycleEvent[] = [];
const lifecycleClients = new Set<ServerResponse>();

function nowLabel() {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    hour12: false,
  }).format(new Date());
}

function emitLifecycleEvent(event: Omit<ProxyLifecycleEvent, 'sequence' | 'time'>) {
  const fullEvent: ProxyLifecycleEvent = {
    sequence: ++eventSequence,
    time: nowLabel(),
    ...event,
  };
  lifecycleEvents.push(fullEvent);
  if (lifecycleEvents.length > MAX_EVENT_COUNT) {
    lifecycleEvents.splice(0, lifecycleEvents.length - MAX_EVENT_COUNT);
  }

  const payload = `data: ${JSON.stringify(fullEvent)}\n\n`;
  for (const client of lifecycleClients) {
    client.write(payload);
  }

  // 只输出已脱敏的代理生命周期，方便终端和页面覆盖层互相核对。
  console.info('[MagicPen Proxy]', fullEvent);
}

function isSensitiveKey(key: string) {
  return SENSITIVE_KEYS.test(key);
}

function redactText(value: string) {
  return value
    .replace(/(authToken=)[^&\s]+/gi, '$1已脱敏')
    .replace(/(token=)[^&\s]+/gi, '$1已脱敏')
    .replace(/(password=)[^&\s]+/gi, '$1已脱敏')
    .replace(/(phoneNumber=)[^&\s]+/gi, '$1已脱敏')
    .replace(/(smsId=)[^&\s]+/gi, '$1已脱敏')
    .replace(/(smsCode=)[^&\s]+/gi, '$1已脱敏')
    .replace(/(NECaptchaValidate=)[^&\s]+/gi, '$1已脱敏')
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer 已脱敏')
    .replace(/1[3-9]\d{9}/g, '手机号已脱敏');
}

function redactValue(key: string, value: unknown): unknown {
  if (isSensitiveKey(key)) {
    return '已脱敏';
  }
  if (typeof value === 'string') {
    return redactText(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(key, item));
  }
  if (value && typeof value === 'object') {
    return redactObject(value as Record<string, unknown>);
  }
  return value;
}

function redactObject(input: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, redactValue(key, value)]));
}

function redactUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    for (const key of Array.from(url.searchParams.keys())) {
      if (isSensitiveKey(key)) {
        url.searchParams.set(key, '已脱敏');
      }
    }
    return redactText(url.toString());
  } catch {
    return redactText(rawUrl);
  }
}

function flattenHeaderValue(value: string | string[] | undefined) {
  if (!value) {
    return '';
  }
  return Array.isArray(value) ? value.join(', ') : value;
}

function redactHeaders(headers: IncomingHttpHeaders | Headers) {
  const entries: [string, string][] = [];
  if (headers instanceof Headers) {
    headers.forEach((value, key) => entries.push([key, value]));
  } else {
    Object.entries(headers).forEach(([key, value]) => entries.push([key, flattenHeaderValue(value)]));
  }
  return Object.fromEntries(entries.map(([key, value]) => [key, String(redactValue(key, value))]));
}

function md5(input: string | Buffer) {
  return createHash('md5').update(input).digest();
}

function md5Hex(input: string | Buffer) {
  return md5(input).toString('hex');
}

function sha1(input: string | Buffer) {
  return createHash('sha1').update(input).digest();
}

function nativeUrlEncode(value: string) {
  // 对齐 iOS 旧版 CFURLCreateStringByAddingPercentEscapes 的行为，额外转义 !'()*。
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

function buildNativeQuery(params: Map<string, string>) {
  const queryItems = Array.from(params.entries()).map(([key, value]) => `${key}=${nativeUrlEncode(value)}`);
  return queryItems.sort((left, right) => left.localeCompare(right)).join('&');
}

function keyVersion(rawKey: string) {
  return Buffer.from(rawKey, 'utf8').reduce((sum, byte) => sum + byte, 0) % 19;
}

function decodeRealSignKey(rawKey: string) {
  const realKey = Buffer.from(rawKey, 'base64');
  const zeroIndex = realKey.indexOf(0);
  const keyLength = zeroIndex >= 0 ? zeroIndex : realKey.length;
  for (let index = 0; index < keyLength; index += 1) {
    realKey[index] = (((realKey[index] - MAGIC_XOR) & 0xff) ^ MAGIC_XOR) & 0xff;
  }
  return realKey.subarray(0, keyLength);
}

function signUrl0(urlSignPart: string, realKey: Buffer) {
  return md5(Buffer.concat([Buffer.from(urlSignPart, 'utf8'), realKey]));
}

function signUrl3(urlSignPart: string, realKey: Buffer) {
  const md5Key = md5(realKey);
  const sha1Url = sha1(urlSignPart);
  const concated = Buffer.concat([md5Key, sha1Url]);
  for (let index = 0; index < concated.length; index += 2) {
    concated[index] = concated[index] ^ 34;
  }
  return md5(concated);
}

function signUrl1(urlSignPart: string, keyWithOptionalPrefix: string) {
  const rawKey = keyWithOptionalPrefix.startsWith(MAGIC_SIGN_PREFIX)
    ? keyWithOptionalPrefix.slice(MAGIC_SIGN_PREFIX.length)
    : keyWithOptionalPrefix;
  const version = keyVersion(rawKey);
  const realKey = decodeRealSignKey(rawKey);
  const signBytes = version === 3 ? signUrl3(urlSignPart, realKey) : signUrl0(urlSignPart, realKey);
  const finalBytes = version > 0 ? Buffer.concat([signBytes, Buffer.from([version])]) : signBytes;
  return finalBytes.toString('hex');
}

function signCanonicalUrl(urlString: string, signKey: string) {
  const url = new URL(urlString);
  const signPart = `${url.pathname}${url.search}`;
  return signUrl1(signPart, signKey);
}

function crc16Modbus(data: Buffer) {
  if (data.length === 0) {
    return 0;
  }
  let crc = 0xffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >> 1) ^ 0xa001 : crc >> 1;
    }
  }
  return crc & 0xffff;
}

function specialCrcData(crc: number) {
  // iOS specialCrcData 最终是低位在前、高位在后。
  return Buffer.from([crc & 0xff, (crc >> 8) & 0xff]);
}

function createSecretBasicValue(params: Map<string, string>, rValue: string) {
  const secretQueryItems: string[] = [];
  for (const [key, value] of params.entries()) {
    const replaceKey = BASIC_PARAM_KEY_MAP[key];
    if (replaceKey) {
      secretQueryItems.push(`${replaceKey}=${value}`);
    }
  }

  const queryData = Buffer.from(secretQueryItems.join('&'), 'utf8');
  const uuidCrcData = specialCrcData(crc16Modbus(Buffer.from(rValue, 'utf8')));
  const paramsCrcData = specialCrcData(crc16Modbus(queryData));
  const xorData = Buffer.from(queryData.map((byte) => byte ^ uuidCrcData[0]));
  return gzipSync(Buffer.concat([xorData, paramsCrcData, uuidCrcData])).toString('base64');
}

function createRValue() {
  return md5Hex(randomUUID().toUpperCase());
}

function buildSignedUpstreamUrl(rawUrl: string, config: ProxyTargetConfig) {
  if (!config.signKey) {
    return {
      unsignedUrl: rawUrl,
      signedUrl: rawUrl,
      addedParams: [] as string[],
    };
  }

  const url = new URL(rawUrl);
  const params = new Map<string, string>();
  url.searchParams.forEach((value, key) => {
    if (key !== 'sign' && key !== '_r' && key !== '_v') {
      params.set(key, value);
    }
  });

  for (const [key, value] of Object.entries(config.extraQuery ?? {})) {
    if (!params.has(key) || params.get(key) === '') {
      params.set(key, value);
    }
  }

  const rValue = createRValue();
  params.set('_v', createSecretBasicValue(params, rValue));
  params.set('_r', rValue);

  const query = buildNativeQuery(params);
  const unsignedUrl = `${url.origin}${url.pathname}${query ? `?${query}` : ''}`;
  const sign = signCanonicalUrl(unsignedUrl, config.signKey);
  return {
    unsignedUrl,
    signedUrl: `${unsignedUrl}${query ? '&' : '?'}sign=${sign}`,
    addedParams: ['_v', '_r', 'sign'],
  };
}

function headersForUpstream(req: IncomingMessage, bodyLength: number) {
  const headers = new Headers();
  const contentType = flattenHeaderValue(req.headers['content-type']);

  // 上游请求头按 Android APP 抓包画像重建，不透传浏览器 sec-*、referer、cookie 等本地头。
  headers.set('user-agent', CAPTURED_ANDROID_USER_AGENT);
  // APP 还声明 tnpn4，但本地代理暂不具备 tnpn4 解码能力；保留 gzip 以兼顾抓包特征和响应可读性。
  headers.set('accept-encoding', 'gzip');
  if (bodyLength > 0) {
    headers.set('content-type', contentType || 'application/x-www-form-urlencoded');
    const contentEncoding = flattenHeaderValue(req.headers['content-encoding']);
    if (contentEncoding) {
      headers.set('content-encoding', contentEncoding);
    }
  }
  return headers;
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

function makeBodyPreview(buffer: Buffer, contentType?: string): BodyPreview {
  if (buffer.length === 0) {
    return { size: 0, text: '', truncated: false, contentType };
  }

  const looksTextual = !contentType || /json|text|xml|x-www-form-urlencoded|javascript/i.test(contentType);
  if (!looksTextual) {
    return {
      size: buffer.length,
      text: `二进制内容 ${buffer.length} bytes`,
      truncated: buffer.length > MAX_BODY_PREVIEW,
      contentType,
    };
  }

  const previewBuffer = buffer.subarray(0, MAX_BODY_PREVIEW);
  const rawText = previewBuffer.toString('utf8');
  let text = redactText(rawText);
  try {
    text = JSON.stringify(redactObject(JSON.parse(rawText)), null, 2);
  } catch {
    // 非 JSON 文本直接按原文预览。
  }

  return {
    size: buffer.length,
    text,
    truncated: buffer.length > MAX_BODY_PREVIEW,
    contentType,
  };
}

function writeJson(res: ServerResponse, body: unknown) {
  res.statusCode = 200;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function setupLifecycleDebugEndpoints(server: ViteDevServer) {
  server.middlewares.use((req, res, next) => {
    const url = req.url ?? '';
    if (url === '/__magicpen_proxy_events/snapshot') {
      writeJson(res, { events: lifecycleEvents });
      return;
    }
    if (url === '/__magicpen_proxy_events/clear') {
      lifecycleEvents.splice(0, lifecycleEvents.length);
      emitLifecycleEvent({ id: 'system', phase: 'cleared' });
      writeJson(res, { success: true });
      return;
    }
    if (url === '/__magicpen_proxy_events/stream') {
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

function findProxyTarget(url: string) {
  return Object.entries(PROXY_TARGETS).find(([prefix]) => url === prefix || url.startsWith(`${prefix}/`) || url.startsWith(`${prefix}?`));
}

function resolveUpstreamUrl(prefix: string, config: ProxyTargetConfig, upstreamPath: string) {
  const url = new URL(upstreamPath, config.target);
  const useTestTarget = prefix === '/magicpen-business' && url.searchParams.get(BUSINESS_ENV_QUERY_KEY) === 'test';
  // 环境参数只用于本地代理选目标域，签名和上游请求都不能带这个内部标记。
  url.searchParams.delete(BUSINESS_ENV_QUERY_KEY);
  const target = useTestTarget && config.testTarget ? config.testTarget : config.target;
  return new URL(`${url.pathname}${url.search}${url.hash}`, target).toString();
}

function setupTransparentProxy(server: ViteDevServer) {
  server.middlewares.use(async (req, res, next) => {
    const localUrl = req.url ?? '';
    const match = findProxyTarget(localUrl);
    if (!match) {
      next();
      return;
    }

    const [prefix, config] = match;
    const id = `${Date.now().toString(36)}-${(++requestSequence).toString(36)}`;
    const startedAt = Date.now();
    const method = req.method ?? 'GET';
    const upstreamPath = localUrl.replace(prefix, '') || '/';
    const upstreamUrl = resolveUpstreamUrl(prefix, config, upstreamPath);

    emitLifecycleEvent({
      id,
      phase: 'accepted',
      method,
      prefix,
      localUrl: redactUrl(localUrl),
      upstreamUrl: redactUrl(upstreamUrl),
      requestHeaders: redactHeaders(req.headers),
    });

    try {
      const requestBody = method === 'GET' || method === 'HEAD' ? Buffer.alloc(0) : await readRequestBody(req);
      const signedUrlResult = buildSignedUpstreamUrl(upstreamUrl, config);
      const upstreamHeaders = headersForUpstream(req, requestBody.length);

      emitLifecycleEvent({
        id,
        phase: 'signing',
        method,
        prefix,
        upstreamUrl: redactUrl(upstreamUrl),
        signing: {
          algorithm: config.signKey ? 'SignUrl1 + _r + _v' : 'none',
          addedParams: signedUrlResult.addedParams,
          unsignedUrl: redactUrl(signedUrlResult.unsignedUrl),
          signedUrl: redactUrl(signedUrlResult.signedUrl),
        },
      });

      emitLifecycleEvent({
        id,
        phase: 'signed-request',
        method,
        prefix,
        upstreamUrl: redactUrl(signedUrlResult.signedUrl),
      });

      emitLifecycleEvent({
        id,
        phase: 'upstream-request',
        method,
        prefix,
        upstreamUrl: redactUrl(signedUrlResult.signedUrl),
        requestHeaders: redactHeaders(upstreamHeaders),
        requestBody: makeBodyPreview(requestBody, flattenHeaderValue(req.headers['content-type'])),
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
        prefix,
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
        prefix,
        upstreamUrl: redactUrl(signedUrlResult.signedUrl),
        status: upstreamResponse.status,
        responseBody: makeBodyPreview(responseBuffer, upstreamResponse.headers.get('content-type') ?? undefined),
      });

      res.statusCode = upstreamResponse.status;
      res.statusMessage = upstreamResponse.statusText;
      headersForBrowser(upstreamResponse.headers).forEach((value, key) => res.setHeader(key, value));
      res.setHeader('x-magicpen-proxy-debug-id', id);
      res.end(responseBuffer);

      emitLifecycleEvent({
        id,
        phase: 'completed',
        method,
        prefix,
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
        prefix,
        upstreamUrl: redactUrl(upstreamUrl),
        durationMs: Date.now() - startedAt,
        error: redactText(message),
      });
      res.statusCode = 502;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ success: false, errorCode: 502, message: '本地代理请求失败', data: null }));
    }
  });
}

function magicPenTransparentProxyPlugin(): Plugin {
  return {
    name: 'magicpen-transparent-proxy',
    configureServer(server) {
      setupLifecycleDebugEndpoints(server);
      setupTransparentProxy(server);
    },
  };
}

export default defineConfig({
  plugins: [vue(), magicPenTransparentProxyPlugin()],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  server: {
    port: 5173,
  },
});
