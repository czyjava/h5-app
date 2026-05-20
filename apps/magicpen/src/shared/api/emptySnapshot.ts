import type { MagicPenSnapshot, UserProfile } from '@/entities/magicpen/types';
import { businessHostNameForEnvironment } from '@/shared/config/endpoints';

export function createEmptyProfile(): UserProfile {
  return {
    nickname: '',
    avatar: '',
    diamonds: 0,
    vipExpire: '',
    level: '',
  };
}

export function createEmptySnapshot(
  message = '等待实时 API 响应',
  host = businessHostNameForEnvironment('production'),
): MagicPenSnapshot {
  return {
    apiStatus: {
      mode: 'live',
      host,
      signed: false,
      tokenReady: false,
      source: 'pending',
      endpointCount: 0,
      message,
      loadedAt: '',
    },
    homeCards: [],
    channels: [],
    posts: [],
    coloringCards: [],
    interactiveScenes: [],
    works: [],
    tokenBills: [],
    profile: createEmptyProfile(),
  };
}
