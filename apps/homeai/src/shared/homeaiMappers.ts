import type { DesignAssistantMediaInfo, DiscoverItem, HomeAiSnapshot, UserSummary, WorkItem } from './types';

export interface HomeAiGenerationDetail {
  recordId: string;
  title: string;
  status: string;
  templateCode: string;
  coverUrl: string;
  createdAt: string;
  works: WorkItem[];
}

const emptyUser: UserSummary = {
  nickname: '未登录',
  userId: '-',
  avatar: '',
  vipActive: false,
  diamondCount: 0,
  vipLabel: '未登录',
};

function pickArray(input: unknown): unknown[] {
  if (Array.isArray(input)) {
    return input;
  }
  if (input && typeof input === 'object') {
    const record = input as Record<string, unknown>;
    return pickArray(record.list ?? record.items ?? record.records ?? record.data);
  }
  return [];
}

function pickString(input: Record<string, unknown>, keys: string[], fallback = '') {
  for (const key of keys) {
    const value = input[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    if (typeof value === 'number') {
      return String(value);
    }
  }
  return fallback;
}

function pickRecord(input: unknown): Record<string, unknown> {
  return input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
}

function pickBoolean(input: Record<string, unknown>, keys: string[]) {
  return keys.some((key) => input[key] === true || input[key] === 'true' || input[key] === 'TRUE' || input[key] === 1);
}

function normalizeImageUrl(value: string) {
  if (!value) {
    return '';
  }
  return value.startsWith('//') ? `https:${value}` : value;
}

function resolveVipActive(record: Record<string, unknown>, vipLabel: string) {
  if (pickBoolean(record, ['vip', 'isVip', 'member', 'memberActive', 'vipActive'])) {
    return true;
  }
  const validDuration = Number(record.validDuration ?? record.vipValidDuration ?? 0);
  if (Number.isFinite(validDuration) && validDuration > 0) {
    return true;
  }
  return Boolean(vipLabel && vipLabel !== '未登录' && vipLabel !== '已登录');
}

function parseMaybeJsonObject(input: unknown): unknown {
  if (typeof input !== 'string') {
    return input;
  }
  const trimmed = input.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return input;
  }
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return input;
  }
}

function pickNestedImageUrl(input: unknown): string {
  const parsed = parseMaybeJsonObject(input);
  if (typeof parsed === 'string') {
    return normalizeImageUrl(parsed);
  }
  const record = pickRecord(parsed);
  const directUrl = pickString(record, ['large', 'small', 'url', 'coverUrl', 'resultUrl', 'resultImageUrl', 'imageUrl', 'image', 'thumbnailUrl']);
  if (directUrl) {
    return normalizeImageUrl(directUrl);
  }

  const media = record as DesignAssistantMediaInfo & Record<string, unknown>;
  const imageUrl = pickString(pickRecord(media.image), ['large', 'small']);
  if (imageUrl) {
    return normalizeImageUrl(imageUrl);
  }
  const coverUrl = pickString(pickRecord(media.cover ?? record.cover), ['large', 'small']);
  if (coverUrl) {
    return normalizeImageUrl(coverUrl);
  }
  const videoUrl = pickString(pickRecord(media.video), ['small', 'url']);
  if (videoUrl) {
    return normalizeImageUrl(videoUrl);
  }
  return '';
}

function resolveRecordCoverUrl(record: Record<string, unknown>, fallback = '') {
  const directUrl = pickNestedImageUrl(record);
  if (directUrl) {
    return directUrl;
  }
  const coverUrl = pickNestedImageUrl(record.cover);
  if (coverUrl) {
    return coverUrl;
  }
  const contentUrl = pickNestedImageUrl(record.content ?? record.mediaInfo ?? record.resultContent);
  if (contentUrl) {
    return contentUrl;
  }
  return normalizeImageUrl(fallback);
}

function normalizeGenerationStatus(value: unknown, fallback: string) {
  if (typeof value === 'number') {
    const statusMap: Record<number, string> = {
      0: 'PENDING',
      1: 'PENDING',
      2: 'PROCESSING',
      3: 'FINISHED',
      4: 'FAILED',
      5: 'EXPIRED',
    };
    return statusMap[value] ?? String(value);
  }
  if (typeof value === 'string' && value.trim()) {
    const numericStatus = Number(value);
    if (!Number.isNaN(numericStatus) && String(numericStatus) === value.trim()) {
      return normalizeGenerationStatus(numericStatus, fallback);
    }
    return value.trim();
  }
  return fallback;
}

function mapDiscoverItem(raw: unknown): DiscoverItem {
  const record = pickRecord(raw);
  return {
    title: pickString(record, ['title', 'name', 'templateName'], '未命名灵感'),
    subtitle: pickString(record, ['subTitle', 'subtitle', 'description', 'desc'], ''),
    coverUrl: normalizeImageUrl(pickString(record, ['coverUrl', 'cover', 'imageUrl', 'image', 'url', 'thumbnailUrl'], '')),
    tag: pickString(record, ['tag', 'categoryTitle', 'spaceType'], '全部'),
    buildingType: pickString(record, ['buildingType', 'buildingTypeCode'], ''),
    spaceType: pickString(record, ['spaceType', 'spaceTypeCode'], ''),
  };
}

