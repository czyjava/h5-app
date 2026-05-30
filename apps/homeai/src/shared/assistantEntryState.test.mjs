import assert from 'node:assert/strict';
import test from 'node:test';
import { createAssistantWorkEntryState } from './assistantEntryState.mjs';

test('我的作品发起定制设计必须进入定制设计新会话', () => {
  const state = createAssistantWorkEntryState({
    currentSessionKey: 'copywrite-session-1',
    work: { id: 'work-1', templateId: 'interior', title: '客厅效果图' },
  });

  assert.equal(state.sceneType, 'CUSTOM_DESIGN');
  assert.equal(state.sessionKey, '');
  assert.deepEqual(state.messages, []);
  assert.deepEqual(state.workContext, { workId: 'work-1', templateId: 'interior' });
  assert.match(state.input, /定制设计|继续优化/);
});
