<script setup lang="ts">
import { computed } from 'vue';
import { BatteryFull, Crown } from 'lucide-vue-next';
import BottomNav from '@/widgets/mobile-shell/BottomNav.vue';
import FloatingActivity from '@/widgets/floating-activity/FloatingActivity.vue';
import { appState } from '@/app/model';

const showFloatingActivity = computed(
  () =>
    !appState.loading &&
    appState.firstLaunch.step === 'done' &&
    !appState.activeOverlay &&
    appState.activeTab === 'home',
);
const mainAppReady = computed(() => !appState.loading && appState.firstLaunch.step === 'done');
</script>

<template>
  <main class="page-bg">
    <section
      class="phone-shell"
      :class="[
        `tab-${appState.activeTab}`,
        {
          'has-overlay': Boolean(appState.activeOverlay),
          'diamond-detail-mode': appState.activeOverlay === 'diamondDetail',
          'startup-mode': !mainAppReady,
        },
      ]"
      aria-label="神笔绘画 H5"
    >
      <div class="status-bar">
        <span>2:10</span>
        <div class="status-icons">
          <span>3G</span>
          <BatteryFull :size="22" />
        </div>
      </div>

      <div class="screen-content">
        <slot />
      </div>

      <button
        v-if="mainAppReady && appState.activeTab !== 'profile'"
        class="floating-crown"
        aria-label="会员中心"
        @click="appState.activeOverlay = 'wallet'"
      >
        <Crown :size="26" />
      </button>

      <FloatingActivity v-if="showFloatingActivity" />
      <BottomNav v-if="mainAppReady && appState.activeTab !== 'capture' && appState.activeOverlay !== 'diamondDetail'" />
    </section>
  </main>
</template>
