export function shouldRequireAssistantLogin({ authToken }) {
  // AI 设计助手必须依赖真实用户登录态，空 token 时直接引导登录，不进入业务接口或本地兜底。
  return !authToken?.trim();
}

export function shouldUseLocalAssistantExperience(_state) {
  // AI 设计助手是正式业务能力，禁止使用本地 fallback 生成假消息。
  return false;
}

export function shouldQuoteCustomDesignTemplate({ demoMode, sceneType }) {
  // H5 demo 只验证定制设计上下文和消息链路，不走模板询价接口，避免无效拦截影响演示。
  return sceneType === 'CUSTOM_DESIGN' && !demoMode;
}
