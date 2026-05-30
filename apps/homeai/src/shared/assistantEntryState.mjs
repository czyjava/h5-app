export function createAssistantWorkEntryState(params) {
  const workContext = {
    workId: params.work.id,
    templateId: params.work.templateId,
  };

  // 从作品只能进入定制设计，并且必须清空旧 session，避免普通问询、绘画和定制设计串用上下文。
  if (params.currentSessionKey) {
    console.info('[HomeAI Assistant] 作品入口重置旧会话', {
      sceneType: 'CUSTOM_DESIGN',
      workId: params.work.id,
      previousSession: 'cleared',
    });
  }

  return {
    sceneType: 'CUSTOM_DESIGN',
    workContext,
    sessionKey: '',
    messages: [],
    input: `请基于这个${params.work.title}继续优化，开启定制设计`,
  };
}
