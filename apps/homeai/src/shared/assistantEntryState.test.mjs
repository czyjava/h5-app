import assert from 'node:assert/strict';
import test from 'node:test';
import { createAssistantWorkEntryState, resolveCustomDesignMessageImageUrls } from './assistantEntryState.mjs';

test('我的作品发起定制设计必须进入定制设计新会话', () => {
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
  assert.equal(state.autoSubmit, true);
  assert.equal(state.sessionKey, '');
  assert.deepEqual(state.messages, []);
  assert.deepEqual(state.workContext, {
    workId: 'work-1',
    recordId: 'record-1',
    templateId: 'template-1',
    imageUrl: 'https://cdn.example.com/work.png',
  });
  assert.match(state.input, /定制设计|继续优化/);
});

test('定制设计发送消息时必须优先带入作品图', () => {
  const imageUrls = resolveCustomDesignMessageImageUrls(
    { workId: 'work-1', imageUrl: 'https://cdn.example.com/work.png' },
    ['https://cdn.example.com/user.png', 'https://cdn.example.com/work.png'],
  );

  assert.deepEqual(imageUrls, ['https://cdn.example.com/work.png', 'https://cdn.example.com/user.png']);
});
