import { MAGICPEN_API_HOSTS, MAGICPEN_ENDPOINTS } from '@/shared/config/endpoints';
import { appendRequestParams, buildMagicPenCommonQuery } from '@/shared/api/replicaNetwork';

interface ApiEnvelope<T = unknown> {
  data: T;
  errorCode?: number;
  message?: string | null;
  success?: boolean;
}

export interface LoginSmsCheckData {
  checkType?: string;
  delay?: number;
  restSeconds?: number;
  smsCode?: string;
  smsId?: string;
}

export interface LoginUserInfo {
  authToken?: string;
  nickname?: string;
  phone?: string;
  userId?: string;
  smsToken?: string;
  validDuration?: number;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function buildAuthUrl(path: string) {
  const url = new URL(`${MAGICPEN_API_HOSTS.auth.proxyPrefix}${path}`, window.location.origin);
  appendRequestParams(url, buildMagicPenCommonQuery());
  return url.toString();
}

function encodeFormBody(params: Record<string, string | undefined>) {
  const body = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      body.set(key, value);
    }
  });
  return body;
}

function envelopeError(payload: unknown, fallback: string) {
  const record = asRecord(payload);
  return asString(record.message) || fallback;
}

async function requestAuthForm<T>(path: string, bodyParams: Record<string, string | undefined>): Promise<T> {
  // 登录接口只打印路径和状态，手机号、验证码、token 只进入请求体并由代理调试层脱敏。
  console.info('[MagicPen Auth] 请求登录接口', { path });
  const response = await fetch(buildAuthUrl(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: encodeFormBody(bodyParams),
  });
  const rawText = await response.text();
  const payload = rawText ? (JSON.parse(rawText) as ApiEnvelope<T>) : null;
  console.info('[MagicPen Auth] 登录接口响应', { path, status: response.status, ok: response.ok });

  if (!response.ok) {
    throw new Error(envelopeError(payload, `登录接口请求失败：${response.status}`));
  }
  if (!payload) {
    throw new Error('登录接口响应为空');
  }
  const errorCode = typeof payload.errorCode === 'number' ? payload.errorCode : 0;
  if (payload.success === false || errorCode !== 0) {
    throw new Error(payload.message || `登录接口业务错误：${errorCode}`);
  }
  return payload.data;
}

export async function sendLoginSmsCode(phoneNumber: string) {
  return requestAuthForm<LoginSmsCheckData>(MAGICPEN_ENDPOINTS.loginSmsCheck, {
    phoneNumber,
  });
}

export async function loginWithSmsCode(phoneNumber: string, smsCode: string, smsId: string) {
  const userInfo = await requestAuthForm<LoginUserInfo>(MAGICPEN_ENDPOINTS.loginSmsLogin, {
    phoneNumber,
    smsCode,
    smsId,
  });
  if (!userInfo?.authToken) {
    throw new Error('登录成功响应中没有 authToken');
  }
  return userInfo;
}
