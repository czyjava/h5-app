<script setup lang="ts">
import { computed } from 'vue';
import { Download, Heart, RotateCcw, Share2, ThumbsDown, ThumbsUp } from 'lucide-vue-next';
import {
  appState,
  downloadSelectedWork,
  markWorkSatisfied,
  openCreator,
  shareSelectedWork,
  showToast,
  toggleWorkFavorite,
} from '@/app/model';
import RemoteImage from '@/shared/ui/RemoteImage.vue';

const remakeTemplate = computed(() => appState.snapshot.homeCards[3] ?? appState.snapshot.homeCards[0] ?? null);
const selectedWork = computed(() => appState.selectedWork);
const detailState = computed(() => appState.workDetail);
const mediaTypeLabel = computed(() => (selectedWork.value?.kind === 'video' ? '视频作品' : '图片作品'));
const mediaStatusLabel = computed(() => {
  if (detailState.value.loading || detailState.value.mediaStatus === 'checking') {
    return '资源检查中';
  }
  return detailState.value.mediaStatus === 'ready' ? '封面资源正常' : '封面资源缺失';
});
const downloadResourceLabel = computed(() => {
  if (detailState.value.loading || detailState.value.mediaStatus === 'checking') {
    return '检查中';
  }
  if (detailState.value.mediaStatus === 'missing') {
    return '暂无可下载资源';
  }
  if (detailState.value.downloadStatus === 'downloaded') {
    return '打印图已生成';
  }
  return selectedWork.value?.kind === 'video' ? '视频封面打印图可生成' : '高清打印图可生成';
});
const downloadButtonLabel = computed(() => {
  if (detailState.value.downloadStatus === 'preparing') {
    return '生成中';
  }
  if (detailState.value.downloadStatus === 'downloaded') {
    return '已下载';
  }
  return '下载';
});

function remakeWork() {
  if (!remakeTemplate.value) {
    showToast('暂无可用模板');
    return;
  }
  console.info('[profile] 从作品详情进入再做一次', {
    workId: appState.selectedWork?.id,
    templateId: remakeTemplate.value.id,
  });
  openCreator(remakeTemplate.value);
}
</script>

<template>
  <div v-if="selectedWork" class="work-detail">
    <div class="work-detail__media">
      <RemoteImage :src="selectedWork.cover.url" :alt="selectedWork.cover.alt" />
      <span>{{ mediaTypeLabel }}</span>
    </div>
    <h3>{{ selectedWork.title }}</h3>

    <section v-if="detailState.loading" class="work-detail-loading">
      <span />
      <div>
        <strong>正在加载作品详情</strong>
        <p>模拟 APP 拉取作品详情、媒体信息和下载资源状态</p>
      </div>
    </section>

    <section v-else class="work-detail-meta">
      <div>
        <span>作品编号</span>
        <strong>{{ selectedWork.id }}</strong>
      </div>
      <div>
        <span>作品类型</span>
        <strong>{{ mediaTypeLabel }}</strong>
      </div>
      <div>
        <span>媒体信息</span>
        <strong>{{ mediaStatusLabel }}</strong>
      </div>
      <div>
        <span>下载资源</span>
        <strong>{{ downloadResourceLabel }}</strong>
      </div>
      <div>
        <span>加载时间</span>
        <strong>{{ detailState.detailLoadedAt || '刚刚' }}</strong>
      </div>
    </section>

    <div class="work-detail__actions">
      <button :class="{ active: detailState.favorite }" :disabled="detailState.loading" @click="toggleWorkFavorite">
        <Heart :size="20" />{{ detailState.favorite ? '已收藏' : '收藏' }}
      </button>
      <button :class="{ active: detailState.shared }" :disabled="detailState.loading" @click="shareSelectedWork">
        <Share2 :size="20" />{{ detailState.shared ? '已分享' : '分享' }}
      </button>
      <button
        :class="{ active: detailState.downloadStatus === 'downloaded' }"
        :disabled="detailState.loading || detailState.downloadStatus === 'preparing'"
        @click="downloadSelectedWork"
      >
        <Download :size="20" />{{ downloadButtonLabel }}
      </button>
      <button @click="remakeWork"><RotateCcw :size="20" />再做一次</button>
    </div>
    <section class="feedback-panel">
      <p>这次结果满意吗?</p>
      <div>
        <button @click="markWorkSatisfied(true)"><ThumbsUp :size="20" />满意</button>
        <button @click="markWorkSatisfied(false)"><ThumbsDown :size="20" />再优化</button>
      </div>
    </section>
  </div>
</template>
