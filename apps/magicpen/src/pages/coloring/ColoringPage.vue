<script setup lang="ts">
import { computed, ref } from 'vue';
import { CheckCircle2, Gem, Lock, Palette, Printer, Sparkles } from 'lucide-vue-next';
import {
  appState,
  closeColoringUnlockSheet,
  isColoringCardLocked,
  isVipAvailable,
  openCaptureEntry,
  openColoringCanvas,
  showToast,
  unlockColoringCard,
} from '@/app/model';
import type { ColoringCard, InteractiveScene } from '@/entities/magicpen/types';
import RemoteImage from '@/shared/ui/RemoteImage.vue';
import ColoringCanvas from '@/pages/coloring/ColoringCanvas.vue';
import BottomSheet from '@/widgets/bottom-sheet/BottomSheet.vue';

type PainterLevelKey = 'novice' | 'skilled' | 'master';

const painterLevelOptions: Array<{
  key: PainterLevelKey;
  profileLevel: string;
  title: string;
  age: string;
  description: string;
}> = [
  {
    key: 'novice',
    profileLevel: 'L1 新手画师',
    title: '新手画师',
    age: '3-5岁',
    description: '线条更简单，适合先熟悉填色和基础图形',
  },
  {
    key: 'skilled',
    profileLevel: 'L2 资深画师',
    title: '资深画师',
    age: '6-8岁',
    description: '图案层次更多，适合连续闯关练习观察力',
  },
  {
    key: 'master',
    profileLevel: 'L3 神境画师',
    title: '神境画师',
    age: '9岁+',
    description: '细节更密集，适合挑战完整作品和打印收藏',
  },
];

function levelKeyFromProfile(level: string): PainterLevelKey {
  if (level.includes('神境') || level.includes('L3')) {
    return 'master';
  }
  if (level.includes('资深') || level.includes('L2')) {
    return 'skilled';
  }
  return 'novice';
}

const currentLevelKey = computed(() => levelKeyFromProfile(appState.snapshot.profile.level));
const currentLevel = computed(
  () => painterLevelOptions.find((option) => option.key === currentLevelKey.value) ?? painterLevelOptions[0],
);
const painterLevel = computed(() => appState.snapshot.profile.level || currentLevel.value.profileLevel);
const activeColoringCards = computed(() => {
  const cards = appState.snapshot.coloringCards;
  if (cards.length <= 3 || currentLevelKey.value === 'novice') {
    return cards;
  }
  // 接口暂未返回年龄段字段，H5 用稳定切片表达“等级筛选资源”的本地复刻语义。
  const startIndex = currentLevelKey.value === 'skilled' ? Math.min(2, cards.length - 1) : Math.min(4, cards.length - 1);
  const filteredCards = cards.slice(startIndex);
  return filteredCards.length ? filteredCards : cards;
});
const coloringProgress = computed(
  () =>
    `${activeColoringCards.value.filter((card) => appState.completedColoringCardIds.includes(card.id)).length}/${
      activeColoringCards.value.length || 8
    }完成`,
);
const selectedScene = ref<InteractiveScene | null>(null);
const showLevelSheet = ref(false);
const showCardMakerSheet = ref(false);
const selectedLevelKey = ref<PainterLevelKey>(currentLevelKey.value);

const unlockCard = computed(() => appState.pendingUnlockColoringCard);
const unlockBalanceEnough = computed(() => {
  const card = unlockCard.value;
  return Boolean(card && appState.snapshot.profile.diamonds >= card.price);
});
const sceneCards = computed(() => {
  if (!selectedScene.value) {
    return [];
  }
  const cards = activeColoringCards.value;
  if (!cards.length) {
    return [];
  }
  // 互动场景接口当前没有下发资源明细，H5 复刻按场景序号稳定切片，表达“场景 -> 资源列表 -> 进入涂色”的 APP 链路。
  const sceneIndex = Math.max(
    0,
    appState.snapshot.interactiveScenes.findIndex((scene) => scene.id === selectedScene.value?.id),
  );
  const start = (sceneIndex * 3) % cards.length;
  return Array.from({ length: Math.min(4, cards.length) }, (_, index) => cards[(start + index) % cards.length]).filter(
    (card): card is ColoringCard => Boolean(card),
  );
});

