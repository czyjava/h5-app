<script setup lang="ts">
import { Activity, RefreshCw, Search, Trash2, Wifi, WifiOff, X } from 'lucide-vue-next';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import JsonTree from './JsonTree.vue';

type ProxyPhase =
  | 'accepted'
  | 'signing'
  | 'signed-request'
  | 'upstream-request'
  | 'upstream-response'
  | 'response-body'
  | 'completed'
  | 'error'
  | 'cleared';

interface BodyPreview {
  size: number;
  text: string;
  truncated: boolean;
  contentType?: string;
}

interface ProxyLifecycleEvent {
  id: string;
  sequence: number;
  time: string;
  phase: ProxyPhase;
  method?: string;
  localUrl?: string;
  upstreamUrl?: string;
  prefix?: string;
  status?: number;
  statusText?: string;
  durationMs?: number;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  requestBody?: BodyPreview;
  responseBody?: BodyPreview;
  signing?: {
    algorithm: string;
    addedParams: string[];
    unsignedUrl: string;
    signedUrl: string;
  };
  error?: string;
}

interface ProxyRequestGroup {
  id: string;
  method: string;
  localUrl: string;
  upstreamUrl: string;
  phase: ProxyPhase;
  status?: number;
  statusText?: string;
  durationMs?: number;
  latestTime: string;
  latestSequence: number;
  events: ProxyLifecycleEvent[];
}

interface RawExchange {
  request: {
    id: string;
    method: string;
    browserUrl: string;
    upstreamUrl: string;
    headers: Record<string, string>;
    body: string;
    bodySize: number;
    bodyContentType?: string;
    bodyTruncated: boolean;
  };
  response: {
    status?: number;
    statusText?: string;
    headers: Record<string, string>;
    body: string;
    bodySize: number;
    bodyContentType?: string;
    bodyTruncated: boolean;
    durationMs?: number;
    error?: string;
  };
}

type StatusFilter = 'all' | 'success' | 'warn' | 'error' | 'pending';
type DetailTab = 'headers' | 'payload' | 'response';

const props = withDefaults(defineProps<{ pageMode?: boolean }>(), {
  pageMode: false,
});

const connected = ref(false);
const loading = ref(false);
const events = ref<ProxyLifecycleEvent[]>([]);
const selectedId = ref('');
const selectedDomain = ref('all');
const selectedStatus = ref<StatusFilter>('all');
const selectedDetailTab = ref<DetailTab>('headers');
const searchKeyword = ref('');
const debugPageUrl = `${window.location.origin}${window.location.pathname}#/api-debug`;
let eventSource: EventSource | null = null;

const statusFilterOptions: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'success', label: '2xx' },
  { value: 'warn', label: '3xx' },
  { value: 'error', label: '错误' },
  { value: 'pending', label: '等待' },
];

const detailTabs: { value: DetailTab; label: string }[] = [
  { value: 'headers', label: 'Headers' },
  { value: 'payload', label: 'Payload' },
  { value: 'response', label: 'Response' },
];

const requestGroups = computed<ProxyRequestGroup[]>(() => {
  const groups = new Map<string, ProxyRequestGroup>();
  for (const event of events.value) {
    if (event.phase === 'cleared') {
      continue;
    }
    const group =
      groups.get(event.id) ??
      ({
        id: event.id,
        method: event.method ?? 'GET',
        localUrl: event.localUrl ?? '',
        upstreamUrl: event.upstreamUrl ?? '',
        phase: event.phase,
        latestTime: event.time,
        latestSequence: event.sequence,
        events: [],
      } satisfies ProxyRequestGroup);

    group.method = event.method ?? group.method;
    group.localUrl = event.localUrl ?? group.localUrl;
    group.upstreamUrl = event.upstreamUrl ?? group.upstreamUrl;
    group.phase = event.phase;
    group.status = event.status ?? group.status;
    group.statusText = event.statusText ?? group.statusText;
    group.durationMs = event.durationMs ?? group.durationMs;
    group.latestTime = event.time;
    group.latestSequence = event.sequence;
    group.events.push(event);
    groups.set(event.id, group);
  }

  return Array.from(groups.values()).sort((left, right) => right.latestSequence - left.latestSequence);
});

const domainOptions = computed(() => {
  return Array.from(new Set(requestGroups.value.map((group) => domainLabel(group)))).sort((left, right) =>
    left.localeCompare(right),
  );
});

