export const ASSISTANT_MESSAGE_REGENERATED_STATE = 'REGENERATED';

export type AssistantFeedbackValue = 'LIKE' | 'DISLIKE';
export type AssistantMessageLocalOperationState = typeof ASSISTANT_MESSAGE_REGENERATED_STATE;

export interface AssistantMessageUiState {
  role?: string | null;
  messageId?: string | null;
  status?: string | null;
  feedback?: string | null;
  localOperationState?: AssistantMessageLocalOperationState | string | null;
}

export function resolveAssistantMessageFeedbackLabel(message: AssistantMessageUiState) {
  const feedback = message.feedback?.trim().toUpperCase();
  if (feedback === 'LIKE') {
    return '已满意';
  }
  if (feedback === 'DISLIKE') {
    return '已不满意';
  }
  return '';
}

export function shouldShowAssistantMessageActions(message: AssistantMessageUiState) {
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
