import { reactive } from 'vue';
import type { MagicPenApiEnvironment } from '@/shared/config/endpoints';

const AUTH_TOKEN_STORAGE_KEY = '__MAGICPEN_AUTH_TOKEN__';
const API_ENVIRONMENT_STORAGE_KEY = '__MAGICPEN_API_ENVIRONMENT__';
const DEMO_MODE_STORAGE_KEY = '__MAGICPEN_DEMO_MODE__';

export interface SessionState {
  apiMode: 'live';
  authToken: string;
  apiEnvironment: MagicPenApiEnvironment;
  demoMode: boolean;
}

function readStoredAuthToken() {
  try {
    return typeof window === 'undefined' ? '' : window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

function isApiEnvironment(value: string | null): value is MagicPenApiEnvironment {
  return value === 'production' || value === 'test';
}

function readStoredApiEnvironment(): MagicPenApiEnvironment {
  try {
    const storedValue = typeof window === 'undefined' ? null : window.sessionStorage.getItem(API_ENVIRONMENT_STORAGE_KEY);
    return isApiEnvironment(storedValue) ? storedValue : 'production';
  } catch {
    return 'production';
  }
}

function readStoredDemoMode() {
  try {
    return typeof window === 'undefined' ? false : window.sessionStorage.getItem(DEMO_MODE_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export const sessionState = reactive<SessionState>({
  apiMode: 'live',
  authToken: readStoredAuthToken(),
  apiEnvironment: readStoredApiEnvironment(),
  demoMode: readStoredDemoMode(),
});

export function setAuthToken(token: string) {
  // token 只保存到当前浏览器会话，避免长期落盘；日志和调试面板仍会脱敏展示。
  const normalizedToken = token.trim();
  sessionState.authToken = normalizedToken;
  try {
    if (normalizedToken) {
      window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, normalizedToken);
    } else {
      window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    }
  } catch {
    // 会话存储不可用时退回内存态，不影响本次页面使用。
  }
}

export function setApiEnvironment(environment: MagicPenApiEnvironment) {
  // 环境只保存到当前浏览器会话，便于测试后自动回到默认正式域。
  sessionState.apiEnvironment = environment;
  try {
    window.sessionStorage.setItem(API_ENVIRONMENT_STORAGE_KEY, environment);
  } catch {
    // 会话存储不可用时退回内存态，不影响本次环境切换。
  }
}

export function setDemoMode(enabled: boolean) {
  // 演示模式只影响当前浏览器会话，避免把演示态长期保存在用户设备里。
  sessionState.demoMode = enabled;
  try {
    if (enabled) {
      window.sessionStorage.setItem(DEMO_MODE_STORAGE_KEY, '1');
    } else {
      window.sessionStorage.removeItem(DEMO_MODE_STORAGE_KEY);
    }
  } catch {
    // 会话存储不可用时退回内存态。
  }
}

export function clearAuthToken() {
  setAuthToken('');
}
