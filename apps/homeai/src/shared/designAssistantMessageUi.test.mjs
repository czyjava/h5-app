import assert from 'node:assert/strict';
import test from 'node:test';
import {
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
