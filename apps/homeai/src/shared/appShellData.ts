import { homeAiAssets } from './assets';
import type { HomeAiSnapshot } from './types';

export const appShellSnapshot: HomeAiSnapshot = {
  banners: [homeAiAssets.splashReplaceBg, homeAiAssets.splashColoringBg, homeAiAssets.surveyBg],
  features: [
    {
      code: 'interior',
      title: '室内设计',
      subtitle: '上传房间照片，生成全新软装和布局参考。',
      route: 'http://homeai.nav.wanmeixiangsu.com/default?featureCode=interior',
      accent: '#2f7dff',
      guideImage: homeAiAssets.guide.interiorGood,
      badImage: homeAiAssets.guide.interiorBad,
      icon: homeAiAssets.magicWand,
    },
    {
      code: 'renovation',
      title: '旧房翻新',
      subtitle: '保留空间结构，快速预览翻新后的家。',
      route: 'http://homeai.nav.wanmeixiangsu.com/func_splash?featureCode=renovation',
      accent: '#16b58f',
      guideImage: homeAiAssets.guide.renovationGood,
      badImage: homeAiAssets.guide.renovationBad,
      icon: homeAiAssets.paint,
    },
    {
      code: 'garden',
      title: '庭院设计',
      subtitle: '为露台、花园和入户空间生成景观方案。',
      route: 'http://homeai.nav.wanmeixiangsu.com/single_category?featureCode=garden',
      accent: '#88c93d',
      guideImage: homeAiAssets.guide.gardenGood,
      badImage: homeAiAssets.guide.gardenBad,
      icon: homeAiAssets.defaultColor,
    },
    {
      code: 'floor_plan',
      title: '平面图优化',
      subtitle: '识别户型结构，规划更清晰的空间动线。',
      route: 'http://homeai.nav.wanmeixiangsu.com/template_list?featureCode=floor_plan',
      accent: '#ff9f2f',
      guideImage: homeAiAssets.guide.floorPlanGood,
      badImage: homeAiAssets.guide.floorPlanBad,
      icon: homeAiAssets.upload,
    },
  ],
  discover: [],
  works: [],
  user: {
    nickname: '未登录',
    userId: '-',
    diamondCount: 0,
    vipLabel: '未登录',
  },
};
