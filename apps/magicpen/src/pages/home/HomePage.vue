<script setup lang="ts">
import { appState, openCaptureEntry, openCreator } from '@/app/model';
import type { HomeCard } from '@/entities/magicpen/types';
import RemoteImage from '@/shared/ui/RemoteImage.vue';
import homeLogo from '@/assets/magicpen/home_logo.png';
import vipCrown from '@/assets/magicpen/ic_vip_crown_static.png';

function heroAsset(card: HomeCard) {
  // APP 的首页运营位每组素材是“缩略图 + 大图/视频封面”，大卡背景取第二个资源才会和抓包截图一致。
  return card.thumbnails[1] ?? card.thumbnails[0];
}

function tagAsset(card: HomeCard, index: number) {
  // 标签缩略图对应每组素材的第一个资源，避免把大卡背景误塞进下方小标签。
  return card.thumbnails[index * 2] ?? card.thumbnails[index];
}

function cardStyle(card: HomeCard) {
  const asset = heroAsset(card);
  return asset ? { '--feature-bg': `url("${asset.url}")` } : {};
}

function badgeLabel(card: HomeCard, index: number) {
  if (index === 0) {
    return 'HOT';
  }
  return card.badge || '限时免费';
}
</script>

<template>
  <section class="home-page page-scroll">
    <header class="brand-header">
      <h1 class="brand-logo-title">
        <img :src="homeLogo" alt="神笔绘画" />
      </h1>
      <button class="crown-button" aria-label="会员权益" @click="appState.activeOverlay = 'wallet'">
        <img :src="vipCrown" alt="" />
        <span>开通会员</span>
      </button>
    </header>

    <div class="home-card-list">
      <article
        v-for="(card, index) in appState.snapshot.homeCards"
        :key="card.id"
        class="home-feature-card"
        :class="`theme-${card.theme}`"
        :style="cardStyle(card)"
        @click="card.theme === 'scan' ? openCaptureEntry('home-card') : openCreator(card)"
      >
        <span class="corner-badge">{{ badgeLabel(card, index) }}</span>
        <div class="home-feature-card__content">
          <h2>{{ card.title }}</h2>
          <p>{{ card.subtitle }}</p>
          <div class="tag-row">
            <span v-for="(tag, tagIndex) in card.tags.slice(0, 4)" :key="tag">
              <RemoteImage
                v-if="tagAsset(card, tagIndex)"
                :src="tagAsset(card, tagIndex)?.url ?? ''"
                :alt="tag"
              />
              <em>{{ tag }}</em>
            </span>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
