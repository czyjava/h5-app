import { homeAiReplicaConfig } from '../../app.config';
import { requestBusiness, type HomeAiRequestContext } from './homeaiApi';
import type {
  DesignAssistantMediaInfo,
  DesignAssistantMessage,
  DesignAssistantMessageInput,
  DesignAssistantMessagesResponse,
  DesignAssistantSceneType,
  DesignAssistantSendResponse,
  DesignAssistantSessionsResponse,
  DesignAssistantStartReason,
  DesignAssistantStartResponse,
} from './types';

interface StartParams {
  sceneType: DesignAssistantSceneType;
  startReason: DesignAssistantStartReason;
  deviceId?: string;
  // 会话可能跨多个作品继续聊，session 级只记录最后一次关联的作品 ID。
  lastWorkId?: string;
  recordId?: string;
  templateId?: string;
  sourceImageUrl?: string;
}

interface SendParams {
  sessionKey: string;
  prompt: string;
  messages?: DesignAssistantMessageInput[];
  imageUrls?: string[];
  workId?: string;
  recordId?: string;
  templateId?: string;
  sourceImageUrl?: string;
  priceChecked?: boolean;
}

function compactForm(input: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  ) as Record<string, string | number | boolean>;
}

function normalizeMessages(response: DesignAssistantSendResponse | DesignAssistantMessagesResponse) {
  if (Array.isArray(response.messages)) {
    return response.messages;
  }
  const sendResponse = response as DesignAssistantSendResponse;
  if (Array.isArray(sendResponse.userMessages) && sendResponse.userMessages.length) {
    return [sendResponse.userMessages, sendResponse.assistantMessage]
      .flat()
      .filter(Boolean) as DesignAssistantMessage[];
  }
  return [sendResponse.userMessage, sendResponse.assistantMessage].filter(Boolean) as DesignAssistantMessage[];
}

export function resolveAssistantText(media?: DesignAssistantMediaInfo | null) {
  return media?.text?.text || '';
}

export function resolveAssistantImageUrl(media?: DesignAssistantMediaInfo | null) {
  return media?.image?.large || media?.image?.small || media?.video?.url || media?.video?.small || '';
}

export async function startDesignAssistantSession(context: HomeAiRequestContext, params: StartParams) {
  return requestBusiness<DesignAssistantStartResponse>(
    homeAiReplicaConfig.endpoints.designAssistantStart,
    context,
    {
      method: 'POST',
      form: compactForm({
        ...params,
        productCategory: homeAiReplicaConfig.productCategory,
        clientInfo: JSON.stringify({ source: 'homeai-h5', version: homeAiReplicaConfig.version }),
      }),
    },
  );
}

export async function sendDesignAssistantMessage(context: HomeAiRequestContext, params: SendParams) {
  const response = await requestBusiness<DesignAssistantSendResponse>(
    homeAiReplicaConfig.endpoints.designAssistantSend,
    context,
    {
      method: 'POST',
      form: compactForm({
        ...params,
        messages: params.messages?.length ? JSON.stringify(params.messages) : undefined,
        imageUrls: params.imageUrls?.join('\n'),
      }),
    },
  );
  return { ...response, messages: normalizeMessages(response) };
}

export async function listDesignAssistantMessages(context: HomeAiRequestContext, sessionKey: string) {
  const response = await requestBusiness<DesignAssistantMessagesResponse>(
    homeAiReplicaConfig.endpoints.designAssistantMessages,
    context,
    { method: 'POST', form: { sessionKey, pageNo: 1, pageSize: 100 } },
  );
  return response.messages ?? [];
}

export async function listDesignAssistantSessions(
  context: HomeAiRequestContext,
  sceneType?: DesignAssistantSceneType,
) {
  const response = await requestBusiness<DesignAssistantSessionsResponse>(
    homeAiReplicaConfig.endpoints.designAssistantSessions,
    context,
    { method: 'POST', form: compactForm({ sceneType, pageNo: 1, pageSize: 50 }) },
  );
  return response.items ?? response.sessions ?? [];
}
