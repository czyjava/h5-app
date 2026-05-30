export function shouldUseLocalAssistantExperience({ demoMode }) {
  // 只有显式演示模式才走本地体验；空 token 也要请求真实接口，让后端返回真实结果或鉴权错误。
  return demoMode;
}
