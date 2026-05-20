<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  ArrowLeft,
  Baby,
  Check,
  Crop,
  HelpCircle,
  ImagePlus,
  RotateCcw,
  Save,
  Shirt,
  Sparkles,
  Squirrel,
  Sun,
  Waves,
} from 'lucide-vue-next';
import { showToast, switchTab } from '@/app/model';

const modes = [
  { key: 'scan', label: '扫描绘画', template: '扫描模板', description: '识别线稿边界后进入校正' },
  { key: 'teach', label: '教我画画', template: '步骤模板', description: '生成临摹步骤与描红参考' },
  { key: 'motion', label: '动起来', template: '动画模板', description: '保留 APP 动画语义展示' },
  { key: 'color', label: '绘画上色', template: '上色模板', description: '导入线稿后进入涂色准备' },
  { key: 'style', label: '换风格', template: '风格模板', description: '导入图片后模拟风格检查' },
];
const categories = [
  { label: '简笔画', icon: Sun },
  { label: '人物画', icon: Baby },
  { label: '动物画', icon: Squirrel },
  { label: '服装画', icon: Shirt },
  { label: '涂鸦绘画', icon: Waves },
];
type ScanStep = 'ready' | 'captured' | 'correcting' | 'saved';

const activeModeKey = ref(modes[0].key);
const scanStep = ref<ScanStep>('ready');
const importedImage = ref('');
const mockCapturedImage =
  'https://wanmeixiangsu.oss-cn-hangzhou.aliyuncs.com/magicpen/h5-replica/camera-scan-placeholder.png';

const activeMode = computed(() => modes.find((mode) => mode.key === activeModeKey.value) ?? modes[0]);
const stepItems = computed(() => [
  { key: 'ready', label: '扫描取图' },
  { key: 'captured', label: '扫描结果' },
  { key: 'correcting', label: '校正边框' },
  { key: 'saved', label: '保存结果' },
]);
const previewImage = computed(() => importedImage.value || (scanStep.value === 'ready' ? '' : mockCapturedImage));
const resultHint = computed(() => {
  if (scanStep.value === 'saved') {
    return '已保存到 H5 本地结果，可返回继续创作';
  }
  if (scanStep.value === 'correcting') {
    return '拖拽校正点在 H5 中以可视化 mock 表达';
  }
  if (scanStep.value === 'captured') {
    return '已生成扫描结果，下一步进入边框校正';
  }
  return `${activeMode.value.template} · 单图固定模式`;
});

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) {
    return;
  }
  importedImage.value = URL.createObjectURL(file);
  scanStep.value = 'captured';
  console.info('[camera] H5 导入图片并进入扫描结果', { mode: activeMode.value.key, fileType: file.type });
  showToast('已导入图片，进入扫描结果');
}

function captureMockImage() {
  // 浏览器不能直接复刻 APP 原生相机链路，这里用固定单图流程表达“拍摄 -> 扫描结果”。
  scanStep.value = 'captured';
  console.info('[camera] H5 模拟拍摄完成', { mode: activeMode.value.key });
  showToast('已模拟拍摄，进入扫描结果');
}

function moveToCorrecting() {
  scanStep.value = 'correcting';
  console.info('[camera] 进入扫描校正步骤', { mode: activeMode.value.key });
}

function saveScanResult() {
  scanStep.value = 'saved';
  console.info('[camera] H5 本地保存扫描结果', { mode: activeMode.value.key, hasImportedImage: Boolean(importedImage.value) });
  showToast('扫描结果已保存到本地流程');
}

function resetScanFlow() {
  scanStep.value = 'ready';
  console.info('[camera] 重置扫描流程', { mode: activeMode.value.key });
}
</script>

<template>
  <section class="camera-page">
    <header class="camera-top">
      <button class="icon-button" aria-label="返回" @click="switchTab('home')">
        <ArrowLeft :size="28" />
      </button>
      <button class="icon-button" aria-label="帮助">
        <HelpCircle :size="24" />
      </button>
    </header>

    <div class="camera-preview">
      <img
        v-if="previewImage"
        :src="previewImage"
        alt="本地导入预览"
        class="camera-preview__image"
      />
      <div v-else class="camera-empty-state">
        <strong>{{ activeMode.template }}</strong>
        <span>{{ activeMode.description }}</span>
      </div>
      <div class="camera-grid-lines">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div v-if="scanStep !== 'ready'" class="scan-corners" :class="{ correcting: scanStep === 'correcting' }">
        <span />
        <span />
        <span />
        <span />
      </div>

      <div class="capture-toggle" aria-label="拍摄模式">
        <button class="active">拍单图</button>
        <button disabled>多图暂不可用</button>
      </div>

      <div class="scan-result-card">
        <strong>{{ resultHint }}</strong>
        <span>{{ activeMode.label }} · {{ activeMode.description }}</span>
      </div>
    </div>

    <div class="scan-step-row" aria-label="扫描步骤">
      <span
        v-for="(item, index) in stepItems"
        :key="item.key"
        :class="{ active: stepItems.findIndex((step) => step.key === scanStep) >= index }"
      >
        {{ item.label }}
      </span>
    </div>

    <div class="mode-strip">
      <button
        v-for="mode in modes"
        :key="mode.key"
        :class="{ active: activeModeKey === mode.key }"
        @click="activeModeKey = mode.key"
      >
        {{ mode.label }}
      </button>
    </div>

    <div class="camera-category-row">
      <button v-for="category in categories" :key="category.label" class="camera-category">
        <component :is="category.icon" :size="28" />
        <span>{{ category.label }}</span>
      </button>
    </div>

    <div class="camera-tool-row">
      <button class="tool-button" @click="showToast('已切换闪光灯状态')">
        <Sparkles :size="24" />
        <span>闪光灯</span>
      </button>
      <button v-if="scanStep === 'ready'" class="shutter-button" aria-label="拍摄" @click="captureMockImage">
        <span />
      </button>
      <button v-else-if="scanStep === 'captured'" class="shutter-action" aria-label="校正" @click="moveToCorrecting">
        <Crop :size="25" />
      </button>
      <button v-else-if="scanStep === 'correcting'" class="shutter-action" aria-label="保存" @click="saveScanResult">
        <Save :size="25" />
      </button>
      <button v-else class="shutter-action" aria-label="完成" @click="resetScanFlow">
        <Check :size="25" />
      </button>
      <label class="tool-button import-button">
        <ImagePlus v-if="scanStep === 'ready'" :size="25" />
        <RotateCcw v-else :size="25" />
        <span>{{ scanStep === 'ready' ? '相册导入' : '重新扫描' }}</span>
        <input type="file" accept="image/png,image/jpeg" @change="onFileChange" />
      </label>
    </div>
  </section>
</template>
