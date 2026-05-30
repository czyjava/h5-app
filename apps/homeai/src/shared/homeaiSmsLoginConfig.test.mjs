import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const appConfigSource = await readFile(new URL('../../app.config.ts', import.meta.url), 'utf8');
const appVueSource = await readFile(new URL('../app/App.vue', import.meta.url), 'utf8');

test('HomeAI 配置短信登录 auth host 和接口', () => {
  assert.match(appConfigSource, /auth:\s*{/);
  assert.match(appConfigSource, /proxyPrefix:\s*'\/homeai-auth'/);
  assert.match(appConfigSource, /productionTarget:\s*'https:\/\/auth\.wanmeixiangsu\.cn'/);
  assert.match(appConfigSource, /_authVersion:\s*'2\.0'/);
  assert.match(appConfigSource, /loginSmsCheck:\s*'\/api\/open\/v3\/login-sms\/check\.htm'/);
  assert.match(appConfigSource, /loginSmsLogin:\s*'\/api\/open\/v3\/login-sms\/login\.htm'/);
});

test('HomeAI 实时 API 面板接入手机号验证码登录', () => {
  assert.doesNotMatch(appVueSource, /:sms-login-enabled="false"/);
  assert.match(appVueSource, /:send-code-handler="sendLoginSmsCode"/);
  assert.match(appVueSource, /:login-handler="loginWithSmsCode"/);
});

test('HomeAI AI 设计助手接口走 open API 路径', () => {
  assert.doesNotMatch(appConfigSource, /\/api\/h5\/homeai\/design-assistant\//);
  assert.match(appConfigSource, /designAssistantStart:\s*'\/api\/open\/homeai\/design-assistant\/start\.htm'/);
  assert.match(appConfigSource, /designAssistantSend:\s*'\/api\/open\/homeai\/design-assistant\/send\.htm'/);
  assert.match(appConfigSource, /designAssistantSessions:\s*'\/api\/open\/homeai\/design-assistant\/sessions\.htm'/);
  assert.match(appConfigSource, /designAssistantMessages:\s*'\/api\/open\/homeai\/design-assistant\/messages\/list\.htm'/);
  assert.match(appConfigSource, /designAssistantFeedback:\s*'\/api\/open\/homeai\/design-assistant\/feedback\.htm'/);
  assert.match(appConfigSource, /designAssistantRegenerate:\s*'\/api\/open\/homeai\/design-assistant\/regenerate\.htm'/);
  assert.match(appConfigSource, /designAssistantApplyDesign:\s*'\/api\/open\/homeai\/design-assistant\/apply-design\.htm'/);
});
