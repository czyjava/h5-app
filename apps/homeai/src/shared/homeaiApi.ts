import {
  appendReplicaRequestParams,
  buildReplicaCommonQuery,
  encodeReplicaFormParams,
  redactObject,
  type ReplicaEnvironment,
  type ReplicaRequestParamValue,
} from '@wmxs/h5-replica-common/client';
import { homeAiReplicaConfig } from '../../app.config';
import { appShellSnapshot } from './appShellData';
import { mapGenerationDetail, mapGenerationList, normalizeHomeAiSnapshot, type HomeAiGenerationDetail } from './homeaiMappers';
import type { HomeAiSnapshot, WorkItem } from './types';

interface ApiEnvelope<T = unknown> {
  data?: T;
  errorCode?: number;
  message?: string | null;
  success?: boolean;
}

interface UploadImageData {
  previewUrl?: string | null;
  encodedData?: string | null;
  url?: string | null;
  imageUrl?: string | null;
  displayImageUrl?: string | null;
  rawUrl?: string | null;
  large?: string | null;
  small?: string | null;
  image?: {
    large?: string | null;
    small?: string | null;
  } | null;
  itemList?: UploadImageData[];
}

interface UploadTokenData {
  upAppKey?: string | null;
  upToken?: string | null;
}

export interface HomeAiRequestContext {
  authToken?: string;
  environment: ReplicaEnvironment;
}

interface RequestOptions {
  method?: 'GET' | 'POST';
  hostType?: HomeAiHostType;
  params?: Record<string, ReplicaRequestParamValue>;
  form?: Record<string, ReplicaRequestParamValue>;
}

type HomeAiHostType = keyof typeof homeAiReplicaConfig.hosts;

function buildBusinessUrl(path: string, context: HomeAiRequestContext, hostType: HomeAiHostType = 'business') {
  const host = homeAiReplicaConfig.hosts[hostType];
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
  if (hostType === 'business' && context.environment === 'test') {
    url.searchParams.set('__homeai_env', 'test');
  }
  return url;
}

function apiErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '接口请求失败';
}

export async function requestBusiness<T>(path: string, context: HomeAiRequestContext, options: RequestOptions = {}): Promise<T> {
  const hostType = options.hostType ?? 'business';
  const url = buildBusinessUrl(path, context, hostType);
  appendReplicaRequestParams(url, options.params);

  const hasBody = options.method === 'POST';
  const body = hasBody ? encodeReplicaFormParams(options.form) : undefined;
  // 业务日志统一脱敏，只记录接口路径和参数摘要，避免 authToken 等敏感信息进入控制台。
  console.info('[HomeAI API] 请求接口', redactObject({ hostType, path, method: options.method ?? 'GET', params: options.params, form: options.form }));
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
  console.info('[HomeAI API] 接口响应', { hostType, path, status: response.status, ok: response.ok });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const errorCode = typeof payload.errorCode === 'number' ? payload.errorCode : 0;
  if (payload.success === false || errorCode !== 0) {
    throw new Error(payload.message || `业务错误：${errorCode}`);
  }
  return (payload.data ?? payload) as T;
}

function resolveUploadImageData(payload: UploadImageData | UploadImageData[]) {
  if (Array.isArray(payload)) {
    return payload[0] ?? {};
  }
  return Array.isArray(payload.itemList) && payload.itemList.length > 0 ? payload.itemList[0] : payload;
}

function resolveUploadImageUrl(payload: UploadImageData | UploadImageData[]) {
  const item = resolveUploadImageData(payload);
  return (
    item.previewUrl ||
    item.url ||
    item.imageUrl ||
    item.displayImageUrl ||
    item.rawUrl ||
    item.image?.large ||
    item.image?.small ||
    item.large ||
    item.small ||
    ''
  );
}

async function acquirePixelStudioUploadToken(context: HomeAiRequestContext) {
  const tokenData = await requestBusiness<UploadTokenData>(homeAiReplicaConfig.endpoints.uploadToken, context);
  const upAppKey = tokenData.upAppKey?.trim();
  const upToken = tokenData.upToken?.trim();
  if (!upAppKey || !upToken) {
    throw new Error('获取上传凭据失败');
  }
  return { upAppKey, upToken };
}