const domainFilteredRequestGroups = computed(() => {
  if (selectedDomain.value === 'all') {
    return requestGroups.value;
  }
  return requestGroups.value.filter((group) => domainLabel(group) === selectedDomain.value);
});

const filteredRequestGroups = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();

  // 调试页按 Network 面板习惯做组合过滤：先收窄域名，再叠加状态与关键词。
  return domainFilteredRequestGroups.value.filter((group) => {
    if (selectedStatus.value !== 'all' && statusBucket(group) !== selectedStatus.value) {
      return false;
    }

    if (!keyword) {
      return true;
    }

    const searchableText = [
      group.id,
      group.method,
      group.localUrl,
      group.upstreamUrl,
      domainLabel(group),
      shortUrl(group.upstreamUrl || group.localUrl),
      statusLabel(group),
    ]
      .join(' ')
      .toLowerCase();
    return searchableText.includes(keyword);
  });
});

const selectedGroup = computed(() => {
  return filteredRequestGroups.value.find((group) => group.id === selectedId.value) ?? filteredRequestGroups.value[0] ?? null;
});

const selectedExchange = computed<RawExchange | null>(() => {
  if (!selectedGroup.value) {
    return null;
  }
  return buildRawExchange(selectedGroup.value);
});

const parsedResponseBody = computed(() => parseJsonBody(selectedExchange.value?.response.body ?? ''));

const completedCount = computed(() => requestGroups.value.filter((group) => group.phase === 'completed').length);
const errorCount = computed(() => requestGroups.value.filter((group) => group.phase === 'error').length);
const filteredCompletedCount = computed(() =>
  filteredRequestGroups.value.filter((group) => group.phase === 'completed').length,
);
const filteredErrorCount = computed(() => filteredRequestGroups.value.filter((group) => group.phase === 'error').length);

function latestEvent(group: ProxyRequestGroup, phase: ProxyPhase) {
  return [...group.events].reverse().find((event) => event.phase === phase);
}

function buildRawExchange(group: ProxyRequestGroup): RawExchange {
  const accepted = latestEvent(group, 'accepted');
  const upstreamRequest = latestEvent(group, 'upstream-request');
  const upstreamResponse = latestEvent(group, 'upstream-response');
  const responseBody = latestEvent(group, 'response-body');
  const error = latestEvent(group, 'error');

  // 这里按“真实转发请求 + 上游响应”重组展示，隐藏内部生命周期细节。
  return {
    request: {
      id: group.id,
      method: group.method,
      browserUrl: accepted?.localUrl ?? group.localUrl,
      upstreamUrl: upstreamRequest?.upstreamUrl ?? group.upstreamUrl,
      headers: upstreamRequest?.requestHeaders ?? accepted?.requestHeaders ?? {},
      body: upstreamRequest?.requestBody?.text ?? '',
      bodySize: upstreamRequest?.requestBody?.size ?? 0,
      bodyContentType: upstreamRequest?.requestBody?.contentType,
      bodyTruncated: Boolean(upstreamRequest?.requestBody?.truncated),
    },
    response: {
      status: responseBody?.status ?? upstreamResponse?.status ?? group.status,
      statusText: upstreamResponse?.statusText ?? group.statusText,
      headers: upstreamResponse?.responseHeaders ?? {},
      body: responseBody?.responseBody?.text ?? '',
      bodySize: responseBody?.responseBody?.size ?? 0,
      bodyContentType: responseBody?.responseBody?.contentType,
      bodyTruncated: Boolean(responseBody?.responseBody?.truncated),
      durationMs: group.durationMs,
      error: error?.error,
    },
  };
}

function statusLabel(group: ProxyRequestGroup) {
  if (group.phase === 'error') {
    return 'ERR';
  }
  return group.status ? String(group.status) : '...';
}

function statusBucket(group: ProxyRequestGroup): Exclude<StatusFilter, 'all'> {
  if (group.phase === 'error') {
    return 'error';
  }
  if (!group.status) {
    return 'pending';
  }
  if (group.status >= 200 && group.status < 300) {
    return 'success';
  }
  return group.status >= 400 ? 'error' : 'warn';
}

function statusClass(group: ProxyRequestGroup) {
  return statusBucket(group);
}

function statusFilterCount(filter: StatusFilter) {
  if (filter === 'all') {
    return domainFilteredRequestGroups.value.length;
  }
  return domainFilteredRequestGroups.value.filter((group) => statusBucket(group) === filter).length;
}

