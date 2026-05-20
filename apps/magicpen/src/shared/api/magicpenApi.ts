import type { MagicPenSnapshot } from '@/entities/magicpen/types';
import { sessionState } from '@/entities/session/model';
import { createEmptySnapshot } from '@/shared/api/emptySnapshot';
import {
  mapColoringCards,
  mapCommunityChannels,
  mapCommunityPosts,
  mapGenerationList,
  mapInteractiveModels,
  mapProfile,
  mapRecommendList,
  mapTokenBills,
} from '@/shared/api/mappers';
import {
  MAGICPEN_API_HOSTS,
  MAGICPEN_BUSINESS_ENV_QUERY_KEY,
  MAGICPEN_ENDPOINTS,
  businessHostNameForEnvironment,
  businessTargetForEnvironment,
  type MagicPenApiHostKey,
} from '@/shared/config/endpoints';
import { appendRequestParams, buildMagicPenCommonQuery, encodeFormParams, type RequestParamValue } from '@/shared/api/replicaNetwork';

type EndpointKey =
  | 'recommendList'
  | 'communityChannels'
  | 'communityPosts'
  | 'coloringCards'
  | 'interactiveModels'
  | 'generationList'
  | 'currentUser'
  | 'userBalance'
  | 'userTokenBill'
  | 'renewalInfo';

interface RequestOptions {
  hostType?: MagicPenApiHostKey;
  query?: Record<string, RequestParamValue>;
  bodyParams?: Record<string, RequestParamValue>;
  includeLanguage?: boolean;
  method?: 'GET' | 'POST';
}

interface ApiEnvelope<T = unknown> {
  data: T;
  errorCode?: number;
  message?: string | null;
  success?: boolean;
}

interface EndpointResult<T> {
  data: T;
  source: 'live' | 'error';
  error?: string;
}

interface ApiDebugEntry {
  time: string;
  phase: 'request' | 'response' | 'business-error' | 'transport-error';
  path: string;
  method?: string;
  endpoint?: EndpointKey;
  host?: string;
  proxyPrefix?: string;
  status?: number;
  ok?: boolean;
  reason?: string;
}

