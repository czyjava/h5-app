import type { ReplicaAppConfig, ReplicaCommonQuery, ReplicaDeviceProfile, ReplicaRequestParamValue } from '../types.ts';

export const DEFAULT_ANDROID_REPLICA_DEVICE_PROFILE: ReplicaDeviceProfile = {
  system: 'AE3A.240806.043',
  clv: '2048',
  language: 'zh',
  vendor: 'qudao',
  operator: 'UNKNOWN',
  manufacturer: 'Google',
  platform: 'android',
  renyuan: 'renyuan',
  appName: '',
  systemVersion: '15',
  launch: '18',
  network: 'g3',
  userAgent:
    'Mozilla/5.0 (Linux; Android 15; sdk_gphone64_arm64 Build/AE3A.240806.043; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.6367.219 Mobile Safari/537.36',
};

export interface ReplicaCommonQueryOptions {
  authToken?: string;
  includeLanguage?: boolean;
  deviceProfile?: Partial<ReplicaDeviceProfile>;
}

export interface ReplicaUpstreamHeaderOptions {
  bodyLength?: number;
  contentType?: string;
  contentEncoding?: string;
  deviceProfile?: Partial<ReplicaDeviceProfile>;
}

function mergeDeviceProfile(profile?: Partial<ReplicaDeviceProfile>): ReplicaDeviceProfile {
  return {
    ...DEFAULT_ANDROID_REPLICA_DEVICE_PROFILE,
    ...profile,
  };
}

function normalizeParam(value: ReplicaRequestParamValue) {
  if (value === undefined || value === null || value === '') {
    return '';
  }
  return String(value);
}

export function buildReplicaCommonQuery(
  appConfig: ReplicaAppConfig,
  options: ReplicaCommonQueryOptions = {},
): ReplicaCommonQuery {
  const profile = mergeDeviceProfile(options.deviceProfile);
  const query: ReplicaCommonQuery = {
    _system: profile.system,
    _clv: profile.clv,
    _wmLang: profile.language,
    _pkgName: appConfig.packageName,
    _vendor: profile.vendor,
    _operator: profile.operator,
    _product: appConfig.product,
    _productCategory: appConfig.productCategory,
    _manufacturer: profile.manufacturer,
    _platform: profile.platform,
    _renyuan: profile.renyuan,
    _appName: profile.appName || appConfig.appId,
    _systemVersion: profile.systemVersion,
    _launch: profile.launch,
    _version: appConfig.version,
    _network: profile.network,
    authToken: options.authToken || undefined,
  };
  if (options.includeLanguage === false) {
    // 部分 APP 加密 POST 抓包不带语言参数，公共层允许按接口精确关闭。
    delete query._wmLang;
  }
  return query;
}

export function appendReplicaRequestParams(url: URL, params: Record<string, ReplicaRequestParamValue> = {}) {
  Object.entries(params).forEach(([key, value]) => {
    const normalizedValue = normalizeParam(value);
    if (normalizedValue) {
      url.searchParams.set(key, normalizedValue);
    }
  });
}

export function encodeReplicaFormParams(params: Record<string, ReplicaRequestParamValue> = {}) {
  const body = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    const normalizedValue = normalizeParam(value);
    if (normalizedValue) {
      body.set(key, normalizedValue);
    }
  });
  return body;
}

export function buildReplicaUpstreamHeaders(options: ReplicaUpstreamHeaderOptions = {}) {
  const profile = mergeDeviceProfile(options.deviceProfile);
  const headers = new Headers();
  headers.set('user-agent', profile.userAgent);
  // 抓包里 APP 还声明 tnpn4；公共代理默认只声明 gzip，保证本地调试能读取响应体。
  headers.set('accept-encoding', 'gzip');
  if ((options.bodyLength ?? 0) > 0) {
    headers.set('content-type', options.contentType || 'application/x-www-form-urlencoded');
    if (options.contentEncoding) {
      headers.set('content-encoding', options.contentEncoding);
    }
  }
  return headers;
}
