<script setup lang="ts">
import { appState } from '@/app/model';
</script>

<template>
  <Transition name="toast">
    <div v-if="appState.toast" class="toast-host" role="status">
      {{ appState.toast.message }}
    </div>
  </Transition>
</template>

