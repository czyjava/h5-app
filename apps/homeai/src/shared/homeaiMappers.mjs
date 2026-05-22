const mapperFallback = {
  works: [],
  user: {
    nickname: '未登录',
    userId: '',
    diamondCount: 0,
    vipLabel: '',
  },
};

function pickArray(input) {
  if (Array.isArray(input)) {
    return input;
  }
  if (input && typeof input === 'object') {
    const record = input;
    return pickArray(record.list ?? record.itemList ?? record.items ?? record.records ?? record.data);
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

function pickNumber(input, keys, fallback = 0) {
  for (const key of keys) {
    const value = input[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
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

function mapPaymentOption(raw) {
  const record = raw && typeof raw === 'object' ? raw : {};
  const externalProductId = pickString(record, ['externalProductId']);
  const tradeMainPlatform = pickString(record, ['tradeMainPlatform', 'tradePlatform']);
  const tradeSubPlatform = pickString(record, ['tradeSubPlatform']);
  if (!externalProductId || !tradeMainPlatform || !tradeSubPlatform) {
    return null;
  }
  return { externalProductId, tradeMainPlatform, tradeSubPlatform };
}

function formatPrice(symbol, value) {
  if (!value) {
    return '';
  }
  return `${symbol}${Number.isInteger(value) ? value : value.toFixed(2)}`;
}

function mapDiscoverItem(raw, index) {
  const record = raw && typeof raw === 'object' ? raw : {};
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

function mapWorkItem(raw, index) {
  const record = raw && typeof raw === 'object' ? raw : {};
  // 我的页 APK 默认空作品；只有真实列表返回数据时，才用兜底字段补齐单条作品信息。
  const fallback = mapperFallback.works[index % mapperFallback.works.length] ?? {
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

function mapUser(raw) {
  const record = raw && typeof raw === 'object' ? raw : {};
  return {
    nickname: pickString(record, ['nickname', 'nickName', 'name'], mapperFallback.user.nickname),
    userId: pickString(record, ['userId', 'id'], mapperFallback.user.userId),
    diamondCount: Number(record.diamondCount ?? record.credit ?? record.balance ?? mapperFallback.user.diamondCount),
    vipLabel: pickString(record, ['vipLabel', 'vipName'], mapperFallback.user.vipLabel),
  };
}

function buildDiscoverTabs(discover) {
  const indoorItems = discover.filter((item) => item.buildingType !== 'exterior' && item.buildingType !== 'garden');
  const exteriorItems = discover.filter((item) => item.buildingType === 'exterior' || item.buildingType === 'garden');
  const makeSection = (key, title, items) => ({
    key,
    title,
    items: items.map((item, index) => ({
      id: `${key}-${index}`,
      title: item.title,
      coverUrl: item.coverUrl,
    })),
  });
  const tabs = [];
  if (indoorItems.length > 0) {
    tabs.push({ key: 'interior', label: '室内', sections: [makeSection('interior', '室内', indoorItems)] });
  }
  if (exteriorItems.length > 0) {
    tabs.push({ key: 'exterior', label: '外观', sections: [makeSection('exterior', '外观', exteriorItems)] });
  }
  return tabs;
}

export function normalizeHomeAiSnapshot({ user, generationList, recommendList } = {}) {
  const works = pickArray(generationList).map(mapWorkItem).filter((item) => item.coverUrl);
  const configJson = recommendList && typeof recommendList === 'object' ? recommendList.configJson : '';
  const parsedRecommend = typeof configJson === 'string' && configJson.trim() ? JSON.parse(configJson) : recommendList;
  const discover = pickArray(parsedRecommend).map(mapDiscoverItem).filter((item) => item.coverUrl);
  const normalizedDiscover = discover.slice(0, 12);

  return {
    user: user ? mapUser(user) : mapperFallback.user,
    works: works.length > 0 ? works.slice(0, 8) : [],
    discover: normalizedDiscover,
    discoverTabs: buildDiscoverTabs(normalizedDiscover),
  };
}

export function normalizeHomeAiVipPlans(raw) {
  return pickArray(raw)
    .map((item) => {
      const record = item && typeof item === 'object' ? item : {};
      const goodsCode = pickString(record, ['goodsCode', 'code']);
      const channelCode = pickString(record, ['channelCode']);
      const currencySymbol = pickString(record, ['currencySymbol'], '¥');
      const channelPrice = pickNumber(record, ['channelPrice', 'salePrice']);
      const goodsPrice = pickNumber(record, ['goodsPrice']);
      const paymentOptions = pickArray(record.paymentOptions).map(mapPaymentOption).filter(Boolean);
      if (!goodsCode || !channelCode || channelPrice <= 0) {
        return null;
      }
      return {
        key: goodsCode,
        label: pickString(record, ['goodsName', 'name', 'title'], goodsCode),
        price: formatPrice(currencySymbol, channelPrice),
        originalPrice: goodsPrice > channelPrice ? formatPrice(currencySymbol, goodsPrice) : '',
        tokenCount: pickNumber(record, ['tokenCount']),
        channelCode,
        paymentOptions,
      };
    })
    .filter(Boolean);
}
