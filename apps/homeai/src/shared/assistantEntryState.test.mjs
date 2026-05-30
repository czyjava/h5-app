import assert from 'node:assert/strict';
import test from 'node:test';
import { createAssistantWorkEntryState } from './assistantEntryState.mjs';

test('我的作品发起定制设计必须进入定制设计新会话并等待用户意图', () => {
  const state = createAssistantWorkEntryState({
    currentSessionKey: 'copywrite-session-1',
    work: {
      id: 'work-1',
      recordId: 'record-1',
      templateId: 'template-1',
      title: '客厅效果图',
      coverUrl: 'https://cdn.example.com/work.png',
    },
  });

  assert.equal(state.sceneType, 'CUSTOM_DESIGN');
  assert.equal(state.autoSubmit, false);
  assert.equal(state.input, '');
  assert.equal(state.sessionKey, '');
  assert.deepEqual(state.messages, []);
  assert.deepEqual(state.workContext, {
    workId: 'work-1',
    recordId: 'record-1',
    templateId: 'template-1',
    imageUrl: 'https://cdn.example.com/work.png',
  });
});
