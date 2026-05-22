import { homeAiAssets } from './assets';
import type { HomeAiSnapshot } from './types';

const localFeatureSnapshot: Pick<HomeAiSnapshot, 'banners' | 'features'> = {
  banners: [homeAiAssets.splashReplaceBg, homeAiAssets.splashColoringBg, homeAiAssets.surveyBg],
  features: [
    {
      code: 'interior',
      title: '室内设计',
      subtitle: 'AI智能设计，探索千万种装修风格',
      route: 'http://homeai.nav.wanmeixiangsu.com/default?featureCode=interior',
      accent: '#2f7dff',
      guideImage: homeAiAssets.guide.interiorGood,
      badImage: homeAiAssets.guide.interiorBad,
      homeImage: homeAiAssets.guide.interiorGood,
      icon: homeAiAssets.magicWand,
    },
    {
      code: 'living_room',
      title: '客厅设计',
      subtitle: '精致生活从客厅开始，AI 设计一步到位',
      route: 'http://homeai.nav.wanmeixiangsu.com/default?featureCode=living_room',
      accent: '#16b58f',
      guideImage: homeAiAssets.guide.interiorBad,
      badImage: homeAiAssets.guide.floorPlanGood,
      homeImage: homeAiAssets.guide.interiorBad,
      icon: homeAiAssets.paint,
    },
    {
      code: 'bedroom',
      title: '卧室设计',
      subtitle: '卧室毛坯焕新颜，定制静谧休憩居所',
      route: 'http://homeai.nav.wanmeixiangsu.com/default?featureCode=bedroom',
      accent: '#88c93d',
      guideImage: homeAiAssets.guide.floorPlanGood,
      badImage: homeAiAssets.guide.gardenGood,
      homeImage: homeAiAssets.guide.floorPlanGood,
      icon: homeAiAssets.defaultColor,
    },
  ],
};

export const liveSnapshot: HomeAiSnapshot = {
  ...localFeatureSnapshot,
  discover: [],
  discoverTabs: [],
  works: [],
  user: {
    nickname: '未登录',
    userId: '',
    diamondCount: 0,
    vipLabel: '',
  },
};

export const demoSnapshot: HomeAiSnapshot = {
  ...localFeatureSnapshot,
  discover: [
    {
      title: '奶油风客厅',
      subtitle: '柔和浅色墙面、低饱和家具和隐藏灯带。',
      coverUrl: homeAiAssets.guide.interiorGood,
      tag: '室内',
      buildingType: 'interior',
      spaceType: 'living_room',
    },
    {
      title: '庭院步道改造',
      subtitle: '用绿植、石材与低位照明提升入户仪式感。',
      coverUrl: homeAiAssets.guide.gardenGood,
      tag: '庭院',
      buildingType: 'garden',
      spaceType: 'outdoor',
    },
    {
      title: '旧房焕新案例',
      subtitle: '保持原有格局，替换墙面、地板和灯光气质。',
      coverUrl: homeAiAssets.guide.renovationGood,
      tag: '翻新',
      buildingType: 'renovation',
      spaceType: 'bedroom',
    },
    {
      title: '店铺门头灵感',
      subtitle: '更醒目的招牌、橱窗和夜间照明方案。',
      coverUrl: homeAiAssets.guide.exteriorGood,
      tag: '外立面',
      buildingType: 'exterior',
      spaceType: 'storefront',
    },
  ],
  discoverTabs: [
    {
      key: 'interior',
      label: '室内',
      sections: [
        {
          key: 'bedroom',
          title: '卧室',
          items: [
            { id: 'bedroom-1', title: '卧室灵感 1', coverUrl: homeAiAssets.guide.interiorGood },
            { id: 'bedroom-2', title: '卧室灵感 2', coverUrl: homeAiAssets.guide.interiorGood },
            { id: 'bedroom-3', title: '卧室灵感 3', coverUrl: homeAiAssets.guide.renovationGood },
          ],
        },
        {
          key: 'living-room',
          title: '客厅',
          items: [
            { id: 'living-1', title: '客厅灵感 1', coverUrl: homeAiAssets.guide.interiorBad },
            { id: 'living-2', title: '客厅灵感 2', coverUrl: homeAiAssets.guide.interiorBad },
            { id: 'living-3', title: '客厅灵感 3', coverUrl: homeAiAssets.guide.gardenGood },
          ],
        },
        {
          key: 'kitchen',
          title: '厨房',
          items: [
            { id: 'kitchen-1', title: '厨房灵感 1', coverUrl: homeAiAssets.guide.floorPlanGood },
            { id: 'kitchen-2', title: '厨房灵感 2', coverUrl: homeAiAssets.guide.floorPlanBad },
            { id: 'kitchen-3', title: '厨房灵感 3', coverUrl: homeAiAssets.guide.floorPlanGood },
          ],
        },
      ],
    },
    {
      key: 'exterior',
      label: '外观',
      sections: [
        {
          key: 'facade',
          title: '外观',
          items: [
            { id: 'facade-1', title: '外观灵感 1', coverUrl: homeAiAssets.guide.exteriorGood },
            { id: 'facade-2', title: '外观灵感 2', coverUrl: homeAiAssets.guide.gardenGood },
            { id: 'facade-3', title: '外观灵感 3', coverUrl: homeAiAssets.guide.exteriorBad },
          ],
        },
      ],
    },
  ],
  works: [],
  user: {
    nickname: '沉愿',
    userId: 'homeai-demo',
    diamondCount: 0,
    vipLabel: '体验会员',
  },
};