export function mapWorkItem(raw: unknown, index: number): WorkItem {
  const record = pickRecord(raw);
  return {
    id: pickString(record, ['workId', 'workID', 'work_id', 'id', 'recordCode', 'code'], `work-${index}`),
    recordId: pickString(record, ['recordId', 'recordID', 'record_id', 'recordCode', 'generationRecordId', 'id', 'code'], ''),
    templateId: pickString(record, ['templateId', 'templateID', 'template_id', 'templateCode'], ''),
    sourceType: 'record',
    title: pickString(record, ['title', 'name', 'templateName'], '未命名作品'),
    status: normalizeGenerationStatus(record.status ?? record.generationStatus, ''),
    coverUrl: resolveRecordCoverUrl(record),
    createdAt: pickString(record, ['createdAt', 'createTime', 'gmtCreate'], ''),
  };
}

export function mapGenerationList(raw: unknown, limit = 20): WorkItem[] {
  return pickArray(raw)
    .map(mapWorkItem)
    .filter((item) => item.coverUrl)
    .slice(0, limit);
}

export function mapGenerationWork(raw: unknown, index: number, detail: Pick<HomeAiGenerationDetail, 'recordId' | 'templateCode' | 'title' | 'status' | 'createdAt' | 'coverUrl'>): WorkItem {
  const record = pickRecord(raw);
  return {
    id: pickString(record, ['workCode', 'workId', 'workID', 'work_id', 'id', 'code'], `${detail.recordId}-work-${index}`),
    recordId: pickString(record, ['recordCode', 'recordId', 'recordID', 'record_id', 'generationRecordId'], detail.recordId),
    templateId: pickString(record, ['templateId', 'templateID', 'template_id', 'templateCode'], detail.templateCode),
    sourceType: 'work',
    title: pickString(record, ['title', 'name'], detail.title || `作品 ${index + 1}`),
    status: normalizeGenerationStatus(record.status ?? record.generationStatus, detail.status),
    coverUrl: resolveRecordCoverUrl(record, detail.coverUrl),
    createdAt: pickString(record, ['createdAt', 'createTime', 'gmtCreate'], detail.createdAt),
  };
}

export function mapGenerationDetail(raw: unknown, fallbackWork?: WorkItem | null): HomeAiGenerationDetail {
  const record = pickRecord(raw);
  const recordId = pickString(record, ['recordCode', 'code', 'recordId', 'id'], fallbackWork?.recordId || fallbackWork?.id || '');
  const detail: HomeAiGenerationDetail = {
    recordId,
    title: pickString(record, ['title', 'name', 'templateName'], fallbackWork?.title || '未命名作品'),
    status: normalizeGenerationStatus(record.status ?? record.generationStatus, fallbackWork?.status || ''),
    templateCode: pickString(record, ['templateCode', 'templateId', 'templateID', 'template_id'], fallbackWork?.templateId || ''),
    coverUrl: resolveRecordCoverUrl(record, fallbackWork?.coverUrl || ''),
    createdAt: pickString(record, ['createdAt', 'createTime', 'gmtCreate'], fallbackWork?.createdAt || ''),
    works: [],
  };
  const works = pickArray(record.workList ?? record.works ?? record.items)
    .map((work, index) => mapGenerationWork(work, index, detail))
    .filter((work) => work.coverUrl);
  if (works.length > 0) {
    detail.works = works;
    return detail;
  }
  if (detail.coverUrl) {
    detail.works = [
      {
        id: fallbackWork?.id || recordId,
        recordId,
        templateId: detail.templateCode,
        sourceType: 'record',
        title: detail.title,
        status: detail.status,
        coverUrl: detail.coverUrl,
        createdAt: detail.createdAt,
      },
    ];
  }
  return detail;
}

function mapUser(raw: unknown): UserSummary {
  const record = pickRecord(raw);
  const userId = pickString(record, ['userId', 'id'], emptyUser.userId);
  const nickname = pickString(record, ['nickname', 'nickName', 'name'], emptyUser.nickname);
  const loggedIn = userId !== emptyUser.userId || nickname !== emptyUser.nickname;
  const vipLabel = pickString(record, ['vipLabel', 'vipName'], loggedIn ? '已登录' : emptyUser.vipLabel);
  return {
    nickname,
    userId,
    avatar: normalizeImageUrl(pickString(record, ['largeAvatar', 'avatar', 'avatarUrl', 'headImg'], emptyUser.avatar)),
    vipActive: resolveVipActive(record, vipLabel),
    diamondCount: Number(record.diamondCount ?? record.credit ?? record.balance ?? emptyUser.diamondCount),
    // current-user 经常只返回基础用户资料，不带会员标签；只要有用户身份，就不再显示“未登录”。
    vipLabel,
  };
}

export function normalizeHomeAiSnapshot({
  user,
  generationList,
  recommendList,
}: {
  user?: unknown;
  generationList?: unknown;
  recommendList?: unknown;
} = {}): Pick<HomeAiSnapshot, 'discover' | 'works' | 'user'> {
  const configJson = recommendList && typeof recommendList === 'object' ? (recommendList as Record<string, unknown>).configJson : '';
  const parsedRecommend = typeof configJson === 'string' && configJson.trim() ? JSON.parse(configJson) : recommendList;
  const works = mapGenerationList(generationList, 8);
  const discover = pickArray(parsedRecommend).map(mapDiscoverItem).filter((item) => item.coverUrl);

  return {
    user: user ? mapUser(user) : emptyUser,
    works: works.slice(0, 8),
    discover: discover.slice(0, 12),
  };
}
