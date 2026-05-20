import type { ReplicaAppConfig } from '../../common/src/types';

export const magicPenReplicaConfig: ReplicaAppConfig = {
  appId: 'magicpen',
  displayName: '神笔绘画',
  packageName: 'com.wanmeixiangsu.android.magicpen',
  version: '5.25.0',
  product: '神笔绘画',
  productCategory: 'magicpen',
  hosts: {
    business: {
      proxyPrefix: '/magicpen-business',
      productionTarget: 'https://pixel-studio.wanmeixiangsu.cn',
      testTarget: 'https://pixel-studio.ttt.wanmeixiangsu.cn',
      signKey: '*#06#RotvnIuEg32QqaOmcqh1qGuN',
    },
    auth: {
      proxyPrefix: '/magicpen-auth',
      productionTarget: 'https://auth.wanmeixiangsu.cn',
      signKey: '*#06#p52Gj3BJPIp8omqdl3dzeTxC',
      extraQuery: { _authVersion: '2.0' },
    },
    config: {
      proxyPrefix: '/magicpen-config',
      productionTarget: 'https://config.wanmeixiangsu.cn',
      signKey: '*#06#bYmCRnJ2jEVreGtEnKKnh6On',
    },
  },
  endpoints: {
    currentUser: '/api/open/v2/user/current-user.htm',
    userBalance: '/api/open/user-token/balance.htm',
    userTokenBill: '/api/open/user-token/bill.htm',
    loginSmsCheck: '/api/open/v3/login-sms/check.htm',
    loginSmsLogin: '/api/open/v3/login-sms/login.htm',
    recommendList: '/api/open/recommend/list.htm',
    communityChannels: '/api/open/community/channel/list.htm',
    communityPostList: '/api/open/community/post/list.htm',
    coloringCards: '/api/open/coloring-card/list.htm',
    generationList: '/api/open/generation/list.htm',
  },
};
