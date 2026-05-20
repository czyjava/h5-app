<script setup lang="ts">
import { computed } from 'vue';
import { ChevronLeft, ChevronRight, Gem } from 'lucide-vue-next';
import { appState, closeOverlay, replicaDiamondBills, showToast } from '@/app/model';
import { sessionState } from '@/entities/session/model';

const bills = computed(() => {
  if (appState.snapshot.tokenBills.length || sessionState.authToken) {
    return appState.snapshot.tokenBills;
  }
  return replicaDiamondBills;
});
const balance = computed(() => {
  if (appState.snapshot.profile.diamonds || sessionState.authToken) {
    return appState.snapshot.profile.diamonds;
  }
  return 3210;
});

function amountText(amount: number) {
  return `${amount > 0 ? '+' : ''}${amount}`;
}

function openRecharge() {
  showToast('充值入口已对齐展示，当前不会提交支付');
}
</script>

<template>
  <div class="diamond-detail-sheet">
    <header class="diamond-detail-header">
      <button aria-label="返回我的" @click="closeOverlay">
        <ChevronLeft :size="24" />
      </button>
      <h1>钻石明细</h1>
      <span />
    </header>

    <section class="diamond-detail-balance">
      <div>
        <span>我的钻石</span>
        <strong>{{ balance }}</strong>
      </div>
      <button @click="openRecharge">
        <span>立即充值</span>
        <ChevronRight :size="16" />
      </button>
      <Gem :size="92" />
    </section>

    <section class="diamond-bill-section">
      <h3>钻石明细</h3>
      <div v-if="bills.length" class="diamond-bill-list">
        <article v-for="bill in bills" :key="bill.id" class="diamond-bill-row">
          <div>
            <strong>{{ bill.title }}</strong>
            <span>{{ bill.time }}</span>
          </div>
          <em :class="{ income: bill.amount > 0 }">{{ amountText(bill.amount) }}</em>
        </article>
      </div>
      <p v-else class="diamond-bill-empty">暂无钻石明细</p>
    </section>
  </div>
</template>