function openScene(scene: InteractiveScene) {
  selectedScene.value = scene;
  console.info('[coloring] 打开互动场景资源列表', {
    sceneId: scene.id,
    resourceCount: sceneCards.value.length,
  });
}

function openSceneCard(card: ColoringCard) {
  console.info('[coloring] 从互动场景进入涂色资源', { cardId: card.id, sceneId: selectedScene.value?.id });
  selectedScene.value = null;
  openColoringCanvas(card);
}

function openLevelSelection() {
  selectedLevelKey.value = currentLevelKey.value;
  showLevelSheet.value = true;
  console.info('[coloring] 打开等级选择弹层', { currentLevel: painterLevel.value });
}

function selectPainterLevel(levelKey: PainterLevelKey) {
  selectedLevelKey.value = levelKey;
  console.info('[coloring] 本地选择涂色等级', { levelKey });
}

function confirmPainterLevel() {
  const option = painterLevelOptions.find((item) => item.key === selectedLevelKey.value) ?? painterLevelOptions[0];
  appState.snapshot.profile.level = option.profileLevel;
  showLevelSheet.value = false;
  showToast(`已切换到${option.title}`);
  console.info('[coloring] 本地更新涂色等级并刷新资源标注', {
    level: option.profileLevel,
    visibleCardCount: activeColoringCards.value.length,
  });
}

function openCardMakerGuide() {
  showCardMakerSheet.value = true;
  console.info('[coloring] 打开制作涂色卡说明');
}

function goToCardMakerCamera() {
  showCardMakerSheet.value = false;
  showToast('已进入拍摄页制作涂色卡');
  console.info('[coloring] 制作涂色卡跳转拍摄入口');
  openCaptureEntry('coloring-card-maker');
}
</script>

