<template>
  <ReplicaProxyLifecycleOverlay v-if="apiDebugPage" page-mode />

  <main v-else class="app-frame">
    <section class="phone-shell" :class="{ 'entry-gate': entryGateVisible }" aria-label="装修 APP H5 复刻">
      <header class="status-bar">
        <span>9:41</span>
        <span class="status-icons">5G 100%</span>
      </header>

      <section v-if="entryGateVisible" class="entry-login-page">
        <button type="button" class="entry-back" aria-label="返回首页" @click="dismissEntryGate">
          <ChevronLeft :size="28" />
        </button>
        <section class="entry-brand">
          <img :src="homeAiAssets.appLogo" alt="" />
          <span>
            <strong>AI装修大师</strong>
            <small>看见家的千万种可能</small>
          </span>
        </section>
        <section v-if="entryLoginStep === 'phone'" class="entry-login-step">
          <label class="entry-phone-field">
            <span>+86</span>
            <input v-model.trim="entryPhone" type="tel" inputmode="numeric" maxlength="11" placeholder="请输入手机号" />
          </label>
          <button type="button" class="entry-login-button" :disabled="!canSubmitEntryLogin" @click="sendEntrySmsCode">
            {{ entrySendingCode ? '发送中...' : '验证码登录' }}
          </button>
          <label class="entry-agreement">
            <input v-model="entryAgreementChecked" type="checkbox" />
            <span>我已阅读并同意「AI装修大师」的</span>
            <button type="button" @click="showToast('已打开用户协议')">用户协议</button>
            <span>和</span>
            <button type="button" @click="showToast('已打开隐私政策')">隐私政策</button>
          </label>
        </section>

        <section v-else class="entry-login-step entry-code-step">
          <p>验证码已发送至 +86 {{ maskedEntryPhone }}</p>
          <label class="entry-code-field" aria-label="短信验证码">
            <input v-model.trim="entrySmsCode" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="请输入验证码" />
            <span v-for="index in 6" :key="index">{{ entrySmsCodeDigits[index - 1] }}</span>
          </label>
          <button type="button" class="entry-login-button" :disabled="!canSubmitEntryLogin" @click="loginWithEntrySmsCode">
            {{ entryLoggingIn ? '登录中...' : '登录' }}
          </button>
          <button type="button" class="entry-resend-button" :disabled="entrySendingCode" @click="sendEntrySmsCode">
            {{ entrySendingCode ? '重新发送中...' : '重新发送' }}
          </button>
        </section>
        <section class="entry-other-login" aria-label="其他登录方式">
          <span>其他登录方式</span>
          <button type="button" class="entry-wechat-button" @click="submitWechatLogin">
            <span class="entry-wechat-icon">微</span>
            <small>微信登录</small>
          </button>
        </section>
      </section>

      <section v-else class="screen">
        <section v-if="activeTab === 'home'" class="page page-home native-home" @scroll.passive="isScrolled = true">
          <header class="home-native-head">
            <div class="home-brand">
              <strong>AI装修大师</strong>
              <span>看见家的千万种可能</span>
            </div>
            <button type="button" class="member-pill" @click="activeTab = 'mine'">
              <img :src="homeAiAssets.vipSmallIcon" alt="" />
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
          <header class="page-header" :class="{ 'upload-title': currentStep === 'upload' }">
            <button class="icon-button" type="button" aria-label="返回首页" @click="activeTab = 'home'">
              <ChevronLeft :size="20" />
            </button>
            <strong>{{ currentStep === 'upload' ? '第一步' : selectedFeature.title }}</strong>
            <button class="icon-button" type="button" aria-label="重置设计" @click="resetDesign">
              <X :size="18" />
            </button>
          </header>

          <div class="step-indicator">
            <span v-for="(_, index) in designSteps" :key="index" :class="{ active: index <= designStep }"></span>
          </div>

          <section v-if="currentStep === 'upload'" class="design-panel upload-panel">
            <h2>上传照片,AI生成设计方案</h2>
            <button class="upload-dropzone" type="button" @click="mockUpload">
              <span class="upload-plus">+</span>
              <strong>{{ selectedImageName || '上传图片' }}</strong>
            </button>
            <section class="sample-strip" aria-label="参考示例">
              <h3>参考示例</h3>
              <div>
                <figure v-for="item in uploadExamples" :key="item.id">
                  <span>免费</span>
                  <img :src="item.coverUrl" alt="" />
                </figure>
              </div>
            </section>
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
            <h2>{{ generationTitle }}</h2>
            <p>{{ generationSubtitle }}</p>
            <div class="result-preview">
              <img :src="selectedFeature.guideImage" alt="" />
              <div>
                <strong>{{ generationCardTitle }}</strong>
                <span>{{ generationCardSubtitle }}</span>
              </div>
            </div>
          </section>

          <button class="bottom-action" :disabled="bottomActionDisabled" type="button" @click="nextDesignStep">
            {{ bottomActionLabel }}
          </button>
        </section>

        <section v-else-if="activeTab === 'discover'" class="page page-discover">
          <header class="discover-native-head">
            <h1>发现</h1>
          </header>
          <div class="discover-segment">
            <button
              v-for="tab in snapshot.discoverTabs"
              :key="tab.key"
              :class="{ active: tab.key === activeDiscoverTab }"
              type="button"
              @click="activeDiscoverTab = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>
          <section v-if="snapshotLoading" class="state-card">
            <strong>发现内容加载中</strong>
            <span>正在根据当前环境同步推荐内容，请稍候。</span>
          </section>
          <section v-else-if="activeDiscoverSections.length > 0" class="discover-shelves">
            <article v-for="section in activeDiscoverSections" :key="section.key" class="discover-shelf">
              <header>
                <h2>{{ section.title }}</h2>
                <button type="button" @click="openDiscoverSection(section.key)">查看全部</button>
              </header>
              <div>
                <img v-for="item in section.items" :key="item.id" :src="item.coverUrl" :alt="item.title" />
              </div>
            </article>
          </section>
          <section v-else class="state-card">
            <strong>暂无服务端推荐内容</strong>
            <span>当前实时接口没有返回发现页数据，已按空态展示。</span>
          </section>
        </section>

        <section v-else class="page page-mine native-mine">
          <header class="mine-profile" :class="{ 'logged-out': !isLoggedIn }">
            <img :src="homeAiAssets.defaultAvatar" alt="" />
            <div>
              <h2>{{ isLoggedIn ? snapshot.user.nickname : '点击登录' }}</h2>
              <button v-if="isLoggedIn" type="button" @click="openOverlay('diamond')">
                <img :src="homeAiAssets.diamond" alt="" />
                {{ snapshot.user.diamondCount }}钻石
                <span>查看明细</span>
              </button>
              <button v-else type="button" class="login-summary" @click="promptLogin">登录后获取更多功能信息</button>
            </div>
            <button v-if="isLoggedIn" type="button" class="mine-icon" aria-label="充值钻石" @click="openOverlay('diamond')">
              <Gem :size="18" />
            </button>
            <button type="button" class="mine-icon" aria-label="设置" @click="openOverlay('settings')">
              <Settings :size="18" />
            </button>
          </header>

          <section class="mine-vip-card">
            <header>
              <strong>超多会员特权等你体验</strong>
              <button type="button" @click="openOverlay('vip')">立即开通</button>
            </header>
            <div>
              <article v-for="(privilege, index) in vipPrivileges" :key="privilege.label">
                <img :src="homeAiAssets.vipPrivileges[index]" alt="" />
                <span>{{ privilege.label }}</span>
              </article>
            </div>
          </section>

          <section class="mine-shortcuts" aria-label="快捷入口">
            <button type="button" @click="openOverlay('invite')">
              <img :src="homeAiAssets.inviteCardBg" alt="" />
              <span>邀请好友</span>
            </button>
            <button type="button" @click="openOverlay('questionnaire')">
              <img :src="homeAiAssets.questionnaireIcon" alt="" />
              <span>用户问卷</span>
            </button>
          </section>

          <section class="work-list native-work-list">
            <h3>作品</h3>
            <section v-if="snapshotLoading" class="state-card compact">
              <strong>作品列表加载中</strong>
              <span>正在同步生成记录与账户信息。</span>
            </section>
            <section v-else-if="snapshot.works.length === 0" class="mine-empty-state" :class="{ 'logged-out': !isLoggedIn }">
              <template v-if="!isLoggedIn">
                <strong>当前账号未登录</strong>
                <button type="button" @click="promptLogin">点击登录</button>
              </template>
              <strong v-else>这里什么都没有</strong>
            </section>
            <template v-else>
              <article v-for="work in snapshot.works" :key="work.id" class="work-row">
                <img :src="work.coverUrl" alt="" />
                <div>
                  <strong>{{ work.title }}</strong>
                  <span>{{ work.status }} · {{ work.createdAt || '今天' }}</span>
                </div>
              </article>
            </template>
          </section>
        </section>
      </section>

      <nav v-if="!entryGateVisible" class="bottom-nav">
        <button v-for="tab in tabs" :key="tab.key" type="button" :class="{ active: activeTab === tab.key }" @click="activeTab = tab.key">
          <img :src="tab.icon" alt="" />
          <span>{{ tab.label }}</span>
        </button>
      </nav>

      <section v-if="overlayView !== 'none'" class="native-overlay" role="dialog" aria-modal="true">
        <section class="native-sheet">
          <header>
            <button type="button" class="sheet-close" aria-label="关闭" @click="closeOverlay">
              <ChevronLeft :size="20" />
            </button>
            <strong>{{ overlayTitle }}</strong>
            <span></span>
          </header>

          <section v-if="overlayView === 'discoverList'" class="discover-list-page">
            <article v-for="item in selectedDiscoverItems" :key="item.id">
              <img :src="item.coverUrl" :alt="item.title" />
              <span>{{ item.title }}</span>
            </article>
            <p v-if="selectedDiscoverItems.length === 0">暂无服务端推荐内容</p>
          </section>

          <section v-else-if="overlayView === 'diamond'" class="diamond-page">
            <div class="diamond-balance">
              <img :src="homeAiAssets.diamond" alt="" />
              <strong>{{ snapshot.user.diamondCount }}</strong>
              <span>当前钻石</span>
            </div>
            <button v-if="demoMode" type="button" class="yellow-action" @click="selectDiamondPack">充值 60 钻石</button>
            <section class="plain-list">
              <h3>明细</h3>
              <p>{{ demoMode ? '暂无钻石变动记录' : '暂无服务端钻石明细或充值套餐数据' }}</p>
            </section>
          </section>

          <section v-else-if="overlayView === 'vip'" class="vip-page">
            <img class="vip-page-logo" :src="homeAiAssets.vipFontLogo" alt="AI装修大师 VIP" />
            <section v-if="vipLoading" class="plain-list">
              <h3>会员方案加载中</h3>
              <p>正在读取服务端售卖单元商品列表。</p>
            </section>
            <section v-else-if="vipError" class="plain-list">
              <h3>会员方案加载失败</h3>
              <p>{{ vipError }}</p>
              <button type="button" class="yellow-action" @click="void reloadVipPlans()">重试</button>
            </section>
            <template v-else-if="currentVipPlans.length > 0">
              <div class="vip-plan-list">
              <button
                v-for="plan in currentVipPlans"
                :key="plan.key"
                type="button"
                :class="{ active: selectedVipPlan === plan.key }"
                @click="selectedVipPlan = plan.key"
              >
                <strong>{{ plan.label }}</strong>
                <span>
                  {{ plan.price }}
                  <small v-if="plan.originalPrice">{{ plan.originalPrice }}</small>
                </span>
              </button>
              </div>
              <section class="vip-benefit-list">
                <article v-for="(privilege, index) in vipPrivileges" :key="privilege.label">
                  <img :src="homeAiAssets.vipPrivileges[index]" alt="" />
                  <span>{{ privilege.label }}</span>
                </article>
              </section>
              <button type="button" class="yellow-action" @click="confirmVipPlan">立即开通</button>
            </template>
            <section v-else class="plain-list">
              <h3>暂无服务端会员方案</h3>
              <p>当前实时接口没有返回可购买商品。</p>
            </section>
          </section>

          <section v-else-if="overlayView === 'invite'" class="invite-page">
            <img :src="homeAiAssets.inviteCardBg" alt="" />
            <h2>邀请好友一起装修设计</h2>
            <p>{{ demoMode ? '好友通过邀请进入后，可一起查看 AI 装修灵感和设计结果。' : '暂无服务端邀请配置，未生成本地模拟海报。' }}</p>
            <button v-if="demoMode" type="button" class="yellow-action" @click="showToast('邀请海报已生成')">生成邀请海报</button>
          </section>

          <section v-else-if="overlayView === 'questionnaire'" class="questionnaire-page">
            <template v-if="demoMode">
              <article v-for="question in questionnaire" :key="question.key">
                <h3>{{ question.title }}</h3>
                <div>
                  <button
                    v-for="option in question.options"
                    :key="option"
                    type="button"
                    :class="{ active: questionnaireAnswers[question.key] === option }"
                    @click="questionnaireAnswers[question.key] = option"
                  >
                    {{ option }}
                  </button>
                </div>
              </article>
              <button type="button" class="yellow-action" @click="submitQuestionnaire">提交问卷</button>
            </template>
            <section v-else class="plain-list">
              <h3>暂无服务端问卷配置</h3>
              <p>当前实时接口没有返回问卷题目，未展示本地模拟选项。</p>
            </section>
          </section>

          <section v-else class="settings-page">
            <button type="button" @click="showToast('已打开用户服务协议')">用户服务协议</button>
            <button type="button" @click="showToast('已打开隐私政策')">隐私政策</button>
            <button type="button" @click="resetLocalExperience">恢复首启体验</button>
          </section>
        </section>
      </section>
    </section>

    <p v-if="toastMessage" class="toast-message" :class="toastKind">{{ toastMessage }}</p>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { ChevronLeft, Gem, Settings, WandSparkles, X } from 'lucide-vue-next';
