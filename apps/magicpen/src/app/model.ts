import { computed, reactive } from 'vue';
import type {
  AppTab,
  ColoringCard,
  DiamondBillItem,
  HomeCard,
  InspirationPost,
  MagicPenSnapshot,
  UserWork,
} from '@/entities/magicpen/types';
import { loadCommunityPosts, loadMagicPenSnapshot, quoteByTemplate } from '@/shared/api/magicpenApi';
import { createEmptySnapshot } from '@/shared/api/emptySnapshot';
import { sessionState } from '@/entities/session/model';
import { businessHostNameForEnvironment } from '@/shared/config/endpoints';

export type OverlayName =
  | 'creator'
  | 'wallet'
  | 'diamondDetail'
  | 'settings'
  | 'workDetail'
  | 'profileEdit'
  | 'profileQuickAction'
  | null;
export type ProfileQuickActionType = 'invite' | 'education' | 'demo' | 'activity';
export type FirstLaunchStep = 'survey' | 'advert' | 'done';
export type WorkMediaStatus = 'checking' | 'ready' | 'missing';
export type WorkDownloadStatus = 'idle' | 'preparing' | 'downloaded';

export interface SourceSurveyOption {
  id: string;
  label: string;
  description: string;
}

export interface FirstLaunchState {
  step: FirstLaunchStep;
  source: string;
  surveyFinished: boolean;
  advertFinished: boolean;
}

export interface WorkDetailState {
  loading: boolean;
  loadedWorkId: string;
  mediaStatus: WorkMediaStatus;
  favorite: boolean;
  shared: boolean;
  downloadStatus: WorkDownloadStatus;
  detailLoadedAt: string;
}

export interface ToastState {
  id: number;
  message: string;
}

export interface AppState {
  activeTab: AppTab;
  loading: boolean;
  snapshot: MagicPenSnapshot;
  selectedChannel: string;
  postLoading: boolean;
  postCache: Record<string, InspirationPost[]>;
  activeOverlay: OverlayName;
  selectedHomeCard: HomeCard | null;
  selectedPost: InspirationPost | null;
  selectedColoringCard: ColoringCard | null;
  pendingUnlockColoringCard: ColoringCard | null;
  selectedWork: UserWork | null;
  selectedProfileQuickAction: ProfileQuickActionType;
  unlockedColoringCardIds: string[];
  completedColoringCardIds: string[];
  firstLaunch: FirstLaunchState;
  workDetail: WorkDetailState;
  toast: ToastState | null;
  quoteLoading: boolean;
  quote: {
    price: number;
    balance: number;
    enough: boolean;
  } | null;
}

export const sourceSurveyOptions: SourceSurveyOption[] = [
  { id: 'friend', label: '朋友推荐', description: '从同学、家长群或老师那里听说' },
  { id: 'social', label: '社交平台', description: '在短视频、社区或公众号看到作品' },
  { id: 'store', label: '应用商店', description: '搜索绘画、涂色或儿童创作时发现' },
];

export const launchAdvertOffer = {
  title: '开学创作礼包',
  description: '本地复刻启动优惠：领取后仅更新 H5 展示态，不会拉起支付或广告 SDK。',
  badge: '限时体验',
};

// 未登录复刻态使用模拟器“钻石明细”页面可见记录，真实登录后优先展示接口账单。
export const replicaDiamondBills: DiamondBillItem[] = [
  { id: 'replica-bill-1', title: '入画探险生成成功消耗', time: '2026-04-19 06:49:04', amount: -60, type: 'out' },
  { id: 'replica-bill-2', title: '入画探险生成成功消耗', time: '2026-04-19 06:42:00', amount: -60, type: 'out' },
  { id: 'replica-bill-3', title: '入画探险生成成功消耗', time: '2026-04-19 06:35:32', amount: -60, type: 'out' },
  { id: 'replica-bill-4', title: '神笔马良生成成功消耗', time: '2026-04-18 12:26:13', amount: -60, type: 'out' },
  { id: 'replica-bill-5', title: '入画探险生成成功消耗', time: '2026-04-04 11:10:06', amount: -60, type: 'out' },
  { id: 'replica-bill-6', title: '入画探险生成成功消耗', time: '2026-04-04 10:55:28', amount: -60, type: 'out' },
  { id: 'replica-bill-7', title: '舞蹈室生成成功消耗', time: '2026-02-28 11:53:00', amount: -30, type: 'out' },
  { id: 'replica-bill-8', title: '会员赠送', time: '2026-01-29 17:23:36', amount: 3600, type: 'in' },
];

