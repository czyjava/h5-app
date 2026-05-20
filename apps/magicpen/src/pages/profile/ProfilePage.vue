<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  CalendarDays,
  Gem,
  GraduationCap,
  Grid3X3,
  Headphones,
  LogIn,
  Settings,
  Sparkles,
  UserRound,
} from 'lucide-vue-next';
import { appState, openCreator, openDiamondDetail, openProfileQuickAction, openWorkDetail } from '@/app/model';
import type { InspirationPost, UserProfile, UserWork } from '@/entities/magicpen/types';
import { sessionState } from '@/entities/session/model';
import RemoteImage from '@/shared/ui/RemoteImage.vue';

type ProfileContentTab = 'works' | 'posts' | 'drawings';
type WorkFilterTab = 'all' | 'video' | 'photo' | 'satisfied';
type WorkViewMode = 'grid' | 'calendar' | 'user';

interface ProfileGridItem {
  id: string;
  title: string;
  cover: UserWork['cover'];
  kind: UserWork['kind'] | 'post';
  work?: UserWork;
  post?: InspirationPost;
}

const activeProfileTab = ref<ProfileContentTab>('works');
const activeWorkTab = ref<'all' | 'video' | 'photo' | 'satisfied'>('all');
const activeWorkView = ref<WorkViewMode>('grid');

const profileTabs: Array<{ key: ProfileContentTab; label: string }> = [
  { key: 'works', label: '作品' },
  { key: 'posts', label: '帖子' },
  { key: 'drawings', label: '画作' },
];

const workFilters: Array<{ key: WorkFilterTab; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'video', label: '视频' },
  { key: 'photo', label: '照片' },
  { key: 'satisfied', label: '满意的' },
];

const workViewModes: Array<{ key: WorkViewMode; label: string; icon: typeof Grid3X3 }> = [
  { key: 'grid', label: '九宫格视图', icon: Grid3X3 },
  { key: 'calendar', label: '日历视图', icon: CalendarDays },
  { key: 'user', label: '用户视图', icon: UserRound },
];

const replicaProfile: UserProfile = {
  nickname: '洋娃娃的暖心',
  avatar: '',
  diamonds: 3210,
  vipExpire: '',
  level: 'L1 新手画师',
};

const useReplicaProfile = computed(
  () => sessionState.demoMode || (!sessionState.authToken && !appState.snapshot.profile.nickname),
);

// 未登录时使用模拟器截图里的复刻态资料，只服务视觉还原；真实登录凭证仍只走用户主动登录。
const displayProfile = computed(() => (useReplicaProfile.value ? replicaProfile : appState.snapshot.profile));
const profileName = computed(() => displayProfile.value.nickname || '未登录');
const vipExpireLabel = computed(() =>
  displayProfile.value.vipExpire ? `${displayProfile.value.vipExpire}到期` : '按月订阅',
);

const displayWorks = computed<UserWork[]>(() => {
  if (appState.snapshot.works.length || sessionState.authToken) {
    return appState.snapshot.works;
  }

  // 没有作品接口登录态时，借用实时社区封面补足作品瀑布流观感，避免“我的”页在复刻态下空掉。
  return appState.snapshot.posts.slice(0, 9).map((post, index) => ({
    id: `replica-work-${post.id}`,
    title: post.templateTitle || `作品 ${index + 1}`,
    cover: post.cover,
    kind: index % 3 === 0 ? 'video' : 'photo',
    satisfied: index % 2 === 0,
  }));
});

const filteredWorks = computed(() => {
  // “画作”是作品流的图片子集；切到该菜单时仍复用作品接口数据，避免伪造额外接口。
  const sourceWorks =
    activeProfileTab.value === 'drawings'
      ? displayWorks.value.filter((work) => work.kind === 'photo')
      : displayWorks.value;

  if (activeWorkTab.value === 'all') {
    return sourceWorks;
  }
  if (activeWorkTab.value === 'satisfied') {
    return sourceWorks.filter((work) => work.satisfied);
  }
  return sourceWorks.filter((work) => work.kind === activeWorkTab.value);
});

const visibleWorkFilters = computed(() =>
  activeProfileTab.value === 'drawings'
    ? workFilters.filter((filter) => filter.key !== 'video')
    : workFilters,
);

const profileGridItems = computed<ProfileGridItem[]>(() => {
  if (activeProfileTab.value === 'posts') {
    return appState.snapshot.posts.slice(0, 12).map((post) => ({
      id: `post-${post.id}`,
      title: post.templateTitle,
      cover: post.cover,
      kind: 'post',
      post,
    }));
  }

  return filteredWorks.value.map((work) => ({
    id: work.id,
    title: work.title,
    cover: work.cover,
    kind: work.kind,
    work,
  }));
});

