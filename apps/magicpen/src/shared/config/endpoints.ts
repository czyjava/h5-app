export const MAGICPEN_BUSINESS_ENV_QUERY_KEY = '__magicpen_env';

export const MAGICPEN_BUSINESS_ENVIRONMENTS = {
  production: {
    label: '正式环境',
    target: 'https://pixel-studio.wanmeixiangsu.cn',
  },
  test: {
    label: '测试环境',
    target: 'https://pixel-studio.ttt.wanmeixiangsu.cn',
  },
} as const;

export type MagicPenApiEnvironment = keyof typeof MAGICPEN_BUSINESS_ENVIRONMENTS;

export function businessTargetForEnvironment(environment: MagicPenApiEnvironment) {
  return MAGICPEN_BUSINESS_ENVIRONMENTS[environment].target;
}

export function businessHostNameForEnvironment(environment: MagicPenApiEnvironment) {
  return businessTargetForEnvironment(environment).replace(/^https?:\/\//, '');
}

export const MAGICPEN_API_HOSTS = {
  business: {
    proxyPrefix: '/magicpen-business',
    target: MAGICPEN_BUSINESS_ENVIRONMENTS.production.target,
  },
  auth: {
    proxyPrefix: '/magicpen-auth',
    target: 'https://auth.wanmeixiangsu.cn',
  },
  config: {
    proxyPrefix: '/magicpen-config',
    target: 'https://config.wanmeixiangsu.cn',
  },
  cheetah: {
    proxyPrefix: '/magicpen-cheetah',
    target: 'https://cheetah.wanmeixiangsu.cn',
  },
  bugly: {
    proxyPrefix: '/magicpen-bugly',
    target: 'https://bugly.wanmeixiangsu.cn',
  },
} as const;

export type MagicPenApiHostKey = keyof typeof MAGICPEN_API_HOSTS;

export const MAGICPEN_ENDPOINTS = {
  currentUser: '/api/open/v2/user/current-user.htm',
  userBalance: '/api/open/user-token/balance.htm',
  userTokenBill: '/api/open/user-token/bill.htm',
  vipUsage: '/api/open/permission/get-vip-benefit-usage.htm',
  userPermission: '/api/open/permission/get-user-permission.htm',
  renewalInfo: '/api/open/renewal/get-renewal-info.htm',
  recommendList: '/api/open/recommend/list.htm',
  communityChannels: '/api/open/community/channel/list.htm',
  communityPostList: '/api/open/community/post/list.htm',
  coloringCards: '/api/open/coloring-card/list.htm',
  interactiveModels: '/api/open/interactive-model/list.htm',
  generationList: '/api/open/generation/list.htm',
  templateDetail: '/api/open/template/detail2.htm',
  quoteByTemplate: '/api/open/generation/quote-by-template.htm',
  loginSmsCheck: '/api/open/v3/login-sms/check.htm',
  loginSmsLogin: '/api/open/v3/login-sms/login.htm',
} as const;
