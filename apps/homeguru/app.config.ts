import type { ReplicaAppConfig } from '@wmxs/h5-replica-common/client';

export const homeGuruReplicaConfig: ReplicaAppConfig = {
  appId: 'homeguru',
  displayName: '装修国际版',
  packageName: 'com.wanmeixiangsu.android.homeguru',
  version: '5.26.0',
  product: 'homeguru',
  productCategory: 'homeguru',
  hosts: {
    business: {
      proxyPrefix: '/homeguru-business',
      productionTarget: 'https://pixel-studio.wanmeixiangsu.cn',
      testTarget: 'https://pixel-studio.ttt.wanmeixiangsu.cn',
      signKey: '*#06#RotvnIuEg32QqaOmcqh1qGuN',
    },
    config: {
      proxyPrefix: '/homeguru-config',
      productionTarget: 'https://config.wanmeixiangsu.cn',
      testTarget: 'https://config.ttt.wanmeixiangsu.cn',
      signKey: '*#06#bYmCRnJ2jEVreGtEnKKnh6On',
    },
    feedback: {
      proxyPrefix: '/homeguru-feedback',
      productionTarget: 'https://feedback.wanmeixiangsu.cn',
      testTarget: 'https://feedback.ttt.wanmeixiangsu.cn',
      signKey: '*#06#fHhwnIs8b0h2eJycPI6mh4pu',
    },
  },
  endpoints: {
    currentUser: '/api/open/v2/user/current-user.htm',
    featureConfig: '/api/open/homeai/config/feature-config.htm',
    detectObjectsSubmit: '/api/open/homeai/detect-objects/submit.htm',
    detectObjectsResult: '/api/open/homeai/detect-objects/get-result.htm',
    recognizeBuildingType: '/api/open/homeai/generate/recognize-building-type.htm',
    generationList: '/api/open/homeai/generation/list.htm',
    recommendConfig: '/api/open/recommend/config.htm',
    recommendList: '/api/open/recommend/list.htm',
    communityChannels: '/api/open/community/channel/list.htm',
    communityPostList: '/api/open/community/post/list.htm',
    communityPostRecommend: '/api/open/community/post/recommend.htm',
    userPermission: '/api/open/permission/get-user-permission.htm',
    userTokenBalance: '/api/open/user-token/balance.htm',
    goodsList: '/api/open/goods/get-goods-list.htm',
    feedbackCreate: '/api/open/feedback/create.htm',
  },
};
