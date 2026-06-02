export interface AssistantMessageUiState {
  role?: string | null;
  messageId?: string | null;
  localId?: string | null;
  batchNo?: string | null;
  replyToMessageId?: string | null;
  status?: string | null;
}

export interface AssistantComposerState {
  assistantSending?: boolean;
  messages?: AssistantMessageUiState[];
}

export interface AssistantReplyLookup {
  replyToMessageId?: string | null;
  batchNo?: string | null;
}

export function isAssistantReplyInProgress(messages: AssistantMessageUiState[] = []) {
  return messages.some((message) => message.role === 'ASSISTANT' && message.status === 'PENDING');
}

export function shouldDisableAssistantComposer(state: AssistantComposerState) {
  // 对话必须串行：请求发送中或已有待完成助手回复时，禁止用户继续输入新问题。
  return Boolean(state.assistantSending) || isAssistantReplyInProgress(state.messages ?? []);
}

export function findAssistantCompletedReply(messages: AssistantMessageUiState[] = [], lookup: AssistantReplyLookup) {
  const replyToMessageId = String(lookup.replyToMessageId || '').trim();
  const batchNo = String(lookup.batchNo || '').trim();
  const isCompletedAssistant = (message: AssistantMessageUiState) =>
    message.role === 'ASSISTANT' && message.status !== 'PENDING';
  const replyByMessageId = replyToMessageId
    ? messages.find((message) => isCompletedAssistant(message) && message.replyToMessageId === replyToMessageId)
    : null;
  if (replyByMessageId) {
    return replyByMessageId;
  }
  // 后端同一轮可能保存多条用户消息，助手回复锚点在极端情况下会和前端取到的文本消息不同；
  // 此时用同 batchNo 的已完成助手消息兜底，避免真实回复已落库但页面一直停留在“生成中”。
  return batchNo ? messages.find((message) => isCompletedAssistant(message) && message.batchNo === batchNo) : undefined;
}
