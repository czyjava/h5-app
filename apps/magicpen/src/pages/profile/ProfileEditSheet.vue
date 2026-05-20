<script setup lang="ts">
import { CalendarDays, Smartphone, UserRound } from 'lucide-vue-next';
import { appState, showToast } from '@/app/model';
import RemoteImage from '@/shared/ui/RemoteImage.vue';
</script>

<template>
  <div class="profile-edit">
    <RemoteImage :src="appState.snapshot.profile.avatar" alt="用户头像" />
    <button class="secondary-button" @click="showToast('头像上传已隔离')">更换头像</button>
    <div class="profile-edit__rows">
      <label>
        <UserRound :size="19" />
        <span>昵称</span>
        <input v-model="appState.snapshot.profile.nickname" />
      </label>
      <label>
        <CalendarDays :size="19" />
        <span>生日</span>
        <input value="未设置" readonly />
      </label>
      <label>
        <Smartphone :size="19" />
        <span>手机号</span>
        <input value="已绑定" readonly />
      </label>
    </div>
  </div>
</template>

