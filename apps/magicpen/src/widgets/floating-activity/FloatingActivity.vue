<script setup lang="ts">
import { ref, watch } from 'vue';
import { X } from 'lucide-vue-next';
import type { AppTab } from '@/entities/magicpen/types';
import { appState, showToast } from '@/app/model';
import underseaFloating from '@/assets/magicpen/undersea_floating.png';

const dismissed = ref(false);

watch(
  () => appState.activeTab,
  (tab: AppTab) => {
    if (tab === 'home') {
      dismissed.value = false;
    }
  },
);

function openActivity() {
  // 原 APP 当前只暴露运营浮层入口，H5 先保留可点击反馈，避免误造未抓到的活动路由。
  showToast('海底世界活动入口');
}
</script>

<template>
  <div v-if="!dismissed" class="floating-activity" aria-label="海底世界活动">
    <button class="floating-activity__close" type="button" aria-label="关闭海底世界" @click="dismissed = true">
      <X :size="19" :stroke-width="3.5" />
    </button>
    <button class="floating-activity__banner" type="button" @click="openActivity">
      <img :src="underseaFloating" alt="海底世界" />
    </button>
  </div>
</template>