declare global {
  interface Window {
    __MAGICPEN_API_DEBUG__?: ApiDebugEntry[];
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function responseData(response: unknown): unknown {
  return asRecord(response).data;
}

function pushApiDebug(entry: Omit<ApiDebugEntry, 'time'>) {
  if (typeof window === 'undefined') {
    return;
  }

  // 调试日志只记录接口路径、状态码和失败原因，不记录 token、请求体或隐私字段。
  const debugList = window.__MAGICPEN_API_DEBUG__ ?? [];
  debugList.push({
    time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
    ...entry,
  });
  if (debugList.length > 160) {
    debugList.splice(0, debugList.length - 160);
  }
  window.__MAGICPEN_API_DEBUG__ = debugList;
  try {
    window.sessionStorage.setItem('__MAGICPEN_API_DEBUG__', JSON.stringify(debugList));
  } catch {
    // 调试记录写入失败不影响业务加载。
  }
  try {
    const debugNodeId = 'magicpen-api-debug';
    const debugNode =
      document.getElementById(debugNodeId) ??
      Object.assign(document.createElement('script'), {
        id: debugNodeId,
        type: 'application/json',
      });
    debugNode.textContent = JSON.stringify(debugList);
    if (!debugNode.parentElement) {
      document.head.appendChild(debugNode);
    }
  } catch {
    // 调试 DOM 节点只用于本地核对，请求链路本身不依赖它。
  }
}

function buildCommonQuery(options: Pick<RequestOptions, 'includeLanguage'> = {}) {
  return buildMagicPenCommonQuery({
    authToken: sessionState.authToken,
    includeLanguage: options.includeLanguage,
  });
}

function hostConfig(hostType: RequestOptions['hostType']) {
  const resolvedHostType = hostType ?? 'business';
  const config = MAGICPEN_API_HOSTS[resolvedHostType];
  if (resolvedHostType === 'business') {
    return {
      ...config,
      target: businessTargetForEnvironment(sessionState.apiEnvironment),
    };
  }
  return config;
}

function buildUrl(path: string, options: RequestOptions = {}) {
  const resolvedHostType = options.hostType ?? 'business';
  const url = new URL(`${hostConfig(options.hostType).proxyPrefix}${path}`, window.location.origin);
  appendRequestParams(url, { ...buildCommonQuery(options), ...options.query });
  if (resolvedHostType === 'business' && sessionState.apiEnvironment === 'test') {
    // 本地代理消费该参数后会删除，避免把 H5 内部环境标记传给真实业务接口。
    url.searchParams.set(MAGICPEN_BUSINESS_ENV_QUERY_KEY, sessionState.apiEnvironment);
  }

  return url.toString();
}

function buildLogQuery(options: RequestOptions = {}) {
  const query = { ...buildCommonQuery(options), ...options.query };
  return Object.fromEntries(
    Object.entries(query)
      .filter(([, value]) => value !== undefined && value !== '')
      .map(([key, value]) => [key, key === 'authToken' ? '已脱敏' : value]),
  );
}

function parseJsonBody(rawText: string, path: string) {
  if (!rawText) {
    return null;
  }
  try {
    return JSON.parse(rawText) as unknown;
  } catch {
    console.warn('[MagicPen API] 响应不是 JSON', { path });
    return null;
  }
}

function envelopeMessage(payload: unknown, fallback: string) {
  const record = asRecord(payload);
  const message = record.message;
  return typeof message === 'string' && message ? message : fallback;
}

async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET';
  const currentHostConfig = hostConfig(options.hostType);
  const requestUrl = buildUrl(path, options);
  const requestBody = options.bodyParams ? encodeFormParams(options.bodyParams) : undefined;
  const logMeta = {
    method,
    host: currentHostConfig.target,
    proxyPrefix: currentHostConfig.proxyPrefix,
    path,
    query: buildLogQuery(options),
    bodyKeys: options.bodyParams ? Object.keys(options.bodyParams).sort() : undefined,
  };

  // 接口请求日志只打印脱敏元信息，方便在 Console 里确认真实请求链路。
  console.info('[MagicPen API] 请求接口', logMeta);
  pushApiDebug({
    phase: 'request',
    method,
    host: currentHostConfig.target,
    proxyPrefix: currentHostConfig.proxyPrefix,
    path,
  });

  let response: Response;
  try {
    response = await fetch(requestUrl, {
      method,
      headers: requestBody ? { 'Content-Type': 'application/x-www-form-urlencoded' } : undefined,
      body: requestBody,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '接口网络请求失败';
    pushApiDebug({
      phase: 'transport-error',
      method,
      path,
      reason: message,
    });
    throw new Error(message);
  }

  const rawText = await response.text();
  const json = parseJsonBody(rawText, path);

  console.info('[MagicPen API] 接口响应', {
    method,
    path,
    ok: response.ok,
    status: response.status,
  });
  pushApiDebug({
    phase: 'response',
    method,
    path,
    status: response.status,
    ok: response.ok,
  });

  if (!response.ok) {
    const message = envelopeMessage(json, `接口请求失败：${response.status}`);
    pushApiDebug({
      phase: 'business-error',
      method,
      path,
      status: response.status,
      reason: message,
    });
    throw new Error(message);
  }

  if (!json) {
    throw new Error('接口响应为空或不是 JSON');
  }

  const envelope = json as ApiEnvelope;
  const errorCode = typeof envelope.errorCode === 'number' ? envelope.errorCode : 0;
  if (envelope.success === false || errorCode !== 0) {
    const message = envelope.message || `接口业务错误：${errorCode}`;
    console.warn('[MagicPen API] 接口业务失败', {
      path,
      errorCode,
      message,
    });
    pushApiDebug({
      phase: 'business-error',
      method,
      path,
      reason: message,
    });
    throw new Error(message);
  }
  return json as T;
}

async function loadEndpoint<T>(
  endpoint: EndpointKey,
  path: string,
  mapper: (response: unknown) => T,
  options: RequestOptions = {},
): Promise<EndpointResult<T>> {
  try {
    const liveResponse = await requestJson(path, options);
    return {
      data: mapper(liveResponse),
      source: 'live',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : '实时接口请求失败';
    // 不再回填本地样例，接口失败时保留空状态并把真实错误暴露到状态栏和调试面板。
    console.warn('[MagicPen API] 实时接口失败，未使用本地数据', {
      endpoint,
      path,
      reason: message,
    });
    pushApiDebug({
      phase: 'business-error',
      endpoint,
      path,
      reason: message,
    });
    return {
      data: mapper(undefined),
      source: 'error',
      error: message,
    };
  }
}

export async function loadMagicPenSnapshot(): Promise<MagicPenSnapshot> {
  const results = await Promise.all([
    loadEndpoint('recommendList', MAGICPEN_ENDPOINTS.recommendList, mapRecommendList, {
      query: { moduleParam: 'home_content', apiVersion: 1 },
    }),
    loadEndpoint('communityChannels', MAGICPEN_ENDPOINTS.communityChannels, mapCommunityChannels, {
      query: { apiVersion: 1 },
    }),
    loadEndpoint('communityPosts', MAGICPEN_ENDPOINTS.communityPostList, mapCommunityPosts, {
      query: { channelKey: 'community_hot', page: 1, limit: 20, apiVersion: 1 },
    }),
    loadEndpoint('coloringCards', MAGICPEN_ENDPOINTS.coloringCards, mapColoringCards, {
      query: { apiVersion: 1 },
    }),
    loadEndpoint('interactiveModels', MAGICPEN_ENDPOINTS.interactiveModels, mapInteractiveModels, {
      query: { apiVersion: 1 },
    }),
    loadEndpoint('generationList', MAGICPEN_ENDPOINTS.generationList, mapGenerationList, {
      query: { viewMode: 1, page: 1, limit: 20, apiVersion: 1 },
    }),
    loadEndpoint('currentUser', MAGICPEN_ENDPOINTS.currentUser, (response) => response, {
      hostType: 'auth',
      query: { _authVersion: '2.0' },
    }),
    loadEndpoint('userBalance', MAGICPEN_ENDPOINTS.userBalance, (response) => response, {
      query: { apiVersion: 1 },
    }),
    loadEndpoint('userTokenBill', MAGICPEN_ENDPOINTS.userTokenBill, mapTokenBills, {
      query: { page: 1, limit: 20, apiVersion: 1 },
    }),
    loadEndpoint('renewalInfo', MAGICPEN_ENDPOINTS.renewalInfo, (response) => response, {
      query: { apiVersion: 1 },
    }),
  ]);

  const [homeCards, channels, posts, coloringCards, interactiveScenes, works, currentUser, balance, tokenBills, renewalInfo] =
    results;
  const errors = results.map((result) => result.error).filter((message): message is string => Boolean(message));
  const successCount = results.filter((result) => result.source === 'live').length;
  const failedCount = results.length - successCount;
  const baseSnapshot = createEmptySnapshot(
    '等待实时 API 响应',
    businessHostNameForEnvironment(sessionState.apiEnvironment),
  );
  const source = failedCount === 0 ? 'live' : successCount > 0 ? 'partial' : 'error';
  const firstError = errors[0] ?? '';
  const signed = !errors.some((message) => message.includes('URL签名错误'));

  return {
    ...baseSnapshot,
    homeCards: homeCards.data,
    channels: channels.data,
    posts: posts.data,
    coloringCards: coloringCards.data,
    interactiveScenes: interactiveScenes.data,
    works: works.data,
    tokenBills: tokenBills.data,
    profile: mapProfile(balance.data, renewalInfo.data, currentUser.data),
    apiStatus: {
      ...baseSnapshot.apiStatus,
      signed,
      tokenReady: Boolean(sessionState.authToken),
      source,
      endpointCount: results.length,
      message:
        failedCount === 0
          ? `已从实时 API 加载 ${results.length} 个接口`
          : successCount > 0
            ? `实时 API 部分可用：成功 ${successCount}/${results.length}，失败 ${failedCount} 个：${firstError}`
            : `实时 API 暂不可用：${firstError}`,
      loadedAt: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
    },
  };
}

export async function loadCommunityPosts(channelKey: string) {
  const result = await loadEndpoint('communityPosts', MAGICPEN_ENDPOINTS.communityPostList, mapCommunityPosts, {
    query: { channelKey, page: 1, limit: 20, apiVersion: 1 },
  });
  if (result.source === 'error') {
    throw new Error(result.error ?? '社区帖子加载失败');
  }
  return result.data;
}

export async function quoteByTemplate(payload: { templateCode: string; templatePrice: number }) {
  const response = await requestJson<ApiEnvelope<unknown>>(MAGICPEN_ENDPOINTS.quoteByTemplate, {
    method: 'POST',
    includeLanguage: false,
    // APP 抓包中该接口是表单参数经 tnpn2 编码后进入 body；H5 代理先使用明文 form 参数保持语义一致。
    bodyParams: { apiVersion: 1, templateCode: payload.templateCode, templatePrice: payload.templatePrice },
  });
  const data = asRecord(responseData(response));
  const quotedPrice = asNumber(data.price, asNumber(data.payPrice, asNumber(data.listPrice, payload.templatePrice)));
  const balance = asNumber(data.balance, asNumber(data.amount, asNumber(data.value, 0)));
  return {
    price: quotedPrice,
    balance,
    enough: typeof data.enough === 'boolean' ? data.enough : balance >= quotedPrice,
  };
}
