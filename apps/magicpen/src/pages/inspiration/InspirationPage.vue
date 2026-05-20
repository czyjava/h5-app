<script setup lang="ts">
import { Heart, WandSparkles } from 'lucide-vue-next';
import { appState, openCreator, selectChannel, togglePostLike, visiblePosts } from '@/app/model';
import { compactNumber } from '@/shared/lib/format';
import RemoteImage from '@/shared/ui/RemoteImage.vue';
</script>

<template>
  <section class="inspiration-page page-scroll">
    <div class="channel-strip">
      <button
        v-for="channel in appState.snapshot.channels"
        :key="channel.key"
        class="channel-chip"
        :class="{ active: appState.selectedChannel === channel.key }"
        :aria-pressed="appState.selectedChannel === channel.key"
        @click="selectChannel(channel.key)"
      >
        {{ channel.label }}
      </button>
    </div>

    <div v-if="appState.postLoading" class="masonry-state">加载中...</div>
    <div v-else-if="visiblePosts.length" class="masonry-grid">
      <article v-for="post in visiblePosts" :key="post.id" class="inspiration-card">
        <div class="inspiration-card__media">
          <RemoteImage :src="post.cover.url" :alt="post.cover.alt" />
          <span v-if="post.hot" class="hot-badge">热门</span>
        </div>
        <div class="inspiration-card__body">
          <div class="author-row">
            <span class="avatar-dot">
              <RemoteImage v-if="post.authorAvatar.url" :src="post.authorAvatar.url" :alt="post.authorAvatar.alt" />
              <span v-else>{{ post.author.slice(0, 1) }}</span>
            </span>
            <strong>{{ post.author }}</strong>
          </div>
          <div class="post-actions">
            <button class="round-action" :class="{ active: post.liked }" aria-label="收藏" @click="togglePostLike(post)">
              <Heart :size="22" />
            </button>
            <button class="remake-button" @click="openCreator(post)">
              <WandSparkles :size="18" />
              <span>做同款 {{ compactNumber(post.remakes) }}次</span>
            </button>
          </div>
        </div>
      </article>
    </div>
    <div v-else class="masonry-state">暂无内容</div>
  </section>
</template>
