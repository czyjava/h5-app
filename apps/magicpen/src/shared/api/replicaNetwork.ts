export type RequestParamValue = string | number | boolean | null | undefined;

export const MAGICPEN_CAPTURED_ANDROID_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 15; sdk_gphone64_arm64 Build/AE3A.240806.043; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.6367.219 Mobile Safari/537.36';

const MAGICPEN_CAPTURED_COMMON_QUERY = {
  _system: 'AE3A.240806.043',
  _clv: '2048',
  _wmLang: 'zh',
  _pkgName: 'com.wanmeixiangsu.android.magicpen',
  _vendor: 'qudao',
  _operator: 'UNKNOWN',
  _product: '神笔绘画',
  _productCategory: 'magicpen',
  _manufacturer: 'Google',
  _platform: 'android',
  _renyuan: 'renyuan',
  _appName: 'magicpen',
  _systemVersion: '15',
  _launch: '18',
  _version: '5.25.0',
  _network: 'g3',
} as const;

export interface MagicPenCommonQueryOptions {
  authToken?: string;
  includeLanguage?: boolean;
}

function normalizeParam(value: RequestParamValue) {
  if (value === undefined || value === null || value === '') {
    return '';
  }
  return String(value);
}

export function buildMagicPenCommonQuery(options: MagicPenCommonQueryOptions = {}) {
  const query: Record<string, string | undefined> = {
    ...MAGICPEN_CAPTURED_COMMON_QUERY,
    authToken: options.authToken || undefined,
  };
  if (options.includeLanguage === false) {
    // 抓包显示部分加密 POST 不带 _wmLang；按接口维度显式关闭，避免全局猜测。
    delete query._wmLang;
  }
  return query;
}

export function appendRequestParams(url: URL, params: Record<string, RequestParamValue> = {}) {
  Object.entries(params).forEach(([key, value]) => {
    const normalizedValue = normalizeParam(value);
    if (normalizedValue) {
      url.searchParams.set(key, normalizedValue);
    }
  });
}

export function encodeFormParams(params: Record<string, RequestParamValue> = {}) {
  const body = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    const normalizedValue = normalizeParam(value);
    if (normalizedValue) {
      body.set(key, normalizedValue);
    }
  });
  return body;
}
