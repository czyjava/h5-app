export function createAssistantWorkEntryState(params) {
  const workContext = {
    workId: params.work.id,
    templateId: params.work.templateId,
  };
  const isCustomDesign = params.sceneType === 'CUSTOM_DESIGN';

  // 从作品进入任意 Agent 角色都必须清空旧 session，避免普通问询、绘画和定制设计串用上下文。
  if (params.currentSessionKey) {
    console.info('[HomeAI Assistant] 作品入口重置旧会话', {
      sceneType: params.sceneType,
      workId: params.work.id,
      previousSession: 'cleared',
    });
  }

  return {
    sceneType: params.sceneType,
    workContext,
    sessionKey: '',
    messages: [],
    input: isCustomDesign
      ? `请基于这个${params.work.title}继续优化，开启定制设计`
      : `请结合这个作品，给我一些${params.work.title}的装修优化建议`,
  };
}
