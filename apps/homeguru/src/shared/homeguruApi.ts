import {
  appendReplicaRequestParams,
  buildReplicaCommonQuery,
  encodeReplicaFormParams,
  redactObject,
  type ReplicaEnvironment,
  type ReplicaRequestParamValue,
} from '@wmxs/h5-replica-common/client';
import { homeGuruReplicaConfig } from '../../app.config';
import { demoSnapshot } from './demoData';
import type { DiscoverItem, HomeGuruSnapshot, UserSummary, WorkItem } from './types';

interface ApiEnvelope<T = unknown> {
  data?: T;
  errorCode?: number;
  message?: string | null;
  success?: boolean;
}

export interface HomeGuruRequestContext {
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

function pickArray(input: unknown): unknown[] {
  if (Array.isArray(input)) {
    return input;
  }
  if (input && typeof input === 'object') {
    const record = input as Record<string, unknown>;
    return pickArray(record.list ?? record.items ?? record.records ?? record.data);
  }
  return [];
}

function pickString(input: Record<string, unknown>, keys: string[], fallback = '') {
  for (const key of keys) {
    const value = input[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    if (typeof value === 'number') {
      return String(value);
    }
  }
  return fallback;
}

function normalizeImageUrl(value: string) {
  if (!value) {
    return '';
  }
  return value.startsWith('//') ? `https:${value}` : value;
}

async function requestBusiness<T>(
  path: string,
  context: HomeGuruRequestContext,
  options: RequestOptions = {},
): Promise<T> {
  const host = homeGuruReplicaConfig.hosts.business;
  const url = new URL(`${host.proxyPrefix}${path}`, window.location.origin);
  const commonQuery = buildReplicaCommonQuery(homeGuruReplicaConfig, {
    authToken: context.authToken,
    deviceProfile: {
      language: 'en',
      appName: 'homeguru',
      network: 'wifi',
    },
  });
  appendReplicaRequestParams(url, commonQuery as unknown as Record<string, ReplicaRequestParamValue>);
  appendReplicaRequestParams(url, options.params);
  if (context.environment === 'test') {
    url.searchParams.set('__homeguru_env', 'test');
  }

  const hasBody = options.method === 'POST';
  const body = hasBody ? encodeReplicaFormParams(options.form) : undefined;
  // 业务请求只打印脱敏后的摘要，避免 token 等敏感信息进入日志。
  console.info('[HomeGuru API] 请求业务接口', redactObject({ path, method: options.method ?? 'GET', params: options.params }));
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
  console.info('[HomeGuru API] 业务接口响应', { path, status: response.status, ok: response.ok });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const errorCode = typeof payload.errorCode === 'number' ? payload.errorCode : 0;
  if (payload.success === false || errorCode !== 0) {
    throw new Error(payload.message || `业务错误：${errorCode}`);
  }
  return (payload.data ?? payload) as T;
}

function mapDiscoverItem(raw: unknown, index: number): DiscoverItem {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const fallback = demoSnapshot.discover[index % demoSnapshot.discover.length];
  const coverUrl = normalizeImageUrl(pickString(record, ['coverUrl', 'cover', 'imageUrl', 'image', 'url', 'thumbnailUrl'], fallback.coverUrl));
  return {
    title: pickString(record, ['title', 'name', 'templateName'], fallback.title),
    subtitle: pickString(record, ['subTitle', 'subtitle', 'description', 'desc'], fallback.subtitle),
    coverUrl,
    tag: pickString(record, ['tag', 'categoryTitle', 'spaceType'], fallback.tag),
    buildingType: pickString(record, ['buildingType', 'buildingTypeCode'], 'interior'),
    spaceType: pickString(record, ['spaceType', 'spaceTypeCode'], 'living_room'),
  };
}

function mapWorkItem(raw: unknown, index: number): WorkItem {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const fallback = demoSnapshot.works[index % demoSnapshot.works.length];
  return {
    id: pickString(record, ['id', 'recordCode', 'code'], `work-${index}`),
    title: pickString(record, ['title', 'name', 'templateName'], `Home Guru work ${index + 1}`),
    status: pickString(record, ['status', 'generationStatus'], 'Generated'),
    coverUrl: normalizeImageUrl(pickString(record, ['coverUrl', 'resultUrl', 'imageUrl', 'url'], fallback.coverUrl)),
    createdAt: pickString(record, ['createdAt', 'createTime', 'gmtCreate'], ''),
  };
}

function mapUser(raw: unknown): UserSummary {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    nickname: pickString(record, ['nickname', 'nickName', 'name'], demoSnapshot.user.nickname),
    userId: pickString(record, ['userId', 'id'], demoSnapshot.user.userId),
    diamondCount: Number(record.diamondCount ?? record.credit ?? demoSnapshot.user.diamondCount),
    vipLabel: pickString(record, ['vipLabel', 'vipName'], demoSnapshot.user.vipLabel),
  };
}

export async function loadHomeGuruSnapshot(context: HomeGuruRequestContext): Promise<HomeGuruSnapshot> {
  const snapshot: HomeGuruSnapshot = structuredClone(demoSnapshot);
  const errors: string[] = [];

  const safeLoad = async <T>(label: string, loader: () => Promise<T>) => {
    try {
      return await loader();
    } catch (error) {
      const message = apiErrorMessage(error);
      errors.push(`${label}: ${message}`);
      console.warn('[HomeGuru API] 接口降级到演示数据', redactObject({ label, message }));
      return null;
    }
  };

  const [user, generationList, recommendList] = await Promise.all([
    context.authToken ? safeLoad('currentUser', () => requestBusiness(homeGuruReplicaConfig.endpoints.currentUser, context)) : Promise.resolve(null),
    // 作品列表依赖 authToken；未配置时直接保留演示数据，避免制造可预期的 400 请求。
    context.authToken
      ? safeLoad('generationList', () =>
          requestBusiness(homeGuruReplicaConfig.endpoints.generationList, context, {
            params: { page: 1, pageSize: 10 },
          }),
        )
      : Promise.resolve(null),
    safeLoad('recommendConfig', () =>
      requestBusiness(homeGuruReplicaConfig.endpoints.recommendConfig, context, {
        params: { moduleParam: 'homeai_discover' },
      }),
    ),
  ]);

  if (user) {
    snapshot.user = mapUser(user);
  }

  const works = pickArray(generationList).map(mapWorkItem).filter((item) => item.coverUrl);
  if (works.length > 0) {
    snapshot.works = works.slice(0, 6);
  }

  const configJson = recommendList && typeof recommendList === 'object' ? (recommendList as Record<string, unknown>).configJson : '';
  const parsedRecommend = typeof configJson === 'string' && configJson.trim() ? JSON.parse(configJson) : recommendList;
  const discoverSource = pickArray(parsedRecommend);
  const discover = discoverSource.map(mapDiscoverItem).filter((item) => item.coverUrl);
  if (discover.length > 0) {
    snapshot.discover = discover.slice(0, 12);
  }

  if (errors.length > 0) {
    throw Object.assign(new Error(errors.join('；')), { snapshot });
  }
  return snapshot;
}
