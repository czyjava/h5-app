<script setup lang="ts">
import { computed, ref } from 'vue';
import { LogIn, RefreshCw, Send, ShieldCheck, X } from 'lucide-vue-next';
import { sessionState, setAuthToken, clearAuthToken } from '@/entities/session/model';
import { bootstrapApp, showToast } from '@/app/model';
import { sendLoginSmsCode, loginWithSmsCode } from '@/shared/api/authApi';
import { maskToken } from '@/shared/lib/format';

const phoneNumber = ref('');
const smsCode = ref('');
const smsId = ref('');
const smsPhoneNumber = ref('');
const sending = ref(false);
const loggingIn = ref(false);

const tokenLabel = computed(() => maskToken(sessionState.authToken));

async function reload() {
  await bootstrapApp();
  showToast('数据源已刷新');
}

async function sendCode() {
  const phone = phoneNumber.value.trim();
  if (!phone) {
    showToast('请输入手机号');
    return;
  }

  sending.value = true;
  try {
    const response = await sendLoginSmsCode(phone);
    // 内部测试号可能直接返回 smsCode，自动填入能减少一次复制。
    smsCode.value = response.smsCode ?? smsCode.value;
    smsId.value = response.smsId ?? '';
    smsPhoneNumber.value = phone;
    showToast('验证码已发送，请查看短信或 API 面板');
  } catch (error) {
    showToast(error instanceof Error ? `发送验证码失败：${error.message}` : '发送验证码失败');
  } finally {
    sending.value = false;
  }
}

async function login() {
  const phone = phoneNumber.value.trim();
  const code = smsCode.value.trim();
  if (!phone || !code) {
    showToast('请先填写手机号和验证码');
    return;
  }
  if (!smsId.value || smsPhoneNumber.value !== phone) {
    showToast('请先发送验证码，再登录');
    return;
  }

  loggingIn.value = true;
  try {
    const userInfo = await loginWithSmsCode(phone, code, smsId.value);
    setAuthToken(userInfo.authToken ?? '');
    showToast(`登录成功，token ${maskToken(userInfo.authToken ?? '')}`);
    await bootstrapApp();
  } catch (error) {
    showToast(error instanceof Error ? `登录失败：${error.message}` : '登录失败');
  } finally {
    loggingIn.value = false;
  }
}

function clearLogin() {
  clearAuthToken();
  showToast('已清除当前登录 token');
}
</script>

<template>
  <section class="api-login-panel">
    <header>
      <div>
        <ShieldCheck :size="18" />
        <span>实时 API</span>
      </div>
      <strong>{{ tokenLabel }}</strong>
    </header>

    <div class="api-login-token">
      <input
        type="password"
        :value="sessionState.authToken"
        placeholder="authToken"
        autocomplete="off"
        spellcheck="false"
        @input="setAuthToken(($event.target as HTMLInputElement).value)"
      />
      <button class="icon-button" :aria-label="`刷新，当前 token ${tokenLabel}`" @click="reload">
        <RefreshCw :size="18" />
      </button>
      <button class="icon-button" aria-label="清除登录 token" @click="clearLogin">
        <X :size="18" />
      </button>
    </div>

    <div class="api-login-form">
      <label>
        <span>手机号</span>
        <input v-model="phoneNumber" inputmode="tel" autocomplete="tel" placeholder="输入手机号" />
      </label>
      <button class="secondary-button" :disabled="sending" @click="sendCode">
        <Send :size="17" />
        <span>{{ sending ? '发送中' : '发送验证码' }}</span>
      </button>
      <label>
        <span>验证码</span>
        <input v-model="smsCode" inputmode="numeric" autocomplete="one-time-code" placeholder="短信验证码" />
      </label>
      <button class="primary-button" :disabled="loggingIn" @click="login">
        <LogIn :size="18" />
        <span>{{ loggingIn ? '登录中' : '登录并刷新' }}</span>
      </button>
    </div>
  </section>
</template>
