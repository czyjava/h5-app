export interface AssistantConnectionState {
  authToken?: string;
}

export function shouldRequireAssistantLogin({ authToken }: AssistantConnectionState) {
  // AI 设计助手必须依赖真实用户登录态，空 token 时直接引导登录，不进入业务接口或本地兜底。
  return !authToken?.trim();
}

export function shouldUseLocalAssistantExperience(_state: AssistantConnectionState) {
  // AI 设计助手是正式业务能力，禁止使用本地 fallback 生成假消息。
  return false;
}
