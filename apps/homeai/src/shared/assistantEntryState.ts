import type { DesignAssistantMessage, WorkItem } from './types';

export interface CustomDesignWorkContext {
  workId: string;
  recordId?: string;
  templateId?: string;
  imageUrl?: string;
}

interface AssistantWorkEntryParams {
  currentSessionKey?: string;
  work: Pick<WorkItem, 'id' | 'recordId' | 'templateId' | 'title' | 'coverUrl'>;
}

export interface AssistantWorkEntryState {
  sceneType: 'CUSTOM_DESIGN';
  workContext: CustomDesignWorkContext;
  sessionKey: string;
  messages: DesignAssistantMessage[];
  autoSubmit: boolean;
  input: string;
}

export function createAssistantWorkEntryState(params: AssistantWorkEntryParams): AssistantWorkEntryState {
  const workContext = {
    workId: params.work.id,
    recordId: params.work.recordId,
    templateId: params.work.templateId,
    imageUrl: params.work.coverUrl,
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
    autoSubmit: true,
    input: `请基于这个${params.work.title}继续优化，开启定制设计`,
  };
}

export function resolveCustomDesignMessageImageUrls(
  workContext: Pick<CustomDesignWorkContext, 'imageUrl'> | null | undefined,
  attachmentImageUrls: string[] = [],
) {
  const imageUrls = [workContext?.imageUrl, ...attachmentImageUrls]
    .filter((url): url is string => Boolean(url?.trim()))
    .map((url) => url.trim());
  return Array.from(new Set(imageUrls));
}
