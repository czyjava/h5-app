import { homeAiReplicaConfig } from '../../app.config';
import { requestBusiness, type HomeAiRequestContext } from './homeaiApi';
import { resolveAssistantImageUrl } from './designAssistantApi';
import type { DesignAssistantMediaInfo } from './types';

export type CustomDesignRemoteStatus = 'SUBMITTED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'APPLIED' | string;

export interface CustomDesignSubmitParams {
  generationRecordId: string;
  sourceWorkId: string;
  templateCode: string;
  prompt: string;
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
  outputMediaList?: DesignAssistantMediaInfo[];
  errorCode?: string | null;
  errorMessage?: string | null;
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

export function resolveCustomDesignOutputImageUrl(response: CustomDesignFetchResponse) {
  // 定制设计结果必须来自服务端转存后的媒体结构，避免继续使用静态复刻素材。
  return resolveAssistantImageUrl(response.outputImage) || (response.outputMediaList ?? []).map(resolveAssistantImageUrl).find(Boolean) || '';
}
