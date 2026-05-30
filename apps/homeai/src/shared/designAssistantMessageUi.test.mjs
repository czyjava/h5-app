import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isAssistantReplyInProgress,
  resolveAssistantMessageFeedbackLabel,
  shouldDisableAssistantComposer,
  shouldShowAssistantMessageActions,
} from './designAssistantMessageUi.mjs';

test('成功的助手消息默认展示操作按钮', () => {
  assert.equal(
    shouldShowAssistantMessageActions({
      role: 'ASSISTANT',
      messageId: 'assistant-message-1',
      status: 'SUCCEEDED',
    }),
    true,
  );
});

test('满意反馈后隐藏操作按钮并展示已满意标签', () => {
  const message = {
    role: 'ASSISTANT',
    messageId: 'assistant-message-1',
    status: 'SUCCEEDED',
    feedback: 'LIKE',
  };

  assert.equal(shouldShowAssistantMessageActions(message), false);
  assert.equal(resolveAssistantMessageFeedbackLabel(message), '已满意');
});

test('不满意反馈后隐藏操作按钮并展示已不满意标签', () => {
  const message = {
    role: 'ASSISTANT',
    messageId: 'assistant-message-1',
    status: 'SUCCEEDED',
    feedback: 'DISLIKE',
  };

  assert.equal(shouldShowAssistantMessageActions(message), false);
  assert.equal(resolveAssistantMessageFeedbackLabel(message), '已不满意');
});

test('重生成后隐藏原消息操作按钮但不展示反馈标签', () => {
  const message = {
    role: 'ASSISTANT',
    messageId: 'assistant-message-1',
    status: 'SUCCEEDED',
    localOperationState: 'REGENERATED',
  };

  assert.equal(shouldShowAssistantMessageActions(message), false);
  assert.equal(resolveAssistantMessageFeedbackLabel(message), '');
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
