<template>
  <ReplicaProxyLifecycleOverlay v-if="apiDebugPage" page-mode />

  <main v-else class="app-frame">
    <section class="phone-shell" aria-label="Home Guru H5 replica">
      <header class="status-bar">
        <span>9:41</span>
        <span class="status-icons">5G 100%</span>
      </header>

      <section class="screen">
        <section v-if="activeTab === 'home'" class="page page-home" @scroll.passive="isScrolled = true">
          <div class="sticky-top" :class="{ solid: isScrolled }">
            <img :src="homeGuruAssets.homeText" alt="Home Guru" />
          </div>

          <div class="hero">
            <img class="hero-image" :src="snapshot.banners[0]" alt="" />
            <div class="hero-copy">
              <p>Welcome to Home Guru</p>
              <h1>Home Guru</h1>
              <button class="primary-button" type="button" @click="activeTab = 'design'">
                <img :src="homeGuruAssets.magicWand" alt="" />
                Start Design
              </button>
            </div>
          </div>

          <section class="primary-card-list">
            <button
              v-for="feature in snapshot.features"
              :key="feature.code"
              class="primary-card"
              type="button"
              :style="{ '--accent': feature.accent }"
              @click="selectFeature(feature.code)"
            >
              <img class="primary-card-cover" :src="feature.guideImage" alt="" />
              <span class="primary-card-body">
                <strong>{{ feature.title }}</strong>
                <small>{{ feature.subtitle }}</small>
              </span>
              <span class="try-button">
                <img :src="feature.icon" alt="" />
                Try it
              </span>
            </button>
          </section>
        </section>

        <section v-else-if="activeTab === 'design'" class="page page-design">
          <header class="page-header">
            <button class="icon-button" type="button" aria-label="Back" @click="activeTab = 'home'">
              <ChevronLeft :size="20" />
            </button>
            <strong>Step {{ designStep + 1 }}/{{ designSteps.length }}</strong>
            <button class="icon-button" type="button" aria-label="Reset design" @click="resetDesign">
              <X :size="18" />
            </button>
          </header>

          <div class="step-indicator">
            <span v-for="(_, index) in designSteps" :key="index" :class="{ active: index <= designStep }"></span>
          </div>

          <section v-if="currentStep === 'upload'" class="design-panel upload-panel">
            <img class="upload-art" :src="selectedFeature.guideImage" alt="" />
            <h2>{{ selectedFeature.title }}</h2>
            <p>Add a photo, AI generates design</p>
            <button class="upload-zone" type="button" @click="mockUpload">
              <img :src="homeGuruAssets.upload" alt="" />
              <span>{{ selectedImageName || 'Choose from Gallery' }}</span>
            </button>
            <div class="guide-compare">
              <figure>
                <img :src="selectedFeature.guideImage" alt="" />
                <figcaption>Good photo</figcaption>
              </figure>
              <figure v-if="selectedFeature.badImage">
                <img :src="selectedFeature.badImage" alt="" />
                <figcaption>Avoid blur</figcaption>
              </figure>
            </div>
          </section>

          <section v-else-if="currentStep === 'style'" class="design-panel">
            <h2>Select your desired design style</h2>
            <div class="chip-grid">
              <button
                v-for="style in styles"
                :key="style"
                class="select-chip"
                :class="{ active: style === selectedStyle }"
                type="button"
                @click="selectedStyle = style"
              >
                {{ style }}
              </button>
            </div>
            <div class="tool-strip">
              <button v-for="tool in designTools" :key="tool.label" type="button" class="tool-button">
                <img :src="tool.icon" alt="" />
                <span>{{ tool.label }}</span>
              </button>
            </div>
          </section>

          <section v-else class="design-panel result-panel">
            <img class="detecting" :src="homeGuruAssets.objectDetecting" alt="" />
            <h2>AI is creating your exclusive work</h2>
            <p>{{ selectedFeature.title }} · {{ selectedStyle }}</p>
            <div class="result-preview">
              <img :src="selectedFeature.guideImage" alt="" />
              <div>
                <strong>Generation ready</strong>
                <span>Use the proxy panel to compare real API requests and responses.</span>
              </div>
            </div>
          </section>

          <button class="bottom-action" type="button" @click="nextDesignStep">
            {{ designStep === designSteps.length - 1 ? 'Generate Again' : 'Next' }}
          </button>
        </section>

        <section v-else-if="activeTab === 'discover'" class="page page-discover">
          <header class="page-title-row">
            <div>
              <p>Discover</p>
              <h2>Ideas for real spaces</h2>
            </div>
            <img :src="homeGuruAssets.discoverScreen" alt="" />
          </header>
          <div class="category-tabs">
            <button
              v-for="category in discoverCategories"
              :key="category"
              :class="{ active: category === activeDiscoverCategory }"
              type="button"
              @click="activeDiscoverCategory = category"
            >
              {{ category }}
            </button>
          </div>
          <section class="discover-grid">
            <article v-for="item in filteredDiscover" :key="item.title" class="discover-card">
              <img :src="item.coverUrl" alt="" />
              <strong>{{ item.title }}</strong>
              <span>{{ item.subtitle }}</span>
            </article>
          </section>
        </section>

        <section v-else class="page page-mine">
          <header class="profile-head">
            <img :src="homeGuruAssets.appLogo" alt="" />
            <div>
              <h2>{{ snapshot.user.nickname }}</h2>
              <p>ID {{ snapshot.user.userId }}</p>
            </div>
            <span>{{ snapshot.user.vipLabel }}</span>
          </header>

          <section class="vip-card">
            <img :src="homeGuruAssets.vipCardBg" alt="" />
            <div>
              <img :src="homeGuruAssets.vipFontLogo" alt="VIP" />
              <strong>{{ snapshot.user.diamondCount }} credits</strong>
              <span>3-day free trial available</span>
            </div>
          </section>

          <section class="settings-shell" aria-label="设置">
            <header>
              <h2>Settings</h2>
              <small>{{ apiState.environmentLabel }} · {{ apiState.mode }}</small>
            </header>
            <ReplicaApiModePanel
              :auth-token="authTokenDraft"
              :sms-login-enabled="false"
              empty-token-label="未配置"
              :reload-handler="reload"
              :clear-token-handler="clearLogin"
              @update:auth-token="updateAuthToken"
              @notice="showToast"
              @error="showToast"
            />
            <ReplicaSettingsPanel
              :environments="environmentOptions"
              :active-environment="environment"
              :switching-environment="switchingEnvironment"
              :rows="settingRows"
              @choose-environment="chooseEnvironment"
              @row-click="handleSettingRow"
            />
            <p v-if="apiState.lastError" class="settings-error">{{ apiState.lastError }}</p>
          </section>

          <section class="work-list">
            <h3>My Works</h3>
            <article v-for="work in snapshot.works" :key="work.id" class="work-row">
              <img :src="work.coverUrl" alt="" />
              <div>
                <strong>{{ work.title }}</strong>
                <span>{{ work.status }} · {{ work.createdAt || 'Today' }}</span>
              </div>
            </article>
          </section>
        </section>
      </section>

      <nav class="bottom-nav">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          <img :src="tab.icon" alt="" />
          <span>{{ tab.label }}</span>
        </button>
      </nav>
    </section>

    <ReplicaProxyLifecycleOverlay />

    <p v-if="toastMessage" class="toast-message" :class="toastKind">{{ toastMessage }}</p>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { ChevronLeft, X } from 'lucide-vue-next';
