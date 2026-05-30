import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldUseLocalAssistantExperience } from './designAssistantMode.mjs';

test('非演示模式下即使没有 token 也应走真实装修助手接口', () => {
  assert.equal(shouldUseLocalAssistantExperience({ demoMode: false, authToken: '' }), false);
});

test('演示模式下继续使用本地装修助手体验', () => {
  assert.equal(shouldUseLocalAssistantExperience({ demoMode: true, authToken: 'token' }), true);
});
