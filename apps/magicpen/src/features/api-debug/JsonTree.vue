<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';

defineOptions({ name: 'JsonTree' });

interface JsonEntry {
  key: string;
  value: unknown;
}

const props = withDefaults(
  defineProps<{
    data: unknown;
    label?: string;
    defaultExpanded?: boolean;
  }>(),
  {
    label: 'root',
    defaultExpanded: false,
  },
);

const expanded = ref(props.defaultExpanded);

watch(
  () => props.data,
  () => {
    expanded.value = props.defaultExpanded;
  },
);

const isArrayNode = computed(() => Array.isArray(props.data));
const isObjectNode = computed(() => isPlainObject(props.data));
const canToggle = computed(() => isArrayNode.value || isObjectNode.value);

const entries = computed<JsonEntry[]>(() => {
  if (Array.isArray(props.data)) {
    return props.data.map((value, index) => ({ key: String(index), value }));
  }
  if (isPlainObject(props.data)) {
    return Object.entries(props.data).map(([key, value]) => ({ key, value }));
  }
  return [];
});

const nodeSummary = computed(() => {
  const count = entries.value.length;
  if (isArrayNode.value) {
    return `Array(${count})`;
  }
  if (isObjectNode.value) {
    return `Object(${count})`;
  }
  return primitivePreview(props.data);
});

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function primitiveClass(value: unknown) {
  if (value === null) {
    return 'null';
  }
  return typeof value;
}

function primitivePreview(value: unknown) {
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (value === null) {
    return 'null';
  }
  return String(value);
}

function keyLabel(key: string) {
  return Array.isArray(props.data) ? `[${key}]` : key;
}
</script>

<template>
  <div class="json-node">
    <div class="json-line">
      <button
        v-if="canToggle"
        class="json-toggle"
        type="button"
        :aria-label="expanded ? `折叠 ${label}` : `展开 ${label}`"
        @click="expanded = !expanded"
      >
        <ChevronRight :size="14" :class="{ expanded }" />
      </button>
      <span v-else class="json-spacer" aria-hidden="true"></span>

      <span class="json-key">{{ label }}</span>
      <span class="json-colon">:</span>

      <template v-if="canToggle">
        <span class="json-kind">{{ nodeSummary }}</span>
        <span v-if="!expanded" class="json-preview">{{ isArrayNode ? '[...]' : '{...}' }}</span>
      </template>
      <span v-else :class="['json-primitive', primitiveClass(data)]">{{ primitivePreview(data) }}</span>
    </div>

    <div v-if="canToggle && expanded" class="json-children">
      <JsonTree
        v-for="entry in entries"
        :key="entry.key"
        :label="keyLabel(entry.key)"
        :data="entry.value"
        :default-expanded="false"
      />
      <p v-if="entries.length === 0" class="json-empty">{{ isArrayNode ? '空数组' : '空对象' }}</p>
    </div>
  </div>
</template>

<style scoped>
.json-node {
  min-width: 0;
  color: #172033;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
  font-size: 12px;
  line-height: 1.62;
}

.json-line {
  min-height: 24px;
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
}

.json-toggle {
  width: 20px;
  height: 20px;
  display: inline-grid;
  flex: 0 0 auto;
  place-items: center;
  color: #475569;
  background: transparent;
  border: 0;
  border-radius: 4px;
}

.json-toggle:hover {
  color: #155eef;
  background: #eef4ff;
}

.json-toggle svg {
  transition: transform 0.16s ease;
}

.json-toggle svg.expanded {
  transform: rotate(90deg);
}

.json-spacer {
  width: 20px;
  flex: 0 0 auto;
}

.json-key {
  color: #1d4ed8;
  font-weight: 760;
}

.json-colon {
  color: #64748b;
}

.json-kind,
.json-preview {
  color: #64748b;
}

.json-primitive.string {
  color: #047857;
}

.json-primitive.number {
  color: #b45309;
}

.json-primitive.boolean {
  color: #7c3aed;
}

.json-primitive.null {
  color: #64748b;
  font-style: italic;
}

.json-children {
  margin-left: 22px;
  padding-left: 12px;
  border-left: 1px solid #dbe5f1;
}

.json-empty {
  margin: 4px 0;
  color: #94a3b8;
}
</style>