import {
  createReplicaSession,
  persistReplicaAuthToken,
  persistReplicaDemoMode,
  persistReplicaEnvironment,
  type ReplicaEnvironment,
} from '@wmxs/h5-replica-common/client';
import {
  ReplicaApiModePanel,
  ReplicaProxyLifecycleOverlay,
  ReplicaSettingsPanel,
  type ReplicaSettingsRow,
} from '@wmxs/h5-replica-common/ui';
import { homeGuruReplicaConfig } from '../../app.config';
import { homeGuruAssets } from '../shared/assets';
import { demoSnapshot } from '../shared/demoData';
import { loadHomeGuruSnapshot } from '../shared/homeguruApi';
import type { DesignFeature, HomeGuruApiState, HomeGuruSnapshot, MainTab } from '../shared/types';

const API_DEBUG_HASH = '#/api-debug';
const session = createReplicaSession(homeGuruReplicaConfig.appId);
const activeTab = ref<MainTab>('home');
const environment = ref<ReplicaEnvironment>(session.environment);
const demoMode = ref(false);
const authTokenDraft = ref(session.authToken);
const snapshot = ref<HomeGuruSnapshot>(structuredClone(demoSnapshot));
const apiState = ref<HomeGuruApiState>({
  mode: demoMode.value ? 'demo' : 'live',
  environmentLabel: environment.value,
  lastError: '',
});
const apiDebugPage = ref(window.location.hash === API_DEBUG_HASH);
const switchingEnvironment = ref(false);
const toastMessage = ref('');
const toastKind = ref<'notice' | 'error'>('notice');
const isScrolled = ref(false);
const selectedFeatureCode = ref('interior');
const designStep = ref(0);
const selectedImageName = ref('');
const selectedStyle = ref('Modern');
const activeDiscoverCategory = ref('All');

