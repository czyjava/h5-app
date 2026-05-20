<script setup lang="ts">
import { computed, ref } from 'vue';
import { Check, Download, Maximize2, RotateCcw, Save, Undo2 } from 'lucide-vue-next';
import type { ColoringCard } from '@/entities/magicpen/types';
import { appState, closeColoringCanvas, markColoringCardCompleted, openColoringCanvas, showToast } from '@/app/model';
import RemoteImage from '@/shared/ui/RemoteImage.vue';

const props = defineProps<{
  card: ColoringCard;
}>();

const colors = ['#ffd000', '#e46f72', '#b866ce', '#62b5ed', '#4fb7ad', '#83c682'];
const activeColor = ref(colors[0]);
const strokes = ref<Array<{ x: number; y: number; color: string }>>([]);
const completionPanelOpen = ref(false);
const savedLocally = ref(false);

const progress = computed(() => Math.min(5, strokes.value.length));
const progressPercent = computed(() => Math.round((progress.value / 5) * 100));
const nextCard = computed(() => {
  const cards = appState.snapshot.coloringCards.filter((card) => !card.locked || appState.unlockedColoringCardIds.includes(card.id));
  const currentIndex = cards.findIndex((card) => card.id === props.card.id);
  return currentIndex >= 0 ? cards[currentIndex + 1] : null;
});

function paint(event: MouseEvent | TouchEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const point = 'touches' in event ? event.touches[0] : event;
  strokes.value.push({
    x: ((point.clientX - rect.left) / rect.width) * 100,
    y: ((point.clientY - rect.top) / rect.height) * 100,
    color: activeColor.value,
  });
}

function undo() {
  strokes.value.pop();
}

function finish() {
  savedLocally.value = true;
  completionPanelOpen.value = true;
  markColoringCardCompleted(props.card);
  showToast(`${props.card.title} 已生成完成结果`);
}

function downloadPreview() {
  savedLocally.value = true;
  console.info('[coloring] 生成 H5 本地下载预览', { cardId: props.card.id, progress: progress.value });
  showToast('已生成下载预览');
}

function goNext() {
  const card = nextCard.value;
  if (!card) {
    closeColoringCanvas();
    showToast('已完成当前可用关卡');
    return;
  }
  completionPanelOpen.value = false;
  console.info('[coloring] 进入下一张涂色卡', { currentCardId: props.card.id, nextCardId: card.id });
  openColoringCanvas(card);
}
</script>

<template>
  <section class="coloring-canvas">
    <header class="canvas-header">
      <button class="back-button" aria-label="返回" @click="closeColoringCanvas">‹</button>
      <strong>进度 {{ progress }}/5 · {{ progressPercent }}%</strong>
      <button class="confirm-button" aria-label="完成" @click="finish">
        <Check :size="26" />
      </button>
    </header>

    <aside class="canvas-tools">
      <button aria-label="辅助"><Maximize2 :size="21" /><span>辅助</span></button>
      <button aria-label="摆正"><RotateCcw :size="21" /><span>摆正</span></button>
      <button aria-label="撤销" @click="undo"><Undo2 :size="21" /><span>撤销</span></button>
      <button aria-label="下载" @click="downloadPreview"><Download :size="21" /><span>下载</span></button>
    </aside>

    <div class="paint-board" @mousedown="paint" @touchstart.passive="paint">
      <RemoteImage :src="card.image.url" :alt="card.image.alt" />
      <span
        v-for="(stroke, index) in strokes"
        :key="index"
        class="paint-stroke"
        :style="{ left: `${stroke.x}%`, top: `${stroke.y}%`, background: stroke.color }"
      />
    </div>

    <aside class="palette-column">
      <button
        v-for="color in colors"
        :key="color"
        class="color-swatch"
        :class="{ active: activeColor === color }"
        :style="{ background: color }"
        :aria-label="`选择颜色 ${color}`"
        @click="activeColor = color"
      />
    </aside>

    <div v-if="completionPanelOpen" class="canvas-complete-mask">
      <section class="canvas-complete-panel" role="dialog" aria-label="完成涂色">
        <RemoteImage :src="card.image.url" :alt="card.image.alt" />
        <h2>完成啦</h2>
        <p>{{ card.title }} 已保存到 H5 本地进度，当前完成度 {{ progressPercent }}%。</p>
        <div class="complete-status-row">
          <span :class="{ active: savedLocally }"><Save :size="18" />保存结果</span>
          <span :class="{ active: true }"><Check :size="18" />完成记录</span>
        </div>
        <button class="primary-button" @click="goNext">
          {{ nextCard ? `下一关：${nextCard.title}` : '返回涂色列表' }}
        </button>
        <button class="secondary-button" @click="completionPanelOpen = false">继续涂色</button>
      </section>
    </div>
  </section>
</template>
