<script setup lang="ts">
import { Gem, Infinity, Rocket, Sparkles } from 'lucide-vue-next';
import { appState } from '@/app/model';
</script>

<template>
  <div class="wallet-sheet">
    <section class="wallet-balance">
      <Gem :size="28" />
      <div>
        <span>钻石余额</span>
        <strong>{{ appState.snapshot.profile.diamonds }}</strong>
      </div>
    </section>

    <div class="wallet-list">
      <article>
        <Sparkles :size="22" />
        <div>
          <strong>专属视频玩法</strong>
          <span>神笔马良、入画探险、绘画跳舞</span>
        </div>
      </article>
      <article>
        <Infinity :size="22" />
        <div>
          <strong>生图不限次</strong>
          <span>会员有效期内优先生成</span>
        </div>
      </article>
      <article>
        <Rocket :size="22" />
        <div>
          <strong>快速生成</strong>
          <span>{{ appState.snapshot.profile.vipExpire }} 到期</span>
        </div>
      </article>
    </div>
  </div>
</template>