import {
  createSmsAuthClient,
  createReplicaSession,
  persistReplicaAuthToken,
  persistReplicaEnvironment,
  type ReplicaEnvironment,
} from '@wmxs/h5-replica-common/client';
import { ReplicaProxyLifecycleOverlay } from '@wmxs/h5-replica-common/ui';
import { homeAiReplicaConfig } from '../../app.config';
import { homeAiAssets } from '../shared/assets';
import { demoSnapshot, liveSnapshot } from '../shared/demoData';
import { createHomeAiVipOrder, loadHomeAiSnapshot, loadHomeAiVipPlans } from '../shared/homeaiApi';
import { buildHomeAiHashRoute, getFeatureNativePath, parseHomeAiHashRoute } from '../shared/navigation';
import type { DesignFeature, HomeAiApiState, HomeAiSnapshot, HomeAiVipPlan, MainTab } from '../shared/types';

const API_DEBUG_HASH = '#/api-debug';
const DEMO_QUERY_PARAM = '__homeai_demo';
const ENTRY_GATE_STORAGE_KEY = `${homeAiReplicaConfig.appId}:entry-gate-dismissed`;
type EntryLoginStep = 'phone' | 'code';
const resetParams = new URLSearchParams(window.location.search);
if (resetParams.get('__homeai_reset') === '1') {
  // 本地复刻对比时需要反复回到 APK 当前首屏；顺手清理旧首启链路遗留状态，避免影响本轮对照。
  localStorage.removeItem(ENTRY_GATE_STORAGE_KEY);
  localStorage.removeItem(`${homeAiReplicaConfig.appId}:privacy-accepted`);
  localStorage.removeItem(`${homeAiReplicaConfig.appId}:onboarding-complete`);
  localStorage.removeItem(`${homeAiReplicaConfig.appId}:guide-complete`);
  resetParams.delete('__homeai_reset');
  const nextSearch = resetParams.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`);
}
const session = createReplicaSession(homeAiReplicaConfig.appId);
const smsAuthClient = createSmsAuthClient(homeAiReplicaConfig);
const explicitDemoMode = resetParams.get(DEMO_QUERY_PARAM) === '1';
type OverlayView = 'none' | 'discoverList' | 'diamond' | 'vip' | 'invite' | 'questionnaire' | 'settings';

const activeTab = ref<MainTab>('home');
const environment = ref<ReplicaEnvironment>(session.environment);
const demoMode = ref(explicitDemoMode);
const authTokenDraft = ref(session.authToken);
const snapshot = ref<HomeAiSnapshot>(structuredClone(demoMode.value ? demoSnapshot : liveSnapshot));
const apiState = ref<HomeAiApiState>({
  mode: demoMode.value ? 'demo' : 'live',
  environmentLabel: environment.value,
  lastError: '',
});
const apiDebugPage = ref(window.location.hash === API_DEBUG_HASH);
const toastMessage = ref('');
const toastKind = ref<'notice' | 'error'>('notice');
const snapshotLoading = ref(false);
const isScrolled = ref(false);
const entryGateVisible = ref(localStorage.getItem(ENTRY_GATE_STORAGE_KEY) !== '1');
const entryLoginStep = ref<EntryLoginStep>('phone');
const entryPhone = ref('');
const entrySmsCode = ref('');
const entrySmsId = ref('');
const entrySmsPhone = ref('');
const entryAgreementChecked = ref(false);
const entrySendingCode = ref(false);
const entryLoggingIn = ref(false);
const selectedFeatureCode = ref('interior');
const designStep = ref(0);
const selectedImageName = ref('');
const selectedStyle = ref('现代简约');
const activeDiscoverTab = ref<'interior' | 'exterior'>('interior');
const generationPhase = ref<'idle' | 'queued' | 'processing' | 'done'>('idle');
const overlayView = ref<OverlayView>('none');
const selectedDiscoverSectionKey = ref('');
const selectedVipPlan = ref('monthly');
const liveVipPlans = ref<HomeAiVipPlan[]>([]);
const vipLoading = ref(false);
const vipError = ref('');
const questionnaireAnswers = ref<Record<string, string>>({});
let generationPhaseTimer: number | null = null;

const designSteps = ['upload', 'style', 'result'] as const;
const styles = ['现代简约', '奶油风', '新中式', '原木风', '轻奢', '工业风'];
const designTools = [
  { label: '涂抹', icon: homeAiAssets.paint },
  { label: '换色', icon: homeAiAssets.color },
  { label: '材质', icon: homeAiAssets.texture },
  { label: '擦除', icon: homeAiAssets.erase },
];
const vipPrivileges = [
  { label: '高品质作品' },
  { label: '免排队加速' },
  { label: '无广告' },
];
const demoVipPlans: HomeAiVipPlan[] = [
  { key: 'monthly', label: '月度会员', price: '¥18' },
  { key: 'quarterly', label: '季度会员', price: '¥45' },
  { key: 'yearly', label: '年度会员', price: '¥128' },
].map((plan) => ({ ...plan, originalPrice: '', tokenCount: 0, channelCode: 'demo', paymentOptions: [] }));
const questionnaire = [
  { key: 'role', title: '你的装修身份', options: ['业主', '设计师', '先看看'] },
  { key: 'space', title: '最想设计的空间', options: ['卧室', '客厅', '厨房'] },
  { key: 'style', title: '偏好的装修风格', options: ['现代简约', '奶油风', '新中式'] },
];

const tabs = computed(() => [
  { key: 'home' as const, label: '首页', icon: activeTab.value === 'home' ? homeAiAssets.tabs.home[1] : homeAiAssets.tabs.home[0] },
  { key: 'design' as const, label: '设计', icon: activeTab.value === 'design' ? homeAiAssets.tabs.design[1] : homeAiAssets.tabs.design[0] },
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
const isLoggedIn = computed(() => Boolean(snapshot.value.user.userId));
const homeCards = computed(() =>
  // 首页入口复用各功能的装修参考图，避免误用 APK 中其他功能域的演示素材。
  snapshot.value.features.map((feature) => ({
    ...feature,
    image: feature.homeImage ?? feature.guideImage,
  })),
);
const canSubmitEntryPhone = computed(() => entryAgreementChecked.value && /^\d{11}$/.test(entryPhone.value));
const canSubmitEntryCode = computed(() => /^\d{6}$/.test(entrySmsCode.value) && Boolean(entrySmsId.value) && entrySmsPhone.value === entryPhone.value);
const canSubmitEntryLogin = computed(() =>
  entryLoginStep.value === 'phone' ? canSubmitEntryPhone.value && !entrySendingCode.value : canSubmitEntryCode.value && !entryLoggingIn.value,
);
const entrySmsCodeDigits = computed(() => entrySmsCode.value.padEnd(6, ' ').slice(0, 6).split('').map((item) => (item === ' ' ? '' : item)));
const maskedEntryPhone = computed(() => formatEntryPhone(entrySmsPhone.value || entryPhone.value));
const currentStep = computed(() => designSteps[designStep.value]);
const canAdvanceDesignStep = computed(() => {
  if (currentStep.value === 'upload') {
    return Boolean(selectedImageName.value);
  }
  if (currentStep.value === 'result') {
    return generationPhase.value === 'done';
  }
  return true;
});
const bottomActionDisabled = computed(() => currentStep.value === 'result' && generationPhase.value !== 'done');
const bottomActionLabel = computed(() => {
  if (designStep.value === designSteps.length - 1) {
    return generationPhase.value === 'done' ? '再做一张' : '生成中...';
  }
  return '下一步';
});
const uploadExamples = computed(() => [
  { id: 'current-guide', coverUrl: selectedFeature.value.guideImage },
  { id: 'current-bad', coverUrl: selectedFeature.value.badImage ?? homeAiAssets.typeCards.compare },
  { id: 'living-room', coverUrl: homeAiAssets.guide.interiorBad },
  { id: 'kitchen', coverUrl: homeAiAssets.guide.floorPlanGood },
]);
const generationTitle = computed(() => {
  if (generationPhase.value === 'queued') {
    return '正在创建生成任务';
  }
  if (generationPhase.value === 'processing') {
    return 'AI 正在生成装修方案';
  }
  if (generationPhase.value === 'done') {
    return '方案已生成，可继续下一轮';
  }
  return 'AI 正在生成装修方案';
});
const generationSubtitle = computed(() => {
  if (generationPhase.value === 'queued') {
    return `${selectedFeature.value.title} · ${selectedStyle.value} · 正在排队`;
  }
  if (generationPhase.value === 'processing') {
    return `${selectedFeature.value.title} · ${selectedStyle.value} · 正在渲染`;
  }
  return `${selectedFeature.value.title} · ${selectedStyle.value} · 可重新发起体验`;
});
const generationCardTitle = computed(() => {
  if (generationPhase.value === 'queued') {
    return '任务已进入队列';
  }
  if (generationPhase.value === 'processing') {
    return '正在生成装修效果';
  }
  return '结果预览已就绪';
});
const generationCardSubtitle = computed(() => {
  if (generationPhase.value === 'done') {
    return '真实生成接口可在 Network 面板中继续对照请求参数与时机。';
  }
  return '当前为 H5 演示态，真实生成接口可在 Network 面板中对照代理请求。';
});
const activeDiscoverSections = computed(() => {
  // 发现页 APK 以室内/外观分段和横向图库为主，保留 tab key 兜底可避免接口异常导致空白。
  return snapshot.value.discoverTabs.find((tab) => tab.key === activeDiscoverTab.value)?.sections ?? snapshot.value.discoverTabs[0]?.sections ?? [];
});
const currentVipPlans = computed(() => (demoMode.value ? demoVipPlans : liveVipPlans.value));
const selectedVipPlanDetail = computed(() => currentVipPlans.value.find((item) => item.key === selectedVipPlan.value) ?? currentVipPlans.value[0]);
const selectedDiscoverSection = computed(() => activeDiscoverSections.value.find((section) => section.key === selectedDiscoverSectionKey.value));
const selectedDiscoverItems = computed(() => selectedDiscoverSection.value?.items ?? activeDiscoverSections.value.flatMap((section) => section.items));
const overlayTitle = computed(() => {
  if (overlayView.value === 'discoverList') {
    return selectedDiscoverSection.value?.title ?? '发现';
  }
  if (overlayView.value === 'diamond') {
    return '钻石明细';
  }
  if (overlayView.value === 'vip') {
    return 'AI装修大师 VIP';
  }
  if (overlayView.value === 'invite') {
    return '邀请好友';
  }
  if (overlayView.value === 'questionnaire') {
    return '用户问卷';
  }
  return '设置';
});

function persistEnvironment() {
  persistReplicaEnvironment(homeAiReplicaConfig.appId, environment.value);
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

function clearGenerationPhaseTimer() {
  if (generationPhaseTimer !== null) {
    window.clearTimeout(generationPhaseTimer);
    generationPhaseTimer = null;
  }
}

function startGenerationPreview() {
  // 复刻 APK 的排队、生成、完成节奏，便于和真实接口时机逐步对齐。
  clearGenerationPhaseTimer();
  generationPhase.value = 'queued';
  console.info('[HomeAI App] 进入生成预览态', { featureCode: selectedFeatureCode.value, style: selectedStyle.value });
  generationPhaseTimer = window.setTimeout(() => {
    generationPhase.value = 'processing';
    generationPhaseTimer = window.setTimeout(() => {
      generationPhase.value = 'done';
      generationPhaseTimer = null;
    }, 900);
  }, 700);
}

function applyHashRoute() {
  // 启动引导和 Network 调试页由独立流程接管，避免普通页面状态覆盖当前 hash。
  const nextHash = buildHomeAiHashRoute(
    activeTab.value === 'design'
      ? { page: 'design', featureCode: selectedFeatureCode.value, nativePath: getFeatureNativePath(selectedFeatureCode.value) }
      : activeTab.value === 'discover'
        ? { page: 'discover' }
        : activeTab.value === 'mine'
          ? { page: 'mine' }
          : { page: 'home' },
  );
  if (window.location.hash === nextHash || apiDebugPage.value || entryGateVisible.value) {
    return;
  }
  console.info('[HomeAI App] 同步页面路由', { tab: activeTab.value, hash: nextHash });
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${nextHash}`);
}

