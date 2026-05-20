<script setup lang="ts">
import { X } from 'lucide-vue-next';

defineProps<{
  title: string;
  open: boolean;
  tone?: 'dark' | 'light';
}>();

const emit = defineEmits<{
  close: [];
}>();
</script>

<template>
  <div v-if="open" class="sheet-mask" @click.self="emit('close')">
    <section class="sheet-panel" :class="{ 'sheet-panel--light': tone === 'light' }" role="dialog" :aria-label="title">
      <header class="sheet-panel__header">
        <h2>{{ title }}</h2>
        <button class="icon-button" aria-label="关闭" @click="emit('close')">
          <X :size="22" />
        </button>
      </header>
      <div class="sheet-panel__body">
        <slot />
      </div>
    </section>
  </div>
</template>
