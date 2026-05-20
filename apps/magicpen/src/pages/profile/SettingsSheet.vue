<script setup lang="ts">
import { computed, ref } from 'vue';
import { ChevronRight, CircleCheck, FlaskConical, MessageSquare, Server, ShieldCheck, UserRound } from 'lucide-vue-next';
import { appState, bootstrapApp, showToast } from '@/app/model';
import { sessionState, setApiEnvironment } from '@/entities/session/model';
import {
  MAGICPEN_BUSINESS_ENVIRONMENTS,
  businessHostNameForEnvironment,
  type MagicPenApiEnvironment,
} from '@/shared/config/endpoints';

const rows = [
  { label: '编辑资料', type: 'profile' },
  { label: '意见反馈', type: 'feedback' },
];
const switchingEnvironment = ref(false);
const environmentOptions = (Object.keys(MAGICPEN_BUSINESS_ENVIRONMENTS) as MagicPenApiEnvironment[]).map((key) => ({
  key,
  label: MAGICPEN_BUSINESS_ENVIRONMENTS[key].label,
  host: businessHostNameForEnvironment(key),
}));
const activeEnvironmentLabel = computed(() => MAGICPEN_BUSINESS_ENVIRONMENTS[sessionState.apiEnvironment].label);

async function chooseEnvironment(environment: MagicPenApiEnvironment) {
  if (environment === sessionState.apiEnvironment || switchingEnvironment.value) {
    return;
  }

  setApiEnvironment(environment);
  switchingEnvironment.value = true;
  try {
    await bootstrapApp();
    showToast(`已切换到${MAGICPEN_BUSINESS_ENVIRONMENTS[environment].label}`);
  } catch {
    // bootstrapApp 内部已经兜底并提示错误，这里只负责恢复按钮状态。
  } finally {
    switchingEnvironment.value = false;
  }
}

function onRowClick(type: string) {
  if (type === 'profile') {
    appState.activeOverlay = 'profileEdit';
    return;
  }
  showToast('反馈入口已保留，后续接入真实业务接口');
}
</script>

<template>
  <div class="settings-list">
    <section class="settings-environment">
      <header>
        <div>
          <Server :size="19" />
          <span>接口环境</span>
        </div>
        <strong>{{ activeEnvironmentLabel }}</strong>
      </header>

      <div class="settings-env-options" role="radiogroup" aria-label="业务接口环境">
        <label
          v-for="option in environmentOptions"
          :key="option.key"
          class="settings-env-option"
          :class="{ active: sessionState.apiEnvironment === option.key }"
        >
          <input
            type="radio"
            name="magicpen-api-environment"
            :aria-label="option.label"
            :checked="sessionState.apiEnvironment === option.key"
            :disabled="switchingEnvironment"
            @change="chooseEnvironment(option.key)"
          />
          <span class="settings-env-radio">
            <CircleCheck v-if="sessionState.apiEnvironment === option.key" :size="18" />
          </span>
          <span class="settings-env-copy">
            <strong>
              <FlaskConical v-if="option.key === 'test'" :size="17" />
              <Server v-else :size="17" />
              {{ option.label }}
            </strong>
            <small>{{ option.host }}</small>
          </span>
        </label>
      </div>
    </section>

    <button v-for="row in rows" :key="row.label" @click="onRowClick(row.type)">
      <UserRound v-if="row.type === 'profile'" :size="20" />
      <MessageSquare v-else-if="row.label.includes('反馈')" :size="20" />
      <ShieldCheck v-else :size="20" />
      <span>{{ row.label }}</span>
      <ChevronRight :size="18" />
    </button>
  </div>
</template>
