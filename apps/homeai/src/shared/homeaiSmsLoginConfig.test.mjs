import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const appConfigSource = await readFile(new URL('../../app.config.ts', import.meta.url), 'utf8');
const appPackageSource = await readFile(new URL('../../package.json', import.meta.url), 'utf8');
const appVueSource = await readFile(new URL('../app/App.vue', import.meta.url), 'utf8');
const customDesignApiSource = await readFile(new URL('./customDesignApi.ts', import.meta.url), 'utf8');
const designAssistantApiSource = await readFile(new URL('./designAssistantApi.ts', import.meta.url), 'utf8');
const homeAiApiSource = await readFile(new URL('./homeaiApi.ts', import.meta.url), 'utf8');
const homeAiTypesSource = await readFile(new URL('./types.ts', import.meta.url), 'utf8');
const localAuthTokenApiSource = await readFile(new URL('./localAuthTokenApi.ts', import.meta.url), 'utf8');
const viteConfigSource = await readFile(new URL('../../vite.config.ts', import.meta.url), 'utf8');
const gitIgnoreSource = await readFile(new URL('../../../../.gitignore', import.meta.url), 'utf8');
const commonTypesSource = await readFile(new URL('../../../../common/src/types.ts', import.meta.url), 'utf8');
const commonSessionSource = await readFile(new URL('../../../../common/src/session.ts', import.meta.url), 'utf8');
const transparentProxySource = await readFile(new URL('../../../../common/src/proxy/transparentProxy.ts', import.meta.url), 'utf8');

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

