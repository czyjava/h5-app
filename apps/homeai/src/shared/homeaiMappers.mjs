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

function pickRecord(input) {
  return input && typeof input === 'object' ? input : {};
}

function normalizeImageUrl(value) {
  if (!value) {
    return '';
  }
  return value.startsWith('//') ? `https:${value}` : value;
}

function parseMaybeJsonObject(input) {
  if (typeof input !== 'string') {
    return input;
  }
  const trimmed = input.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return input;
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    return input;
  }
}

function pickNestedImageUrl(input) {
  const parsed = parseMaybeJsonObject(input);
  if (typeof parsed === 'string') {
    return normalizeImageUrl(parsed);
  }
  const record = pickRecord(parsed);
  const directUrl = pickString(record, ['large', 'small', 'url', 'coverUrl', 'resultUrl', 'resultImageUrl', 'imageUrl', 'image', 'thumbnailUrl']);
  if (directUrl) {
    return normalizeImageUrl(directUrl);
  }

  const imageUrl = pickString(pickRecord(record.image), ['large', 'small']);
  if (imageUrl) {
    return normalizeImageUrl(imageUrl);
  }
  const coverUrl = pickString(pickRecord(record.cover), ['large', 'small']);
  if (coverUrl) {
    return normalizeImageUrl(coverUrl);
  }
  const videoUrl = pickString(pickRecord(record.video), ['small', 'url']);
  if (videoUrl) {
    return normalizeImageUrl(videoUrl);
  }
  return '';
}

function resolveRecordCoverUrl(record, fallback = '') {
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

function normalizeGenerationStatus(value, fallback) {
  if (typeof value === 'number') {
    const statusMap = {
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

function mapDiscoverItem(raw, index) {
  const record = pickRecord(raw);
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

export function mapWorkItem(raw, index) {
  const record = pickRecord(raw);
  const fallback = demoSnapshot.works[index % demoSnapshot.works.length];
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

export function mapGenerationList(raw, limit = 20) {
  return pickArray(raw)
    .map(mapWorkItem)
    .filter((item) => item.coverUrl)
    .slice(0, limit);
}

export function mapGenerationWork(raw, index, detail) {
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

export function mapGenerationDetail(raw, fallbackWork = null) {
  const record = pickRecord(raw);
  const fallback = fallbackWork ?? demoSnapshot.works[0];
  const recordId = pickString(record, ['recordCode', 'code', 'recordId', 'id'], fallback.recordId || fallback.id);
  const detail = {
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

function mapUser(raw) {
  const record = pickRecord(raw);
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

  const works = mapGenerationList(generationList, 8);
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
