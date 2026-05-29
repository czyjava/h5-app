export type MainTab = 'home' | 'design' | 'assistant' | 'discover' | 'mine';

export type DesignAssistantSceneType = 'ASSISTANT_CHAT' | 'CUSTOM_DESIGN';
export type DesignAssistantStartReason = 'APP_LAUNCH_FIRST_ENTER' | 'MANUAL_NEW' | 'WORK_RESULT_ENTER';
export type DesignAssistantRole = 'USER' | 'ASSISTANT';
export type DesignAssistantContentType = 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO';
export type DesignAssistantMessageStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED';
export type DesignAssistantApplyStatus = 'NONE' | 'APPLIED' | 'APPLY_FAILED';

export interface DesignAssistantMediaInfo {
  type?: DesignAssistantContentType | string;
  image?: {
    small?: string | null;
    large?: string | null;
    width?: number | string | null;
    height?: number | string | null;
  } | null;
  cover?: {
    small?: string | null;
    large?: string | null;
  } | null;
  video?: {
    url?: string | null;
    small?: string | null;
  } | null;
  text?: {
    text?: string | null;
    langCode?: string | null;
    wordCount?: number | null;
  } | null;
}

export interface DesignAssistantMessage {
  messageId?: string | null;
  batchNo?: string | null;
  replyToMessageId?: string | null;
  workId?: string | null;
  templateId?: string | null;
  role?: DesignAssistantRole | string | null;
  status?: DesignAssistantMessageStatus | string | null;
  contentType?: DesignAssistantContentType | string | null;
  messageContent?: DesignAssistantMediaInfo | null;
  applyStatus?: DesignAssistantApplyStatus | string | null;
  applyTime?: string | number | null;
  applyErrorCode?: string | null;
  feedback?: string | null;
  feedbackReason?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  messageTime?: string | number | null;
}

export interface DesignAssistantSessionItem {
  sessionKey: string;
  sceneType?: DesignAssistantSceneType | string | null;
  summary?: string | null;
  status?: string | null;
  createTime?: string | number | null;
  updateTime?: string | number | null;
}

export interface DesignAssistantStartResponse {
  sessionKey: string;
  session?: DesignAssistantSessionItem | null;
  messages?: DesignAssistantMessage[];
}

export interface DesignAssistantSendResponse {
  sessionKey?: string | null;
  userMessage?: DesignAssistantMessage | null;
  assistantMessage?: DesignAssistantMessage | null;
  messages?: DesignAssistantMessage[];
}

export interface DesignAssistantMessagesResponse {
  sessionKey?: string | null;
  messages?: DesignAssistantMessage[];
}

export interface DesignAssistantSessionsResponse {
  sessions?: DesignAssistantSessionItem[];
}

export interface DesignAssistantApplyDesignResponse {
  messageId?: string | null;
  applyStatus?: DesignAssistantApplyStatus | string | null;
  applyTime?: string | number | null;
}

export interface DesignFeature {
  code: string;
  title: string;
  subtitle: string;
  route: string;
  accent: string;
  guideImage: string;
  badImage?: string;
  icon: string;
}

export interface DiscoverItem {
  title: string;
  subtitle: string;
  coverUrl: string;
  tag: string;
  buildingType: string;
  spaceType: string;
}

export interface WorkItem {
  id: string;
  title: string;
  status: string;
  coverUrl: string;
  createdAt?: string;
}

export interface UserSummary {
  nickname: string;
  userId: string;
  diamondCount: number;
  vipLabel: string;
}

export interface HomeAiSnapshot {
  banners: string[];
  features: DesignFeature[];
  discover: DiscoverItem[];
  works: WorkItem[];
  user: UserSummary;
}

export interface HomeAiApiState {
  mode: 'demo' | 'live';
  environmentLabel: string;
  lastError: string;
}
