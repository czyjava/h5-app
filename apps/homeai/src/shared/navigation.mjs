const FEATURE_ROUTE_PATHS = {
  interior: 'default',
  living_room: 'default',
  bedroom: 'default',
  renovation: 'func_splash',
  garden: 'single_category',
  floor_plan: 'template_list',
};

// 原生 APK 使用功能路径承载首页入口，H5 侧统一映射为稳定的 featureCode。
const NATIVE_PATH_TO_FEATURE = {
  default: 'interior',
  func_splash: 'renovation',
  single_category: 'garden',
  template_list: 'floor_plan',
};

export function getFeatureNativePath(featureCode) {
  return FEATURE_ROUTE_PATHS[featureCode] ?? 'default';
}

export function parseHomeAiHashRoute(hash) {
  if (!hash || hash === '#') {
    return { page: 'home' };
  }

  let url;
  try {
    const normalizedHash = hash.startsWith('#') ? hash.slice(1) : hash;
    url = new URL(normalizedHash.startsWith('/') ? normalizedHash : `/${normalizedHash}`, 'https://homeai.local');
  } catch {
    // Hash 可能来自外部唤起或手动输入，无法解析时退回首页避免白屏。
    return { page: 'home' };
  }
  const path = url.pathname.replace(/^\/+/, '');

  if (path === 'api-debug') {
    return { page: 'api-debug' };
  }
  if (path === 'discover') {
    return { page: 'discover' };
  }
  if (path === 'mine') {
    return { page: 'mine' };
  }
  if (path === '' || path === 'home') {
    return { page: 'home' };
  }

  // 优先信任显式 featureCode，缺省时再按 APK 原生路径反查入口。
  const featureCode = url.searchParams.get('featureCode') ?? NATIVE_PATH_TO_FEATURE[path];
  if (featureCode) {
    return {
      page: 'design',
      featureCode,
      nativePath: path,
    };
  }

  return { page: 'home' };
}

export function buildHomeAiHashRoute(route) {
  switch (route.page) {
    case 'api-debug':
      return '#/api-debug';
    case 'discover':
      return '#/discover';
    case 'mine':
      return '#/mine';
    case 'design': {
      const featureCode = route.featureCode ?? 'interior';
      const nativePath = route.nativePath ?? getFeatureNativePath(featureCode);
      const params = new URLSearchParams({ featureCode });
      return `#/${nativePath}?${params.toString()}`;
    }
    case 'home':
    default:
      return '#/';
  }
}
