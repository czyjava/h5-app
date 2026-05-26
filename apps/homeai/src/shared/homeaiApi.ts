import {
  appendReplicaRequestParams,
  buildReplicaCommonQuery,
  encodeReplicaFormParams,
  redactObject,
  type ReplicaEnvironment,
  type ReplicaRequestParamValue,
} from '@wmxs/h5-replica-common/client';
import { homeAiReplicaConfig } from '../../app.config';
import { liveSnapshot } from './demoData';
import { normalizeHomeAiSnapshot, normalizeHomeAiVipPlans } from './homeaiMappers';
import type { HomeAiSnapshot, HomeAiVipPlan, PaymentOption } from './types';

interface ApiEnvelope<T = unknown> {
  data?: T;
  errorCode?: number;
  message?: string | null;
  success?: boolean;
}

export interface HomeAiRequestContext {
  authToken?: string;
  environment: ReplicaEnvironment;
}

interface RequestOptions {
  method?: 'GET' | 'POST';
  hostKey?: 'auth' | 'business';
  params?: Record<string, ReplicaRequestParamValue>;
  form?: Record<string, ReplicaRequestParamValue>;
}

function apiErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '接口请求失败';
}

async function requestReplicaHost<T>(path: string, context: HomeAiRequestContext, options: RequestOptions = {}): Promise<T> {
  const hostKey = options.hostKey ?? 'business';
  const host = homeAiReplicaConfig.hosts[hostKey];
  if (!host) {
    throw new Error(`缺少 ${hostKey} host 配置`);
  }
  const url = new URL(`${host.proxyPrefix}${path}`, window.location.origin);
  const commonQuery = buildReplicaCommonQuery(homeAiReplicaConfig, {
    authToken: context.authToken,
    deviceProfile: {
      language: 'zh-CN',
      appName: 'homeai',
      network: 'wifi',
    },
  });
  appendReplicaRequestParams(url, commonQuery as unknown as Record<string, ReplicaRequestParamValue>);
  appendReplicaRequestParams(url, options.params);
  if (context.environment === 'test') {
    url.searchParams.set('__homeai_env', 'test');
  }

  const hasBody = options.method === 'POST';
  const body = hasBody ? encodeReplicaFormParams(options.form) : undefined;
  // 接口日志统一脱敏，只记录接口路径、域类型和参数摘要，避免 authToken 等敏感信息进入控制台。
  console.info('[HomeAI API] 请求接口', redactObject({ hostKey, path, method: options.method ?? 'GET', params: options.params, form: options.form }));
  const response = await fetch(url.toString(), {
    method: options.method ?? 'GET',
    headers: hasBody
      ? {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        }
      : undefined,
    body,
  });
  const rawText = await response.text();
  const payload = rawText ? (JSON.parse(rawText) as ApiEnvelope<T>) : ({} as ApiEnvelope<T>);
  console.info('[HomeAI API] 接口响应', { hostKey, path, status: response.status, ok: response.ok });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const errorCode = typeof payload.errorCode === 'number' ? payload.errorCode : 0;
  if (payload.success === false || errorCode !== 0) {
    throw new Error(payload.message || `业务错误：${errorCode}`);
  }
  return (payload.data ?? payload) as T;
}

async function requestBusiness<T>(path: string, context: HomeAiRequestContext, options: RequestOptions = {}): Promise<T> {
  return requestReplicaHost(path, context, { ...options, hostKey: 'business' });
}

async function requestAuth<T>(path: string, context: HomeAiRequestContext, options: RequestOptions = {}): Promise<T> {
  return requestReplicaHost(path, context, { ...options, hostKey: 'auth' });
}

export async function loadHomeAiSnapshot(context: HomeAiRequestContext): Promise<HomeAiSnapshot> {
  const errors: string[] = [];

  const safeLoad = async <T>(label: string, loader: () => Promise<T>) => {
    try {
      return await loader();
    } catch (error) {
      const message = apiErrorMessage(error);
      errors.push(`${label}: ${message}`);
      console.warn('[HomeAI API] 接口请求失败，保留实时空态', redactObject({ label, message }));
      return null;
    }
  };

  const [user, generationList, recommendList] = await Promise.all([
    // APK 登录后从 auth 域读取当前用户资料，H5 复刻也保持相同域名和签名链路。
    context.authToken ? safeLoad('currentUser', () => requestAuth(homeAiReplicaConfig.endpoints.currentUser, context)) : Promise.resolve(null),
    context.authToken
      ? safeLoad('generationList', () =>
          requestBusiness(homeAiReplicaConfig.endpoints.generationList, context, {
            params: { page: 1, pageSize: 10 },
          }),
        )
      : Promise.resolve(null),
    safeLoad('recommendList', () =>
      requestBusiness(homeAiReplicaConfig.endpoints.recommendList, context, {
        params: { moduleParam: 'homeai_discover' },
      }),
    ),
  ]);

  const mappedSnapshot = normalizeHomeAiSnapshot({ user, generationList, recommendList });
  const snapshot: HomeAiSnapshot = {
    ...liveSnapshot,
    ...mappedSnapshot,
    // 首页入口属于本地复刻壳的静态导航；接口内容只来自 mappedSnapshot，不再用 demo 数据兜底。
    banners: liveSnapshot.banners,
    features: liveSnapshot.features,
    // APK 未登录态仍有发现推荐；接口为空或失败时只保留这部分本地结构，不伪造账号和作品。
    discover: mappedSnapshot.discover.length > 0 ? mappedSnapshot.discover : liveSnapshot.discover,
    discoverTabs: mappedSnapshot.discoverTabs.length > 0 ? mappedSnapshot.discoverTabs : liveSnapshot.discoverTabs,
  };

  if (errors.length > 0) {
    throw Object.assign(new Error(errors.join('；')), { snapshot });
  }
  return snapshot;
}

export async function loadHomeAiVipPlans(context: HomeAiRequestContext): Promise<HomeAiVipPlan[]> {
  // VIP 商品必须从服务端售卖单元链路读取，避免本地价格与真实支付配置不一致。
  const channel = await requestBusiness<{ channelCode?: string }>(homeAiReplicaConfig.endpoints.goodsChannelCode, context, {
    params: { entrance: 'vip' },
  });
  const channelCode = channel && typeof channel === 'object' ? channel.channelCode : '';
  if (!channelCode) {
    throw new Error('会员售卖渠道为空');
  }
  const goodsList = await requestBusiness(homeAiReplicaConfig.endpoints.goodsList, context, {
    params: { channelCode },
  });
  return normalizeHomeAiVipPlans(goodsList);
}

export async function createHomeAiVipOrder(
  context: HomeAiRequestContext,
  plan: HomeAiVipPlan,
  paymentOption: PaymentOption,
): Promise<unknown> {
  // 下单只透传服务端商品列表返回的 goodsCode 和支付配置，不在 H5 本地拼外部商品 ID。
  return requestBusiness(homeAiReplicaConfig.endpoints.orderCreate, context, {
    method: 'POST',
    form: {
      channelCode: plan.channelCode,
      goodsCode: plan.key,
      tradeMainPlatform: paymentOption.tradeMainPlatform,
      tradeSubPlatform: paymentOption.tradeSubPlatform,
      entrance: 'vip',
    },
  });
}
