import type { DiscoverItem, DiscoverTab, HomeAiSnapshot, UserSummary, WorkItem } from './types';

const mapperFallback: Pick<HomeAiSnapshot, 'works' | 'user'> = {
  works: [],
  user: {
    nickname: '未登录',
    userId: '',
    diamondCount: 0,
    vipLabel: '',
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
  const coverUrl = normalizeImageUrl(pickString(record, ['coverUrl', 'cover', 'imageUrl', 'image', 'url', 'thumbnailUrl']));
  return {
    title: pickString(record, ['title', 'name', 'templateName'], `灵感 ${index + 1}`),
    subtitle: pickString(record, ['subTitle', 'subtitle', 'description', 'desc'], ''),
    coverUrl,
    tag: pickString(record, ['tag', 'categoryTitle', 'spaceType'], ''),
    buildingType: pickString(record, ['buildingType', 'buildingTypeCode'], ''),
    spaceType: pickString(record, ['spaceType', 'spaceTypeCode'], ''),
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

function buildDiscoverTabs(discover: DiscoverItem[]): DiscoverTab[] {
  const indoorItems = discover.filter((item) => item.buildingType !== 'exterior' && item.buildingType !== 'garden');
  const exteriorItems = discover.filter((item) => item.buildingType === 'exterior' || item.buildingType === 'garden');
  const makeSection = (key: string, title: string, items: DiscoverItem[]) => ({
    key,
    title,
    items: items.map((item, index) => ({
      id: `${key}-${index}`,
      title: item.title,
      coverUrl: item.coverUrl,
    })),
  });
  const tabs: DiscoverTab[] = [];
  if (indoorItems.length > 0) {
    tabs.push({ key: 'interior', label: '室内', sections: [makeSection('interior', '室内', indoorItems)] });
  }
  if (exteriorItems.length > 0) {
    tabs.push({ key: 'exterior', label: '外观', sections: [makeSection('exterior', '外观', exteriorItems)] });
  }
  return tabs;
}

export function normalizeHomeAiSnapshot({
  user,
  generationList,
  recommendList,
}: {
  user?: unknown;
  generationList?: unknown;
  recommendList?: unknown;
} = {}): Pick<HomeAiSnapshot, 'discover' | 'discoverTabs' | 'works' | 'user'> {
  const configJson = recommendList && typeof recommendList === 'object' ? (recommendList as Record<string, unknown>).configJson : '';
  const parsedRecommend = typeof configJson === 'string' && configJson.trim() ? JSON.parse(configJson) : recommendList;
  const works = pickArray(generationList).map(mapWorkItem).filter((item) => item.coverUrl);
  const discover = pickArray(parsedRecommend).map(mapDiscoverItem).filter((item) => item.coverUrl);

  return {
    user: user ? mapUser(user) : mapperFallback.user,
    works: works.length > 0 ? works.slice(0, 8) : [],
    discover: discover.slice(0, 12),
    discoverTabs: buildDiscoverTabs(discover.slice(0, 12)),
  };
}
