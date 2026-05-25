import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const appVue = readFileSync(new URL('../app/App.vue', import.meta.url), 'utf8');
const demoDataTs = readFileSync(new URL('./demoData.ts', import.meta.url), 'utf8');
const homeaiApiTs = readFileSync(new URL('./homeaiApi.ts', import.meta.url), 'utf8');

test('entry login page matches APK build 2707 copy and guest fallback', () => {
  assert.match(appVue, /const ENTRY_GATE_STORAGE_KEY =/);
  assert.match(appVue, /请输入手机号/);
  assert.match(appVue, /验证码登录/);
  assert.match(appVue, /我已阅读并同意「AI装修大师」的/);
  assert.match(appVue, /其他登录方式/);
  assert.match(appVue, /微信登录/);
  assert.match(appVue, /function dismissEntryGate\(\)/);
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
