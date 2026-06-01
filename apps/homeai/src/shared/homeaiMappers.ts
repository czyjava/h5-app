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

const mapperFallback: Pick<HomeAiSnapshot, 'discover' | 'works' | 'user'> = {
  discover: [
    {
      title: '现代客厅灵感',
      subtitle: '上传户型照片，快速获得装修参考。',
      coverUrl: '/assets/homeai/interior_guide_good.png',
      tag: '室内',
      buildingType: 'interior',
      spaceType: 'living_room',
    },
  ],
  works: [
    {
      id: 'demo-1',
      recordId: 'demo-record-1',
      templateId: 'interior',
      title: '客厅改造',
      status: 'FINISHED',
      coverUrl: '/assets/homeai/type_1_processed.png',
      createdAt: '2026-05-20',
    },
  ],
  user: {
    nickname: 'HomeAI 访客',
    userId: 'homeai-demo',
    diamondCount: 12,
    vipLabel: '体验会员',
  },
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

function normalizeImageUrl(value: string) {
  if (!value) {
    return '';
  }
  return value.startsWith('//') ? `https:${value}` : value;
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

function mapDiscoverItem(raw: unknown, index: number): DiscoverItem {
  const record = pickRecord(raw);
  const fallback = mapperFallback.discover[index % mapperFallback.discover.length];
  return {
    title: pickString(record, ['title', 'name', 'templateName'], fallback.title),
    subtitle: pickString(record, ['subTitle', 'subtitle', 'description', 'desc'], fallback.subtitle),
    coverUrl: normalizeImageUrl(pickString(record, ['coverUrl', 'cover', 'imageUrl', 'image', 'url', 'thumbnailUrl'], fallback.coverUrl)),
    tag: pickString(record, ['tag', 'categoryTitle', 'spaceType'], fallback.tag),
    buildingType: pickString(record, ['buildingType', 'buildingTypeCode'], fallback.buildingType),
    spaceType: pickString(record, ['spaceType', 'spaceTypeCode'], fallback.spaceType),
  };
}

export function mapWorkItem(raw: unknown, index: number): WorkItem {
  const record = pickRecord(raw);
  const fallback = mapperFallback.works[index % mapperFallback.works.length];
  return {
    id: pickString(record, ['workId', 'workID', 'work_id', 'id', 'recordCode', 'code'], `work-${index}`),
    recordId: pickString(record, ['recordId', 'recordID', 'record_id', 'recordCode', 'generationRecordId', 'id', 'code'], ''),
    templateId: pickString(record, ['templateId', 'templateID', 'template_id', 'templateCode'], ''),
    title: pickString(record, ['title', 'name', 'templateName'], fallback.title),
    status: normalizeGenerationStatus(record.status ?? record.generationStatus, fallback.status),
    coverUrl: resolveRecordCoverUrl(record, fallback.coverUrl),
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
    title: pickString(record, ['title', 'name'], detail.title || `作品 ${index + 1}`),
    status: normalizeGenerationStatus(record.status ?? record.generationStatus, detail.status),
    coverUrl: resolveRecordCoverUrl(record, detail.coverUrl),
    createdAt: pickString(record, ['createdAt', 'createTime', 'gmtCreate'], detail.createdAt),
  };
}

export function mapGenerationDetail(raw: unknown, fallbackWork?: WorkItem | null): HomeAiGenerationDetail {
  const record = pickRecord(raw);
  const fallback = fallbackWork ?? mapperFallback.works[0];
  const recordId = pickString(record, ['recordCode', 'code', 'recordId', 'id'], fallback.recordId || fallback.id);
  const detail: HomeAiGenerationDetail = {
    recordId,
    title: pickString(record, ['title', 'name', 'templateName'], fallback.title),
    status: normalizeGenerationStatus(record.status ?? record.generationStatus, fallback.status),
    templateCode: pickString(record, ['templateCode', 'templateId', 'templateID', 'template_id'], fallback.templateId || ''),
    coverUrl: resolveRecordCoverUrl(record, fallback.coverUrl),
    createdAt: pickString(record, ['createdAt', 'createTime', 'gmtCreate'], fallback.createdAt || ''),
    works: [],
  };
  const works = pickArray(record.workList ?? record.works ?? record.items)
    .map((work, index) => mapGenerationWork(work, index, detail))
    .filter((work) => work.coverUrl);
  detail.works =
    works.length > 0
      ? works
      : [
          {
            id: fallback.id || recordId,
            recordId,
            templateId: detail.templateCode,
            title: detail.title,
            status: detail.status,
            coverUrl: detail.coverUrl,
            createdAt: detail.createdAt,
          },
        ];
  return detail;
}

function mapUser(raw: unknown): UserSummary {
  const record = pickRecord(raw);
  return {
    nickname: pickString(record, ['nickname', 'nickName', 'name'], mapperFallback.user.nickname),
    userId: pickString(record, ['userId', 'id'], mapperFallback.user.userId),
    diamondCount: Number(record.diamondCount ?? record.credit ?? record.balance ?? mapperFallback.user.diamondCount),
    vipLabel: pickString(record, ['vipLabel', 'vipName'], mapperFallback.user.vipLabel),
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
    user: user ? mapUser(user) : mapperFallback.user,
    works: works.length > 0 ? works.slice(0, 8) : mapperFallback.works,
    discover: discover.length > 0 ? discover.slice(0, 12) : mapperFallback.discover,
  };
}