let toastSeed = 0;
let workDetailTimer: number | null = null;
const FIRST_LAUNCH_SURVEY_FINISHED_KEY = 'h5-magicpen:firstLaunch:sourceSurveyFinished';
const FIRST_LAUNCH_ADVERT_FINISHED_KEY = 'h5-magicpen:firstLaunch:launchAdvertFinished';
type WorkDetailActionMemory = Pick<WorkDetailState, 'favorite' | 'shared' | 'downloadStatus'>;
const workDetailActionMemory = new Map<string, WorkDetailActionMemory>();

function currentBusinessHostName() {
  return businessHostNameForEnvironment(sessionState.apiEnvironment);
}

function readLocalBoolean(key: string) {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(key) === 'true';
  } catch {
    console.info('[startup] 读取首启本地缓存失败，按未完成处理', { key });
    return false;
  }
}

function writeLocalBoolean(key: string) {
  try {
    window.localStorage.setItem(key, 'true');
  } catch {
    console.info('[startup] 写入首启本地缓存失败，仅保留当前会话状态', { key });
  }
}

function createInitialFirstLaunchState(): FirstLaunchState {
  const advertFinished = readLocalBoolean(FIRST_LAUNCH_ADVERT_FINISHED_KEY);
  // 启动广告已完成时，等价于 APP 首启链路已经走过来源调查，避免异常缓存组合让用户倒退回 survey。
  const surveyFinished = advertFinished || readLocalBoolean(FIRST_LAUNCH_SURVEY_FINISHED_KEY);
  return {
    step: advertFinished ? 'done' : surveyFinished ? 'advert' : 'survey',
    source: '',
    surveyFinished,
    advertFinished,
  };
}

const initialFirstLaunch = createInitialFirstLaunchState();

export const appState = reactive<AppState>({
  activeTab: 'home',
  loading: initialFirstLaunch.step === 'done',
  snapshot: createEmptySnapshot('等待实时 API 响应', currentBusinessHostName()),
  selectedChannel: 'community_hot',
  postLoading: false,
  postCache: {},
  activeOverlay: null,
  selectedHomeCard: null,
  selectedPost: null,
  selectedColoringCard: null,
  pendingUnlockColoringCard: null,
  selectedWork: null,
  selectedProfileQuickAction: 'invite',
  unlockedColoringCardIds: [],
  completedColoringCardIds: [],
  firstLaunch: initialFirstLaunch,
  workDetail: {
    loading: false,
    loadedWorkId: '',
    mediaStatus: 'checking',
    favorite: false,
    shared: false,
    downloadStatus: 'idle',
    detailLoadedAt: '',
  },
  toast: null,
  quoteLoading: false,
  quote: null,
});

export const visiblePosts = computed(() => {
  const current = appState.selectedChannel;
  return appState.postCache[current] ?? (current === 'community_hot' ? appState.snapshot.posts : []);
});

export async function bootstrapApp() {
  appState.loading = true;
  try {
    appState.snapshot = await loadMagicPenSnapshot();
    // 灵感页频道按 APP 行为懒加载；首屏热门列表先缓存，后续切回时不重复打接口。
    appState.postCache = { community_hot: appState.snapshot.posts };
  } catch (error) {
    const message = error instanceof Error ? error.message : '实时 API 加载失败';
    showToast(message);
    appState.snapshot = createEmptySnapshot(`实时 API 加载失败：${message}`, currentBusinessHostName());
    appState.postCache = {};
  } finally {
    appState.loading = false;
  }
}

