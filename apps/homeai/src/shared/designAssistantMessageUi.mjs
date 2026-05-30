export const ASSISTANT_MESSAGE_REGENERATED_STATE = 'REGENERATED';

export function resolveAssistantMessageFeedbackLabel(message) {
  const feedback = message.feedback?.trim().toUpperCase();
  if (feedback === 'LIKE') {
    return '已满意';
  }
  if (feedback === 'DISLIKE') {
    return '已不满意';
  }
  return '';
}

export function shouldShowAssistantMessageActions(message) {
  // 消息级操作一旦有明确反馈或触发重生成，就隐藏原消息按钮，避免重复操作同一条回复。
  return (
    message.role === 'ASSISTANT' &&
    Boolean(message.messageId) &&
    message.status !== 'PENDING' &&
    message.status !== 'FAILED' &&
    !resolveAssistantMessageFeedbackLabel(message) &&
    message.localOperationState !== ASSISTANT_MESSAGE_REGENERATED_STATE
  );
}

export function isAssistantReplyInProgress(messages = []) {
  return messages.some((message) => message.role === 'ASSISTANT' && message.status === 'PENDING');
}

export function shouldDisableAssistantComposer(state) {
  // 对话必须串行：请求发送中或已有待完成助手回复时，禁止用户继续输入新问题。
  return Boolean(state.assistantSending) || isAssistantReplyInProgress(state.messages ?? []);
}