const designSteps = ['upload', 'style', 'result'] as const;
const styles = ['Modern', 'Minimal', 'Nordic', 'Luxury', 'Industrial', 'Cozy'];
const designTools = [
  { label: 'Paint', icon: homeGuruAssets.paint },
  { label: 'Color', icon: homeGuruAssets.color },
  { label: 'Texture', icon: homeGuruAssets.texture },
  { label: 'Erase', icon: homeGuruAssets.noObject },
];
const environmentOptions = [
  {
    key: 'production' as const,
    label: '生产环境',
    host: new URL(homeGuruReplicaConfig.hosts.business.productionTarget).host,
  },
  {
    key: 'test' as const,
    label: '测试环境',
    host: new URL(homeGuruReplicaConfig.hosts.business.testTarget ?? homeGuruReplicaConfig.hosts.business.productionTarget).host,
  },
];
const settingRows: ReplicaSettingsRow[] = [
  { key: 'profile', label: '编辑资料', icon: 'profile' },
  { key: 'feedback', label: '意见反馈', icon: 'feedback' },
];

const tabs = computed(() => [
  { key: 'home' as const, label: 'Home', icon: activeTab.value === 'home' ? homeGuruAssets.tabs.home[1] : homeGuruAssets.tabs.home[0] },
  {
    key: 'design' as const,
    label: 'Design',
    icon: activeTab.value === 'design' ? homeGuruAssets.tabs.design[1] : homeGuruAssets.tabs.design[0],
  },
  {
    key: 'discover' as const,
    label: 'Discover',
    icon: activeTab.value === 'discover' ? homeGuruAssets.tabs.discover[1] : homeGuruAssets.tabs.discover[0],
  },
  { key: 'mine' as const, label: 'Mine', icon: activeTab.value === 'mine' ? homeGuruAssets.tabs.mine[1] : homeGuruAssets.tabs.mine[0] },
]);

const selectedFeature = computed<DesignFeature>(
  () => snapshot.value.features.find((feature) => feature.code === selectedFeatureCode.value) ?? snapshot.value.features[0],
);
const currentStep = computed(() => designSteps[designStep.value]);
const discoverCategories = computed(() => ['All', ...Array.from(new Set(snapshot.value.discover.map((item) => item.tag)))]);
const filteredDiscover = computed(() => {
  if (activeDiscoverCategory.value === 'All') {
    return snapshot.value.discover;
  }
  return snapshot.value.discover.filter((item) => item.tag === activeDiscoverCategory.value);
});