export async function uploadHomeAiImage(context: HomeAiRequestContext, file: File): Promise<string> {
  const { upAppKey, upToken } = await acquirePixelStudioUploadToken(context);
  const url = buildBusinessUrl(homeAiReplicaConfig.endpoints.upload, context, 'upload');
  appendReplicaRequestParams(url, { upAppKey, upToken });
  const formData = new FormData();
  // 客户端 FileUploaderSubDomain.pixelStudio 也是先拿 upToken，再把文件字段 file
  // 提交到独立的 Cyclops 上传服务；这里保持同一协议，避免误打业务服务上传接口。
  formData.append('file', file, file.name || 'homeai-upload.jpg');
  console.info('[HomeAI API] 上传图片', { hostType: 'upload', path: homeAiReplicaConfig.endpoints.upload, fileType: file.type, fileSize: file.size });
  const response = await fetch(url.toString(), {
    method: 'POST',
    body: formData,
  });
  const rawText = await response.text();
  const payload = rawText ? (JSON.parse(rawText) as ApiEnvelope<UploadImageData>) : ({} as ApiEnvelope<UploadImageData>);
  console.info('[HomeAI API] 图片上传响应', { status: response.status, ok: response.ok });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const errorCode = typeof payload.errorCode === 'number' ? payload.errorCode : 0;
  if (payload.success === false || errorCode !== 0) {
    throw new Error(payload.message || `业务错误：${errorCode}`);
  }
  const imageUrl = resolveUploadImageUrl((payload.data ?? payload) as UploadImageData | UploadImageData[]);
  if (!imageUrl) {
    throw new Error('图片上传成功但未返回可访问地址');
  }
  return imageUrl;
}

export async function listHomeAiWorks(context: HomeAiRequestContext, page = 1, limit = 20): Promise<WorkItem[]> {
  const response = await requestBusiness(homeAiReplicaConfig.endpoints.generationList, context, {
    params: { page, limit },
  });
  // generation/list 与 ai-app 保持一致：列表只承载 record 级封面，详情页再拉 workList。
  return mapGenerationList(response, limit);
}

export async function getHomeAiGenerationDetail(
  context: HomeAiRequestContext,
  recordCode: string,
  fallbackWork?: WorkItem | null,
): Promise<HomeAiGenerationDetail> {
  console.info('[HomeAI API] 查询作品详情', { recordCode });
  const response = await requestBusiness(homeAiReplicaConfig.endpoints.generationDetail, context, {
    params: { recordCode },
  });
  return mapGenerationDetail(response, fallbackWork);
}

export async function loadHomeAiSnapshot(context: HomeAiRequestContext): Promise<HomeAiSnapshot> {
  const errors: string[] = [];

  const safeLoad = async <T>(label: string, loader: () => Promise<T>) => {
    try {
      return await loader();
    } catch (error) {
      const message = apiErrorMessage(error);
      errors.push(`${label}: ${message}`);
      console.warn('[HomeAI API] 接口请求失败，保留空态', redactObject({ label, message }));
      return null;
    }
  };

  const [user, generationList, recommendList] = await Promise.all([
    context.authToken
      ? safeLoad('currentUser', () =>
          requestBusiness(homeAiReplicaConfig.endpoints.currentUser, context, {
            // current-user 属于认证域；业务服务没有该路径，误走 business 会导致已带 token 仍显示未登录。
            hostType: 'auth',
          }),
        )
      : Promise.resolve(null),
    context.authToken
      ? safeLoad('generationList', () =>
          requestBusiness(homeAiReplicaConfig.endpoints.generationList, context, {
            params: { page: 1, limit: 10 },
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
    ...appShellSnapshot,
    ...mappedSnapshot,
    banners: appShellSnapshot.banners,
    features: appShellSnapshot.features,
  };

  if (errors.length > 0) {
    throw Object.assign(new Error(errors.join('；')), { snapshot });
  }
  return snapshot;
}