function syncStateFromHash() {
  // 支持从 APK 抓到的原生 hash 直接落到 H5 对应页面，方便逐入口对照。
  const route = parseHomeAiHashRoute(window.location.hash);
  apiDebugPage.value = route.page === 'api-debug';
  if (route.page === 'discover') {
    activeTab.value = 'discover';
    return;
  }
  if (route.page === 'mine') {
    activeTab.value = 'mine';
    return;
  }
  if (route.page === 'design') {
    selectedFeatureCode.value = route.featureCode ?? 'interior';
    activeTab.value = 'design';
    return;
  }
  activeTab.value = 'home';
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

function promptLogin() {
  // 未登录状态点击“我的”登录入口时重新打开短信登录门面，保证 H5 也能执行完整登录链路。
  entryLoginStep.value = 'phone';
  entrySmsCode.value = '';
  entrySmsId.value = '';
  entrySmsPhone.value = '';
  entryGateVisible.value = true;
  localStorage.removeItem(ENTRY_GATE_STORAGE_KEY);
  console.info('[HomeAI App] 点击未登录入口，打开短信登录门面', { page: 'mine' });
  showToast('请使用验证码登录后继续体验账号功能');
}

function openOverlay(view: OverlayView) {
  overlayView.value = view;
  if (view === 'vip' && !demoMode.value) {
    void reloadVipPlans();
  }
}

function closeOverlay() {
  overlayView.value = 'none';
}

function openDiscoverSection(sectionKey: string) {
  selectedDiscoverSectionKey.value = sectionKey;
  openOverlay('discoverList');
}

function selectDiamondPack() {
  // 复刻充值入口的正向反馈，不在本地伪造真实余额，避免和账号数据产生冲突。
  showToast('已选择 60 钻石充值包');
}

async function reloadVipPlans() {
  if (demoMode.value || vipLoading.value) {
    return;
  }
  vipLoading.value = true;
  vipError.value = '';
  try {
    const plans = await loadHomeAiVipPlans({
      authToken: authTokenDraft.value,
      environment: environment.value,
    });
    liveVipPlans.value = plans;
    selectedVipPlan.value = plans[0]?.key ?? '';
    console.info('[HomeAI App] 已加载服务端 VIP 商品', { count: plans.length, firstGoodsCode: plans[0]?.key ?? '' });
  } catch (error) {
    vipError.value = error instanceof Error ? error.message : '会员方案接口请求失败';
    liveVipPlans.value = [];
    console.warn('[HomeAI App] VIP 商品加载失败', { message: vipError.value });
  } finally {
    vipLoading.value = false;
  }
}

async function confirmVipPlan() {
  const plan = selectedVipPlanDetail.value;
  if (!plan) {
    showToast('暂无可开通的会员方案');
    return;
  }
  if (demoMode.value) {
    showToast(`已选择${plan.label}方案`);
    return;
  }
  const paymentOption = plan.paymentOptions[0];
  if (!paymentOption) {
    showToast('当前会员方案没有可用支付方式');
    return;
  }
  try {
    await createHomeAiVipOrder(
      {
        authToken: authTokenDraft.value,
        environment: environment.value,
      },
      plan,
      paymentOption,
    );
    showToast(`已创建${plan.label}订单`);
  } catch (error) {
    showToast(error instanceof Error ? `创建订单失败：${error.message}` : '创建订单失败');
  }
}

function submitQuestionnaire() {
  const answeredCount = questionnaire.filter((question) => questionnaireAnswers.value[question.key]).length;
  if (answeredCount < questionnaire.length) {
    showToast('请完成问卷后再提交');
    return;
  }
  showToast('问卷已提交');
  closeOverlay();
}

function resetLocalExperience() {
  localStorage.removeItem(ENTRY_GATE_STORAGE_KEY);
  entryPhone.value = '';
  entrySmsCode.value = '';
  entrySmsId.value = '';
  entrySmsPhone.value = '';
  entryLoginStep.value = 'phone';
  entryAgreementChecked.value = false;
  entryGateVisible.value = true;
  closeOverlay();
}

function dismissEntryGate() {
  // 当前 APK 可从登录页返回首页浏览；H5 同步持久化该状态，避免每次切 tab 都重回首屏门面。
  localStorage.setItem(ENTRY_GATE_STORAGE_KEY, '1');
  entryGateVisible.value = false;
  console.info('[HomeAI App] 已关闭登录门面，进入首页浏览');
  applyHashRoute();
}

function formatEntryPhone(phoneNumber: string) {
  // 验证码页只展示首尾号段，避免自动化截图或录屏暴露完整手机号。
  return phoneNumber.replace(/^(\d{3})\d{4}(\d{4})$/, '$1 **** $2');
}

async function sendEntrySmsCode() {
  if (!entryAgreementChecked.value) {
    showToast('请先勾选用户协议和隐私政策');
    return;
  }
  if (!/^\d{11}$/.test(entryPhone.value)) {
    showToast('请输入 11 位手机号');
    return;
  }
  entrySendingCode.value = true;
  try {
    const response = await smsAuthClient.sendCode(entryPhone.value);
    entrySmsId.value = response.smsId ?? '';
    entrySmsPhone.value = entryPhone.value;
    // 内部测试环境可能直接返回验证码，只回填本地输入态，不进入日志、报告或持久化存储。
    entrySmsCode.value = response.smsCode ?? '';
    entryLoginStep.value = 'code';
    console.info('[HomeAI App] 已触发短信验证码登录', {
      hasSmsId: Boolean(entrySmsId.value),
      phoneTail: entryPhone.value.slice(-4),
    });
    showToast('验证码已发送');
  } catch (error) {
    showToast(error instanceof Error ? `发送验证码失败：${error.message}` : '发送验证码失败');
  } finally {
    entrySendingCode.value = false;
  }
}

async function loginWithEntrySmsCode() {
  if (!entrySmsId.value || entrySmsPhone.value !== entryPhone.value) {
    showToast('请先发送验证码');
    return;
  }
  if (!/^\d{6}$/.test(entrySmsCode.value)) {
    showToast('请输入 6 位验证码');
    return;
  }
  entryLoggingIn.value = true;
  try {
    const userInfo = await smsAuthClient.login(entryPhone.value, entrySmsCode.value, entrySmsId.value);
    authTokenDraft.value = userInfo.authToken ?? '';
    persistReplicaAuthToken(homeAiReplicaConfig.appId, authTokenDraft.value);
    localStorage.setItem(ENTRY_GATE_STORAGE_KEY, '1');
    entryGateVisible.value = false;
    console.info('[HomeAI App] 短信验证码登录成功', {
      hasToken: Boolean(userInfo.authToken),
      phoneTail: entryPhone.value.slice(-4),
    });
    await reload();
    showToast('登录成功');
    applyHashRoute();
  } catch (error) {
    showToast(error instanceof Error ? `登录失败：${error.message}` : '登录失败');
  } finally {
    entryLoggingIn.value = false;
  }
}

function submitWechatLogin() {
  console.info('[HomeAI App] 点击微信登录');
  showToast('微信登录仅在 APK 原生环境中可用');
}

function selectFeature(code: string) {
  selectedFeatureCode.value = code;
  designStep.value = 0;
  generationPhase.value = 'idle';
  activeTab.value = 'design';
}

function resetDesign() {
  designStep.value = 0;
  selectedImageName.value = '';
  generationPhase.value = 'idle';
  clearGenerationPhaseTimer();
}

function mockUpload() {
  if (!demoMode.value) {
    console.warn('[HomeAI App] 实时模式未伪造上传结果', { featureCode: selectedFeatureCode.value });
    showToast('实时模式未收到上传接口返回，未创建本地作品');
    return;
  }
  // 显式 demo 模式才模拟本地上传态，避免实时模式把本地文件名当成服务端结果。
  selectedImageName.value = `${selectedFeature.value.title}.jpg`;
  console.info('[HomeAI App] 模拟选择空间照片', { featureCode: selectedFeatureCode.value, imageName: selectedImageName.value });
}

function nextDesignStep() {
  if (!canAdvanceDesignStep.value) {
    showToast('请先上传空间照片，再进入下一步');
    return;
  }
  if (designStep.value < designSteps.length - 1) {
    designStep.value += 1;
    if (designSteps[designStep.value] === 'result') {
      startGenerationPreview();
    }
    return;
  }
  designStep.value = 0;
  selectedImageName.value = '';
  generationPhase.value = 'idle';
  clearGenerationPhaseTimer();
}

async function reload() {
  persistEnvironment();
  saveToken();
  updateApiState();

  if (demoMode.value) {
    snapshotLoading.value = false;
    snapshot.value = structuredClone(demoSnapshot);
    return;
  }

  snapshotLoading.value = true;
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
      mode: 'live',
      environmentLabel: environment.value,
      lastError: error instanceof Error ? error.message : '接口请求失败，已展示实时空态',
    };
  } finally {
    snapshotLoading.value = false;
  }
}

