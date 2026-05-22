<script setup lang="ts">
import type { AppTab } from '@/entities/magicpen/types';
import { appState, openCaptureEntry, switchTab } from '@/app/model';
import cameraIcon from '@/assets/magicpen/icon_tab_camera.png';
import drawIcon from '@/assets/magicpen/icon_tab_draw.png';
import drawIconSelected from '@/assets/magicpen/icon_tab_draw_selected.png';
import inspirationIcon from '@/assets/magicpen/icon_tab_faxian.png';
import inspirationIconSelected from '@/assets/magicpen/icon_tab_faxian_selected.png';
import homeIcon from '@/assets/magicpen/icon_tab_home.png';
import homeIconSelected from '@/assets/magicpen/icon_tab_home_selected.png';
import profileIcon from '@/assets/magicpen/icon_tab_wode.png';
import profileIconSelected from '@/assets/magicpen/icon_tab_wode_selected.png';

const tabs: Array<{ key: AppTab; label: string; icon: string; activeIcon: string }> = [
  { key: 'home', label: '首页', icon: homeIcon, activeIcon: homeIconSelected },
  { key: 'inspiration', label: '灵感', icon: inspirationIcon, activeIcon: inspirationIconSelected },
  { key: 'coloring', label: '涂色', icon: drawIcon, activeIcon: drawIconSelected },
  { key: 'profile', label: '我的', icon: profileIcon, activeIcon: profileIconSelected },
];

function tabIcon(tab: (typeof tabs)[number]) {
  return appState.activeTab === tab.key ? tab.activeIcon : tab.icon;
}
</script>

<template>
  <nav class="bottom-nav" aria-label="主导航">
    <button
      v-for="tab in tabs.slice(0, 2)"
      :key="tab.key"
      class="bottom-nav__item"
      :class="{ active: appState.activeTab === tab.key }"
      @click="switchTab(tab.key)"
    >
      <img class="bottom-nav__icon" :src="tabIcon(tab)" alt="" />
      <span>{{ tab.label }}</span>
    </button>

    <button
      class="bottom-nav__camera"
      :class="{ active: appState.activeTab === 'capture' }"
      aria-label="拍摄创作"
      @click="openCaptureEntry('bottom-nav')"
    >
      <img :src="cameraIcon" alt="" />
    </button>

    <button
      v-for="tab in tabs.slice(2)"
      :key="tab.key"
      class="bottom-nav__item"
      :class="{ active: appState.activeTab === tab.key }"
      @click="switchTab(tab.key)"
    >
      <img class="bottom-nav__icon" :src="tabIcon(tab)" alt="" />
      <span>{{ tab.label }}</span>
    </button>
  </nav>
</template>
