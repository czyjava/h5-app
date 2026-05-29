<template>
  <ReplicaProxyLifecycleOverlay v-if="apiDebugPage" page-mode />

  <main v-else class="app-frame">
    <section class="phone-shell" :class="{ onboarding: bootFlowVisible, guide: guideVisible }" aria-label="装修 APP H5 复刻">
      <header class="status-bar">
        <span>9:41</span>
        <span class="status-icons">5G 100%</span>
      </header>

      <section v-if="privacyVisible" class="privacy-page">
        <div class="launch-brand">
          <img :src="homeAiAssets.appLogo" alt="" />
          <span>
            <strong>AI装修大师</strong>
            <small>看见家的万千种可能</small>
          </span>
        </div>

        <section class="privacy-dialog" role="dialog" aria-modal="true" aria-label="个人信息保护指引">
          <h1>个人信息保护指引</h1>
          <p>
            感谢您信任并使用AI装修大师！我们十分重视您的个人信息和隐私保护。为了更好地保障您的个人权益，请您仔细阅读
            <a href="#" @click.prevent>《用户服务协议》</a>
            和
            <a href="#" @click.prevent>《隐私政策》</a>
            。
          </p>
          <p>
            这将帮助您详细了解我们对信息的收集、使用方式，以便您更好地了解我们的服务并作出适当选择。如您同意用户服务协议和隐私政策，请单击“同意并继续”。
          </p>
          <p>若点击“不同意”，则相关服务不可用。后续您可以在 我的-右上角设置图标-隐私政策 中查看。</p>
          <footer>
            <button type="button" class="privacy-secondary" @click="showToast('需要同意隐私政策后才能继续体验')">不同意</button>
            <button type="button" class="privacy-primary" @click="acceptPrivacy">同意并继续</button>
          </footer>
        </section>
      </section>

      <section v-else-if="onboardingVisible" class="onboarding-page">
        <header class="onboarding-hero">
          <button v-if="onboardingStep === 'source'" type="button" class="text-button" @click="onboardingStep = 'role'">上一步</button>
          <button type="button" class="text-button skip" @click="completeOnboarding">暂时跳过</button>
          <img :src="homeAiAssets.loginTitle" alt="欢迎使用AI装修大师" />
          <strong v-if="onboardingStep === 'role'">为了更好地为您服务，可以告诉我您的身份吗？</strong>
          <strong v-else>您是如何找到我们的？</strong>
          <span v-if="onboardingStep === 'source'">选择一个来源，帮助 HomeAI 后续推荐更合适的入口。</span>
        </header>

        <section v-if="onboardingStep === 'role'" class="role-question">
          <button v-for="role in roles" :key="role.label" type="button" class="role-card" @click="selectOnboardingRole(role.label)">
            <img :src="role.image" alt="" />
            <span>
              <strong>{{ role.label }}</strong>
              <small>{{ role.subtitle }}</small>
            </span>
            <ChevronRight :size="26" />
          </button>
        </section>

        <section v-else class="source-question">
          <button
            v-for="source in sourceOptions"
            :key="source.label"
            type="button"
            :class="{ active: selectedSource === source.label }"
            @click="selectedSource = source.label"
          >
            <span class="source-icon" :style="{ '--source-bg': source.color }">{{ source.icon }}</span>
            <strong>{{ source.label }}</strong>
            <span class="radio-dot" aria-hidden="true"></span>
          </button>
        </section>

        <footer v-if="onboardingStep === 'source'" class="onboarding-actions">
          <button type="button" class="secondary-button" @click="onboardingStep = 'role'">上一步</button>
          <button type="button" class="next-button" :disabled="onboardingStep === 'source' && !selectedSource" @click="finishOnboardingStep">
            下一步
          </button>
        </footer>
      </section>

      <section v-else-if="guideVisible" class="guide-page">
        <div class="guide-visual">
          <img class="guide-poster" :src="activeGuide.poster" alt="" />
          <span class="original-badge">
            <img :src="activeGuide.original" alt="" />
            <strong>原图</strong>
          </span>
        </div>
        <section class="guide-copy">
          <strong>{{ activeGuide.title }}</strong>
          <span>{{ activeGuide.subtitle }}</span>
        </section>
        <button type="button" class="guide-next" @click="nextGuide">
          {{ guideStep === guideSlides.length - 1 ? '开始体验' : '下一步' }}
        </button>
      </section>

      <section v-else class="screen">
        <section v-if="activeTab === 'home'" class="page page-home native-home" @scroll.passive="isScrolled = true">
          <header class="home-native-head">
            <button type="button" class="member-pill" @click="activeTab = 'mine'">
              <span>👑</span>
              开通会员
            </button>
          </header>

          <section class="native-feature-list">
            <button v-for="feature in homeCards" :key="feature.code" type="button" class="native-feature-card" @click="selectFeature(feature.code)">
              <div class="native-feature-media">
                <img :src="feature.image" alt="" />
                <span class="compare-line"></span>
              </div>
              <footer>
                <span>
                  <strong>{{ feature.title }}</strong>
                  <small>{{ feature.subtitle }}</small>
                </span>
                <span class="try-button">
                  <WandSparkles :size="19" />
                  去试试
                </span>
              </footer>
            </button>
          </section>
        </section>

        <section v-else-if="activeTab === 'design'" class="page page-design">
          <header class="page-header">
            <button class="icon-button" type="button" aria-label="返回首页" @click="activeTab = 'home'">
              <ChevronLeft :size="20" />
            </button>
            <strong>{{ selectedFeature.title }}</strong>
            <button class="icon-button" type="button" aria-label="重置设计" @click="resetDesign">
              <X :size="18" />
            </button>
          </header>

          <div class="step-indicator">
            <span v-for="(_, index) in designSteps" :key="index" :class="{ active: index <= designStep }"></span>
          </div>

          <section v-if="currentStep === 'upload'" class="design-panel upload-panel">
            <img class="upload-art" :src="selectedFeature.guideImage" alt="" />
            <h2>上传空间照片</h2>
            <p>HomeAI 会识别房间结构，再生成对应的装修方案。</p>
            <button class="upload-zone" type="button" @click="mockUpload">
              <img :src="homeAiAssets.upload" alt="" />
              <span>{{ selectedImageName || '从相册选择图片' }}</span>
            </button>
            <div class="guide-compare">
              <figure>
                <img :src="selectedFeature.guideImage" alt="" />
                <figcaption>光线清晰</figcaption>
              </figure>
              <figure v-if="selectedFeature.badImage">
                <img :src="selectedFeature.badImage" alt="" />
                <figcaption>避免遮挡</figcaption>
              </figure>
            </div>
          </section>

          <section v-else-if="currentStep === 'style'" class="design-panel style-panel">
            <h2>选择装修风格</h2>
            <p>保留原空间轮廓，调整软装、色彩和材质。</p>
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
              <button v-for="tool in designTools" :key="tool.label" type="button" class="tool-button" @click="showToast(`${tool.label} 工具已选中`)">
                <img :src="tool.icon" alt="" />
                <span>{{ tool.label }}</span>
              </button>
            </div>
          </section>

          <section v-else class="design-panel result-panel">
            <img class="detecting" :src="homeAiAssets.objectDetecting" alt="" />
            <h2>AI 正在生成装修方案</h2>
            <p>{{ selectedFeature.title }} · {{ selectedStyle }}</p>
            <div class="result-preview">
              <img :src="selectedFeature.guideImage" alt="" />
              <div>
                <strong>生成任务已准备</strong>
                <span>真实生成接口可在 Network 面板中对照代理请求。</span>
              </div>
            </div>
          </section>

          <button class="bottom-action" type="button" @click="nextDesignStep">
            {{ designStep === designSteps.length - 1 ? '再做一张' : '下一步' }}
          </button>
        </section>

        <section v-else-if="activeTab === 'assistant'" class="page page-assistant">
          <header class="assistant-header">
            <button class="icon-button" type="button" aria-label="返回首页" @click="activeTab = 'home'">
              <ChevronLeft :size="20" />
            </button>
            <strong>AI 设计助手</strong>
            <button class="assistant-new-button" type="button" :disabled="assistantSending" @click="startManualAssistantSession">新会话</button>
          </header>
          <section class="assistant-chat">
            <section v-if="assistantMessages.length === 0" class="assistant-empty">
              <span>AI</span>
              <h2>设计助手</h2>
              <p>可以咨询户型、风格、预算和软装搭配，也可以上传图片作为参考。</p>
              <div class="assistant-quick-list">
                <button v-for="question in assistantQuickQuestions" :key="question" type="button" @click="useAssistantQuickQuestion(question)">
                  {{ question }}
                </button>
              </div>
            </section>
            <section v-else class="assistant-message-list">
              <article v-for="message in assistantMessages" :key="message.messageId || message.localId" class="assistant-message" :class="message.role === 'USER' ? 'user' : 'assistant'">
                <img v-if="resolveAssistantMessageImage(message)" :src="resolveAssistantMessageImage(message)" alt="" />
                <p v-if="resolveAssistantMessageText(message)">{{ resolveAssistantMessageText(message) }}</p>
                <small v-if="message.status === 'FAILED'">{{ message.errorMessage || '生成失败，请稍后再试' }}</small>
              </article>
            </section>
          </section>

          <section class="assistant-composer">
            <button type="button" aria-label="上传图片" @click="addAssistantImageAttachment">
              <img :src="homeAiAssets.upload" alt="" />
            </button>
            <input v-model="assistantInput" type="text" placeholder="输入你的装修问题" @keydown.enter.prevent="sendLocalAssistantMessage" />
            <button type="button" :disabled="assistantSending || (!assistantInput.trim() && assistantImageUrls.length === 0)" @click="sendAssistantMessage">
              {{ assistantSending ? '等待' : '发送' }}
            </button>
            <div v-if="assistantImageUrls.length" class="assistant-attachment-strip">
              <span v-for="url in assistantImageUrls" :key="url">
                <img :src="url" alt="" />
              </span>
            </div>
          </section>
        </section>

        <section v-else-if="activeTab === 'discover'" class="page page-discover">
          <header class="page-title-row">
            <div>
              <p>发现</p>
              <h2>真实空间灵感库</h2>
            </div>
            <img :src="homeAiAssets.discoverScreen" alt="" />
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
            <img :src="homeAiAssets.appLogo" alt="" />
            <div>
              <h2>{{ snapshot.user.nickname }}</h2>
              <p>ID {{ snapshot.user.userId }}</p>
            </div>
            <span>{{ snapshot.user.vipLabel }}</span>
          </header>

          <section class="vip-card">
            <img :src="homeAiAssets.vipCardBg" alt="" />
            <div>
              <img :src="homeAiAssets.vipFontLogo" alt="VIP" />
              <strong>{{ snapshot.user.diamondCount }} 钻石</strong>
              <span>会员权益与余额信息来自原 APP 资源结构</span>
            </div>
          </section>

          <section class="settings-shell" aria-label="设置">
            <header>
              <h2>设置</h2>
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
            <h3>我的作品</h3>
            <article v-for="work in snapshot.works" :key="work.id" class="work-row">
              <img :src="work.coverUrl" alt="" />
              <div>
                <strong>{{ work.title }}</strong>
                <span>{{ work.status }} · {{ work.createdAt || '今天' }}</span>
              </div>
            </article>
          </section>
        </section>
      </section>

      <nav v-if="!bootFlowVisible && activeTab !== 'assistant'" class="bottom-nav">
        <button v-for="tab in tabs" :key="tab.key" type="button" :class="{ active: activeTab === tab.key }" @click="activeTab = tab.key">
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
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { ChevronLeft, ChevronRight, WandSparkles, X } from 'lucide-vue-next';
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
import { homeAiReplicaConfig } from '../../app.config';
import { homeAiAssets } from '../shared/assets';
import { demoSnapshot } from '../shared/demoData';
import {
  listDesignAssistantMessages,
  resolveAssistantImageUrl,
  resolveAssistantText,
  sendDesignAssistantMessage,
  startDesignAssistantSession,
} from '../shared/designAssistantApi';
import { loadHomeAiSnapshot } from '../shared/homeaiApi';
import type { DesignAssistantMessage, DesignFeature, HomeAiApiState, HomeAiSnapshot, MainTab } from '../shared/types';