onMounted(() => {
  window.addEventListener('hashchange', syncStateFromHash);
  window.addEventListener('popstate', syncStateFromHash);
  syncStateFromHash();
  void reload();
});

onUnmounted(() => {
  clearGenerationPhaseTimer();
  window.removeEventListener('hashchange', syncStateFromHash);
  window.removeEventListener('popstate', syncStateFromHash);
});

watch([activeTab, selectedFeatureCode, entryGateVisible], () => {
  applyHashRoute();
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
  position: relative;
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

.entry-login-page {
  min-height: 0;
  display: grid;
  grid-template-rows: auto auto auto auto 1fr;
  gap: 22px;
  padding: 22px 20px 30px;
  overflow-y: auto;
  background:
    radial-gradient(circle at 30% 8%, rgba(255, 231, 190, 0.68), transparent 26%),
    linear-gradient(180deg, #fff8ef 0%, #ffffff 42%, #f7f8fb 100%);
}

.entry-back {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 19px;
  color: #1a2130;
  background: transparent;
}

.entry-brand {
  display: grid;
  justify-items: center;
  gap: 16px;
  padding: 76px 0 30px;
  text-align: center;
}

.entry-brand img {
  width: 72px;
  height: 72px;
  border-radius: 20px;
}

.entry-brand span {
  display: grid;
  gap: 6px;
}

.entry-brand strong {
  color: #202634;
  font-size: 27px;
  font-weight: 900;
}

.entry-brand small {
  color: #8b909c;
  font-size: 15px;
}

.entry-login-step {
  display: grid;
  gap: 18px;
}

.entry-phone-field {
  min-height: 82px;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 18px;
  align-items: center;
  padding: 0 24px;
  border: 1px solid #dde2ea;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 28px rgba(223, 196, 156, 0.18);
}

.entry-phone-field span {
  color: #252d3c;
  font-size: 22px;
  font-weight: 800;
}

.entry-phone-field input {
  width: 100%;
  border: 0;
  outline: none;
  color: #252d3c;
  background: transparent;
  font-size: 19px;
}

.entry-phone-field input::placeholder {
  color: #babec7;
}

.entry-code-step {
  gap: 22px;
}

.entry-code-step p {
  margin: 0;
  color: #242936;
  font-size: 20px;
  font-weight: 800;
}

.entry-code-field {
  position: relative;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
}

.entry-code-field input {
  position: absolute;
  inset: 0;
  width: 100%;
  opacity: 0.01;
  border: 0;
}

.entry-code-field span {
  min-height: 58px;
  display: grid;
  place-items: center;
  border: 2px solid #30323a;
  border-radius: 15px;
  color: #202634;
  background: rgba(255, 255, 255, 0.94);
  font-size: 24px;
  font-weight: 900;
}

.entry-login-button {
  min-height: 68px;
  border: 0;
  border-radius: 999px;
  color: #5b5b4f;
  background: linear-gradient(180deg, #fff8a7 0%, #ffef56 100%);
  box-shadow: 0 18px 32px rgba(255, 216, 89, 0.26);
  font-size: 20px;
  font-weight: 900;
}

.entry-login-button:disabled {
  color: #b7b4a4;
  filter: saturate(0.75);
}

.entry-resend-button {
  justify-self: center;
  padding: 0;
  border: 0;
  color: #242936;
  background: transparent;
  font-size: 18px;
  font-weight: 800;
}

.entry-resend-button:disabled {
  color: #a8adb7;
}

.entry-agreement {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 6px;
  align-items: center;
  color: #6d7280;
  font-size: 15px;
  line-height: 1.7;
}

.entry-agreement input {
  width: 22px;
  height: 22px;
  margin: 0 6px 0 0;
  accent-color: #ffcb33;
}

.entry-agreement button {
  padding: 0;
  border: 0;
  color: #d7912f;
  background: transparent;
}

.entry-other-login {
  align-self: end;
  display: grid;
  justify-items: center;
  gap: 28px;
  padding: 18px 0 24px;
}

.entry-other-login > span {
  position: relative;
  color: #b3b7c0;
  font-size: 15px;
}

.entry-other-login > span::before,
.entry-other-login > span::after {
  content: "";
  position: absolute;
  top: 50%;
  width: 54px;
  height: 1px;
  background: #eceef3;
}

.entry-other-login > span::before {
  right: calc(100% + 14px);
}

.entry-other-login > span::after {
  left: calc(100% + 14px);
}

.entry-wechat-button {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 0;
  border: 0;
  color: #8e949f;
  background: transparent;
}

.entry-wechat-icon {
  width: 82px;
  height: 82px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #12b84b;
  background: #f0f2f5;
  font-size: 27px;
  font-weight: 900;
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
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.home-brand {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.home-brand strong {
  color: #161616;
  font-size: 23px;
  line-height: 1.12;
  font-weight: 950;
}

.home-brand span {
  overflow: hidden;
  color: #4e5967;
  font-size: 12px;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-pill {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0 13px;
  border: 0;
  border-radius: 19px;
  color: #fff4c4;
  background: rgba(30, 24, 18, 0.84);
  font-size: 13px;
  font-weight: 900;
  box-shadow: 0 8px 18px rgba(28, 23, 17, 0.16);
}

.member-pill img {
  width: 17px;
  height: 17px;
  object-fit: contain;
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
  background: #f8f8f8;
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

.page-header.upload-title {
  position: relative;
  justify-content: center;
}

.page-header.upload-title .icon-button {
  visibility: hidden;
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
  gap: 7px;
  margin: 6px 2px 20px;
}

.step-indicator span {
  height: 6px;
  transform: skewX(-24deg);
  border-radius: 1px;
  background: #d0d0d0;
}

.step-indicator span.active {
  background: #171717;
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

.upload-panel {
  min-height: 0;
  padding: 4px 0 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.design-panel h2 {
  margin: 0;
  color: #13243b;
  font-size: 22px;
}

.upload-panel h2 {
  margin-top: 18px;
  color: #171717;
  font-size: 20px;
  text-align: center;
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

.upload-dropzone {
  min-height: 270px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 12px;
  margin-top: 10px;
  border: 1.5px dashed #b8b8b8;
  border-radius: 12px;
  color: #202020;
  background: #fff;
  font-size: 17px;
  font-weight: 900;
}

.upload-plus {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #1f1f1f;
  background: #fff500;
  font-size: 34px;
  line-height: 1;
}

.sample-strip {
  display: grid;
  gap: 10px;
  margin-top: 6px;
}

.sample-strip h3 {
  margin: 0;
  color: #161616;
  font-size: 16px;
}

.sample-strip > div {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(118px, 38%);
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.sample-strip figure {
  position: relative;
  overflow: hidden;
  margin: 0;
  border-radius: 10px;
  background: #ececec;
}

.sample-strip figure span {
  position: absolute;
  top: 7px;
  right: 7px;
  z-index: 1;
  padding: 3px 6px;
  border-radius: 10px;
  color: #151515;
  background: #fff500;
  font-size: 11px;
  font-weight: 900;
}

.sample-strip img {
  display: block;
  width: 100%;
  aspect-ratio: 0.82;
  object-fit: cover;
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
  min-height: 54px;
  border-radius: 27px;
  color: #161616;
  background: #fff500;
  font-size: 18px;
  box-shadow: none;
}

.bottom-action:disabled {
  color: #5e5e5e;
  background: #d0d0d0;
  box-shadow: none;
}

.page-discover,
.page-mine {
  background: #f6f8fb;
}

.page-discover {
  padding: 14px 16px 96px;
  background: #fff;
}

.discover-native-head {
  padding: 8px 0 10px;
}

.discover-native-head h1 {
  margin: 0;
  color: #171717;
  font-size: 28px;
  line-height: 1.15;
}

.discover-segment {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0;
  width: 176px;
  margin-bottom: 16px;
  padding: 3px;
  border-radius: 18px;
  background: #f0f0f0;
}

.discover-segment button {
  min-height: 32px;
  border: 0;
  border-radius: 15px;
  color: #777;
  background: transparent;
  font-size: 14px;
  font-weight: 900;
}

.discover-segment button.active {
  color: #161616;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.discover-shelves {
  display: grid;
  gap: 22px;
}

.discover-shelf {
  display: grid;
  gap: 10px;
}

.discover-shelf header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.discover-shelf h2 {
  margin: 0;
  color: #181818;
  font-size: 20px;
}

.discover-shelf header button {
  border: 0;
  color: #878787;
  background: transparent;
  font-size: 13px;
  font-weight: 850;
}

.discover-shelf > div {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(130px, 42%);
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.discover-shelf img {
  width: 100%;
  aspect-ratio: 0.74;
  display: block;
  border-radius: 8px;
  object-fit: cover;
  background: #ececec;
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

.state-card {
  display: grid;
  gap: 8px;
  padding: 18px 16px;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 12px 22px rgba(51, 78, 112, 0.08);
}

.state-card.compact {
  padding: 14px 12px;
}

.state-card strong {
  color: #14233d;
  font-size: 15px;
}

.state-card span {
  color: #687a91;
  font-size: 13px;
  line-height: 1.5;
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

.native-mine {
  display: grid;
  align-content: start;
  gap: 14px;
  padding: 18px 16px 96px;
  background: #f7f7f7;
}

.mine-profile {
  display: grid;
  grid-template-columns: 58px 1fr 38px 38px;
  align-items: center;
  gap: 10px;
  padding: 8px 0 4px;
}

.mine-profile.logged-out {
  grid-template-columns: 58px 1fr 38px;
}

.mine-profile > img {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  object-fit: cover;
}

.mine-profile div {
  min-width: 0;
  display: grid;
  gap: 7px;
}

.mine-profile h2 {
  overflow: hidden;
  margin: 0;
  color: #181818;
  font-size: 21px;
  line-height: 1.18;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mine-profile div button {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: 0;
  color: #555;
  background: transparent;
  font-size: 13px;
  font-weight: 850;
}

.mine-profile div button img {
  width: 16px;
  height: 16px;
}

.mine-profile div button span {
  color: #8a8a8a;
}

.mine-profile .login-summary {
  color: #8a8a8a;
  font-size: 14px;
  font-weight: 800;
}

.mine-icon {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  color: #202020;
  background: #fff;
}

.mine-vip-card {
  min-height: 132px;
  display: grid;
  align-content: space-between;
  gap: 18px;
  padding: 17px 16px 14px;
  border-radius: 16px;
  color: #4b3517;
  background:
    linear-gradient(90deg, rgba(255, 238, 185, 0.9), rgba(246, 202, 121, 0.7)),
    url("/assets/homeai/vip_card_bg.png") center / cover no-repeat;
}

.mine-vip-card header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.mine-vip-card header strong {
  min-width: 0;
  color: #4a3215;
  font-size: 18px;
  line-height: 1.25;
  font-weight: 950;
}

.mine-vip-card header button {
  min-height: 30px;
  padding: 0 13px;
  border: 0;
  border-radius: 15px;
  color: #ffe9b0;
  background: #322315;
  font-size: 12px;
  font-weight: 900;
}

.mine-vip-card > div {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.mine-vip-card article {
  display: grid;
  place-items: center;
  gap: 6px;
  min-width: 0;
  color: #5c421f;
  font-size: 12px;
  font-weight: 900;
}

.mine-vip-card article img {
  width: 30px;
  height: 30px;
  object-fit: contain;
}

.mine-shortcuts {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.mine-shortcuts button {
  position: relative;
  min-height: 72px;
  overflow: hidden;
  padding: 0;
  border: 0;
  border-radius: 12px;
  color: #202020;
  background: #fff;
  text-align: left;
}

.mine-shortcuts img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mine-shortcuts span {
  position: relative;
  z-index: 1;
  display: inline-block;
  padding: 16px 14px;
  font-size: 16px;
  font-weight: 950;
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

.native-work-list {
  margin-top: 4px;
  gap: 14px;
}

.native-work-list h3 {
  color: #181818;
  font-size: 20px;
}

.mine-empty-state {
  min-height: 160px;
  display: grid;
  place-items: center;
  gap: 10px;
  color: #8d8d8d;
  font-size: 14px;
  font-weight: 850;
}

.mine-empty-state.logged-out {
  align-content: center;
}

.mine-empty-state.logged-out strong {
  color: #8d8d8d;
  font-size: 15px;
}

.mine-empty-state.logged-out button {
  border: 0;
  color: #181818;
  background: transparent;
  font-size: 15px;
  font-weight: 900;
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

.native-overlay {
  position: absolute;
  inset: 30px 0 0;
  z-index: 15;
  display: grid;
  align-items: end;
  background: rgba(0, 0, 0, 0.32);
}

.native-sheet {
  min-height: min(82%, 680px);
  max-height: calc(100% - 16px);
  display: grid;
  grid-template-rows: 54px 1fr;
  overflow: hidden;
  border-radius: 22px 22px 0 0;
  background: #fff;
  box-shadow: 0 -18px 40px rgba(0, 0, 0, 0.18);
}

.native-sheet > header {
  display: grid;
  grid-template-columns: 44px 1fr 44px;
  align-items: center;
  padding: 0 10px;
  border-bottom: 1px solid #f0f0f0;
}

.native-sheet > header strong {
  overflow: hidden;
  color: #171717;
  font-size: 17px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sheet-close {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  color: #171717;
  background: transparent;
}

.discover-list-page,
.diamond-page,
.vip-page,
.invite-page,
.questionnaire-page,
.settings-page {
  min-height: 0;
  overflow-y: auto;
  padding: 16px;
}

.discover-list-page {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-content: start;
  gap: 12px;
}

.discover-list-page article {
  min-width: 0;
  display: grid;
  gap: 7px;
}

.discover-list-page img {
  width: 100%;
  aspect-ratio: 0.75;
  border-radius: 10px;
  object-fit: cover;
  background: #ececec;
}

.discover-list-page span {
  overflow: hidden;
  color: #202020;
  font-size: 13px;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.diamond-page,
.vip-page,
.invite-page,
.questionnaire-page,
.settings-page {
  display: grid;
  align-content: start;
  gap: 14px;
}

.diamond-balance {
  display: grid;
  place-items: center;
  gap: 6px;
  padding: 24px 16px;
  border-radius: 16px;
  background: #fff9d8;
}

.diamond-balance img {
  width: 44px;
  height: 44px;
}

.diamond-balance strong {
  color: #171717;
  font-size: 36px;
  line-height: 1;
}

.diamond-balance span,
.plain-list p,
.invite-page p {
  margin: 0;
  color: #777;
  font-size: 13px;
  line-height: 1.5;
}

.yellow-action {
  min-height: 50px;
  border: 0;
  border-radius: 25px;
  color: #161616;
  background: #fff500;
  font-size: 17px;
  font-weight: 950;
}

.plain-list {
  display: grid;
  gap: 8px;
  padding: 14px;
  border-radius: 14px;
  background: #f7f7f7;
}

.plain-list h3,
.questionnaire-page h3,
.invite-page h2 {
  margin: 0;
  color: #171717;
}

.vip-page-logo {
  width: 176px;
  justify-self: center;
}

.vip-plan-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.vip-plan-list button {
  min-height: 86px;
  display: grid;
  place-items: center;
  gap: 5px;
  border: 1px solid #ead7ad;
  border-radius: 14px;
  color: #3f2c12;
  background: #fff8e8;
}

.vip-plan-list button.active {
  border-color: #24190e;
  background: #ffe9a8;
}

.vip-plan-list strong {
  font-size: 13px;
}

.vip-plan-list span {
  font-size: 20px;
  font-weight: 950;
}

.vip-benefit-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.vip-benefit-list article {
  display: grid;
  place-items: center;
  gap: 6px;
  padding: 12px 6px;
  border-radius: 12px;
  background: #f8f4ea;
  color: #5c421f;
  font-size: 12px;
  font-weight: 900;
}

.vip-benefit-list img {
  width: 30px;
  height: 30px;
}

.invite-page img {
  width: 100%;
  max-height: 230px;
  border-radius: 16px;
  object-fit: cover;
}

.questionnaire-page article {
  display: grid;
  gap: 10px;
}

.questionnaire-page article > div {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.questionnaire-page article button,
.settings-page button {
  min-height: 44px;
  border: 0;
  border-radius: 12px;
  color: #272727;
  background: #f3f3f3;
  font-weight: 850;
}

.questionnaire-page article button.active {
  color: #161616;
  background: #fff500;
}

.settings-page button {
  text-align: left;
  padding: 0 14px;
  background: #f7f7f7;
}

.bottom-nav {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
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
  color: #161616;
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
