import type { ReplicaAppConfig } from '../types.ts';

export interface SmsCheckData {
  checkType?: string;
  delay?: number;
  restSeconds?: number;
  smsCode?: string;
  smsId?: string;
}

export interface SmsLoginData {
  authToken?: string;
  nickname?: string;
  phone?: string;
  userId?: string;
  smsToken?: string;
  validDuration?: number;
}

interface ApiEnvelope<T = unknown> {
  data: T;
  errorCode?: number;
  message?: string | null;
  success?: boolean;
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

function buildAuthUrl(config: ReplicaAppConfig, path: string) {
  const authHost = config.hosts.auth;
  if (!authHost) {
    throw new Error('缺少 auth host 配置');
  }

  const url = new URL(`${authHost.proxyPrefix}${path}`, window.location.origin);
  url.searchParams.set('_system', 'H5');
  url.searchParams.set('_clv', '2048');
  url.searchParams.set('_wmLang', 'zh');
  url.searchParams.set('_pkgName', config.packageName);
  url.searchParams.set('_vendor', 'h5');
  url.searchParams.set('_product', config.product);
  url.searchParams.set('_productCategory', config.productCategory);
  url.searchParams.set('_platform', 'h5');
  url.searchParams.set('_renyuan', 'h5');
  url.searchParams.set('_appName', config.appId);
  url.searchParams.set('_version', config.version);
  url.searchParams.set('_network', 'wifi');
  return url.toString();
}

async function requestAuthForm<T>(config: ReplicaAppConfig, path: string, bodyParams: Record<string, string | undefined>) {
  // 登录请求日志只允许打印路径和状态，手机号、验证码和 smsId 交给代理层脱敏。
  console.info('[Replica Auth] 请求登录接口', { appId: config.appId, path });
  const response = await fetch(buildAuthUrl(config, path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: encodeFormBody(bodyParams),
  });
  const rawText = await response.text();
  const payload = rawText ? (JSON.parse(rawText) as ApiEnvelope<T>) : null;
  console.info('[Replica Auth] 登录接口响应', { appId: config.appId, path, status: response.status, ok: response.ok });

  if (!response.ok || !payload) {
    throw new Error(payload?.message || `登录接口请求失败：${response.status}`);
  }
  const errorCode = typeof payload.errorCode === 'number' ? payload.errorCode : 0;
  if (payload.success === false || errorCode !== 0) {
    throw new Error(payload.message || `登录接口业务错误：${errorCode}`);
  }
  return payload.data;
}

export function createSmsAuthClient(config: ReplicaAppConfig) {
  return {
    sendCode(phoneNumber: string) {
      return requestAuthForm<SmsCheckData>(config, config.endpoints.loginSmsCheck, { phoneNumber });
    },
    async login(phoneNumber: string, smsCode: string, smsId: string) {
      const userInfo = await requestAuthForm<SmsLoginData>(config, config.endpoints.loginSmsLogin, {
        phoneNumber,
        smsCode,
        smsId,
      });
      if (!userInfo?.authToken) {
        throw new Error('登录成功响应中没有 authToken');
      }
      return userInfo;
    },
  };
}