const API_DEBUG_HASH = '#/api-debug';
const PRIVACY_STORAGE_KEY = `${homeAiReplicaConfig.appId}:privacy-accepted`;
const ONBOARDING_STORAGE_KEY = `${homeAiReplicaConfig.appId}:onboarding-complete`;
const GUIDE_STORAGE_KEY = `${homeAiReplicaConfig.appId}:guide-complete`;
const resetParams = new URLSearchParams(window.location.search);
if (resetParams.get('__homeai_reset') === '1') {
  // 本地复刻对比时需要反复回到首启态；该参数只清理本应用的本地演示状态。
  localStorage.removeItem(PRIVACY_STORAGE_KEY);
  localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  localStorage.removeItem(GUIDE_STORAGE_KEY);
  resetParams.delete('__homeai_reset');
  const nextSearch = resetParams.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`);
}
const session = createReplicaSession(homeAiReplicaConfig.appId);
const activeTab = ref<MainTab>('home');
const environment = ref<ReplicaEnvironment>(session.environment);
const demoMode = ref(session.demoMode);
const authTokenDraft = ref(session.authToken);
const snapshot = ref<HomeAiSnapshot>(structuredClone(demoSnapshot));
const apiState = ref<HomeAiApiState>({
  mode: demoMode.value ? 'demo' : 'live',
  environmentLabel: environment.value,
  lastError: '',
});
const apiDebugPage = ref(window.location.hash === API_DEBUG_HASH);
const switchingEnvironment = ref(false);
const toastMessage = ref('');
const toastKind = ref<'notice' | 'error'>('notice');
const isScrolled = ref(false);
const privacyVisible = ref(localStorage.getItem(PRIVACY_STORAGE_KEY) !== '1');
const onboardingVisible = ref(localStorage.getItem(ONBOARDING_STORAGE_KEY) !== '1');
const guideVisible = ref(localStorage.getItem(GUIDE_STORAGE_KEY) !== '1' && !privacyVisible.value && !onboardingVisible.value);
const guideStep = ref(0);
const onboardingStep = ref<'role' | 'source'>('role');
const selectedRole = ref('');
const selectedSource = ref('');
const selectedFeatureCode = ref('interior');
const designStep = ref(0);
const selectedImageName = ref('');
const selectedStyle = ref('现代简约');
const activeDiscoverCategory = ref('全部');
const assistantInput = ref('');
const assistantImageUrls = ref<string[]>([]);
const assistantMessages = ref<Array<DesignAssistantMessage & { localId?: string }>>([]);
const assistantSessionKey = ref('');
const assistantSending = ref(false);

const designSteps = ['upload', 'style', 'result'] as const;
const styles = ['现代简约', '奶油风', '新中式', '原木风', '轻奢', '工业风'];
const roles = [
  { label: '我是业主', subtitle: 'Owner', image: homeAiAssets.surveyOwner },
  { label: '我是设计师', subtitle: 'Design', image: homeAiAssets.surveyDesigner },
  { label: '我先看看', subtitle: 'Take A Look', image: homeAiAssets.surveyCurios },
];
const sourceOptions = [
  { label: '设计师/装修公司推荐', icon: '荐', color: '#a9adff' },
  { label: '小红书', icon: '红', color: '#ff2442' },
  { label: '抖音', icon: '抖', color: '#171b20' },
  { label: '微信视频号', icon: '微', color: '#19c465' },
  { label: '应用商店搜索', icon: '搜', color: '#3aa7f4' },
  { label: '问的 AI，如豆包/千问/文心一言等', icon: 'AI', color: '#e9edf5' },
];
const guideSlides = [
  {
    title: '开启设计之旅',
    subtitle: '上传任意房间照片，AI 即刻智能识别空间',
    ...homeAiAssets.guideVideos[0],
  },
  {
    title: '定义你的风格',
    subtitle: '海量风格模板随心换，轻松找到你的理想型',
    ...homeAiAssets.guideVideos[1],
  },
  {
    title: '打造极致细节',
    subtitle: '自由调整风格配色，一键改善生活细节',
    ...homeAiAssets.guideVideos[2],
  },
  {
    title: '见证家的蜕变',
    subtitle: '高清效果图秒生成，装修效果提前预见',
    ...homeAiAssets.guideVideos[3],
  },
];
const designTools = [
  { label: '涂抹', icon: homeAiAssets.paint },
  { label: '换色', icon: homeAiAssets.color },
  { label: '材质', icon: homeAiAssets.texture },
  { label: '擦除', icon: homeAiAssets.erase },
];
const assistantQuickQuestions = ['小户型客厅怎么显大？', '现代简约适合什么配色？', '帮我规划玄关收纳', '预算有限先改哪里？'];
const environmentOptions = [
  {
    key: 'production' as const,
    label: '生产环境',
    host: new URL(homeAiReplicaConfig.hosts.business.productionTarget).host,
  },
  {
    key: 'test' as const,
    label: '测试环境',
    host: new URL(homeAiReplicaConfig.hosts.business.testTarget ?? homeAiReplicaConfig.hosts.business.productionTarget).host,
  },
];
const settingRows: ReplicaSettingsRow[] = [
  { key: 'profile', label: '编辑资料', icon: 'profile' },
  { key: 'feedback', label: '意见反馈', icon: 'feedback' },
];

const tabs = computed(() => [
  { key: 'home' as const, label: '首页', icon: activeTab.value === 'home' ? homeAiAssets.tabs.home[1] : homeAiAssets.tabs.home[0] },
  { key: 'design' as const, label: '设计', icon: activeTab.value === 'design' ? homeAiAssets.tabs.design[1] : homeAiAssets.tabs.design[0] },
  { key: 'assistant' as const, label: 'AI', icon: homeAiAssets.magicWand },
  {
    key: 'discover' as const,
    label: '发现',
    icon: activeTab.value === 'discover' ? homeAiAssets.tabs.discover[1] : homeAiAssets.tabs.discover[0],
  },
  { key: 'mine' as const, label: '我的', icon: activeTab.value === 'mine' ? homeAiAssets.tabs.mine[1] : homeAiAssets.tabs.mine[0] },
]);

const selectedFeature = computed<DesignFeature>(
  () => snapshot.value.features.find((feature) => feature.code === selectedFeatureCode.value) ?? snapshot.value.features[0],
);
const homeCards = computed(() =>
  // 首页入口复用各功能的装修参考图，避免误用 APK 中其他功能域的演示素材。
  snapshot.value.features.map((feature) => ({
    ...feature,
    image: feature.guideImage,
  })),
);
const bootFlowVisible = computed(() => privacyVisible.value || onboardingVisible.value || guideVisible.value);
const activeGuide = computed(() => guideSlides[guideStep.value] ?? guideSlides[0]);
const currentStep = computed(() => designSteps[designStep.value]);
const discoverCategories = computed(() => ['全部', ...Array.from(new Set(snapshot.value.discover.map((item) => item.tag)))]);
const filteredDiscover = computed(() => {
  if (activeDiscoverCategory.value === '全部') {
    return snapshot.value.discover;
  }
  return snapshot.value.discover.filter((item) => item.tag === activeDiscoverCategory.value);
});

function persistEnvironment() {
  persistReplicaEnvironment(homeAiReplicaConfig.appId, environment.value);
}

function persistDemoModeState() {
  persistReplicaDemoMode(homeAiReplicaConfig.appId, demoMode.value);
}

function saveToken() {
  persistReplicaAuthToken(homeAiReplicaConfig.appId, authTokenDraft.value);
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
    showToast('编辑资料入口已保留，后续接入真实业务接口');
    return;
  }
  if (row.key === 'feedback') {
    showToast('反馈入口已保留，后续接入真实业务接口');
    return;
  }
  showToast(`${row.label} 暂未接入`);
}

function chooseRole(role: string) {
  showToast(`已选择：${role}`);
}

function acceptPrivacy() {
  // 隐私弹窗只模拟原 APP 首次启动链路，确认态保存在本地，避免重复打扰。
  localStorage.setItem(PRIVACY_STORAGE_KEY, '1');
  privacyVisible.value = false;
  onboardingVisible.value = localStorage.getItem(ONBOARDING_STORAGE_KEY) !== '1';
  guideVisible.value = !onboardingVisible.value && localStorage.getItem(GUIDE_STORAGE_KEY) !== '1';
}

function selectOnboardingRole(role: string) {
  selectedRole.value = role;
  onboardingStep.value = 'source';
}

function completeOnboarding() {
  // 首屏问卷只影响演示流入口，不把身份或来源写入业务接口，避免产生无意义用户数据。
  localStorage.setItem(ONBOARDING_STORAGE_KEY, '1');
  onboardingVisible.value = false;
  if (localStorage.getItem(GUIDE_STORAGE_KEY) !== '1') {
    guideVisible.value = true;
    guideStep.value = 0;
    return;
  }
  showToast(selectedRole.value ? `已记录：${selectedRole.value}` : '已进入首页');
}

function finishOnboardingStep() {
  if (onboardingStep.value === 'role') {
    onboardingStep.value = 'source';
    return;
  }

  if (!selectedSource.value) {
    showToast('请选择一个来源，或点击上一步返回');
    return;
  }
  completeOnboarding();
}

function nextGuide() {
  if (guideStep.value < guideSlides.length - 1) {
    guideStep.value += 1;
    return;
  }
  localStorage.setItem(GUIDE_STORAGE_KEY, '1');
  guideVisible.value = false;
  showToast(selectedRole.value ? `已记录：${selectedRole.value}` : '已进入首页');
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
  // 首版复刻只保存交互态，真实上传接口后续通过透明代理逐项对齐原 APP。
  selectedImageName.value = `${selectedFeature.value.title}.jpg`;
}

function createLocalAssistantMessage(role: 'USER' | 'ASSISTANT', text: string, imageUrl = '') {
  const messageContent = imageUrl
    ? { type: 'IMAGE', image: { large: imageUrl } }
    : { type: 'TEXT', text: { text } };
  return {
    localId: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    status: 'SUCCEEDED',
    contentType: imageUrl ? 'IMAGE' : 'TEXT',
    messageContent,
    messageTime: Date.now(),
  } satisfies DesignAssistantMessage & { localId: string };
}

function getAssistantContext() {
  return {
    authToken: authTokenDraft.value,
    environment: environment.value,
  };
}

function resolveAssistantMessageText(message: DesignAssistantMessage) {
  return resolveAssistantText(message.messageContent);
}

function resolveAssistantMessageImage(message: DesignAssistantMessage) {
  return resolveAssistantImageUrl(message.messageContent);
}

function useAssistantQuickQuestion(question: string) {
  assistantInput.value = question;
}

function addAssistantImageAttachment() {
  const nextImage = selectedFeature.value?.guideImage || homeAiAssets.guide.interiorGood;
  if (!assistantImageUrls.value.includes(nextImage)) {
    assistantImageUrls.value = [...assistantImageUrls.value, nextImage];
  }
  showToast('已添加一张图片附件');
}

function appendAssistantWaitingMessage() {
  assistantMessages.value.push({
    localId: `ASSISTANT-PENDING-${Date.now()}`,
    role: 'ASSISTANT',
    status: 'PENDING',
    contentType: 'TEXT',
    messageContent: { type: 'TEXT', text: { text: '正在生成中...' } },
    messageTime: Date.now(),
  });
}

function sendLocalAssistantMessage() {
  const prompt = assistantInput.value.trim();
  if (!prompt && assistantImageUrls.value.length === 0) {
    return;
  }
  if (prompt) {
    assistantMessages.value.push(createLocalAssistantMessage('USER', prompt));
  }
  assistantImageUrls.value.forEach((url) => {
    assistantMessages.value.push(createLocalAssistantMessage('USER', '', url));
  });
  assistantMessages.value.push(
    createLocalAssistantMessage('ASSISTANT', '我先收到了你的问题。下一步会接入同步接口，直接返回装修建议或设计图片。'),
  );
  assistantInput.value = '';
  assistantImageUrls.value = [];
}

async function ensureAssistantSession(startReason: 'APP_LAUNCH_FIRST_ENTER' | 'MANUAL_NEW' = 'APP_LAUNCH_FIRST_ENTER') {
  if (demoMode.value || !authTokenDraft.value) {
    return '';
  }
  if (assistantSessionKey.value && startReason !== 'MANUAL_NEW') {
    return assistantSessionKey.value;
  }
  const response = await startDesignAssistantSession(getAssistantContext(), {
    sceneType: 'ASSISTANT_CHAT',
    startReason,
    deviceId: `${homeAiReplicaConfig.appId}-h5`,
  });
  assistantSessionKey.value = response.sessionKey;
  return response.sessionKey;
}

async function restoreAssistantMessages() {
  if (demoMode.value || !authTokenDraft.value || !assistantSessionKey.value) {
    return;
  }
  assistantMessages.value = await listDesignAssistantMessages(getAssistantContext(), assistantSessionKey.value);
}

async function startManualAssistantSession() {
  if (demoMode.value || !authTokenDraft.value) {
    assistantSessionKey.value = '';
    assistantMessages.value = [];
    showToast('已新建本地体验会话');
    return;
  }
  assistantSending.value = true;
  try {
    await ensureAssistantSession('MANUAL_NEW');
    assistantMessages.value = [];
    showToast('已新建设计助手会话');
  } catch (error) {
    showToast(error instanceof Error ? error.message : '新建会话失败');
  } finally {
    assistantSending.value = false;
  }
}

async function sendAssistantMessage() {
  const prompt = assistantInput.value.trim();
  const imageUrls = [...assistantImageUrls.value];
  if (!prompt && imageUrls.length === 0) {
    return;
  }
  if (demoMode.value || !authTokenDraft.value) {
    sendLocalAssistantMessage();
    return;
  }
  assistantInput.value = '';
  assistantImageUrls.value = [];
  assistantMessages.value.push(createLocalAssistantMessage('USER', prompt || '图片附件', imageUrls[0] || ''));
  appendAssistantWaitingMessage();
  assistantSending.value = true;
  try {
    const sessionKey = await ensureAssistantSession();
    await sendDesignAssistantMessage(getAssistantContext(), {
      sessionKey,
      prompt,
      imageUrls,
    });
    await restoreAssistantMessages();
  } catch (error) {
    assistantMessages.value = assistantMessages.value.filter((message) => message.status !== 'PENDING');
    assistantMessages.value.push({
      localId: `ASSISTANT-FAILED-${Date.now()}`,
      role: 'ASSISTANT',
      status: 'FAILED',
      contentType: 'TEXT',
      messageContent: { type: 'TEXT', text: { text: '' } },
      errorMessage: error instanceof Error ? error.message : '生成失败，请稍后再试',
      messageTime: Date.now(),
    });
    showToast(error instanceof Error ? error.message : '发送失败');
  } finally {
    assistantSending.value = false;
  }
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
    snapshot.value = await loadHomeAiSnapshot({
      authToken: authTokenDraft.value,
      environment: environment.value,
    });
    updateApiState();
  } catch (error) {
    const maybeSnapshot = error && typeof error === 'object' && 'snapshot' in error ? (error as { snapshot?: HomeAiSnapshot }).snapshot : null;
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

watch(activeTab, (tab) => {
  if (tab !== 'assistant') {
    return;
  }
  void (async () => {
    try {
      await ensureAssistantSession();
      await restoreAssistantMessages();
    } catch (error) {
      showToast(error instanceof Error ? error.message : '设计助手会话初始化失败');
    }
  })();
});

onUnmounted(() => {
  window.removeEventListener('hashchange', syncApiDebugPage);
  window.removeEventListener('popstate', syncApiDebugPage);
});
</script>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

:global(body) {
  margin: 0;
  min-width: 320px;
  color: #192036;
  background: #dbe7f4;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", sans-serif;
}

button {
  font: inherit;
  cursor: pointer;
}

.app-frame {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 22px;
  background:
    radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.86), transparent 28%),
    linear-gradient(135deg, #f4f8fd 0%, #d7e5f2 48%, #eef3e6 100%);
}

.phone-shell {
  width: min(100%, 430px);
  height: min(900px, calc(100vh - 44px));
  min-height: 700px;
  display: grid;
  grid-template-rows: 30px 1fr 74px;
  overflow: hidden;
  border: 10px solid #111722;
  border-radius: 34px;
  background: #f6f8fb;
  box-shadow: 0 28px 60px rgba(31, 55, 83, 0.28);
}

.phone-shell.onboarding {
  grid-template-rows: 30px 1fr;
  background: #f2f5fa;
}

.phone-shell.guide {
  background: #000;
}

.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 22px;
  color: #20283a;
  font-size: 12px;
  font-weight: 800;
  background: #f8fbff;
}

.phone-shell.onboarding .status-bar {
  color: #fff;
  background: #fff4be;
  mix-blend-mode: multiply;
}

.screen {
  min-height: 0;
  position: relative;
  overflow: hidden;
  background: #f4f7fb;
}

.privacy-page {
  min-height: 0;
  position: relative;
  display: grid;
  align-items: end;
  padding: 24px 20px 54px;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(243, 248, 255, 0.42), rgba(232, 238, 246, 0.92)),
    url("/assets/homeai/page_bg_home.png") center / cover no-repeat,
    #f3f6fb;
}

.privacy-page::before {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.56);
}

.launch-brand {
  position: absolute;
  left: 36px;
  right: 36px;
  bottom: 52px;
  display: flex;
  align-items: center;
  gap: 16px;
  color: #101725;
  opacity: 0.28;
}

.launch-brand img {
  width: 70px;
  height: 70px;
  border-radius: 18px;
}

.launch-brand span {
  display: grid;
  gap: 5px;
}

.launch-brand strong {
  font-size: 32px;
}

.launch-brand small {
  color: #4f5e72;
  font-size: 15px;
  font-weight: 800;
}

.privacy-dialog {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 14px;
  max-height: calc(100% - 24px);
  overflow-y: auto;
  padding: 26px 24px 22px;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.22);
}

.privacy-dialog h1 {
  margin: 0;
  color: #2a2f38;
  font-size: 23px;
  text-align: center;
}

.privacy-dialog p {
  margin: 0;
  color: #646b76;
  font-size: 15px;
  line-height: 1.62;
}

.privacy-dialog a {
  color: #38afff;
  text-decoration: none;
}

.privacy-dialog footer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.privacy-secondary,
.privacy-primary {
  min-height: 50px;
  border-radius: 26px;
  font-size: 18px;
  font-weight: 900;
}

.privacy-secondary {
  border: 1px solid #37aefb;
  color: #37aefb;
  background: #fff;
}

.privacy-primary {
  border: 0;
  color: #fff;
  background: linear-gradient(135deg, #11d5d4, #0f8dff);
}

.onboarding-page {
  min-height: 0;
  position: relative;
  overflow-y: auto;
  padding: 0 20px 106px;
  background:
    linear-gradient(180deg, rgba(255, 240, 116, 0.68) 0%, rgba(255, 248, 206, 0.7) 29%, rgba(242, 245, 250, 0) 48%),
    url("/assets/homeai/source_survey_top_bg.png") top center / 100% auto no-repeat,
    #f2f5fa;
}

.onboarding-hero {
  display: grid;
  gap: 14px;
  padding: 64px 0 22px;
}

.onboarding-hero img {
  width: min(100%, 270px);
  height: auto;
}

.onboarding-hero strong {
  color: #101725;
  font-size: 24px;
  line-height: 1.42;
  letter-spacing: 0;
}

.onboarding-hero span {
  color: #536174;
  font-size: 14px;
  line-height: 1.45;
}

.text-button {
  position: absolute;
  top: 70px;
  left: 20px;
  z-index: 2;
  border: 0;
  color: #1b2638;
  background: transparent;
  font-weight: 850;
}

.text-button.skip {
  left: auto;
  right: 20px;
  font-size: 15px;
}

.role-question,
.source-question {
  display: grid;
  gap: 14px;
}

.role-card {
  min-height: 0;
  display: block;
  padding: 0;
  border: 0;
  border-radius: 18px;
  color: #111722;
  background: #fff;
  text-align: left;
  box-shadow: 0 12px 26px rgba(55, 76, 104, 0.08);
}

.role-card img {
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
}

.role-card span {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

.role-card svg {
  display: none;
}

.source-question button {
  min-height: 86px;
  display: grid;
  grid-template-columns: 50px 1fr 30px;
  gap: 16px;
  align-items: center;
  padding: 16px 18px;
  border: 0;
  border-radius: 18px;
  color: #111722;
  background: #fff;
  text-align: left;
  box-shadow: 0 12px 24px rgba(55, 76, 104, 0.07);
}

.source-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  color: #fff;
  background: var(--source-bg);
  font-size: 17px;
  font-weight: 950;
}

.source-question button:last-child .source-icon {
  color: #233047;
}

.source-question strong {
  font-size: 20px;
  line-height: 1.35;
  font-weight: 700;
}

.radio-dot {
  width: 25px;
  height: 25px;
  border: 2px solid #d8dde5;
  border-radius: 50%;
}

.source-question button.active .radio-dot {
  border: 7px solid #fff500;
  outline: 2px solid #111722;
}

.onboarding-actions {
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: 22px;
  display: grid;
  grid-template-columns: 0.72fr 1.56fr;
  gap: 14px;
}

.secondary-button,
.next-button {
  min-height: 66px;
  border: 0;
  border-radius: 33px;
  color: #121212;
  font-size: 21px;
  font-weight: 900;
}

.secondary-button {
  background: #fff;
}

.next-button {
  background: #fff500;
}

.next-button:disabled {
  color: #272727;
  background: #cfcfcf;
}

.guide-page {
  min-height: 0;
  position: relative;
  display: grid;
  grid-template-rows: 1fr auto 92px;
  overflow: hidden;
  background: #000;
}

.guide-visual {
  position: relative;
  isolation: isolate;
  min-height: 0;
  overflow: hidden;
}

.guide-poster {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.guide-visual::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  height: 46%;
  background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.72) 72%, #000 100%);
}

.original-badge {
  position: absolute;
  top: 154px;
  right: 24px;
  z-index: 4;
  width: 84px;
  overflow: hidden;
  border: 3px solid #fff;
  border-radius: 15px;
  background: #fff;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.2);
}

.original-badge img {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

.original-badge strong {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 3px 0 4px;
  color: #fff;
  background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.62));
  font-size: 18px;
  text-align: center;
}

.guide-copy {
  z-index: 1;
  display: grid;
  gap: 10px;
  padding: 0 24px 22px;
  color: #fff;
  text-align: center;
}

.guide-copy strong {
  font-size: 38px;
  line-height: 1.05;
}

.guide-copy span {
  font-size: 19px;
  font-weight: 900;
  line-height: 1.42;
}

.guide-next {
  align-self: start;
  min-height: 62px;
  margin: 0 20px;
  border: 0;
  border-radius: 31px;
  color: #161616;
  background: #fff500;
  font-size: 22px;
  font-weight: 900;
}

.page {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  padding: 18px 16px 24px;
}

.page-home {
  padding-top: 0;
  background: #edf5ff;
}

.native-home {
  display: grid;
  align-content: start;
  gap: 14px;
  padding: 12px 14px 96px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.84) 0%, rgba(237, 245, 255, 0.72) 42%, #f6f7fa 100%),
    url("/assets/homeai/page_bg_home.png") top center / cover no-repeat;
}

.home-native-head {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.member-pill {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0 13px;
  border: 0;
  border-radius: 19px;
  color: #2f250c;
  background: rgba(255, 236, 153, 0.92);
  font-size: 13px;
  font-weight: 900;
  box-shadow: 0 8px 18px rgba(144, 113, 34, 0.14);
}

.native-feature-list {
  display: grid;
  gap: 16px;
}

.native-feature-card {
  min-width: 0;
  overflow: hidden;
  padding: 0;
  border: 0;
  border-radius: 24px;
  color: #111722;
  background: #fff;
  text-align: left;
  box-shadow: 0 16px 30px rgba(52, 76, 108, 0.12);
}

.native-feature-media {
  position: relative;
  overflow: hidden;
  aspect-ratio: 1.32;
  background: #e7edf5;
}

.native-feature-media img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.compare-line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 3px;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 0 0 1px rgba(24, 35, 56, 0.08);
}

.compare-line::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 34px;
  height: 34px;
  transform: translate(-50%, -50%);
  border: 3px solid #fff;
  border-radius: 50%;
  background: rgba(17, 23, 34, 0.38);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.18);
}

.native-feature-card footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 15px 16px;
}

.native-feature-card footer > span:first-child {
  min-width: 0;
  display: grid;
  gap: 5px;
}

.native-feature-card strong {
  color: #121a2a;
  font-size: 20px;
  line-height: 1.2;
}

.native-feature-card small {
  overflow: hidden;
  color: #697688;
  font-size: 12px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.try-button {
  flex: 0 0 auto;
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0 12px;
  border-radius: 18px;
  color: #151515;
  background: #fff500;
  font-size: 13px;
  font-weight: 950;
}

.sticky-top {
  position: sticky;
  top: 0;
  z-index: 5;
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0 8px;
  transition: background 0.18s ease, box-shadow 0.18s ease;
}

.sticky-top.solid {
  background: rgba(244, 248, 253, 0.92);
  box-shadow: 0 8px 20px rgba(46, 85, 126, 0.12);
  backdrop-filter: blur(14px);
}

.sticky-top > img {
  width: 88px;
  height: auto;
}

.sticky-top button {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 10px 24px rgba(56, 93, 137, 0.14);
}

.sticky-top button img {
  width: 26px;
  height: 26px;
}

.hero-card {
  position: relative;
  min-height: 230px;
  overflow: hidden;
  border-radius: 22px;
  background: linear-gradient(135deg, #cbe5ff, #e5f8e9);
}

.hero-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.42;
}

.hero-copy {
  position: relative;
  z-index: 1;
  width: 68%;
  min-height: 230px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 10px;
  padding: 24px 20px;
}

.hero-copy p,
.page-title-row p {
  margin: 0;
  color: #41607f;
  font-size: 13px;
  font-weight: 850;
}

.hero-copy h1 {
  margin: 0;
  color: #13243f;
  font-size: 34px;
  line-height: 1.04;
}

.primary-button,
.bottom-action {
  min-height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  border-radius: 23px;
  color: #fff;
  background: linear-gradient(135deg, #235bff, #18b59b);
  font-weight: 900;
  box-shadow: 0 14px 24px rgba(35, 91, 255, 0.22);
}

.survey-strip,
.settings-shell,
.work-list {
  margin-top: 14px;
  display: grid;
  gap: 12px;
}

.survey-strip header,
.settings-shell > header,
.work-list h3 {
  margin: 0;
}

.survey-strip header span,
.settings-shell small {
  color: #63748a;
  font-size: 12px;
  font-weight: 800;
}

.survey-strip header strong {
  display: block;
  margin-top: 4px;
  color: #14233d;
  font-size: 18px;
}

.survey-strip > div {
  display: grid;
  gap: 9px;
}

.survey-strip button {
  display: block;
  padding: 0;
  border: 0;
  border-radius: 16px;
  color: #17304c;
  background: #fff;
  box-shadow: 0 12px 24px rgba(58, 89, 130, 0.1);
  overflow: hidden;
}

.survey-strip button img {
  display: block;
  width: 100%;
  height: auto;
}

.survey-strip button span {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

.feature-grid {
  display: grid;
  gap: 12px;
  margin-top: 14px;
}

.feature-card {
  min-height: 146px;
  display: grid;
  grid-template-columns: 112px 1fr;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border: 0;
  border-radius: 20px;
  color: #17243a;
  background: #fff;
  box-shadow: 0 16px 26px rgba(50, 80, 120, 0.12);
  text-align: left;
}

.feature-cover {
  width: 112px;
  height: 122px;
  border-radius: 16px;
  object-fit: cover;
  background: #e6edf5;
}

.feature-copy {
  min-width: 0;
  display: grid;
  gap: 7px;
}

.feature-copy strong {
  color: #111f35;
  font-size: 19px;
}

.feature-copy small,
.discover-card span,
.work-row span,
.result-preview span {
  color: #687a91;
  font-size: 13px;
  line-height: 1.45;
}

.feature-action {
  grid-column: 2;
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 16px;
  color: #fff;
  background: var(--accent);
  font-size: 13px;
  font-weight: 900;
}

.feature-action img {
  width: 18px;
  height: 18px;
}

.page-design {
  padding-bottom: 86px;
  background: linear-gradient(180deg, #f7fbff, #eaf2fb);
}

.page-assistant {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 0;
  padding: 12px 18px 18px;
  background: #f5f8fd;
}

.assistant-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 42px;
}

.assistant-header strong {
  font-size: 17px;
}

.assistant-new-button {
  border: 0;
  border-radius: 999px;
  padding: 8px 12px;
  color: #fff;
  background: #3478f6;
  font-size: 13px;
  font-weight: 800;
}

.assistant-chat {
  min-height: 0;
  overflow-y: auto;
  padding: 12px 0;
}

.assistant-empty {
  align-self: center;
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 30px 22px;
  text-align: center;
}

.assistant-empty > span {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  border-radius: 18px;
  color: #fff;
  background: #3478f6;
  font-size: 18px;
  font-weight: 900;
}

.assistant-empty h2 {
  margin: 0;
  font-size: 24px;
}

.assistant-empty p {
  margin: 0;
  color: #647089;
  font-size: 14px;
  line-height: 1.7;
}

.assistant-quick-list {
  width: 100%;
  display: grid;
  gap: 9px;
  margin-top: 12px;
}

.assistant-quick-list button {
  min-height: 40px;
  border: 1px solid rgba(52, 120, 246, 0.14);
  border-radius: 14px;
  color: #27344d;
  background: #fff;
  font-size: 13px;
  font-weight: 800;
}

.assistant-message-list {
  display: grid;
  gap: 12px;
  align-content: start;
  padding-bottom: 8px;
}

.assistant-message {
  max-width: 84%;
  display: grid;
  gap: 7px;
  padding: 11px 13px;
  border-radius: 18px;
  color: #20283a;
  background: #fff;
  box-shadow: 0 10px 24px rgba(32, 52, 82, 0.08);
}

.assistant-message.user {
  justify-self: end;
  color: #fff;
  background: #3478f6;
}

.assistant-message img {
  width: min(180px, 100%);
  border-radius: 12px;
  object-fit: cover;
}

.assistant-message p {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.55;
}

.assistant-message small {
  color: #d43131;
}

.assistant-composer {
  position: relative;
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) 56px;
  gap: 8px;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid rgba(101, 126, 153, 0.12);
}

.assistant-composer > button {
  min-height: 38px;
  border: 0;
  border-radius: 18px;
  color: #fff;
  background: #3478f6;
  font-size: 13px;
  font-weight: 900;
}

.assistant-composer > button:disabled {
  color: #97a3b7;
  background: #e1e7f0;
}

.assistant-composer > button:first-child {
  background: #fff;
  box-shadow: inset 0 0 0 1px rgba(52, 120, 246, 0.18);
}

.assistant-composer > button img {
  width: 19px;
  height: 19px;
}

.assistant-composer input {
  min-width: 0;
  min-height: 40px;
  border: 0;
  border-radius: 20px;
  padding: 0 14px;
  outline: 0;
  background: #fff;
  font-size: 14px;
  box-shadow: inset 0 0 0 1px rgba(101, 126, 153, 0.16);
}

.assistant-attachment-strip {
  grid-column: 1 / -1;
  display: flex;
  gap: 8px;
  overflow-x: auto;
}

.assistant-attachment-strip span {
  flex: 0 0 auto;
  width: 46px;
  height: 46px;
  overflow: hidden;
  border-radius: 12px;
  background: #fff;
}

.assistant-attachment-strip img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.page-header,
.page-title-row,
.profile-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.page-header {
  height: 48px;
}

.page-header strong {
  min-width: 0;
  overflow: hidden;
  font-size: 17px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.icon-button {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  color: #182338;
  background: #fff;
}

.step-indicator {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin: 8px 0 16px;
}

.step-indicator span {
  height: 5px;
  border-radius: 99px;
  background: #d5dee9;
}

.step-indicator span.active {
  background: #235bff;
}

.design-panel {
  min-height: 500px;
  display: grid;
  align-content: start;
  gap: 14px;
  padding: 16px;
  border-radius: 22px;
  background: #fff;
  box-shadow: 0 18px 32px rgba(49, 79, 120, 0.11);
}

.design-panel h2 {
  margin: 0;
  color: #13243b;
  font-size: 22px;
}

.design-panel p {
  margin: 0;
  color: #667892;
  line-height: 1.5;
}

.upload-art {
  width: 100%;
  aspect-ratio: 1.28;
  border-radius: 18px;
  object-fit: cover;
}

.upload-zone {
  min-height: 76px;
  display: grid;
  grid-template-columns: 42px 1fr;
  gap: 12px;
  align-items: center;
  padding: 14px;
  border: 1px dashed #8aa7c7;
  border-radius: 16px;
  color: #235bff;
  background: #f4f8ff;
  font-weight: 900;
  text-align: left;
}

.upload-zone img {
  width: 42px;
  height: 42px;
}

.guide-compare {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.guide-compare figure {
  margin: 0;
  overflow: hidden;
  border-radius: 14px;
  background: #eef3f8;
}

.guide-compare img {
  width: 100%;
  aspect-ratio: 1.12;
  object-fit: cover;
}

.guide-compare figcaption {
  padding: 8px;
  color: #44566e;
  font-size: 12px;
  font-weight: 850;
}

.chip-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.select-chip {
  min-height: 48px;
  border: 1px solid #d6e0ec;
  border-radius: 14px;
  color: #273a55;
  background: #f7faff;
  font-weight: 850;
}

.select-chip.active {
  border-color: #235bff;
  color: #fff;
  background: #235bff;
}

.tool-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-top: 4px;
}

.tool-button {
  min-height: 74px;
  display: grid;
  place-items: center;
  gap: 6px;
  border: 0;
  border-radius: 14px;
  color: #263a54;
  background: #f1f6fc;
  font-size: 12px;
  font-weight: 850;
}

.tool-button img {
  width: 28px;
  height: 28px;
}

.result-panel {
  text-align: center;
}

.detecting {
  justify-self: center;
  width: 128px;
  height: 128px;
  object-fit: contain;
}

.result-preview {
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border-radius: 16px;
  background: #f4f8ff;
  text-align: left;
}

.result-preview img {
  width: 96px;
  height: 96px;
  border-radius: 14px;
  object-fit: cover;
}

.result-preview div {
  min-width: 0;
  display: grid;
  gap: 5px;
}

.bottom-action {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 18px;
}

.page-discover,
.page-mine {
  background: #f6f8fb;
}

.page-title-row {
  padding: 8px 0 14px;
}

.page-title-row h2 {
  margin: 4px 0 0;
  color: #13243b;
  font-size: 24px;
}

.page-title-row img {
  width: 92px;
  height: 92px;
  border-radius: 18px;
  object-fit: cover;
}

.category-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 10px;
}

.category-tabs button {
  flex: 0 0 auto;
  min-height: 36px;
  padding: 0 14px;
  border: 0;
  border-radius: 18px;
  color: #44566e;
  background: #e9eff6;
  font-weight: 850;
}

.category-tabs button.active {
  color: #fff;
  background: #182338;
}

.discover-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.discover-card {
  min-width: 0;
  display: grid;
  gap: 7px;
  padding: 9px;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 12px 22px rgba(51, 78, 112, 0.1);
}

.discover-card img {
  width: 100%;
  aspect-ratio: 0.86;
  border-radius: 13px;
  object-fit: cover;
}

.discover-card strong {
  min-width: 0;
  overflow: hidden;
  color: #14233d;
  font-size: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-head {
  padding: 14px;
  border-radius: 20px;
  color: #fff;
  background: linear-gradient(135deg, #1b2b46, #244d82);
}

.profile-head > img {
  width: 58px;
  height: 58px;
  border-radius: 16px;
}

.profile-head div {
  min-width: 0;
  flex: 1;
}

.profile-head h2,
.profile-head p {
  margin: 0;
}

.profile-head p {
  margin-top: 5px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
}

.profile-head > span {
  flex: 0 0 auto;
  padding: 7px 10px;
  border-radius: 13px;
  color: #2a220f;
  background: #ffe092;
  font-size: 12px;
  font-weight: 900;
}

.vip-card {
  position: relative;
  min-height: 124px;
  overflow: hidden;
  margin-top: 12px;
  border-radius: 20px;
  color: #3f2c12;
}

.vip-card > img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.vip-card div {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 7px;
  padding: 18px;
}

.vip-card div img {
  width: 96px;
}

.vip-card strong {
  font-size: 23px;
}

.settings-shell {
  padding: 14px;
  border-radius: 20px;
  background: #fff;
}

.settings-shell > header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.settings-shell h2 {
  margin: 0;
}

.settings-error {
  margin: 0;
  padding: 10px;
  border-radius: 10px;
  color: #9d2b2b;
  background: #fff0f0;
  font-size: 12px;
  line-height: 1.5;
}

.work-list {
  padding-bottom: 6px;
}

.work-row {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 12px;
  align-items: center;
  padding: 10px;
  border-radius: 16px;
  background: #fff;
}

.work-row img {
  width: 72px;
  height: 72px;
  border-radius: 13px;
  object-fit: cover;
}

.work-row div {
  min-width: 0;
  display: grid;
  gap: 5px;
}

.work-row strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bottom-nav {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  border-top: 1px solid rgba(101, 126, 153, 0.14);
  background: rgba(255, 255, 255, 0.95);
}

.bottom-nav button {
  min-width: 0;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 4px;
  border: 0;
  color: #8190a4;
  background: transparent;
  font-size: 11px;
  font-weight: 850;
}

.bottom-nav button.active {
  color: #235bff;
}

.bottom-nav img {
  width: 24px;
  height: 24px;
}

.toast-message {
  position: fixed;
  left: 50%;
  bottom: 28px;
  z-index: 20;
  max-width: min(360px, calc(100vw - 36px));
  transform: translateX(-50%);
  margin: 0;
  padding: 11px 14px;
  border-radius: 16px;
  color: #fff;
  background: rgba(20, 28, 42, 0.92);
  font-size: 13px;
  font-weight: 800;
  box-shadow: 0 12px 24px rgba(10, 20, 35, 0.22);
}

.toast-message.error {
  background: rgba(151, 34, 34, 0.92);
}

@media (max-width: 520px) {
  .app-frame {
    padding: 0;
  }

  .phone-shell {
    width: 100vw;
    height: 100vh;
    min-height: 0;
    border: 0;
    border-radius: 0;
  }

  .onboarding-page {
    padding-right: 16px;
    padding-left: 16px;
  }

  .hero-copy {
    width: 76%;
  }
}
</style>
