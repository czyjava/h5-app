import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldRequireAssistantLogin, shouldUseLocalAssistantExperience } from './designAssistantMode.mjs';

test('未登录时 AI 设计助手必须要求登录', () => {
  assert.equal(shouldRequireAssistantLogin({ authToken: '' }), true);
});

test('已登录时 AI 设计助手不应要求登录', () => {
  assert.equal(shouldRequireAssistantLogin({ authToken: 'token' }), false);
});

test('AI 设计助手不允许使用本地 fallback', () => {
  assert.equal(shouldUseLocalAssistantExperience({ demoMode: true, authToken: 'token' }), false);
});
