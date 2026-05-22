import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeHomeAiSnapshot, normalizeHomeAiVipPlans } from './homeaiMappers.mjs';

test('normalizeHomeAiSnapshot maps user, work, and discover payloads with fallbacks', () => {
  const snapshot = normalizeHomeAiSnapshot({
    user: { nickname: '设计师', userId: 42, credit: 18, vipName: 'VIP 体验' },
    generationList: {
      list: [
        {
          recordCode: 'r1',
          templateName: '客厅改造',
          resultUrl: '//cdn.example.com/a.png',
          generationStatus: 'FINISHED',
        },
      ],
    },
    recommendList: {
      list: [
        {
          title: '现代客厅',
          coverUrl: 'https://cdn.example.com/b.png',
          tag: '室内',
        },
      ],
    },
  });

  assert.equal(snapshot.user.nickname, '设计师');
  assert.equal(snapshot.user.userId, '42');
  assert.equal(snapshot.user.diamondCount, 18);
  assert.equal(snapshot.works[0].coverUrl, 'https://cdn.example.com/a.png');
  assert.equal(snapshot.works[0].status, 'FINISHED');
  assert.equal(snapshot.discover[0].tag, '室内');
});

test('normalizeHomeAiSnapshot keeps live empty defaults without account payload', () => {
  const snapshot = normalizeHomeAiSnapshot();

  assert.equal(snapshot.user.nickname, '未登录');
  assert.equal(snapshot.user.diamondCount, 0);
  assert.deepEqual(snapshot.works, []);
  assert.deepEqual(snapshot.discover, []);
  assert.deepEqual(snapshot.discoverTabs, []);
});

test('normalizeHomeAiVipPlans maps service goods item list without local prices', () => {
  const plans = normalizeHomeAiVipPlans({
    itemList: [
      {
        channelCode: 'homeai_purchase_regenerate',
        channelPrice: 198,
        currencySymbol: '¥',
        goodsCode: 'homeai_vip_365d',
        goodsName: 'AI装修大师-年会员',
        goodsPrice: 298,
        paymentOptions: [
          {
            externalProductId: 'homeai_vip_365d_alipay',
            tradeMainPlatform: 'alipay',
            tradeSubPlatform: 'alipay_mobile',
          },
        ],
        tokenCount: 3600,
      },
    ],
  });

  assert.equal(plans.length, 1);
  assert.equal(plans[0].key, 'homeai_vip_365d');
  assert.equal(plans[0].label, 'AI装修大师-年会员');
  assert.equal(plans[0].price, '¥198');
  assert.equal(plans[0].originalPrice, '¥298');
  assert.equal(plans[0].tokenCount, 3600);
  assert.equal(plans[0].paymentOptions[0].tradeSubPlatform, 'alipay_mobile');
});