function persistEnvironment() {
  persistReplicaEnvironment(homeGuruReplicaConfig.appId, environment.value);
}

function persistDemoModeState() {
  persistReplicaDemoMode(homeGuruReplicaConfig.appId, demoMode.value);
}

function saveToken() {
  persistReplicaAuthToken(homeGuruReplicaConfig.appId, authTokenDraft.value);
}

function updateApiState(lastError = '') {
  apiState.value = {
    mode: demoMode.value ? 'demo' : 'live',
    environmentLabel: environment.value,
    lastError,
  };
}

function syncApiDebugPage() {
  apiDebugPage.value = window.location.hash === API_DEBUG_HASH;
}

function showToast(message: string) {
  toastMessage.value = message;
  toastKind.value = message.includes('失败') || message.includes('错误') ? 'error' : 'notice';
  window.setTimeout(() => {
    if (toastMessage.value === message) {
      toastMessage.value = '';
    }
  }, 2600);
}

function updateAuthToken(token: string) {
  authTokenDraft.value = token;
  saveToken();
}

async function clearLogin() {
  updateAuthToken('');
  await reload();
}

async function chooseEnvironment(nextEnvironment: ReplicaEnvironment) {
  if (nextEnvironment === environment.value || switchingEnvironment.value) {
    return;
  }

  environment.value = nextEnvironment;
  switchingEnvironment.value = true;
  try {
    await reload();
    showToast(`已切换到${environmentOptions.find((option) => option.key === nextEnvironment)?.label ?? nextEnvironment}`);
  } finally {
    switchingEnvironment.value = false;
  }
}

function handleSettingRow(row: ReplicaSettingsRow) {
  if (row.key === 'profile') {
    activeTab.value = 'mine';
    showToast('编辑资料入口已保留，后续接入真实业务接口');
    return;
  }
  if (row.key === 'feedback') {
    showToast('反馈入口已保留，后续接入真实业务接口');
    return;
  }
  showToast(`${row.label} 暂未接入`);
}

function selectFeature(code: string) {
  selectedFeatureCode.value = code;
  designStep.value = 0;
  activeTab.value = 'design';
}

function resetDesign() {
  designStep.value = 0;
  selectedImageName.value = '';
}

function mockUpload() {
  // H5 复刻先记录交互态，真实上传仍通过原 APP 的接口和代理事件核对。
  selectedImageName.value = `${selectedFeature.value.title}.jpg`;
}

function nextDesignStep() {
  if (designStep.value < designSteps.length - 1) {
    designStep.value += 1;
    return;
  }
  designStep.value = 0;
}

async function reload() {
  persistEnvironment();
  persistDemoModeState();
  saveToken();
  updateApiState();

  if (demoMode.value) {
    snapshot.value = structuredClone(demoSnapshot);
    return;
  }

  try {
    snapshot.value = await loadHomeGuruSnapshot({
      authToken: authTokenDraft.value,
      environment: environment.value,
    });
    updateApiState();
  } catch (error) {
    const maybeSnapshot = error && typeof error === 'object' && 'snapshot' in error ? (error as { snapshot?: HomeGuruSnapshot }).snapshot : null;
    if (maybeSnapshot) {
      snapshot.value = maybeSnapshot;
    }
    apiState.value = {
      mode: 'demo',
      environmentLabel: environment.value,
      lastError: error instanceof Error ? error.message : '接口请求失败，已展示演示数据',
    };
  }
}

onMounted(() => {
  window.addEventListener('hashchange', syncApiDebugPage);
  window.addEventListener('popstate', syncApiDebugPage);
  syncApiDebugPage();
  void reload();
});

onUnmounted(() => {
  window.removeEventListener('hashchange', syncApiDebugPage);
  window.removeEventListener('popstate', syncApiDebugPage);
});
</script>
