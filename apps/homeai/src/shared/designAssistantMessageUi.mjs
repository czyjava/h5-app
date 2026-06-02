export function isAssistantReplyInProgress(messages = []) {
  return messages.some((message) => message.role === 'ASSISTANT' && message.status === 'PENDING');
}

export function shouldDisableAssistantComposer(state) {
  // 对话必须串行：请求发送中或已有待完成助手回复时，禁止用户继续输入新问题。
  return Boolean(state.assistantSending) || isAssistantReplyInProgress(state.messages ?? []);
}
