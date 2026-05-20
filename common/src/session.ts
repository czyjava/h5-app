import type { ReplicaEnvironment } from './types.ts';

export interface ReplicaSessionState {
  authToken: string;
  environment: ReplicaEnvironment;
  demoMode: boolean;
}

function storageKey(appId: string, key: string) {
  return `__WMXS_H5_REPLICA_${appId.toUpperCase()}_${key}__`;
}

function safeGet(key: string) {
  try {
    return typeof window === 'undefined' ? '' : window.sessionStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}

function safeSet(key: string, value: string) {
  try {
    if (value) {
      window.sessionStorage.setItem(key, value);
    } else {
      window.sessionStorage.removeItem(key);
    }
  } catch {
    // 会话存储不可用时由调用方继续使用内存态。
  }
}

export function createReplicaSession(appId: string): ReplicaSessionState {
  const environment = safeGet(storageKey(appId, 'ENVIRONMENT'));
  return {
    authToken: safeGet(storageKey(appId, 'AUTH_TOKEN')),
    environment: environment === 'test' ? 'test' : 'production',
    demoMode: safeGet(storageKey(appId, 'DEMO_MODE')) === '1',
  };
}

export function persistReplicaAuthToken(appId: string, token: string) {
  // token 只保存到当前浏览器会话，避免长期落盘。
  safeSet(storageKey(appId, 'AUTH_TOKEN'), token.trim());
}

export function persistReplicaEnvironment(appId: string, environment: ReplicaEnvironment) {
  safeSet(storageKey(appId, 'ENVIRONMENT'), environment);
}

export function persistReplicaDemoMode(appId: string, enabled: boolean) {
  safeSet(storageKey(appId, 'DEMO_MODE'), enabled ? '1' : '');
}