export async function selectChannel(channelKey: string) {
  appState.selectedChannel = channelKey;
  if (appState.postCache[channelKey]) {
    return;
  }

  appState.postLoading = true;
  try {
    appState.postCache[channelKey] = await loadCommunityPosts(channelKey);
  } catch (error) {
    showToast(error instanceof Error ? `频道加载失败：${error.message}` : '频道加载失败');
  } finally {
    appState.postLoading = false;
  }
}

export function switchTab(tab: AppTab) {
  appState.activeTab = tab;
  appState.activeOverlay = null;
}

export function openCreator(payload: HomeCard | InspirationPost) {
  if ('templateTitle' in payload) {
    appState.selectedPost = payload;
    appState.selectedHomeCard = null;
  } else {
    appState.selectedHomeCard = payload;
    appState.selectedPost = null;
  }
  appState.activeOverlay = 'creator';
  loadQuote({
    templateCode: payload.templateCode,
    price: 'templatePrice' in payload ? payload.templatePrice : payload.price ?? 0,
  });
}

export async function loadQuote(payload: { templateCode?: string; price: number }) {
  appState.quoteLoading = true;
  appState.quote = null;
  try {
    if (!payload.templateCode) {
      // 社区流当前没有返回 templateCode，不能凭空调用报价接口；先用本地余额给出可用报价态。
      const fallbackPrice = payload.price;
      appState.quote = {
        price: fallbackPrice,
        balance: appState.snapshot.profile.diamonds,
        enough: appState.snapshot.profile.diamonds >= fallbackPrice,
      };
      return;
    }
    appState.quote = await quoteByTemplate({
      templateCode: payload.templateCode,
      templatePrice: payload.price,
    });
  } catch (error) {
    showToast(error instanceof Error ? `报价接口失败：${error.message}` : '报价接口失败');
  } finally {
    appState.quoteLoading = false;
  }
}

export function openColoringCanvas(card: ColoringCard) {
  if (isColoringCardLocked(card)) {
    appState.pendingUnlockColoringCard = card;
    console.info('[coloring] 打开锁卡解锁弹层', {
      cardId: card.id,
      price: card.price,
      balance: appState.snapshot.profile.diamonds,
    });
    return;
  }
  appState.selectedColoringCard = card;
}

export function closeColoringCanvas() {
  appState.selectedColoringCard = null;
}

export function closeColoringUnlockSheet() {
  appState.pendingUnlockColoringCard = null;
}

export function isColoringCardLocked(card: ColoringCard) {
  return card.locked && !appState.unlockedColoringCardIds.includes(card.id);
}

export function isVipAvailable() {
  const expireAt = Date.parse(appState.snapshot.profile.vipExpire);
  // APP 的 VIP 字段可能为空或不可解析；H5 复刻态只在能确认未过期时开放 VIP 解锁。
  return Number.isFinite(expireAt) && expireAt > Date.now();
}

export function unlockColoringCard(method: 'vip' | 'diamond') {
  const card = appState.pendingUnlockColoringCard;
  if (!card) {
    return;
  }

  if (method === 'vip') {
    if (!isVipAvailable()) {
      showToast('当前未检测到有效 VIP，已保留充值入口展示');
      console.info('[coloring] VIP 解锁被拦截：无有效 VIP', { cardId: card.id });
      return;
    }
  } else if (appState.snapshot.profile.diamonds < card.price) {
    showToast('钻石余额不足，当前不会拉起真实支付');
    console.info('[coloring] 钻石解锁被拦截：余额不足', {
      cardId: card.id,
      price: card.price,
      balance: appState.snapshot.profile.diamonds,
    });
    return;
  } else {
    appState.snapshot.profile.diamonds -= card.price;
  }

  // 本地解锁只更新 H5 会话状态，不回写真实服务端，避免误触支付或资产接口。
  if (!appState.unlockedColoringCardIds.includes(card.id)) {
    appState.unlockedColoringCardIds.push(card.id);
  }
  card.locked = false;
  appState.pendingUnlockColoringCard = null;
  appState.selectedColoringCard = card;
  showToast(method === 'vip' ? '已用 VIP 权益解锁' : '已用钻石解锁');
  console.info('[coloring] 本地解锁完成并进入画布', { cardId: card.id, method });
}