function selectProfileTab(tab: ProfileContentTab) {
  activeProfileTab.value = tab;
  if (tab === 'posts') {
    activeWorkTab.value = 'all';
    return;
  }
  if (tab === 'drawings' && activeWorkTab.value === 'video') {
    activeWorkTab.value = 'photo';
  }
}

function openProfileGridItem(item: ProfileGridItem) {
  if (item.post) {
    openCreator(item.post);
    return;
  }
  if (item.work) {
    openWorkDetail(item.work);
  }
}
</script>

<template>
  <section class="profile-page page-scroll" :class="{ 'profile-page--replica': useReplicaProfile }">
    <header class="profile-hero">
      <RemoteImage v-if="displayProfile.avatar" :src="displayProfile.avatar" alt="用户头像" />
      <span v-else class="profile-avatar-fallback">
        <UserRound :size="34" />
      </span>
      <div>
        <h1>{{ profileName }}</h1>
        <button v-if="!sessionState.authToken" class="profile-login-button" @click="appState.activeOverlay = 'settings'">
          <LogIn :size="16" />
          <span>登录同步数据</span>
        </button>
        <button class="diamond-pill" @click="openDiamondDetail">
          <Gem :size="18" />
          <span>{{ displayProfile.diamonds }}钻石 | 查看明细</span>
        </button>
      </div>
      <button class="icon-button" aria-label="客服" @click="appState.activeOverlay = 'settings'">
        <Headphones :size="24" />
      </button>
      <button class="icon-button" aria-label="设置" @click="appState.activeOverlay = 'settings'">
        <Settings :size="24" />
      </button>
    </header>

    <section class="vip-banner" @click="appState.activeOverlay = 'wallet'">
      <div>
        <h2>神笔绘画 <span>VIP</span></h2>
        <p>超多会员特权等你体验</p>
      </div>
      <strong>{{ vipExpireLabel }}</strong>
      <div class="vip-benefits">
        <span><Sparkles :size="18" />专属视频玩法</span>
        <span><Grid3X3 :size="18" />生图不限次</span>
        <span><GraduationCap :size="18" />快速生成</span>
      </div>
    </section>

    <div class="quick-actions">
      <button @click="openProfileQuickAction('invite')">🎁 邀请有礼</button>
      <button @click="openProfileQuickAction('education')">🎓 教育优惠</button>
      <button :class="{ active: sessionState.demoMode }" @click="openProfileQuickAction('demo')">🖥️ 演示模式</button>
      <button @click="openProfileQuickAction('activity')">🔥 活动</button>
    </div>

    <section class="work-section">
      <div class="work-heading-row">
        <div class="profile-tabs">
          <button
            v-for="tab in profileTabs"
            :key="tab.key"
            :class="{ active: activeProfileTab === tab.key }"
            :aria-pressed="activeProfileTab === tab.key"
            @click="selectProfileTab(tab.key)"
          >
            {{ tab.label }}
          </button>
        </div>
        <div class="work-view-switch" aria-label="作品展示方式">
          <button
            v-for="mode in workViewModes"
            :key="mode.key"
            :class="{ active: activeWorkView === mode.key }"
            :aria-label="mode.label"
            :aria-pressed="activeWorkView === mode.key"
            @click="activeWorkView = mode.key"
          >
            <component :is="mode.icon" :size="25" />
          </button>
        </div>
      </div>
      <div v-if="activeProfileTab !== 'posts'" class="work-filters">
        <button
          v-for="filter in visibleWorkFilters"
          :key="filter.key"
          :class="{ active: activeWorkTab === filter.key }"
          :aria-pressed="activeWorkTab === filter.key"
          @click="activeWorkTab = filter.key"
        >
          {{ filter.label }}
        </button>
      </div>

      <div v-if="profileGridItems.length" class="work-grid" :class="`work-grid--${activeWorkView}`">
        <button
          v-for="item in profileGridItems"
          :key="item.id"
          class="work-card"
          :class="{ 'work-card--post': item.kind === 'post' }"
          @click="openProfileGridItem(item)"
        >
          <RemoteImage :src="item.cover.url" :alt="item.cover.alt" />
          <span v-if="item.kind === 'video'" class="play-dot">▶</span>
          <span>{{ item.title }}</span>
        </button>
      </div>
      <div v-else class="work-empty">暂无内容</div>
    </section>
  </section>
</template>