test('HomeAI 设置必须支持本地测试线上三套业务访问地址', () => {
  assert.match(commonTypesSource, /export type ReplicaEnvironment = 'local' \| 'test' \| 'production'/);
  assert.match(commonSessionSource, /environment === 'local' \|\| environment === 'test' \|\| environment === 'production'/);
  assert.match(appVueSource, /BUSINESS_TARGET_STORAGE_KEY/);
  assert.match(appVueSource, /本地环境访问地址/);
  assert.match(appVueSource, /测试环境访问地址/);
  assert.match(appVueSource, /线上环境访问地址/);
  assert.match(appVueSource, /key: 'local' as const/);
  assert.match(appVueSource, /businessTarget:\s*normalizedBusinessTarget\.value/);
  assert.match(appVueSource, /persistBusinessTargets/);
  assert.match(homeAiApiSource, /businessTarget\?: string/);
  assert.match(homeAiApiSource, /url\.searchParams\.set\('__homeai_env', context\.environment\)/);
  assert.match(homeAiApiSource, /url\.searchParams\.set\('__homeai_target', context\.businessTarget/);
  assert.match(viteConfigSource, /targetQueryKey:\s*'__homeai_target'/);
  assert.match(transparentProxySource, /targetQueryKey\?: string/);
  assert.match(transparentProxySource, /url\.searchParams\.delete\(targetQueryKey\)/);
  assert.match(transparentProxySource, /targetUrl\.protocol !== 'http:' && targetUrl\.protocol !== 'https:'/);
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
  assert.doesNotMatch(appConfigSource, /designAssistantApplyDesign/);
  assert.doesNotMatch(designAssistantApiSource, /applyDesignAssistantImage/);
  assert.doesNotMatch(appVueSource, /shouldRenderApplyDesignAction/);
});

test('HomeAI AI 设计助手新建受限时必须恢复已有会话', () => {
  assert.match(designAssistantApiSource, /export async function listDesignAssistantSessions/);
  assert.match(appVueSource, /listDesignAssistantSessions/);
  assert.match(appVueSource, /function isAssistantSessionLimitError/);
  assert.match(appVueSource, /function pickLatestAssistantSession/);
  assert.match(appVueSource, /async function restoreLatestAssistantSession/);
  assert.match(appVueSource, /startReason !== 'MANUAL_NEW'[\s\S]*?restoreLatestAssistantSession/);
  assert.match(appVueSource, /已进入上次设计助手会话/);
  assert.match(appVueSource, /listDesignAssistantMessages\(getAssistantContext\(\), session\.sessionKey\)/);
});

test('HomeAI 当前用户信息必须走认证域 current-user 接口', () => {
  assert.match(homeAiApiSource, /type HomeAiHostType = keyof typeof homeAiReplicaConfig\.hosts/);
  assert.match(
    homeAiApiSource,
    /requestBusiness\(homeAiReplicaConfig\.endpoints\.currentUser,\s*context,\s*\{[\s\S]*?hostType:\s*'auth'/,
  );
});

test('HomeAI HTTP 失败但响应体包含业务 message 时必须优先展示 message', () => {
  assert.match(homeAiApiSource, /throw new Error\(payload\.message \|\| formatHttpErrorMessage\(response\.status\)\)/);
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
  assert.match(appConfigSource, /upload:\s*\{[\s\S]*?proxyPrefix:\s*'\/homeai-upload'/);
  assert.match(appConfigSource, /productionTarget:\s*'https:\/\/cyclops\.wanmeixiangsu\.cn'/);
  assert.match(appConfigSource, /uploadToken:\s*'\/api\/open\/tool\/acquire-token\.htm'/);
  assert.match(appConfigSource, /upload:\s*'\/api\/open\/upload\/upload\.htm'/);
  assert.match(homeAiApiSource, /export async function uploadHomeAiImage/);
  assert.match(homeAiApiSource, /acquirePixelStudioUploadToken/);
  assert.match(homeAiApiSource, /new FormData\(\)/);
  assert.match(homeAiApiSource, /formData\.append\('file', file/);
  assert.match(homeAiApiSource, /homeAiReplicaConfig\.endpoints\.upload/);
  assert.match(homeAiApiSource, /hostType:\s*'upload'/);
  assert.match(appVueSource, /accepted-files="image\/png,image\/jpeg,image\/webp"/);
  assert.match(appVueSource, /function createUploadFileFromAdvancedChatFile/);
  assert.match(appVueSource, /function uploadAdvancedChatFiles/);
  assert.match(appVueSource, /function handleAdvancedChatSendMessage/);
  assert.match(appVueSource, /uploadHomeAiImage\(getAssistantContext\(\), uploadFile\)/);
  assert.match(appVueSource, /sendAssistantMessage\(\{ prompt: content, imageUrls, suppressBusyToast: true \}\)/);
  assert.doesNotMatch(appVueSource, /assistantImageInputRef/);
  assert.doesNotMatch(appVueSource, /function addAssistantImageAttachment/);
  assert.doesNotMatch(appVueSource, /selectedFeature\.value\?\.guideImage \|\| homeAiAssets\.guide\.interiorGood/);
});

test('HomeAI 定制设计页面提交真实接口并轮询结果', () => {
  assert.match(appConfigSource, /customDesignSubmit:\s*'\/api\/open\/homeai\/custom-design\/submit\.htm'/);
  assert.match(appConfigSource, /customDesignFetch:\s*'\/api\/open\/homeai\/custom-design\/fetch\.htm'/);
  assert.match(appConfigSource, /customDesignRecords:\s*'\/api\/open\/homeai\/custom-design\/records\.htm'/);
  assert.match(customDesignApiSource, /submitHomeAiCustomDesign/);
  assert.match(customDesignApiSource, /fetchHomeAiCustomDesign/);
  assert.match(customDesignApiSource, /listHomeAiCustomDesignRecords/);
  assert.match(appVueSource, /submitHomeAiCustomDesign\(getAssistantContext\(\)/);
  assert.match(appVueSource, /fetchHomeAiCustomDesign\(getAssistantContext\(\), customDesignCode\)/);
  assert.match(appVueSource, /listHomeAiCustomDesignRecords\(getAssistantContext\(\)/);
  assert.match(appVueSource, /const CUSTOM_DESIGN_FETCH_INTERVAL_MS = 5000/);
  assert.match(appVueSource, /window\.setTimeout\([\s\S]*?CUSTOM_DESIGN_FETCH_INTERVAL_MS/);
  assert.doesNotMatch(appVueSource, /createMockCustomDesignResultImage/);
  assert.doesNotMatch(appVueSource, /静态复刻阶段用本地装修素材模拟结果图/);
});

test('HomeAI 定制设计应用设计必须走 custom-design apply 接口', () => {
  assert.match(appConfigSource, /customDesignApply:\s*'\/api\/open\/homeai\/custom-design\/apply\.htm'/);
  assert.match(customDesignApiSource, /export async function applyHomeAiCustomDesign/);
  assert.match(customDesignApiSource, /homeAiReplicaConfig\.endpoints\.customDesignApply/);
  assert.match(customDesignApiSource, /form:\s*\{\s*customDesignCode\s*\}/);
  assert.match(appVueSource, /customDesignApplyingCode/);
  assert.match(appVueSource, /function applyCustomDesignResult\(/);
  assert.match(appVueSource, /applyHomeAiCustomDesign\(getAssistantContext\(\), customDesignCode\)/);
  assert.match(appVueSource, /currentCustomDesignApplyCode/);
  assert.match(appVueSource, /@click="applyCurrentCustomDesignResult"/);
  assert.match(appVueSource, /@click="applyCustomDesignRecordResult\(record\)"/);
  assert.doesNotMatch(appConfigSource, /\/api\/open\/homeai\/design-assistant\/apply-design\.htm/);
  assert.doesNotMatch(appVueSource, /applyDesignAssistantImage/);
});

test('HomeAI 作品详情必须选中真实 generationWork 后才能进入定制设计', () => {
  assert.match(appVueSource, /workDetailCustomDesignDisabled/);
  assert.match(appVueSource, /:disabled="workDetailCustomDesignDisabled"/);
  assert.match(appVueSource, /selectedWork\.value\.sourceType !== 'work'/);
});

test('HomeAI 我的页必须提供作品和助手二级 tab', () => {
  assert.match(appVueSource, /mineTab/);
  assert.match(appVueSource, /class="mine-tabs"/);
  assert.match(appVueSource, />作品</);
  assert.match(appVueSource, />助手</);
  assert.match(appVueSource, /class="assistant-history-list"/);
  assert.match(appVueSource, /loadAssistantHistory/);
  assert.match(appVueSource, /openAssistantHistorySession/);
  assert.match(appVueSource, /listDesignAssistantSessions\(getAssistantContext\(\), 'ASSISTANT_CHAT'\)/);
  assert.match(appVueSource, /listDesignAssistantMessages\(getAssistantContext\(\), session\.sessionKey\)/);
});

test('HomeAI 助手历史列表必须用真实消息生成标题描述和时间', () => {
  assert.match(appVueSource, /interface AssistantHistorySession/);
  assert.match(appVueSource, /buildAssistantHistorySession/);
  assert.match(appVueSource, /firstUserText/);
  assert.match(appVueSource, /lastPreviewText/);
  assert.match(appVueSource, /lastUserMessageTime/);
  assert.match(appVueSource, /hasAssistantHistoryContent/);
  assert.match(appVueSource, /filter\(hasAssistantHistoryContent\)/);
  assert.match(appVueSource, /message\.role === 'USER'/);
  assert.match(appVueSource, /formatAssistantHistoryTitle\(session\)[\s\S]*?session\.firstUserText/);
  assert.match(appVueSource, /formatAssistantHistorySubtitle\(session\)[\s\S]*?session\.lastPreviewText/);
  assert.match(appVueSource, /formatAssistantHistoryTime\(session\)[\s\S]*?session\.lastUserMessageTime/);
  assert.doesNotMatch(appVueSource, /继续上次设计建议/);
});

test('HomeAI 助手历史列表图标必须复用底部 AI 助手图标', () => {
  assert.match(appVueSource, /key: 'assistant' as const, label: 'AI', icon: homeAiAssets\.magicWand/);
  assert.match(appVueSource, /class="assistant-history-icon"[\s\S]*?:src="homeAiAssets\.magicWand"/);
  assert.doesNotMatch(appVueSource, /formatAssistantHistoryIcon/);
});

test('HomeAI 定制设计过程记录只能从定制设计页查看', () => {
  const workDetailActionsSource = appVueSource.match(/<section class="work-detail-actions">[\s\S]*?<\/section>/)?.[0] ?? '';
  assert.match(appVueSource, /:disabled="workDetailCustomDesignDisabled"/);
  assert.match(appVueSource, /aria-label="查看过程记录"/);
  assert.match(appVueSource, /@click="openCustomDesignRecordsFromCurrentDesign"/);
  assert.match(appVueSource, /function openCustomDesignRecordsFromCurrentDesign\(\)/);
  assert.match(appVueSource, /visibleCustomDesignProcessRecords/);
  assert.match(appVueSource, /record\.generationRecordId === context\.recordId && record\.sourceWorkId === context\.workId/);
  assert.match(appVueSource, /aria-label="返回定制设计"/);
  assert.match(appVueSource, /@click="activeTab = 'customDesign'"/);
  assert.doesNotMatch(appVueSource, /openCustomDesignRecordsFromSelectedWork/);
  assert.doesNotMatch(workDetailActionsSource, /查看过程记录/);
  assert.doesNotMatch(appVueSource, /@click="openCustomDesignRecords"/);
});

test('HomeAI 交付页面不能直接暴露技术错误和业务字段', () => {
  assert.match(homeAiApiSource, /formatHttpErrorMessage/);
  assert.doesNotMatch(homeAiApiSource, /throw new Error\(`HTTP \$\{response\.status\}`\)/);
  assert.doesNotMatch(appVueSource, />记录 ID</);
  assert.doesNotMatch(appVueSource, />作品 ID</);
  assert.doesNotMatch(appVueSource, />模板 ID</);
  assert.doesNotMatch(appVueSource, /缺少 generationRecord/);
  assert.doesNotMatch(appVueSource, /请选择一个 generationWork/);
  assert.doesNotMatch(appVueSource, /真实的 generationWork/);
});

test('HomeAI 定制设计页必须给用户明确的操作引导', () => {
  assert.match(appVueSource, /customDesignPromptExamples/);
  assert.match(appVueSource, /保留布局，改成奶油风/);
  assert.match(appVueSource, /让客厅更显大/);
  assert.match(appVueSource, /基于这张图定制设计/);
  assert.match(appVueSource, /应用后会替换原作品/);
  assert.match(appVueSource, /useCustomDesignPromptExample/);
});

test('HomeAI 定制设计过程记录按状态展示动作', () => {
  assert.match(appVueSource, /v-if="record\.status === 'completed'"/);
  assert.match(appVueSource, /v-else-if="record\.status === 'applied'"/);
  assert.match(appVueSource, /v-else-if="record\.status === 'failed'"/);
  assert.match(appVueSource, /v-else-if="record\.status === 'submitted'"/);
  assert.match(appVueSource, /等待结果返回后可查看输出图和应用设计/);
  assert.match(appVueSource, /重新生成/);
  assert.doesNotMatch(appVueSource, /:disabled="record\.status !== 'completed'"/);
});

test('HomeAI 交付页必须隐藏后台状态、长编号和开发态说明', () => {
  assert.match(appVueSource, /profileUserHint/);
  assert.match(appVueSource, /formatWorkDisplayMeta/);
  assert.match(appVueSource, /formatWorkStatusText/);
  assert.match(appVueSource, /formatDisplayTime/);
  assert.doesNotMatch(appVueSource, /ID \{\{ snapshot\.user\.userId \}\}/);
  assert.doesNotMatch(appVueSource, /会员权益与余额信息来自原 APP 资源结构/);
  assert.doesNotMatch(appVueSource, /\{\{ work\.status \}\} · 记录/);
  assert.doesNotMatch(appVueSource, /\{\{ selectedWork\.status \}\} · \{\{ selectedWork\.createdAt/);
});

test('HomeAI 定制设计页面不能展示模板和记录短码', () => {
  assert.doesNotMatch(appVueSource, /已匹配/);
  assert.doesNotMatch(appVueSource, /已匹配当前作品模板/);
  assert.match(appVueSource, /描述你想调整的风格、颜色、软装或问题/);
  assert.match(appVueSource, /只看当前作品的修改记录/);
  assert.doesNotMatch(appVueSource, /模板 \$\{formatShortCode\(customDesignContext\.value\.templateCode\)\}/);
  assert.doesNotMatch(appVueSource, /只看记录 \$\{generationRecordId\} · 作品 \$\{workId\}/);
  assert.doesNotMatch(appVueSource, /编号：\{\{ formatShortCode\(record\.processRecordCode\) \}\}/);
});

test('HomeAI 定制设计过程记录不能把无输出图断言为生成中', () => {
  assert.match(appVueSource, /SUBMITTED[\s\S]*?return 'submitted';/);
  assert.match(appVueSource, /customDesignOutputPlaceholderText\(record\)/);
  assert.match(appVueSource, /return '暂无输出';/);
  assert.match(appVueSource, /status === 'submitted'[\s\S]*?return '已提交';/);
  assert.doesNotMatch(appVueSource, /<span v-else>生成中<\/span>/);
});

test('HomeAI 定制设计横向选项不能露出底部滚动条', () => {
  assert.match(appVueSource, /\.page-custom-design[\s\S]*?overflow-x: hidden;/);
  assert.match(appVueSource, /\.custom-prompt-examples::-\webkit-scrollbar[\s\S]*?display: none;/);
  assert.match(appVueSource, /\.custom-style-strip::-\webkit-scrollbar[\s\S]*?display: none;/);
  assert.match(appVueSource, /\.custom-prompt-examples,[\s\S]*?\.custom-style-strip[\s\S]*?scrollbar-width: none;/);
});

test('HomeAI AI 设计助手初始化失败应展示接口错误提示', () => {
  const autoInitSource = appVueSource.match(/watch\(activeTab,[\s\S]*?AI 设计助手自动初始化失败[\s\S]*?\n\s*\}\n\s*\}\)\(\);\n\}\);/)?.[0] ?? '';
  assert.match(autoInitSource, /AI 设计助手自动初始化失败/);
  assert.match(autoInitSource, /showToast\(message\)/);
});

test('HomeAI AI 设计助手轮次超限必须跳转会员购买页', () => {
  const sendAssistantSource = appVueSource.match(/async function sendAssistantMessage[\s\S]*?\n}\n\nfunction handleAssistantImageError/)?.[0] ?? '';
  const autoInitSource = appVueSource.match(/watch\(activeTab,[\s\S]*?AI 设计助手自动初始化失败[\s\S]*?\n\s*\}\n\s*\}\)\(\);\n\}\);/)?.[0] ?? '';
  assert.match(homeAiTypesSource, /'vipPurchase'/);
  assert.match(appVueSource, /activeTab === 'vipPurchase'/);
  assert.match(appVueSource, /function openVipPurchasePage/);
  assert.match(appVueSource, /function isAssistantRoundLimitError/);
  assert.match(appVueSource, /function isAssistantQuotaLimitError/);
  assert.match(appVueSource, /function handleAssistantQuotaLimitError/);
  assert.match(appVueSource, /function loadVipPurchaseChannel/);
  assert.match(appVueSource, /超过免费体验轮数/);
  assert.match(appVueSource, /继续开通会员/);
  assert.match(appVueSource, /goodsChannelCode/);
  assert.doesNotMatch(appVueSource, /会员购买入口已打开/);
  assert.match(sendAssistantSource, /handleAssistantQuotaLimitError\(error\)/);
  assert.doesNotMatch(sendAssistantSource, /showToast\(error instanceof Error \? error\.message : '发送失败'\)/);
  assert.match(autoInitSource, /handleAssistantQuotaLimitError\(error\)/);
});

test('HomeAI AI 设计助手 IM 页面必须接入 vue-advanced-chat', () => {
  const packageJson = JSON.parse(appPackageSource);
  assert.match(viteConfigSource, /isCustomElement:\s*\(tagName\) => tagName === 'vue-advanced-chat' \|\| tagName === 'emoji-picker'/);
  assert.equal(typeof packageJson.dependencies['vue-advanced-chat'], 'string');
  assert.match(appVueSource, /import \{ register as registerAdvancedChat \} from 'vue-advanced-chat'/);
  assert.match(appVueSource, /registerAdvancedChat\(\)/);
  assert.match(appVueSource, /<vue-advanced-chat/);
  assert.match(appVueSource, /:current-user-id="ADVANCED_CHAT_CURRENT_USER_ID"/);
  assert.match(appVueSource, /:rooms="advancedChatRooms"/);
  assert.match(appVueSource, /:messages="advancedChatMessages"/);
  assert.match(appVueSource, /@send-message="handleAdvancedChatSendMessage"/);
  assert.match(appVueSource, /function mapAssistantMessageToAdvancedChatMessage/);
  assert.match(appVueSource, /function handleAdvancedChatSendMessage/);
  assert.match(appVueSource, /slot="room-header"/);
  assert.match(appVueSource, /:slot="`message_\$\{message\._id\}`"/);
  assert.match(appVueSource, /:slot="`message-avatar_\$\{message\._id\}`"/);
  assert.match(appVueSource, /class="assistant-vac-message"/);
  assert.match(appVueSource, /class="assistant-vac-avatar"/);
  assert.match(appVueSource, /general:\s*\{/);
  assert.match(appVueSource, /header:\s*\{/);
  assert.match(appVueSource, /footer:\s*\{/);
  assert.match(appVueSource, /content:\s*\{/);
  assert.match(appVueSource, /icons:\s*\{/);
  assert.doesNotMatch(appVueSource, /roomHeader:/);
  assert.doesNotMatch(appVueSource, /roomsList:/);
  assert.doesNotMatch(appVueSource, /class="assistant-message-list"/);
  assert.doesNotMatch(appVueSource, /class="assistant-composer"/);
});

test('HomeAI 定制设计图标按钮必须有可访问语义', () => {
  assert.match(appVueSource, /aria-label="选择风格"/);
  assert.match(appVueSource, /title="选择风格"/);
});
