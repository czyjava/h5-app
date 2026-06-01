export interface AssistantMessageUiState {
  role?: string | null;
  messageId?: string | null;
  localId?: string | null;
  status?: string | null;
}

export interface AssistantComposerState {
  assistantSending?: boolean;
  messages?: AssistantMessageUiState[];
}

export function shouldShowAssistantMessageActions(message: AssistantMessageUiState) {
  // 仅保留图片定制设计的“应用设计”类动作；普通 AI 问答不再展示消息级操作。
  return (
    message.role === 'ASSISTANT' &&
    Boolean(message.messageId) &&
    message.status !== 'PENDING' &&
    message.status !== 'FAILED'
  );
}

export function isAssistantReplyInProgress(messages: AssistantMessageUiState[] = []) {
  return messages.some((message) => message.role === 'ASSISTANT' && message.status === 'PENDING');
}

export function shouldDisableAssistantComposer(state: AssistantComposerState) {
  // 对话必须串行：请求发送中或已有待完成助手回复时，禁止用户继续输入新问题。
  return Boolean(state.assistantSending) || isAssistantReplyInProgress(state.messages ?? []);
}
