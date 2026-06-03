import { homeAiReplicaConfig } from '../../app.config';
import { requestBusiness, type HomeAiRequestContext } from './homeaiApi';
import { resolveAssistantImageUrl } from './designAssistantApi';
import type { DesignAssistantMediaInfo } from './types';

export type CustomDesignRemoteStatus = 'SUBMITTED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'WAITING_USER_INPUT' | 'APPLIED' | string;
export type CustomDesignFeedbackStatus = 'SATISFIED' | 'UNSATISFIED';

const CUSTOM_DESIGN_FEEDBACK_ENDPOINT = '/api/open/homeai/custom-design/feedback.htm';

export interface CustomDesignSubmitParams {
  generationRecordId: string;
  sourceWorkId: string;
  templateCode: string;
  prompt: string;
  referenceImageUrl?: string;
  deviceId?: string;
}

export interface CustomDesignSubmitResponse {
  customDesignCode: string;
  status: CustomDesignRemoteStatus;
  nextFetchPeriodMs?: number;
}

export interface CustomDesignFetchResponse {
  customDesignCode: string;
  generationRecordId?: string;
  sourceWorkId?: string;
  templateCode?: string;
  status: CustomDesignRemoteStatus;
  nextFetchPeriodMs?: number;
  outputImage?: DesignAssistantMediaInfo | null;
  assistantText?: string | null;
  feedbackStatus?: CustomDesignFeedbackStatus | string | null;
  outputMediaList?: DesignAssistantMediaInfo[];
  errorCode?: string | null;
  errorMessage?: string | null;
}

export interface CustomDesignRecordItemResponse {
  customDesignCode: string;
  generationRecordId: string;
  sourceWorkId: string;
  templateCode?: string;
  prompt?: string;
  status: CustomDesignRemoteStatus;
  inputMediaList?: DesignAssistantMediaInfo[];
  assistantText?: string | null;
  feedbackStatus?: CustomDesignFeedbackStatus | string | null;
  outputMediaList?: DesignAssistantMediaInfo[];
  errorCode?: string | null;
  errorMessage?: string | null;
  createTime?: string | number;
  finishTime?: string | number;
}

export interface CustomDesignRecordsResponse {
  generationRecordId: string;
  sourceWorkId?: string;
  records?: CustomDesignRecordItemResponse[];
}

export interface CustomDesignApplyResponse {
  customDesignCode: string;
  status: CustomDesignRemoteStatus;
  sourceWorkId?: string;
}

export interface CustomDesignFeedbackResponse {
  customDesignCode: string;
  feedbackStatus: CustomDesignFeedbackStatus;
}

export async function submitHomeAiCustomDesign(context: HomeAiRequestContext, params: CustomDesignSubmitParams) {
  return requestBusiness<CustomDesignSubmitResponse>(
    homeAiReplicaConfig.endpoints.customDesignSubmit,
    context,
    {
      method: 'POST',
      form: { ...params },
    },
  );
}

export async function fetchHomeAiCustomDesign(context: HomeAiRequestContext, customDesignCode: string) {
  return requestBusiness<CustomDesignFetchResponse>(
    homeAiReplicaConfig.endpoints.customDesignFetch,
    context,
    {
      method: 'POST',
      form: { customDesignCode },
    },
  );
}

export async function listHomeAiCustomDesignRecords(
  context: HomeAiRequestContext,
  params: { generationRecordId: string; sourceWorkId?: string; limit?: number },
) {
  return requestBusiness<CustomDesignRecordsResponse>(
    homeAiReplicaConfig.endpoints.customDesignRecords,
    context,
    {
      method: 'POST',
      form: { ...params },
    },
  );
}

export async function applyHomeAiCustomDesign(context: HomeAiRequestContext, customDesignCode: string) {
  return requestBusiness<CustomDesignApplyResponse>(
    homeAiReplicaConfig.endpoints.customDesignApply,
    context,
    {
      method: 'POST',
      form: { customDesignCode },
    },
  );
}

export async function feedbackHomeAiCustomDesign(
  context: HomeAiRequestContext,
  customDesignCode: string,
  feedbackStatus: CustomDesignFeedbackStatus,
) {
  return requestBusiness<CustomDesignFeedbackResponse>(
    CUSTOM_DESIGN_FEEDBACK_ENDPOINT,
    context,
    {
      method: 'POST',
      form: { customDesignCode, feedbackStatus },
    },
  );
}

export function resolveCustomDesignOutputImageUrl(response: CustomDesignFetchResponse) {
  // 定制设计结果必须来自服务端转存后的媒体结构，避免继续使用静态复刻素材。
  return resolveAssistantImageUrl(response.outputImage) || (response.outputMediaList ?? []).map(resolveAssistantImageUrl).find(Boolean) || '';
}

export function resolveCustomDesignRecordInputImageUrl(record: CustomDesignRecordItemResponse) {
  return (record.inputMediaList ?? []).map(resolveAssistantImageUrl).find(Boolean) || '';
}

export function resolveCustomDesignRecordOutputImageUrl(record: CustomDesignRecordItemResponse) {
  return (record.outputMediaList ?? []).map(resolveAssistantImageUrl).find(Boolean) || '';
}