export function markColoringCardCompleted(card: ColoringCard) {
  if (!appState.completedColoringCardIds.includes(card.id)) {
    appState.completedColoringCardIds.push(card.id);
  }
  console.info('[coloring] 本地记录涂色完成', {
    cardId: card.id,
    completedCount: appState.completedColoringCardIds.length,
  });
}

function showLaunchAdvert(reason: 'completed' | 'skipped') {
  appState.firstLaunch.step = 'advert';
  console.info('[startup] 来源调查结束，展示启动广告原型', {
    reason,
    selectedSource: appState.firstLaunch.source || '未选择',
  });
}

export function completeSourceSurvey(source: string) {
  appState.firstLaunch.source = source;
  appState.firstLaunch.surveyFinished = true;
  writeLocalBoolean(FIRST_LAUNCH_SURVEY_FINISHED_KEY);
  console.info('[startup] 本地来源调查完成', { source });
  showLaunchAdvert('completed');
}

export function skipSourceSurvey() {
  appState.firstLaunch.source = '';
  appState.firstLaunch.surveyFinished = true;
  writeLocalBoolean(FIRST_LAUNCH_SURVEY_FINISHED_KEY);
  console.info('[startup] 跳过本地来源调查');
  showLaunchAdvert('skipped');
}

export function finishLaunchAdvert(action: 'claim' | 'skip') {
  appState.firstLaunch.advertFinished = true;
  appState.firstLaunch.step = 'done';
  appState.loading = true;
  writeLocalBoolean(FIRST_LAUNCH_SURVEY_FINISHED_KEY);
  writeLocalBoolean(FIRST_LAUNCH_ADVERT_FINISHED_KEY);
  showToast(action === 'claim' ? '启动礼包已记录到本地原型' : '已跳过启动优惠');
  console.info('[startup] 启动广告原型结束，进入主应用', {
    action,
    selectedSource: appState.firstLaunch.source || '未选择',
  });
}

function rememberWorkDetailActionState(workId: string) {
  workDetailActionMemory.set(workId, {
    favorite: appState.workDetail.favorite,
    shared: appState.workDetail.shared,
    downloadStatus: appState.workDetail.downloadStatus,
  });
}

function resetWorkDetailState(workId: string) {
  const cachedActionState = workDetailActionMemory.get(workId);
  appState.workDetail.loading = true;
  appState.workDetail.loadedWorkId = '';
  appState.workDetail.mediaStatus = 'checking';
  appState.workDetail.favorite = cachedActionState?.favorite ?? false;
  appState.workDetail.shared = cachedActionState?.shared ?? false;
  // 下载生成中是瞬时态，重新打开详情时只恢复已完成下载，避免旧定时器被切走后留下假进度。
  appState.workDetail.downloadStatus = cachedActionState?.downloadStatus === 'downloaded' ? 'downloaded' : 'idle';
  appState.workDetail.detailLoadedAt = '';
  if (cachedActionState) {
    rememberWorkDetailActionState(workId);
    console.info('[profile] 恢复作品详情动作状态', {
      workId,
      favorite: appState.workDetail.favorite,
      shared: appState.workDetail.shared,
      downloadStatus: appState.workDetail.downloadStatus,
    });
  }

  if (workDetailTimer) {
    window.clearTimeout(workDetailTimer);
    workDetailTimer = null;
  }
}

