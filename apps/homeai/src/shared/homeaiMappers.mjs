const emptyUser = {
  nickname: '未登录',
  userId: '-',
  avatar: '',
  vipActive: false,
  diamondCount: 0,
  vipLabel: '未登录',
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

function resolvePermissionActive(permission) {
  const hasPermission = permission?.hasPermission;
  return hasPermission === true || hasPermission === 'true' || hasPermission === 'TRUE' || hasPermission === 1;
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

function mapDiscoverItem(raw) {
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

export function mapWorkItem(raw, index) {
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
    sourceType: 'work',
    title: pickString(record, ['title', 'name'], detail.title || `作品 ${index + 1}`),
    status: normalizeGenerationStatus(record.status ?? record.generationStatus, detail.status),
    coverUrl: resolveRecordCoverUrl(record, detail.coverUrl),
    createdAt: pickString(record, ['createdAt', 'createTime', 'gmtCreate'], detail.createdAt),
  };
}

export function mapGenerationDetail(raw, fallbackWork = null) {
  const record = pickRecord(raw);
  const recordId = pickString(record, ['recordCode', 'code', 'recordId', 'id'], fallbackWork?.recordId || fallbackWork?.id || '');
  const detail = {
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

function mapUser(raw, permission) {
  const record = pickRecord(raw);
  const userId = pickString(record, ['userId', 'id'], emptyUser.userId);
  const nickname = pickString(record, ['nickname', 'nickName', 'name'], emptyUser.nickname);
  const loggedIn = userId !== emptyUser.userId || nickname !== emptyUser.nickname;
  const vipActive = resolvePermissionActive(permission);
  const vipLabel = vipActive ? 'VIP' : loggedIn ? '已登录' : emptyUser.vipLabel;
  return {
    nickname,
    userId,
    avatar: normalizeImageUrl(pickString(record, ['largeAvatar', 'avatar', 'avatarUrl', 'headImg'], emptyUser.avatar)),
    vipActive,
    diamondCount: Number(record.diamondCount ?? record.credit ?? record.balance ?? emptyUser.diamondCount),
    // VIP 状态只来自业务服务权益接口；current-user 仅承载用户基础资料。
    vipLabel,
  };
}

export function normalizeHomeAiSnapshot({ user, userPermission, generationList, recommendList } = {}) {
  const works = mapGenerationList(generationList, 8);
  const configJson = recommendList && typeof recommendList === 'object' ? recommendList.configJson : '';
  const parsedRecommend = typeof configJson === 'string' && configJson.trim() ? JSON.parse(configJson) : recommendList;
  const discover = pickArray(parsedRecommend).map(mapDiscoverItem).filter((item) => item.coverUrl);

  return {
    user: user ? mapUser(user, userPermission) : emptyUser,
    works: works.slice(0, 8),
    discover: discover.slice(0, 12),
  };
}