function shortUrl(url: string) {
  if (!url) {
    return '等待请求';
  }
  try {
    const parsed = new URL(url, window.location.origin);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

function methodPath(url: string) {
  const path = shortUrl(url);
  return path.length > 1 ? path.split('?')[0] : path;
}

function extractDomain(url: string) {
  if (!url) {
    return '未知域名';
  }
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.host;
  } catch {
    return '未知域名';
  }
}

function domainLabel(group: ProxyRequestGroup) {
  return extractDomain(group.upstreamUrl || group.localUrl);
}

function rawDump(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function parseJsonBody(body: string) {
  const text = body.trim();
  if (!text) {
    return { parsed: false, value: null as unknown };
  }

  try {
    // 响应体可能是普通文本或被截断的 JSON，解析失败时必须保留原文方便排查。
    return { parsed: true, value: JSON.parse(text) as unknown };
  } catch {
    return { parsed: false, value: null as unknown };
  }
}

function formatDuration(duration?: number) {
  if (typeof duration !== 'number') {
    return '-';
  }
  return `${duration} ms`;
}

function formatBytes(size?: number) {
  if (!size) {
    return '-';
  }
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function responseBodySize(group: ProxyRequestGroup) {
  return latestEvent(group, 'response-body')?.responseBody?.size;
}

function typeLabel(group: ProxyRequestGroup) {
  const contentType = latestEvent(group, 'response-body')?.responseBody?.contentType;
  if (!contentType) {
    return '-';
  }
  if (contentType.includes('json')) {
    return 'json';
  }
  if (contentType.includes('html')) {
    return 'html';
  }
  if (contentType.includes('text')) {
    return 'text';
  }
  return contentType.split(';')[0] ?? contentType;
}

function headerEntries(headers: Record<string, string>) {
  return Object.entries(headers).sort(([left], [right]) => left.localeCompare(right));
}

function queryEntries(url: string) {
  try {
    const parsed = new URL(url, window.location.origin);
    return Array.from(parsed.searchParams.entries());
  } catch {
    return [];
  }
}

function selectLatestIfNeeded() {
  if (filteredRequestGroups.value[0] && !filteredRequestGroups.value.some((group) => group.id === selectedId.value)) {
    selectedId.value = filteredRequestGroups.value[0].id;
  }
}

async function loadSnapshot() {
  loading.value = true;
  try {
    const response = await fetch('/__magicpen_proxy_events/snapshot');
    const payload = (await response.json()) as { events?: ProxyLifecycleEvent[] };
    events.value = (payload.events ?? []).slice(-360);
    selectLatestIfNeeded();
  } catch {
    connected.value = false;
  } finally {
    loading.value = false;
  }
}

function connectEventStream() {
  if (eventSource) {
    return;
  }
  // 通过 SSE 接收 Node 代理事件，页面里只展示整理后的 request/response。
  eventSource = new EventSource('/__magicpen_proxy_events/stream');
  eventSource.onopen = () => {
    connected.value = true;
  };
  eventSource.onerror = () => {
    connected.value = false;
  };
  eventSource.onmessage = (message) => {
    const event = JSON.parse(message.data) as ProxyLifecycleEvent;
    if (event.phase === 'cleared') {
      events.value = [];
      selectedId.value = '';
      return;
    }
    events.value = [...events.value, event].slice(-360);
    selectLatestIfNeeded();
  };
}

function closeDebugPage() {
  window.close();
  // 浏览器可能拦截非脚本打开页面的 window.close，此时回到主应用页面。
  window.location.hash = '';
}

async function clearEvents() {
  try {
    await fetch('/__magicpen_proxy_events/clear', { method: 'POST' });
  } finally {
    events.value = [];
    selectedId.value = '';
  }
}

onMounted(() => {
  loadSnapshot();
  connectEventStream();
});

onUnmounted(() => {
  eventSource?.close();
  eventSource = null;
});
</script>

<template>
  <a
    v-if="!props.pageMode"
    class="api-debug-launcher"
    :href="debugPageUrl"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="打开 API 调用列表"
  >
    <Activity :size="18" />
    <span>{{ requestGroups.length }}</span>
  </a>

  <main v-else class="api-debug-page" aria-label="API 调用列表">
    <section class="network-shell" role="region" aria-label="API 调用列表">
      <header class="network-topbar">
        <div class="network-title">
          <strong>Network</strong>
          <span>API 调用列表</span>
          <span :class="['api-debug-connection', connected ? 'online' : 'offline']">
            <Wifi v-if="connected" :size="15" />
            <WifiOff v-else :size="15" />
            {{ connected ? '实时连接' : '未连接' }}
          </span>
        </div>
        <nav class="network-actions">
          <button class="icon-button" aria-label="刷新 API 调用" @click="loadSnapshot">
            <RefreshCw :size="17" :class="{ spinning: loading }" />
          </button>
          <button class="icon-button" aria-label="清空 API 调用" @click="clearEvents">
            <Trash2 :size="17" />
          </button>
          <button class="icon-button" aria-label="关闭 API 调用列表" @click="closeDebugPage">
            <X :size="18" />
          </button>
        </nav>
      </header>

      <div class="network-toolbar">
        <label class="network-search">
          <Search :size="15" />
          <input v-model="searchKeyword" type="search" placeholder="过滤 URL / 域名 / 方法 / 状态" />
        </label>

        <label class="network-select">
          <span>域名</span>
          <select v-model="selectedDomain" @change="selectLatestIfNeeded">
            <option value="all">全部域名</option>
            <option v-for="domain in domainOptions" :key="domain" :value="domain">{{ domain }}</option>
          </select>
        </label>

        <div class="network-status-filter" aria-label="状态过滤">
          <button
            v-for="option in statusFilterOptions"
            :key="option.value"
            :class="{ active: selectedStatus === option.value }"
            @click="
              selectedStatus = option.value;
              selectLatestIfNeeded();
            "
          >
            {{ option.label }}
            <span>{{ statusFilterCount(option.value) }}</span>
          </button>
        </div>

        <div class="network-summary" aria-label="调用统计">
          <span>{{ filteredRequestGroups.length }} / {{ requestGroups.length }} 条</span>
          <span>{{ filteredCompletedCount }} / {{ completedCount }} 完成</span>
          <span>{{ filteredErrorCount }} / {{ errorCount }} 错误</span>
        </div>
      </div>

      <div class="network-layout">
        <section class="network-table-panel" aria-label="API 请求表格">
          <div class="network-table" role="table">
            <div class="network-table-head" role="row" aria-hidden="true">
            <span>状态</span>
              <span>方法</span>
            <span>域名</span>
            <span>请求</span>
              <span>类型</span>
              <span>大小</span>
            <span>耗时</span>
              <span>时间</span>
          </div>

          <button
            v-for="group in filteredRequestGroups"
            :key="group.id"
              :class="['network-row', { active: selectedGroup?.id === group.id }]"
              role="row"
            @click="selectedId = group.id"
          >
            <span :class="['api-status', statusClass(group)]">{{ statusLabel(group) }}</span>
              <span class="method-pill">{{ group.method }}</span>
              <span class="api-domain">{{ domainLabel(group) }}</span>
              <div class="request-cell">
                <strong>{{ methodPath(group.upstreamUrl || group.localUrl) }}</strong>
                <small>{{ shortUrl(group.upstreamUrl || group.localUrl) }}</small>
            </div>
              <span class="type-cell">{{ typeLabel(group) }}</span>
              <span class="size-cell">{{ formatBytes(responseBodySize(group)) }}</span>
              <span class="api-duration">{{ formatDuration(group.durationMs) }}</span>
              <span class="time-cell">{{ group.latestTime }}</span>
          </button>
          </div>
          <p v-if="filteredRequestGroups.length === 0" class="api-debug-empty">等待匹配的 API 请求</p>
        </section>

        <section class="network-detail-panel" aria-label="API 请求与响应详情">
          <template v-if="selectedExchange && selectedGroup">
            <header class="network-detail-head">
              <span :class="['api-status', statusClass(selectedGroup)]">{{ statusLabel(selectedGroup) }}</span>
              <div>
                <strong>{{ selectedGroup.method }} {{ methodPath(selectedExchange.request.upstreamUrl) }}</strong>
                <small>{{ domainLabel(selectedGroup) }} · {{ selectedGroup.latestTime }}</small>
              </div>
            </header>

            <nav class="network-tabs" aria-label="详情标签">
              <button
                v-for="tab in detailTabs"
                :key="tab.value"
                :class="{ active: selectedDetailTab === tab.value }"
                @click="selectedDetailTab = tab.value"
              >
                {{ tab.label }}
              </button>
            </nav>

            <div class="network-detail-content">
              <template v-if="selectedDetailTab === 'headers'">
                <section class="detail-section">
                  <header>General</header>
                  <dl>
                    <dt>Request URL</dt>
                    <dd>{{ selectedExchange.request.upstreamUrl }}</dd>
                    <dt>Browser URL</dt>
                    <dd>{{ selectedExchange.request.browserUrl }}</dd>
                    <dt>Request Method</dt>
                    <dd>{{ selectedExchange.request.method }}</dd>
                    <dt>Status Code</dt>
                    <dd>{{ selectedExchange.response.status ?? '-' }} {{ selectedExchange.response.statusText ?? '' }}</dd>
                    <dt>Duration</dt>
                    <dd>{{ formatDuration(selectedExchange.response.durationMs) }}</dd>
                  </dl>
                </section>

                <section class="detail-section">
                  <header>Request Headers</header>
                  <dl>
                    <template v-for="[key, value] in headerEntries(selectedExchange.request.headers)" :key="`request-${key}`">
                      <dt>{{ key }}</dt>
                      <dd>{{ value }}</dd>
                    </template>
                  </dl>
                  <p v-if="headerEntries(selectedExchange.request.headers).length === 0" class="detail-empty">无请求头</p>
                </section>

                <section class="detail-section">
                  <header>Response Headers</header>
                  <dl>
                    <template v-for="[key, value] in headerEntries(selectedExchange.response.headers)" :key="`response-${key}`">
                      <dt>{{ key }}</dt>
                      <dd>{{ value }}</dd>
                    </template>
                  </dl>
                  <p v-if="headerEntries(selectedExchange.response.headers).length === 0" class="detail-empty">无响应头</p>
                </section>
              </template>

              <template v-else-if="selectedDetailTab === 'payload'">
                <section class="detail-section">
                  <header>Query String Parameters</header>
                  <dl>
                    <template v-for="[key, value] in queryEntries(selectedExchange.request.upstreamUrl)" :key="key">
                      <dt>{{ key }}</dt>
                      <dd>{{ value }}</dd>
                    </template>
                  </dl>
                  <p v-if="queryEntries(selectedExchange.request.upstreamUrl).length === 0" class="detail-empty">
                    无查询参数
                  </p>
                </section>

                <section class="detail-section">
                  <header>Request Payload</header>
                  <pre v-if="selectedExchange.request.body">{{ selectedExchange.request.body }}</pre>
                  <p v-else class="detail-empty">无请求体</p>
                </section>

                <section class="detail-section">
                  <header>Raw Request</header>
                  <pre>{{ rawDump(selectedExchange.request) }}</pre>
                </section>
              </template>

              <template v-else>
                <section class="detail-section">
                  <header>Response Body</header>
                  <div v-if="selectedExchange.response.body" class="response-body-viewer">
                    <p v-if="selectedExchange.response.bodyTruncated" class="detail-warning">
                      响应体大小 {{ formatBytes(selectedExchange.response.bodySize) }}，当前仅展示调试预览内容。
                    </p>
                    <JsonTree
                      v-if="parsedResponseBody.parsed"
                      label="response"
                      :data="parsedResponseBody.value"
                      :default-expanded="true"
                    />
                    <pre v-else>{{ selectedExchange.response.body }}</pre>
                  </div>
                  <p v-else-if="selectedExchange.response.error" class="detail-empty">
                    {{ selectedExchange.response.error }}
                  </p>
                  <p v-else class="detail-empty">无响应体</p>
                </section>
              </template>
            </div>
          </template>

          <p v-else class="api-debug-empty">点击左侧 API 查看 request / response</p>
        </section>
      </div>
    </section>
  </main>
</template>

<style scoped>
.api-debug-launcher {
  position: fixed;
  right: max(18px, calc((100vw - 430px) / 2 + 18px));
  bottom: 132px;
  z-index: 95;
  width: 46px;
  height: 46px;
  display: inline-grid;
  place-items: center;
  color: #155eef;
  background: #ffffff;
  border: 1px solid #d7e2f0;
  border-radius: 50%;
  box-shadow: 0 14px 34px rgba(37, 99, 235, 0.2);
  text-decoration: none;
}

.api-debug-launcher span {
  position: absolute;
  top: -5px;
  right: -4px;
  min-width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  padding: 0 6px;
  border-radius: 999px;
  color: #fff;
  background: #ef4444;
  font-size: 12px;
  font-weight: 800;
}

.api-debug-page {
  position: fixed;
  inset: 0;
  z-index: 120;
  padding: 0;
  color: #172033;
  background: #f4f7fb;
}

.network-shell {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  overflow: hidden;
  background: #ffffff;
}

.network-topbar {
  min-height: 46px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  background: #ffffff;
  border-bottom: 1px solid #dbe5f1;
}

.network-title {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.network-title strong {
  color: #172033;
  font-size: 15px;
  font-weight: 850;
}

.network-title > span:not(.api-debug-connection) {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.network-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.icon-button {
  width: 30px;
  height: 30px;
  display: inline-grid;
  place-items: center;
  color: #334155;
  background: transparent;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
}

.icon-button:hover {
  color: #155eef;
  background: #eef4ff;
}

.api-debug-connection {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #d97706;
  font-size: 12px;
  font-weight: 750;
}

.api-debug-connection.online {
  color: #059669;
}

.network-toolbar {
  min-height: 46px;
  display: grid;
  grid-template-columns: minmax(220px, 1fr) auto minmax(260px, auto) auto;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #f8fbff;
  border-bottom: 1px solid #dbe5f1;
}

.network-search {
  min-width: 0;
  height: 30px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 9px;
  color: #64748b;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
}

.network-search input {
  min-width: 0;
  width: 100%;
  color: #172033;
  background: transparent;
  border: 0;
  outline: none;
  font-size: 12px;
}

.network-select {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
}

.network-select select {
  width: min(300px, 28vw);
  height: 30px;
  padding: 0 30px 0 9px;
  color: #172033;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  outline: none;
}

.network-status-filter {
  display: inline-flex;
  min-width: 0;
  overflow-x: auto;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
}

.network-status-filter button {
  height: 28px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  color: #475569;
  background: #ffffff;
  border: 0;
  border-right: 1px solid #cbd5e1;
  font-size: 12px;
  font-weight: 750;
}

.network-status-filter button:last-child {
  border-right: 0;
}

.network-status-filter button.active {
  color: #ffffff;
  background: #2563eb;
}

.network-status-filter span {
  color: inherit;
  opacity: 0.78;
}

.network-summary {
  display: inline-flex;
  justify-content: flex-end;
  gap: 10px;
  color: #64748b;
  font-size: 12px;
  font-weight: 750;
  white-space: nowrap;
}

.network-layout {
  min-height: 0;
  display: grid;
  grid-template-rows: minmax(210px, 46%) minmax(0, 54%);
}

.network-table-panel,
.network-detail-panel,
.network-detail-content {
  min-height: 0;
  overflow: auto;
  scrollbar-color: #cbd5e1 transparent;
}

.network-table-panel {
  background: #ffffff;
  border-bottom: 1px solid #dbe5f1;
}

.network-table {
  min-width: 980px;
}

.network-table-head,
.network-row {
  display: grid;
  grid-template-columns:
    58px 68px minmax(170px, 0.9fr) minmax(300px, 1.8fr)
    74px 82px 82px 72px;
  gap: 10px;
  align-items: center;
}

.network-table-head {
  position: sticky;
  top: 0;
  z-index: 1;
  min-height: 32px;
  padding: 0 12px;
  color: #64748b;
  background: #f1f5f9;
  border-bottom: 1px solid #dbe5f1;
  font-size: 12px;
  font-weight: 850;
}

.network-row {
  width: 100%;
  min-height: 38px;
  padding: 0 12px;
  text-align: left;
  color: #172033;
  background: #ffffff;
  border: 0;
  border-bottom: 1px solid #e2e8f0;
}

.network-row:nth-child(odd) {
  background: #f8fafc;
}

.network-row:hover {
  background: #eef6ff;
}

.network-row.active {
  background: #dbeafe;
}

.network-row.active .api-domain,
.network-row.active .request-cell small,
.network-row.active .api-duration,
.network-row.active .time-cell,
.network-row.active .size-cell,
.network-row.active .type-cell {
  color: #1d4ed8;
}

.api-domain,
.request-cell,
.type-cell,
.size-cell,
.api-duration,
.time-cell {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.api-domain {
  color: #2563eb;
  font-size: 12px;
  font-weight: 850;
}

.request-cell {
  display: grid;
  gap: 3px;
}

.request-cell strong {
  min-width: 0;
  overflow: hidden;
  color: #172033;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.request-cell small {
  min-width: 0;
  overflow: hidden;
  color: #64748b;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.api-status {
  width: 44px;
  height: 24px;
  display: inline-grid;
  place-items: center;
  border-radius: 6px;
  color: #172033;
  background: #fbbf24;
  font-size: 12px;
  font-weight: 900;
}

.api-status.success {
  color: #ffffff;
  background: #16a34a;
}

.api-status.warn {
  color: #241500;
  background: #fbbf24;
}

.api-status.error {
  color: #fff;
  background: #dc2626;
}

.api-status.pending {
  color: #ffffff;
  background: #64748b;
}

.method-pill {
  width: fit-content;
  min-width: 44px;
  height: 24px;
  display: inline-grid;
  place-items: center;
  padding: 0 8px;
  color: #334155;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 850;
}

.api-duration,
.time-cell,
.size-cell,
.type-cell {
  color: #64748b;
  font-size: 12px;
  font-weight: 760;
}

.network-detail-panel {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  background: #ffffff;
}

.network-detail-head {
  min-height: 52px;
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  padding: 9px 12px;
  background: #ffffff;
  border-bottom: 1px solid #dbe5f1;
}

.network-detail-head div {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.network-detail-head strong {
  min-width: 0;
  overflow: hidden;
  color: #172033;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.network-detail-head small {
  min-width: 0;
  overflow: hidden;
  color: #64748b;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.network-tabs {
  display: flex;
  gap: 2px;
  padding: 0 12px;
  background: #f8fbff;
  border-bottom: 1px solid #dbe5f1;
}

.network-tabs button {
  height: 36px;
  padding: 0 12px;
  color: #64748b;
  background: transparent;
  border: 0;
  border-bottom: 2px solid transparent;
  font-size: 12px;
  font-weight: 850;
}

.network-tabs button.active {
  color: #155eef;
  border-bottom-color: #155eef;
}

.network-detail-content {
  display: grid;
  align-content: start;
  gap: 12px;
  padding: 12px;
}

.detail-section {
  min-width: 0;
  overflow: hidden;
  border: 1px solid #dbe5f1;
  border-radius: 6px;
  background: #ffffff;
}

.detail-section header {
  padding: 9px 10px;
  color: #172033;
  background: #f8fafc;
  border-bottom: 1px solid #dbe5f1;
  font-size: 12px;
  font-weight: 850;
}

.detail-section dl {
  margin: 0;
  display: grid;
  grid-template-columns: minmax(120px, 0.26fr) minmax(0, 1fr);
}

.detail-section dt,
.detail-section dd {
  min-width: 0;
  margin: 0;
  padding: 8px 10px;
  border-bottom: 1px solid #e2e8f0;
  font-size: 12px;
  line-height: 1.45;
}

.detail-section dt {
  color: #64748b;
  font-weight: 850;
}

.detail-section dd {
  overflow-wrap: anywhere;
  color: #172033;
}

.detail-section pre {
  max-height: 360px;
  margin: 0;
  padding: 10px;
  overflow: auto;
  color: #172033;
  font-size: 12px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}

.response-body-viewer {
  max-height: 430px;
  overflow: auto;
  padding: 10px 12px;
}

.response-body-viewer pre {
  max-height: none;
  padding: 0;
}

.api-debug-empty {
  margin: 18px 12px;
  color: #64748b;
  text-align: center;
}

.detail-empty {
  margin: 0;
  padding: 12px;
  color: #64748b;
  font-size: 12px;
}

.detail-warning {
  margin: 0 0 10px;
  padding: 8px 10px;
  color: #92400e;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 750;
}

.spinning {
  animation: spin 0.9s linear infinite;
}

@media (max-width: 720px) {
  .network-topbar {
    align-items: stretch;
    flex-direction: column;
  }

  .network-toolbar {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .network-select,
  .network-select select {
    width: 100%;
  }

  .network-summary {
    justify-content: flex-start;
    overflow-x: auto;
  }

  .network-layout {
    grid-template-rows: minmax(190px, 42%) minmax(0, 58%);
  }

  .detail-section dl {
    grid-template-columns: 1fr;
  }

  .detail-section dt {
    border-bottom: 0;
    padding-bottom: 2px;
  }

  .detail-section dd {
    padding-top: 2px;
  }
}
</style>
