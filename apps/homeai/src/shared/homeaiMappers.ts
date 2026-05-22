import type { DiscoverItem, HomeAiSnapshot, UserSummary, WorkItem } from './types';

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
  works: [],
  user: {
    nickname: '沉愿',
    userId: 'homeai-demo',
    diamondCount: 0,
    vipLabel: 'AI装修大师 VIP',
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

function normalizeImageUrl(value: string) {
  if (!value) {
    return '';
  }
  return value.startsWith('//') ? `https:${value}` : value;
}

function mapDiscoverItem(raw: unknown, index: number): DiscoverItem {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
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

function mapWorkItem(raw: unknown, index: number): WorkItem {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  // 我的页 APK 默认空作品；只有真实列表返回数据时，才用兜底字段补齐单条作品信息。
  const fallback: WorkItem = mapperFallback.works[index % mapperFallback.works.length] ?? {
    id: `work-${index}`,
    title: '作品',
    status: 'FINISHED',
    coverUrl: '',
    createdAt: '',
  };
  return {
    id: pickString(record, ['id', 'recordCode', 'code'], `work-${index}`),
    title: pickString(record, ['title', 'name', 'templateName'], fallback.title),
    status: pickString(record, ['status', 'generationStatus'], fallback.status),
    coverUrl: normalizeImageUrl(pickString(record, ['coverUrl', 'resultUrl', 'imageUrl', 'url'], fallback.coverUrl)),
    createdAt: pickString(record, ['createdAt', 'createTime', 'gmtCreate'], ''),
  };
}

function mapUser(raw: unknown): UserSummary {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
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
  const works = pickArray(generationList).map(mapWorkItem).filter((item) => item.coverUrl);
  const discover = pickArray(parsedRecommend).map(mapDiscoverItem).filter((item) => item.coverUrl);

  return {
    user: user ? mapUser(user) : mapperFallback.user,
    works: works.length > 0 ? works.slice(0, 8) : [],
    discover: discover.length > 0 ? discover.slice(0, 12) : mapperFallback.discover,
  };
}