<template>
  <ColoringCanvas v-if="appState.selectedColoringCard" :card="appState.selectedColoringCard" />

  <section v-else class="coloring-page page-scroll">
    <header class="coloring-hero">
      <div>
        <RemoteImage :src="appState.snapshot.profile.avatar" alt="头像" />
      </div>
      <section>
        <h1>小画家,你好!</h1>
        <p>准备好开始创作了吗?</p>
      </section>
      <span class="level-pill">{{ painterLevel }}</span>
    </header>

    <div class="coloring-entry-row">
      <button class="coloring-entry yellow" @click="openLevelSelection">
        <Palette :size="24" />
        <span>开始闯关</span>
      </button>
      <button class="coloring-entry blue" @click="openCardMakerGuide">
        <Printer :size="24" />
        <span>制作涂色卡</span>
      </button>
    </div>

    <section class="interactive-block">
      <h2>互动场景</h2>
      <button
        v-for="scene in appState.snapshot.interactiveScenes"
        :key="scene.id"
        class="scene-card"
        @click="openScene(scene)"
      >
        <RemoteImage :src="scene.cover.url" :alt="scene.cover.alt" />
        <div>
          <h3>{{ scene.title }}</h3>
          <p>{{ scene.description }}</p>
          <span>{{ scene.progress.done }}/{{ scene.progress.total }} 完成</span>
        </div>
      </button>
    </section>

    <section class="coloring-grid-section">
      <div class="section-title-row">
        <h2>入门·水果蔬菜</h2>
        <strong>待开始</strong>
        <span>{{ coloringProgress }}</span>
      </div>
      <div class="coloring-grid">
        <button
          v-for="card in activeColoringCards"
          :key="card.id"
          class="coloring-card"
          :class="{ locked: isColoringCardLocked(card), completed: appState.completedColoringCardIds.includes(card.id) }"
          @click="openColoringCanvas(card)"
        >
          <RemoteImage :src="card.image.url" :alt="card.image.alt" />
          <span class="coloring-card__level">{{ currentLevel.title }}</span>
          <span>{{ card.title }}</span>
          <Lock v-if="isColoringCardLocked(card)" class="lock-icon" :size="22" />
        </button>
      </div>
    </section>

    <BottomSheet title="选择挑战等级" :open="showLevelSheet" tone="light" @close="showLevelSheet = false">
      <div class="level-selection-sheet">
        <button
          v-for="option in painterLevelOptions"
          :key="option.key"
          class="level-option-card"
          :class="{ active: selectedLevelKey === option.key }"
          @click="selectPainterLevel(option.key)"
        >
          <div>
            <strong>{{ option.title }}</strong>
            <span>{{ option.age }}</span>
          </div>
          <p>{{ option.description }}</p>
          <CheckCircle2 v-if="selectedLevelKey === option.key" :size="22" />
        </button>
        <button class="primary-button" @click="confirmPainterLevel">
          <Sparkles :size="20" />
          <span>开启创作之旅</span>
        </button>
      </div>
    </BottomSheet>

    <BottomSheet title="制作涂色卡" :open="showCardMakerSheet" tone="light" @close="showCardMakerSheet = false">
      <div class="card-maker-sheet">
        <Printer :size="40" />
        <h3>拍一张线稿或作品</h3>
        <p>H5 当前复用拍摄入口展示制作链路，导入或模拟拍摄后会停留在本地扫描结果，不提交真实上传接口。</p>
        <button class="primary-button" @click="goToCardMakerCamera">去拍摄制作</button>
        <button class="secondary-button" @click="showCardMakerSheet = false">稍后再做</button>
      </div>
    </BottomSheet>

    <BottomSheet
      title="解锁涂色卡"
      :open="Boolean(unlockCard)"
      tone="light"
      @close="closeColoringUnlockSheet"
    >
      <div v-if="unlockCard" class="coloring-unlock-sheet">
        <RemoteImage :src="unlockCard.image.url" :alt="unlockCard.image.alt" />
        <div class="unlock-summary">
          <h3>{{ unlockCard.title }}</h3>
          <p>余额 {{ appState.snapshot.profile.diamonds }} 钻石 · 解锁需 {{ unlockCard.price }} 钻石</p>
        </div>
        <button class="primary-button" :disabled="!isVipAvailable()" @click="unlockColoringCard('vip')">
          <Sparkles :size="20" />
          <span>{{ isVipAvailable() ? '使用 VIP 权益解锁' : 'VIP 权益未生效' }}</span>
        </button>
        <button class="secondary-button unlock-diamond-button" :disabled="!unlockBalanceEnough" @click="unlockColoringCard('diamond')">
          <Gem :size="20" />
          <span>{{ unlockBalanceEnough ? '用钻石解锁并进入' : '钻石不足，保留充值入口' }}</span>
        </button>
      </div>
    </BottomSheet>

    <BottomSheet
      :title="selectedScene?.title ?? '互动场景'"
      :open="Boolean(selectedScene)"
      tone="light"
      @close="selectedScene = null"
    >
      <div v-if="selectedScene" class="scene-resource-sheet">
        <RemoteImage :src="selectedScene.cover.url" :alt="selectedScene.cover.alt" />
        <p>{{ selectedScene.description || '选择一个资源进入涂色挑战' }}</p>
        <div class="scene-resource-grid">
          <button v-for="card in sceneCards" :key="card.id" class="scene-resource-card" @click="openSceneCard(card)">
            <RemoteImage :src="card.image.url" :alt="card.image.alt" />
            <span>{{ card.title }}</span>
            <Lock v-if="isColoringCardLocked(card)" :size="18" />
          </button>
        </div>
      </div>
    </BottomSheet>
  </section>
</template>
