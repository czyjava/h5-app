import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isAssistantReplyInProgress,
  shouldDisableAssistantComposer,
  shouldShowAssistantMessageActions,
} from './designAssistantMessageUi.mjs';

test('成功的助手消息满足消息操作基础条件', () => {
  assert.equal(
    shouldShowAssistantMessageActions({
      role: 'ASSISTANT',
      messageId: 'assistant-message-1',
      status: 'SUCCEEDED',
    }),
    true,
  );
});

test('非可操作消息不展示操作按钮', () => {
  assert.equal(shouldShowAssistantMessageActions({ role: 'USER', messageId: 'user-message-1', status: 'SUCCEEDED' }), false);
  assert.equal(shouldShowAssistantMessageActions({ role: 'ASSISTANT', status: 'SUCCEEDED' }), false);
  assert.equal(shouldShowAssistantMessageActions({ role: 'ASSISTANT', messageId: 'assistant-message-1', status: 'PENDING' }), false);
  assert.equal(shouldShowAssistantMessageActions({ role: 'ASSISTANT', messageId: 'assistant-message-1', status: 'FAILED' }), false);
});

test('助手回复中必须禁用输入，保证串行提问', () => {
  const messages = [
    { role: 'USER', messageId: 'user-message-1', status: 'SUCCEEDED' },
    { role: 'ASSISTANT', localId: 'assistant-pending-1', status: 'PENDING' },
  ];

  assert.equal(isAssistantReplyInProgress(messages), true);
  assert.equal(shouldDisableAssistantComposer({ assistantSending: false, messages }), true);
  assert.equal(shouldDisableAssistantComposer({ assistantSending: true, messages: [] }), true);
  assert.equal(
    shouldDisableAssistantComposer({
      assistantSending: false,
      messages: [{ role: 'ASSISTANT', messageId: 'assistant-message-1', status: 'SUCCEEDED' }],
    }),
    false,
  );
});
