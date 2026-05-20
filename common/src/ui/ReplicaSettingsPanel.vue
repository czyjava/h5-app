<script setup lang="ts">
import { computed } from 'vue';
import { ChevronRight, CircleCheck, FlaskConical, MessageSquare, Server, ShieldCheck, UserRound } from 'lucide-vue-next';
import type { ReplicaEnvironment } from '../types.ts';
import type { ReplicaSettingsEnvironment, ReplicaSettingsRow } from './types.ts';

defineOptions({ name: 'ReplicaSettingsPanel' });

const props = withDefaults(
  defineProps<{
    environments: ReplicaSettingsEnvironment[];
    activeEnvironment: ReplicaEnvironment;
    switchingEnvironment?: boolean;
    rows?: ReplicaSettingsRow[];
    environmentTitle?: string;
  }>(),
  {
    switchingEnvironment: false,
    environmentTitle: '接口环境',
    rows: () => [
      { key: 'profile', label: '编辑资料', icon: 'profile' },
      { key: 'feedback', label: '意见反馈', icon: 'feedback' },
    ],
  },
);

const emit = defineEmits<{
  chooseEnvironment: [environment: ReplicaEnvironment];
  rowClick: [row: ReplicaSettingsRow];
}>();

const activeEnvironmentLabel = computed(
  () => props.environments.find((option) => option.key === props.activeEnvironment)?.label ?? props.activeEnvironment,
);
</script>

<template>
  <div class="settings-list">
    <section class="settings-environment">
      <header>
        <div>
          <Server :size="19" />
          <span>{{ environmentTitle }}</span>
        </div>
        <strong>{{ activeEnvironmentLabel }}</strong>
      </header>

      <div class="settings-env-options" role="radiogroup" aria-label="业务接口环境">
        <label
          v-for="option in environments"
          :key="option.key"
          class="settings-env-option"
          :class="{ active: activeEnvironment === option.key }"
        >
          <input
            type="radio"
            name="replica-api-environment"
            :aria-label="option.label"
            :checked="activeEnvironment === option.key"
            :disabled="switchingEnvironment"
            @change="emit('chooseEnvironment', option.key)"
          />
          <span class="settings-env-radio">
            <CircleCheck v-if="activeEnvironment === option.key" :size="18" />
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

    <button v-for="row in rows" :key="row.key" type="button" @click="emit('rowClick', row)">
      <UserRound v-if="row.icon === 'profile' || row.key === 'profile'" :size="20" />
      <MessageSquare v-else-if="row.icon === 'feedback' || row.label.includes('反馈')" :size="20" />
      <ShieldCheck v-else :size="20" />
      <span>{{ row.label }}</span>
      <ChevronRight :size="18" />
    </button>
  </div>
</template>

<style scoped>
.settings-list {
  display: grid;
  gap: 10px;
  color: #fff;
}

.settings-list button {
  min-height: 60px;
  display: grid;
  grid-template-columns: 32px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 14px;
  border: 0;
  border-radius: 12px;
  color: #fff;
  background: #24272f;
  text-align: left;
}

.settings-list button span {
  font-weight: 820;
}

.settings-environment {
  display: grid;
  gap: 12px;
  padding: 14px;
  border-radius: 14px;
  background: #24272f;
}

.settings-environment header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.settings-environment header > div,
.settings-env-copy strong {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.settings-environment header strong {
  color: #62e6c6;
  font-size: 13px;
}

.settings-env-options {
  display: grid;
  gap: 8px;
}

.settings-env-option {
  position: relative;
  min-width: 0;
  display: grid;
  grid-template-columns: 24px 1fr;
  gap: 10px;
  align-items: center;
  padding: 12px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: #11131a;
  cursor: pointer;
}

.settings-env-option.active {
  border-color: rgba(88, 150, 255, 0.72);
  background: linear-gradient(135deg, rgba(49, 95, 255, 0.34), rgba(20, 158, 198, 0.16)), #11131a;
}

.settings-env-option input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.settings-env-radio {
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  border: 2px solid rgba(255, 255, 255, 0.38);
  border-radius: 50%;
  color: #62e6c6;
}

.settings-env-option.active .settings-env-radio {
  border-color: #62e6c6;
}

.settings-env-copy {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.settings-env-copy small {
  min-width: 0;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.56);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
