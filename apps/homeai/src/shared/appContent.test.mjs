import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const appVue = readFileSync(new URL('../app/App.vue', import.meta.url), 'utf8');
const demoDataTs = readFileSync(new URL('./demoData.ts', import.meta.url), 'utf8');
const homeaiApiTs = readFileSync(new URL('./homeaiApi.ts', import.meta.url), 'utf8');

test('onboarding source options match APK 5.27.0 order and labels', () => {
  const expectedLabels = [
    '设计师/装修公司推荐',
    '小红书',
    '抖音',
    '微信视频号',
    '朋友分享',
    '应用商店搜索',
    '问的AI，如豆包/千问/文心一言（百度）/kimi/夸克/元宝等',
  ];

  const sourceOptionsMatch = appVue.match(/const sourceOptions = \[([\s\S]*?)\];/);
  assert.ok(sourceOptionsMatch, 'sourceOptions should exist');
  const actualLabels = [...sourceOptionsMatch[1].matchAll(/label: '([^']+)'/g)].map((match) => match[1]);

  assert.deepEqual(actualLabels, expectedLabels);
});

test('mine page includes APK 5.27.0 logged-out copy', () => {
  assert.match(appVue, /点击登录/);
  assert.match(appVue, /登录后获取更多功能信息/);
  assert.match(appVue, /当前账号未登录/);
});

test('live snapshot keeps APK discover shelves while account data stays logged out', () => {
  const liveSnapshotMatch = demoDataTs.match(/export const liveSnapshot[\s\S]*?user: \{/);
  assert.ok(liveSnapshotMatch, 'liveSnapshot should exist');
  assert.match(liveSnapshotMatch[0], /localDiscoverSnapshot/);
  assert.match(homeaiApiTs, /mappedSnapshot\.discover\.length > 0 \? mappedSnapshot\.discover : liveSnapshot\.discover/);
  assert.match(homeaiApiTs, /mappedSnapshot\.discoverTabs\.length > 0 \? mappedSnapshot\.discoverTabs : liveSnapshot\.discoverTabs/);
});
