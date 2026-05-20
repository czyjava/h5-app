<script setup lang="ts">
import { computed, ref } from 'vue';
import { Gem, ImagePlus, WandSparkles } from 'lucide-vue-next';
import { appState, showToast } from '@/app/model';
import RemoteImage from '@/shared/ui/RemoteImage.vue';

const fileReady = ref(false);

const title = computed(() => appState.selectedPost?.templateTitle || appState.selectedHomeCard?.title || '神笔马良');
const preview = computed(() => appState.selectedPost?.cover || appState.selectedHomeCard?.thumbnails[0]);

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  fileReady.value = Boolean(input.files?.length);
  if (fileReady.value) {
    showToast('素材已选择，当前不会提交生产接口');
  }
}

function submit() {
  if (!fileReady.value) {
    showToast('请先选择素材');
    return;
  }
  showToast('已模拟提交生成任务');
}
</script>

<template>
  <div class="creator-sheet">
    <div class="creator-preview">
      <RemoteImage v-if="preview" :src="preview.url" :alt="preview.alt" />
      <div>
        <h3>{{ title }}</h3>
        <p>上传绘画素材后生成预览</p>
      </div>
    </div>

    <label class="upload-box">
      <ImagePlus :size="28" />
      <span>{{ fileReady ? '素材已就绪' : '选择一张绘画素材' }}</span>
      <input type="file" accept="image/png,image/jpeg" @change="onFileChange" />
    </label>

    <div class="quote-row">
      <span>剩余 {{ appState.snapshot.profile.diamonds }}</span>
      <strong v-if="appState.quote"><Gem :size="19" />{{ appState.quote.price }}</strong>
      <strong v-else>{{ appState.quoteLoading ? '报价中' : '待报价' }}</strong>
    </div>

    <button class="generate-button" @click="submit">
      <WandSparkles :size="20" />
      <span>立即生成</span>
    </button>
  </div>
</template>
