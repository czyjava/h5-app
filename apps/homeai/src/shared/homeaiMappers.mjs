const demoSnapshot = {
  banners: [
    '/assets/homeai/type_1_processed.png',
    '/assets/homeai/type_2_processed.png',
    '/assets/homeai/type_4_compare.webp',
  ],
  features: [],
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

function pickArray(input) {
  if (Array.isArray(input)) {
    return input;
  }
  if (input && typeof input === 'object') {
    const record = input;
    return pickArray(record.list ?? record.items ?? record.records ?? record.data);
  }
  return [];
}

function pickString(input, keys, fallback = '') {
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

function normalizeImageUrl(value) {
  if (!value) {
    return '';
  }
  return value.startsWith('//') ? `https:${value}` : value;
}

function mapDiscoverItem(raw, index) {
  const record = raw && typeof raw === 'object' ? raw : {};
  const fallback = demoSnapshot.discover[index % demoSnapshot.discover.length];
  return {
    title: pickString(record, ['title', 'name', 'templateName'], fallback.title),
    subtitle: pickString(record, ['subTitle', 'subtitle', 'description', 'desc'], fallback.subtitle),
    coverUrl: normalizeImageUrl(pickString(record, ['coverUrl', 'cover', 'imageUrl', 'image', 'url', 'thumbnailUrl'], fallback.coverUrl)),
    tag: pickString(record, ['tag', 'categoryTitle', 'spaceType'], fallback.tag),
    buildingType: pickString(record, ['buildingType', 'buildingTypeCode'], fallback.buildingType),
    spaceType: pickString(record, ['spaceType', 'spaceTypeCode'], fallback.spaceType),
  };
}

function mapWorkItem(raw, index) {
  const record = raw && typeof raw === 'object' ? raw : {};
  const fallback = demoSnapshot.works[index % demoSnapshot.works.length];
  return {
    id: pickString(record, ['id', 'recordCode', 'code'], `work-${index}`),
    title: pickString(record, ['title', 'name', 'templateName'], fallback.title),
    status: pickString(record, ['status', 'generationStatus'], fallback.status),
    coverUrl: normalizeImageUrl(pickString(record, ['coverUrl', 'resultUrl', 'imageUrl', 'url'], fallback.coverUrl)),
    createdAt: pickString(record, ['createdAt', 'createTime', 'gmtCreate'], ''),
  };
}

function mapUser(raw) {
  const record = raw && typeof raw === 'object' ? raw : {};
  return {
    nickname: pickString(record, ['nickname', 'nickName', 'name'], demoSnapshot.user.nickname),
    userId: pickString(record, ['userId', 'id'], demoSnapshot.user.userId),
    diamondCount: Number(record.diamondCount ?? record.credit ?? record.balance ?? demoSnapshot.user.diamondCount),
    vipLabel: pickString(record, ['vipLabel', 'vipName'], demoSnapshot.user.vipLabel),
  };
}

export function normalizeHomeAiSnapshot({ user, generationList, recommendList } = {}) {
  const snapshot = structuredClone(demoSnapshot);

  if (user) {
    snapshot.user = mapUser(user);
  }

  const works = pickArray(generationList).map(mapWorkItem).filter((item) => item.coverUrl);
  if (works.length > 0) {
    snapshot.works = works.slice(0, 8);
  }

  const configJson = recommendList && typeof recommendList === 'object' ? recommendList.configJson : '';
  const parsedRecommend = typeof configJson === 'string' && configJson.trim() ? JSON.parse(configJson) : recommendList;
  const discover = pickArray(parsedRecommend).map(mapDiscoverItem).filter((item) => item.coverUrl);
  if (discover.length > 0) {
    snapshot.discover = discover.slice(0, 12);
  }

  return snapshot;
}
