<script setup lang="ts">
defineProps<{
  src: string;
  alt: string;
}>();
</script>

<template>
  <img v-if="src" class="remote-image" :src="src" :alt="alt" loading="eager" decoding="async" />
  <span v-else class="remote-image remote-image--empty" role="img" :aria-label="alt" />
</template>