export function openWorkDetail(work: UserWork) {
  appState.selectedWork = work;
  appState.activeOverlay = 'workDetail';
  resetWorkDetailState(work.id);
  console.info('[profile] 打开作品详情，本地模拟拉取详情', { workId: work.id, kind: work.kind });
  // H5 原型不请求真实作品详情接口，用短延迟表达 APP 侧 getGenerationDetail 的加载链路。
  workDetailTimer = window.setTimeout(() => {
    if (appState.selectedWork?.id !== work.id) {
      return;
    }
    appState.workDetail.loading = false;
    appState.workDetail.loadedWorkId = work.id;
    appState.workDetail.mediaStatus = work.cover.url ? 'ready' : 'missing';
    appState.workDetail.detailLoadedAt = new Date().toLocaleString('zh-CN', { hour12: false });
    console.info('[profile] 本地作品详情加载完成', {
      workId: work.id,
      mediaStatus: appState.workDetail.mediaStatus,
    });
    workDetailTimer = null;
  }, 520);
}

export function openProfileQuickAction(action: ProfileQuickActionType) {
  appState.selectedProfileQuickAction = action;
  appState.activeOverlay = 'profileQuickAction';
}

export function openDiamondDetail() {
  appState.activeOverlay = 'diamondDetail';
}

export function closeOverlay() {
  appState.activeOverlay = null;
}

export function showToast(message: string) {
  const id = ++toastSeed;
  appState.toast = { id, message };
  window.setTimeout(() => {
    if (appState.toast?.id === id) {
      appState.toast = null;
    }
  }, 2200);
}

export function togglePostLike(post: InspirationPost) {
  post.liked = !post.liked;
  showToast(post.liked ? '已收藏' : '已取消收藏');
}

export function toggleWorkFavorite() {
  if (!appState.selectedWork) {
    return;
  }
  appState.workDetail.favorite = !appState.workDetail.favorite;
  rememberWorkDetailActionState(appState.selectedWork.id);
  showToast(appState.workDetail.favorite ? '已收藏作品' : '已取消收藏');
  console.info('[profile] 本地切换作品收藏', {
    workId: appState.selectedWork.id,
    favorite: appState.workDetail.favorite,
  });
}

export function shareSelectedWork() {
  if (!appState.selectedWork) {
    return;
  }
  appState.workDetail.shared = true;
  rememberWorkDetailActionState(appState.selectedWork.id);
  showToast('分享图已准备');
  console.info('[profile] 本地准备作品分享', { workId: appState.selectedWork.id });
}

export function downloadSelectedWork() {
  if (!appState.selectedWork) {
    return;
  }
  if (appState.workDetail.mediaStatus === 'missing') {
    showToast('当前作品缺少可下载资源');
    console.info('[profile] 作品下载被拦截：资源缺失', { workId: appState.selectedWork.id });
    return;
  }
  const workId = appState.selectedWork.id;
  appState.workDetail.downloadStatus = 'preparing';
  rememberWorkDetailActionState(workId);
  console.info('[profile] 开始准备作品下载资源', {
    workId,
    resource: appState.selectedWork.kind === 'video' ? 'video-cover-print' : 'image-print',
  });
  window.setTimeout(() => {
    if (appState.selectedWork?.id !== workId) {
      return;
    }
    appState.workDetail.downloadStatus = 'downloaded';
    rememberWorkDetailActionState(workId);
    showToast('下载资源已生成');
    console.info('[profile] 本地下载资源已就绪', { workId });
  }, 420);
}

export function markWorkSatisfied(value: boolean) {
  if (appState.selectedWork) {
    appState.selectedWork.satisfied = value;
    showToast(value ? '已记录满意反馈' : '已记录优化反馈');
    console.info('[profile] 本地记录作品满意度反馈', { workId: appState.selectedWork.id, satisfied: value });
  }
}
