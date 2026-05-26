import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const appVue = readFileSync(new URL('../app/App.vue', import.meta.url), 'utf8');
const appConfigTs = readFileSync(new URL('../../app.config.ts', import.meta.url), 'utf8');
const commonRedactionTs = readFileSync(new URL('../../../../common/src/redaction.ts', import.meta.url), 'utf8');
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

test('entry login page supports real SMS login chain for test account validation', () => {
  assert.match(appConfigTs, /proxyPrefix: '\/homeai-auth'/);
  assert.match(appConfigTs, /loginSmsCheck: '\/api\/open\/v3\/login-sms\/check\.htm'/);
  assert.match(appConfigTs, /loginSmsLogin: '\/api\/open\/v3\/login-sms\/login\.htm'/);
  assert.match(appVue, /createSmsAuthClient/);
  assert.match(appVue, /entryLoginStep/);
  assert.match(appVue, /entrySmsId/);
  assert.match(appVue, /验证码已发送至/);
  assert.match(appVue, /function sendEntrySmsCode\(\)/);
  assert.match(appVue, /function loginWithEntrySmsCode\(\)/);
  assert.match(appVue, /\\d\{11\}/);
  assert.match(appVue, /\$1 \*\*\*\* \$2/);
  assert.match(appVue, /hasSmsId: Boolean\(entrySmsId\.value\)/);
});

test('proxy redaction covers SMS login secrets in JSON and plain text', () => {
  assert.match(commonRedactionTs, /phoneNumber\|phone\|mobile\|smsId\|smsCode/);
  assert.match(commonRedactionTs, /验证码\[:：\]/);
  assert.match(commonRedactionTs, /\?\<!\\d\)\\d\{11\}/);
});

test('logged-in current user request follows APK auth host', () => {
  assert.match(homeaiApiTs, /function requestAuth/);
  assert.match(homeaiApiTs, /currentUser[\s\S]*requestAuth\(homeAiReplicaConfig\.endpoints\.currentUser/);
});

test('mine page includes APK 5.27.0 logged-out copy', () => {
  assert.match(appVue, /点击登录/);
  assert.match(appVue, /登录后获取更多功能信息/);
  assert.match(appVue, /当前账号未登录/);
  assert.match(appVue, /打开短信登录门面/);
});

test('live snapshot keeps APK discover shelves while account data stays logged out', () => {
  const liveSnapshotMatch = demoDataTs.match(/export const liveSnapshot[\s\S]*?user: \{/);
  assert.ok(liveSnapshotMatch, 'liveSnapshot should exist');
  assert.match(liveSnapshotMatch[0], /localDiscoverSnapshot/);
  assert.match(homeaiApiTs, /mappedSnapshot\.discover\.length > 0 \? mappedSnapshot\.discover : liveSnapshot\.discover/);
  assert.match(homeaiApiTs, /mappedSnapshot\.discoverTabs\.length > 0 \? mappedSnapshot\.discoverTabs : liveSnapshot\.discoverTabs/);
});
