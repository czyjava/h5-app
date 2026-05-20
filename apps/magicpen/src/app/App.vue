<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { Gift, Megaphone, Sparkles } from 'lucide-vue-next';
import type { AppTab } from '@/entities/magicpen/types';
import MobileShell from '@/widgets/mobile-shell/MobileShell.vue';
import BottomSheet from '@/widgets/bottom-sheet/BottomSheet.vue';
import ToastHost from '@/widgets/toast/ToastHost.vue';
import HomePage from '@/pages/home/HomePage.vue';
import InspirationPage from '@/pages/inspiration/InspirationPage.vue';
import CameraPage from '@/pages/camera/CameraPage.vue';
import ColoringPage from '@/pages/coloring/ColoringPage.vue';
import ProfilePage from '@/pages/profile/ProfilePage.vue';
import CreatorSheet from '@/pages/inspiration/CreatorSheet.vue';
import WalletSheet from '@/pages/profile/WalletSheet.vue';
import DiamondDetailSheet from '@/pages/profile/DiamondDetailSheet.vue';
import SettingsSheet from '@/pages/profile/SettingsSheet.vue';
import ProfileEditSheet from '@/pages/profile/ProfileEditSheet.vue';
import ProfileQuickActionSheet from '@/pages/profile/ProfileQuickActionSheet.vue';
import WorkDetailSheet from '@/pages/profile/WorkDetailSheet.vue';
import ApiModePanel from '@/features/api-mode/ApiModePanel.vue';
import ProxyLifecycleOverlay from '@/features/api-debug/ProxyLifecycleOverlay.vue';
import {
  appState,
  bootstrapApp,
  closeOverlay,
  completeSourceSurvey,
  finishLaunchAdvert,
  launchAdvertOffer,
  skipSourceSurvey,
  sourceSurveyOptions,
  type OverlayName,
} from '@/app/model';

const API_DEBUG_HASH = '#/api-debug';
const TAB_ROUTES: Record<AppTab, string> = {
  home: 'home',
  inspiration: 'inspiration',
  capture: 'capture',
  coloring: 'coloring',
  profile: 'profile',
};
const ROUTE_TABS = Object.fromEntries(Object.entries(TAB_ROUTES).map(([tab, route]) => [route, tab])) as Record<
  string,
  AppTab
>;
const OVERLAY_ROUTES: Record<Exclude<OverlayName, null>, string> = {
  creator: 'creator',
  wallet: 'wallet',
  diamondDetail: 'diamond-detail',
  settings: 'settings',
  workDetail: 'work-detail',
  profileEdit: 'profile-edit',
  profileQuickAction: 'quick-action',
};
const ROUTE_OVERLAYS = Object.fromEntries(Object.entries(OVERLAY_ROUTES).map(([overlay, route]) => [route, overlay])) as Record<
  string,
  Exclude<OverlayName, null>
>;

let applyingBrowserRoute = false;

function isApiDebugPage() {
  return window.location.hash === API_DEBUG_HASH;
}

const apiDebugPage = ref(isApiDebugPage());

function startMainAppBootstrap() {
  if (apiDebugPage.value || appState.firstLaunch.step !== 'done') {
    return;
  }
  console.info('[startup] 首启流程已完成，开始加载主应用数据');
  bootstrapApp();
}

function syncApiDebugPage() {
  syncStateFromBrowserLocation();
}

function routeSegments() {
  return window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
}

function buildHashFromState() {
  const parts = [TAB_ROUTES[appState.activeTab]];
  if (appState.activeTab === 'coloring' && appState.selectedColoringCard) {
    parts.push('canvas');
  }
  if (appState.activeOverlay) {
    parts.push(OVERLAY_ROUTES[appState.activeOverlay]);
  }
  return `#/${parts.join('/')}`;
}

function writeHash(hash: string, replace = false) {
  if (window.location.hash === hash) {
    return;
  }
  const target = `${window.location.pathname}${window.location.search}${hash}`;
  if (replace) {
    window.history.replaceState(null, '', target);
    return;
  }
  window.history.pushState(null, '', target);
}

function syncStateFromBrowserLocation() {
  apiDebugPage.value = isApiDebugPage();
  if (apiDebugPage.value) {
    return;
  }

  const [routeTab = TAB_ROUTES.home, routeDetail] = routeSegments();
  const nextTab = ROUTE_TABS[routeTab] ?? 'home';
  // 首启来源调查/启动广告期间不恢复历史 overlay，避免旧 hash 把空弹层盖在启动流程上。
  const nextOverlay = appState.firstLaunch.step === 'done' ? ROUTE_OVERLAYS[routeDetail] ?? null : null;

  applyingBrowserRoute = true;
  appState.activeTab = nextTab;
  appState.activeOverlay = nextOverlay;
  if (nextTab !== 'coloring' || routeDetail !== 'canvas') {
    appState.selectedColoringCard = null;
  }
  applyingBrowserRoute = false;

  const shouldDropStartupOverlay = appState.firstLaunch.step !== 'done' && Boolean(routeDetail);

  // 空 hash、非法 hash 或首启阶段遗留 overlay 统一修正为当前状态对应的可见 location。
  if (!window.location.hash || !ROUTE_TABS[routeTab] || shouldDropStartupOverlay) {
    writeHash(buildHashFromState(), true);
  }
}

