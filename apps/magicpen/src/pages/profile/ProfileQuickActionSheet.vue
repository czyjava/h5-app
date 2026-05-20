<script setup lang="ts">
import { computed, ref } from 'vue';
import { BookOpenCheck, Clipboard, Flame, Gift, MonitorPlay, ShieldCheck, Sparkles } from 'lucide-vue-next';
import { appState, closeOverlay, showToast, switchTab } from '@/app/model';
import { sessionState, setDemoMode } from '@/entities/session/model';

const schoolName = ref('');
const contactInfo = ref('');

const actionMeta = computed(() => {
  const metas = {
    invite: {
      icon: Gift,
      title: '邀请有礼',
      subtitle: '邀请好友体验神笔绘画，双方都能获得钻石奖励。',
    },
    education: {
      icon: BookOpenCheck,
      title: '教育优惠',
      subtitle: '为老师、学校和美育课堂准备的批量使用优惠。',
    },
    demo: {
      icon: MonitorPlay,
      title: '演示模式',
      subtitle: '一键切换到脱敏演示资料，方便投屏或给别人看页面。',
    },
    activity: {
      icon: Flame,
      title: '活动中心',
      subtitle: '查看当前可参与的创作活动和奖励任务。',
    },
  };
  return metas[appState.selectedProfileQuickAction];
});

const inviteCode = computed(() => `MAGIC-${String(appState.snapshot.profile.diamonds || 3210).padStart(4, '0')}`);

async function copyInvite() {
  const inviteText = `我在用神笔绘画，邀请码：${inviteCode.value}`;
  try {
    await navigator.clipboard.writeText(inviteText);
    showToast('邀请码已复制');
  } catch {
    showToast(`邀请码：${inviteCode.value}`);
  }
}

function submitEducation() {
  if (!schoolName.value.trim() || !contactInfo.value.trim()) {
    showToast('请填写学校/机构和联系方式');
    return;
  }
  showToast('教育优惠申请已记录');
  closeOverlay();
}

function toggleDemoMode() {
  setDemoMode(!sessionState.demoMode);
  showToast(sessionState.demoMode ? '已进入演示模式' : '已退出演示模式');
  closeOverlay();
}

function openActivity() {
  switchTab('inspiration');
  showToast('已切到灵感活动内容');
}
</script>

<template>
  <section class="profile-quick-sheet">
    <header class="profile-quick-hero">
      <span>
        <component :is="actionMeta.icon" :size="28" />
      </span>
      <div>
        <h3>{{ actionMeta.title }}</h3>
        <p>{{ actionMeta.subtitle }}</p>
      </div>
    </header>

    <div v-if="appState.selectedProfileQuickAction === 'invite'" class="profile-quick-card invite-card">
      <span>我的邀请码</span>
      <strong>{{ inviteCode }}</strong>
      <button class="primary-button" @click="copyInvite">
        <Clipboard :size="18" />
        <span>复制邀请文案</span>
      </button>
    </div>

    <div v-else-if="appState.selectedProfileQuickAction === 'education'" class="profile-quick-card education-card">
      <label>
        <span>学校/机构</span>
        <input v-model="schoolName" placeholder="填写学校或机构名称" />
      </label>
      <label>
        <span>联系方式</span>
        <input v-model="contactInfo" placeholder="手机号或邮箱" />
      </label>
      <button class="primary-button" @click="submitEducation">
        <ShieldCheck :size="18" />
        <span>提交优惠申请</span>
      </button>
    </div>

    <div v-else-if="appState.selectedProfileQuickAction === 'demo'" class="profile-quick-card demo-card">
      <div>
        <strong>{{ sessionState.demoMode ? '演示模式已开启' : '演示模式未开启' }}</strong>
        <p>开启后“我的”页会使用脱敏昵称、作品和钻石展示，不影响真实 token。</p>
      </div>
      <button class="primary-button" @click="toggleDemoMode">
        <MonitorPlay :size="18" />
        <span>{{ sessionState.demoMode ? '退出演示模式' : '开启演示模式' }}</span>
      </button>
    </div>

    <div v-else class="profile-quick-card activity-card">
      <article>
        <Sparkles :size="22" />
        <div>
          <strong>灵感同款挑战</strong>
          <span>发布同款作品，赢取限时钻石奖励。</span>
        </div>
      </article>
      <article>
        <Gift :size="22" />
        <div>
          <strong>好友助力奖励</strong>
          <span>邀请好友完成首次创作后解锁奖励。</span>
        </div>
      </article>
      <button class="primary-button" @click="openActivity">
        <Flame :size="18" />
        <span>去参加活动</span>
      </button>
    </div>
  </section>
</template>
