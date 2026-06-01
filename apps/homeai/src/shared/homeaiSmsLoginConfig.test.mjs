import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const appConfigSource = await readFile(new URL('../../app.config.ts', import.meta.url), 'utf8');
const appVueSource = await readFile(new URL('../app/App.vue', import.meta.url), 'utf8');
const customDesignApiSource = await readFile(new URL('./customDesignApi.ts', import.meta.url), 'utf8');
const designAssistantApiSource = await readFile(new URL('./designAssistantApi.ts', import.meta.url), 'utf8');
const homeAiApiSource = await readFile(new URL('./homeaiApi.ts', import.meta.url), 'utf8');
const localAuthTokenApiSource = await readFile(new URL('./localAuthTokenApi.ts', import.meta.url), 'utf8');
const viteConfigSource = await readFile(new URL('../../vite.config.ts', import.meta.url), 'utf8');
const gitIgnoreSource = await readFile(new URL('../../../../.gitignore', import.meta.url), 'utf8');

function extractInterfaceBlock(source, name) {
  const match = source.match(new RegExp(`interface ${name} \\{[\\s\\S]*?\\n\\}`));
  assert.ok(match, `未找到 ${name} 接口定义`);
  return match[0];
}

test('HomeAI 配置短信登录 auth host 和接口', () => {
  assert.match(appConfigSource, /auth:\s*{/);
  assert.match(appConfigSource, /proxyPrefix:\s*'\/homeai-auth'/);
  assert.match(appConfigSource, /productionTarget:\s*'https:\/\/auth\.wanmeixiangsu\.cn'/);
  assert.match(appConfigSource, /_authVersion:\s*'2\.0'/);
  assert.match(appConfigSource, /loginSmsCheck:\s*'\/api\/open\/v3\/login-sms\/check\.htm'/);
  assert.match(appConfigSource, /loginSmsLogin:\s*'\/api\/open\/v3\/login-sms\/login\.htm'/);
});

test('HomeAI 实时 API 面板接入手机号验证码登录', () => {
  assert.doesNotMatch(appVueSource, /:sms-login-enabled="false"/);
  assert.match(appVueSource, /:send-code-handler="sendLoginSmsCode"/);
  assert.match(appVueSource, /:login-handler="loginWithSmsCode"/);
});

test('HomeAI 登录和接口环境配置必须独立弹窗展示', () => {
  assert.match(appVueSource, /settingsDialogVisible/);
  assert.match(appVueSource, /class="settings-modal"/);
  assert.match(appVueSource, /class="profile-settings-button"/);
  assert.doesNotMatch(appVueSource, /<section class="settings-shell" aria-label="设置">/);
});

test('HomeAI 本地开发 token 必须落到 gitignore 的本地文件', () => {
  assert.match(gitIgnoreSource, /apps\/homeai\/\.homeai-local-auth\.json/);
  assert.match(viteConfigSource, /HOMEAI_LOCAL_AUTH_ENDPOINT/);
  assert.match(viteConfigSource, /\.homeai-local-auth\.json/);
  assert.match(localAuthTokenApiSource, /loadHomeAiLocalAuthToken/);
  assert.match(localAuthTokenApiSource, /persistHomeAiLocalAuthToken/);
  assert.match(appVueSource, /restoreLocalAuthToken/);
  assert.match(appVueSource, /persistHomeAiLocalAuthToken\(token\)/);
});

test('HomeAI AI 设计助手接口走 open API 路径', () => {
  assert.doesNotMatch(appConfigSource, /\/api\/h5\/homeai\/design-assistant\//);
  assert.doesNotMatch(appConfigSource, /quote[-]by[-]template/);
  assert.match(appConfigSource, /designAssistantStart:\s*'\/api\/open\/homeai\/design-assistant\/start\.htm'/);
  assert.match(appConfigSource, /designAssistantSend:\s*'\/api\/open\/homeai\/design-assistant\/send\.htm'/);
  assert.match(appConfigSource, /designAssistantSessions:\s*'\/api\/open\/homeai\/design-assistant\/sessions\.htm'/);
  assert.match(appConfigSource, /designAssistantMessages:\s*'\/api\/open\/homeai\/design-assistant\/messages\/list\.htm'/);
  assert.doesNotMatch(appConfigSource, /designAssistantFeedback/);
  assert.doesNotMatch(designAssistantApiSource, /feedbackDesignAssistantMessage/);
  assert.doesNotMatch(appConfigSource, /designAssistantRegenerate/);
  assert.doesNotMatch(designAssistantApiSource, /regenerateDesignAssistantMessage/);
  assert.match(appConfigSource, /designAssistantApplyDesign:\s*'\/api\/open\/homeai\/design-assistant\/apply-design\.htm'/);
});

test('HomeAI 当前用户信息必须走认证域 current-user 接口', () => {
  assert.match(homeAiApiSource, /hostType\?: 'business' \| 'auth'/);
  assert.match(
    homeAiApiSource,
    /requestBusiness\(homeAiReplicaConfig\.endpoints\.currentUser,\s*context,\s*\{[\s\S]*?hostType:\s*'auth'/,
  );
});

test('HomeAI 定制设计会话使用最后作品ID语义', () => {
  const startParamsSource = extractInterfaceBlock(designAssistantApiSource, 'StartParams');
  assert.match(startParamsSource, /lastWorkId\?: string/);
  assert.doesNotMatch(startParamsSource, /\n\s+workId\?: string/);
  assert.match(appVueSource, /lastWorkId:\s*assistantSceneType\.value === 'CUSTOM_DESIGN' \? assistantWorkContext\.value\?\.workId : undefined/);
  assert.match(appVueSource, /workId:\s*assistantWorkContext\.value\?\.workId/);
});

test('HomeAI AI 设计助手支持同批次图片和文本一起发送', () => {
  const sendParamsSource = extractInterfaceBlock(designAssistantApiSource, 'SendParams');
  assert.match(sendParamsSource, /messages\?: DesignAssistantMessageInput\[\]/);
  assert.match(designAssistantApiSource, /messages:\s*params\.messages\?\.length \? JSON\.stringify\(params\.messages\) : undefined/);
  assert.match(appVueSource, /const batchMessages = \[/);
  assert.match(appVueSource, /\.\.\.messageImageUrls\.map\(\(imageUrl\) => \(\{ contentType: 'IMAGE' as const, imageUrl \}\)\)/);
  assert.match(appVueSource, /\.\.\.\(prompt \? \[\{ contentType: 'TEXT' as const, text: prompt \}\] : \[\]\)/);
  assert.match(appVueSource, /messages:\s*batchMessages/);
});

test('HomeAI AI 设计助手上传图片必须走真实业务上传接口', () => {
  assert.match(appConfigSource, /upload:\s*'\/api\/h5\/file\/upload\.htm'/);
  assert.match(homeAiApiSource, /export async function uploadHomeAiImage/);
  assert.match(homeAiApiSource, /new FormData\(\)/);
  assert.match(homeAiApiSource, /formData\.append\('image', file/);
  assert.match(homeAiApiSource, /homeAiReplicaConfig\.endpoints\.upload/);
  assert.match(appVueSource, /ref="assistantImageInputRef"/);
  assert.match(appVueSource, /@change="handleAssistantImageFileChange"/);
  assert.match(appVueSource, /function openAssistantImagePicker\(\)[\s\S]*?requireAssistantLogin\(\)/);
  assert.match(appVueSource, /uploadHomeAiImage\(getAssistantContext\(\), file\)/);
  assert.match(appVueSource, /removeAssistantImageAttachment/);
  assert.doesNotMatch(appVueSource, /function addAssistantImageAttachment/);
  assert.doesNotMatch(appVueSource, /selectedFeature\.value\?\.guideImage \|\| homeAiAssets\.guide\.interiorGood/);
});

test('HomeAI 定制设计页面提交真实接口并轮询结果', () => {
  assert.match(appConfigSource, /customDesignSubmit:\s*'\/api\/open\/homeai\/custom-design\/submit\.htm'/);
  assert.match(appConfigSource, /customDesignFetch:\s*'\/api\/open\/homeai\/custom-design\/fetch\.htm'/);
  assert.match(customDesignApiSource, /submitHomeAiCustomDesign/);
  assert.match(customDesignApiSource, /fetchHomeAiCustomDesign/);
  assert.match(appVueSource, /submitHomeAiCustomDesign\(getAssistantContext\(\)/);
  assert.match(appVueSource, /fetchHomeAiCustomDesign\(getAssistantContext\(\), customDesignCode\)/);
  assert.doesNotMatch(appVueSource, /createMockCustomDesignResultImage/);
  assert.doesNotMatch(appVueSource, /静态复刻阶段用本地装修素材模拟结果图/);
});

test('HomeAI 作品详情必须选中真实 generationWork 后才能进入定制设计', () => {
  assert.match(appVueSource, /workDetailCustomDesignDisabled/);
  assert.match(appVueSource, /:disabled="workDetailCustomDesignDisabled"/);
  assert.match(appVueSource, /selectedWork\.value\.sourceType !== 'work'/);
});

test('HomeAI 我的页不展示 AI 设计助手历史入口', () => {
  assert.doesNotMatch(appVueSource, /class="assistant-history-card"/);
  assert.doesNotMatch(appVueSource, /loadAssistantHistory/);
  assert.doesNotMatch(appVueSource, /openAssistantHistory/);
  assert.doesNotMatch(appVueSource, /listDesignAssistantSessions/);
});

test('HomeAI 定制设计过程记录只能从真实作品详情查看', () => {
  assert.match(appVueSource, /:disabled="workDetailCustomDesignDisabled"/);
  assert.match(appVueSource, /openCustomDesignRecordsFromSelectedWork/);
  assert.match(appVueSource, /visibleCustomDesignProcessRecords/);
  assert.match(appVueSource, /record\.generationRecordId === context\.recordId && record\.sourceWorkId === context\.workId/);
  assert.doesNotMatch(appVueSource, /@click="openCustomDesignRecords"/);
});