function syncBrowserLocationFromState() {
  if (applyingBrowserRoute || apiDebugPage.value) {
    return;
  }
  writeHash(buildHashFromState());
}

onMounted(() => {
  window.addEventListener('hashchange', syncApiDebugPage);
  window.addEventListener('popstate', syncApiDebugPage);
  syncStateFromBrowserLocation();
  startMainAppBootstrap();
});

onUnmounted(() => {
  window.removeEventListener('hashchange', syncApiDebugPage);
  window.removeEventListener('popstate', syncApiDebugPage);
});

watch(apiDebugPage, (isDebugPage) => {
  if (!isDebugPage) {
    startMainAppBootstrap();
  }
});

watch(
  () => appState.firstLaunch.step,
  () => {
    startMainAppBootstrap();
  },
  { flush: 'sync' },
);

watch(
  () => [appState.activeTab, appState.activeOverlay, appState.selectedColoringCard?.id ?? ''],
  () => {
    syncBrowserLocationFromState();
  },
);
</script>

<template>
  <ProxyLifecycleOverlay v-if="apiDebugPage" page-mode />

  <MobileShell v-else>
    <div v-if="appState.loading" class="loading-screen">
      <span />
      <strong>神笔绘画</strong>
    </div>

    <section v-else-if="appState.firstLaunch.step === 'survey'" class="first-launch-screen first-launch-screen--survey">
      <div class="first-launch-brand">
        <Megaphone :size="32" />
        <span>神笔绘画</span>
      </div>
      <div class="first-launch-copy">
        <p>欢迎回来</p>
        <h1>先告诉我们你从哪里发现神笔绘画?</h1>
      </div>
      <div class="source-survey-list">
        <button
          v-for="option in sourceSurveyOptions"
          :key="option.id"
          class="source-survey-card"
          @click="completeSourceSurvey(option.id)"
        >
          <strong>{{ option.label }}</strong>
          <span>{{ option.description }}</span>
        </button>
      </div>
      <button class="first-launch-skip" @click="skipSourceSurvey">跳过，先进入体验</button>
    </section>

    <section v-else-if="appState.firstLaunch.step === 'advert'" class="first-launch-screen first-launch-screen--advert">
      <div class="advert-prototype-card">
        <span>{{ launchAdvertOffer.badge }}</span>
        <Gift :size="54" />
        <h1>{{ launchAdvertOffer.title }}</h1>
        <p>{{ launchAdvertOffer.description }}</p>
        <button class="primary-button" @click="finishLaunchAdvert('claim')">
          <Sparkles :size="20" />
          <span>领取并进入</span>
        </button>
        <button class="secondary-button" @click="finishLaunchAdvert('skip')">跳过广告</button>
      </div>
    </section>

    <template v-else>
      <DiamondDetailSheet v-if="appState.activeOverlay === 'diamondDetail'" />
      <HomePage v-else-if="appState.activeTab === 'home'" />
      <InspirationPage v-else-if="appState.activeTab === 'inspiration'" />
      <CameraPage v-else-if="appState.activeTab === 'capture'" />
      <ColoringPage v-else-if="appState.activeTab === 'coloring'" />
      <ProfilePage v-else />
    </template>

    <BottomSheet title="做同款" :open="appState.activeOverlay === 'creator'" @close="closeOverlay">
      <CreatorSheet />
    </BottomSheet>

    <BottomSheet title="会员与钻石" :open="appState.activeOverlay === 'wallet'" @close="closeOverlay">
      <WalletSheet />
    </BottomSheet>

    <BottomSheet title="设置" :open="appState.activeOverlay === 'settings'" @close="closeOverlay">
      <ApiModePanel />
      <SettingsSheet />
    </BottomSheet>

    <BottomSheet title="编辑资料" :open="appState.activeOverlay === 'profileEdit'" @close="closeOverlay">
      <ProfileEditSheet />
    </BottomSheet>

    <BottomSheet title="快捷入口" :open="appState.activeOverlay === 'profileQuickAction'" @close="closeOverlay">
      <ProfileQuickActionSheet />
    </BottomSheet>

    <BottomSheet title="作品详情" :open="appState.activeOverlay === 'workDetail'" @close="closeOverlay">
      <WorkDetailSheet />
    </BottomSheet>

    <ToastHost />
  </MobileShell>
</template>
