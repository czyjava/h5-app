import {
  appendReplicaRequestParams,
  buildReplicaCommonQuery,
  encodeReplicaFormParams,
  redactObject,
  type ReplicaEnvironment,
  type ReplicaRequestParamValue,
} from '@wmxs/h5-replica-common/client';
import { homeAiReplicaConfig } from '../../app.config';
import { demoSnapshot } from './demoData';
import { normalizeHomeAiSnapshot } from './homeaiMappers';
import type { HomeAiSnapshot } from './types';

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
  params?: Record<string, ReplicaRequestParamValue>;
  form?: Record<string, ReplicaRequestParamValue>;
}

function apiErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '接口请求失败';
}

export async function requestBusiness<T>(path: string, context: HomeAiRequestContext, options: RequestOptions = {}): Promise<T> {
  const host = homeAiReplicaConfig.hosts.business;
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
  // 业务日志统一脱敏，只记录接口路径和参数摘要，避免 authToken 等敏感信息进入控制台。
  console.info('[HomeAI API] 请求业务接口', redactObject({ path, method: options.method ?? 'GET', params: options.params, form: options.form }));
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
  console.info('[HomeAI API] 业务接口响应', { path, status: response.status, ok: response.ok });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const errorCode = typeof payload.errorCode === 'number' ? payload.errorCode : 0;
  if (payload.success === false || errorCode !== 0) {
    throw new Error(payload.message || `业务错误：${errorCode}`);
  }
  return (payload.data ?? payload) as T;
}

export async function loadHomeAiSnapshot(context: HomeAiRequestContext): Promise<HomeAiSnapshot> {
  const errors: string[] = [];

  const safeLoad = async <T>(label: string, loader: () => Promise<T>) => {
    try {
      return await loader();
    } catch (error) {
      const message = apiErrorMessage(error);
      errors.push(`${label}: ${message}`);
      console.warn('[HomeAI API] 接口降级到演示数据', redactObject({ label, message }));
      return null;
    }
  };

  const [user, generationList, recommendList] = await Promise.all([
    context.authToken ? safeLoad('currentUser', () => requestBusiness(homeAiReplicaConfig.endpoints.currentUser, context)) : Promise.resolve(null),
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
    ...demoSnapshot,
    ...mappedSnapshot,
    banners: demoSnapshot.banners,
    features: demoSnapshot.features,
    // 接口无数据时保留更贴近 APK 的本地演示数据。
    discover: mappedSnapshot.discover.length > 0 ? mappedSnapshot.discover : demoSnapshot.discover,
    works: mappedSnapshot.works.length > 0 ? mappedSnapshot.works : demoSnapshot.works,
    user: mappedSnapshot.user ?? demoSnapshot.user,
  };

  if (errors.length > 0) {
    throw Object.assign(new Error(errors.join('；')), { snapshot });
  }
  return snapshot;
}
