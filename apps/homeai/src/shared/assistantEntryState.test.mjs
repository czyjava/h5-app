import assert from 'node:assert/strict';
import test from 'node:test';
import { createAssistantWorkEntryState } from './assistantEntryState.mjs';

test('我的作品发起定制设计必须进入定制设计新会话', () => {
  const state = createAssistantWorkEntryState({
    sceneType: 'CUSTOM_DESIGN',
    currentSessionKey: 'copywrite-session-1',
    work: { id: 'work-1', templateId: 'interior', title: '客厅效果图' },
  });

  assert.equal(state.sceneType, 'CUSTOM_DESIGN');
  assert.equal(state.sessionKey, '');
  assert.deepEqual(state.messages, []);
  assert.deepEqual(state.workContext, { workId: 'work-1', templateId: 'interior' });
  assert.match(state.input, /定制设计|继续优化/);
});

test('我的作品问助手必须和定制设计会话隔离', () => {
  const state = createAssistantWorkEntryState({
    sceneType: 'ASSISTANT_CHAT',
    currentSessionKey: 'custom-design-session-1',
    work: { id: 'work-2', templateId: 'garden', title: '花园方案' },
  });

  assert.equal(state.sceneType, 'ASSISTANT_CHAT');
  assert.equal(state.sessionKey, '');
  assert.deepEqual(state.messages, []);
  assert.deepEqual(state.workContext, { workId: 'work-2', templateId: 'garden' });
  assert.match(state.input, /装修优化建议/);
});
