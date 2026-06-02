import assert from 'node:assert/strict';
import test from 'node:test';
import {
  findAssistantCompletedReply,
  isAssistantReplyInProgress,
  shouldDisableAssistantComposer,
} from './designAssistantMessageUi.mjs';

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

test('助手轮询按 replyToMessageId 未命中时必须用同批次完成回复兜底', () => {
  const messages = [
    { role: 'USER', messageId: 'msg_image', batchNo: 'batch_1', status: 'SUCCEEDED' },
    { role: 'USER', messageId: 'msg_text', batchNo: 'batch_1', status: 'SUCCEEDED' },
    {
      role: 'ASSISTANT',
      messageId: 'msg_assistant',
      batchNo: 'batch_1',
      replyToMessageId: 'msg_image',
      status: 'SUCCEEDED',
    },
  ];

  const reply = findAssistantCompletedReply(messages, {
    replyToMessageId: 'msg_text',
    batchNo: 'batch_1',
  });

  assert.equal(reply?.messageId, 'msg_assistant');
});
