<script setup lang="ts">
import { computed, ref } from 'vue';
import { LogIn, RefreshCw, Send, ShieldCheck, X } from 'lucide-vue-next';
import type { ReplicaLoginPayload, ReplicaSmsCodeResult } from './types.ts';

defineOptions({ name: 'ReplicaApiModePanel' });

const props = withDefaults(
  defineProps<{
    authToken: string;
    tokenLabel?: string;
    title?: string;
    emptyTokenLabel?: string;
    tokenPlaceholder?: string;
    phonePlaceholder?: string;
    codePlaceholder?: string;
    smsLoginEnabled?: boolean;
    reloadHandler?: () => Promise<void> | void;
    sendCodeHandler?: (phoneNumber: string) => Promise<ReplicaSmsCodeResult | void> | ReplicaSmsCodeResult | void;
    loginHandler?: (payload: ReplicaLoginPayload) => Promise<void> | void;
    clearTokenHandler?: () => Promise<void> | void;
  }>(),
  {
    title: '实时 API',
    emptyTokenLabel: '未登录',
    tokenPlaceholder: 'authToken',
    phonePlaceholder: '输入手机号',
    codePlaceholder: '短信验证码',
    smsLoginEnabled: true,
  },
);

const emit = defineEmits<{
  'update:authToken': [value: string];
  notice: [message: string];
  error: [message: string];
}>();

const phoneNumber = ref('');
const smsCode = ref('');
const smsId = ref('');
const smsPhoneNumber = ref('');
const sending = ref(false);
const loggingIn = ref(false);
const reloading = ref(false);
const clearing = ref(false);

const tokenSummary = computed(() => props.tokenLabel || maskToken(props.authToken));

function emitError(error: unknown, fallback: string) {
  emit('error', error instanceof Error ? `${fallback}：${error.message}` : fallback);
}

function maskToken(token: string) {
  if (!token) {
    return props.emptyTokenLabel;
  }
  if (token.length <= 12) {
    return `${token.slice(0, 3)}...`;
  }
  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

async function reload() {
  reloading.value = true;
  try {
    await props.reloadHandler?.();
    emit('notice', '数据源已刷新');
  } catch (error) {
    emitError(error, '刷新失败');
  } finally {
    reloading.value = false;
  }
}

async function sendCode() {
  const phone = phoneNumber.value.trim();
  if (!phone) {
    emit('error', '请输入手机号');
    return;
  }

  sending.value = true;
  try {
    const response = await props.sendCodeHandler?.(phone);
    // 内部测试号可能直接返回 smsCode，公共组件自动回填以减少复制。
    smsCode.value = response?.smsCode ?? smsCode.value;
    smsId.value = response?.smsId ?? '';
    smsPhoneNumber.value = phone;
    emit('notice', '验证码已发送，请查看短信或 API 面板');
  } catch (error) {
    emitError(error, '发送验证码失败');
  } finally {
    sending.value = false;
  }
}

async function login() {
  const phone = phoneNumber.value.trim();
  const code = smsCode.value.trim();
  if (!phone || !code) {
    emit('error', '请先填写手机号和验证码');
    return;
  }
  if (!smsId.value || smsPhoneNumber.value !== phone) {
    emit('error', '请先发送验证码，再登录');
    return;
  }

  loggingIn.value = true;
  try {
    await props.loginHandler?.({ phoneNumber: phone, smsCode: code, smsId: smsId.value });
    emit('notice', `登录成功，token ${tokenSummary.value}`);
  } catch (error) {
    emitError(error, '登录失败');
  } finally {
    loggingIn.value = false;
  }
}

async function clearLogin() {
  clearing.value = true;
  try {
    await props.clearTokenHandler?.();
    emit('update:authToken', '');
    emit('notice', '已清除当前 token');
  } catch (error) {
    emitError(error, '清除 token 失败');
  } finally {
    clearing.value = false;
  }
}
</script>

<template>
  <section class="api-login-panel">
    <header>
      <div>
        <ShieldCheck :size="18" />
        <span>{{ title }}</span>
      </div>
      <strong>{{ tokenSummary }}</strong>
    </header>

    <div class="api-login-token">
      <input
        type="password"
        :value="authToken"
        :placeholder="tokenPlaceholder"
        autocomplete="off"
        spellcheck="false"
        @input="emit('update:authToken', ($event.target as HTMLInputElement).value)"
      />
      <button class="icon-button" :aria-label="`刷新，当前 token ${tokenSummary}`" :disabled="reloading" @click="reload">
        <RefreshCw :size="18" :class="{ spinning: reloading }" />
      </button>
      <button class="icon-button" aria-label="清除 token" :disabled="clearing" @click="clearLogin">
        <X :size="18" />
      </button>
    </div>

    <div v-if="smsLoginEnabled" class="api-login-form">
      <label>
        <span>手机号</span>
        <input v-model="phoneNumber" inputmode="tel" autocomplete="tel" :placeholder="phonePlaceholder" />
      </label>
      <button class="secondary-button" :disabled="sending" @click="sendCode">
        <Send :size="17" />
        <span>{{ sending ? '发送中' : '发送验证码' }}</span>
      </button>
      <label>
        <span>验证码</span>
        <input v-model="smsCode" inputmode="numeric" autocomplete="one-time-code" :placeholder="codePlaceholder" />
      </label>
      <button class="primary-button" :disabled="loggingIn" @click="login">
        <LogIn :size="18" />
        <span>{{ loggingIn ? '登录中' : '登录并刷新' }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.api-login-panel {
  display: grid;
  gap: 10px;
  margin-bottom: 12px;
  padding: 10px;
  border-radius: 12px;
  color: #fff;
  background: #24272f;
}

.api-login-panel header,
.api-login-token,
.api-login-form {
  min-width: 0;
}

.api-login-panel header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.api-login-panel header > div {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-weight: 850;
}

.api-login-panel header strong {
  color: #62e6c6;
  font-size: 13px;
}

.api-login-token {
  display: grid;
  grid-template-columns: 1fr 42px 42px;
  gap: 8px;
}

.api-login-panel input {
  min-width: 0;
  height: 38px;
  border: 0;
  border-radius: 8px;
  padding: 0 10px;
  color: #fff;
  background: #11131a;
  outline: none;
}

.api-login-form {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}

.api-login-form label {
  min-width: 0;
  display: grid;
  gap: 5px;
}

.api-login-form label span {
  color: rgba(255, 255, 255, 0.62);
  font-size: 12px;
  font-weight: 750;
}

.api-login-form label:nth-of-type(2),
.api-login-form .primary-button {
  grid-column: 1 / -1;
}

.primary-button,
.secondary-button,
.icon-button {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 0;
  border-radius: 8px;
  font-weight: 850;
}

.primary-button {
  padding: 0 12px;
  color: #11131a;
  background: #62e6c6;
}

.secondary-button {
  padding: 0 12px;
  color: #fff;
  background: #363b46;
}

.icon-button {
  width: 42px;
  color: #fff;
  background: #363b46;
}

.primary-button:disabled,
.secondary-button:disabled,
.icon-button:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.spinning {
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
