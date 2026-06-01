# HomeAI 定制设计一句话改图页设计

## 背景

HomeAI 当前定制设计入口已经接入到 AI 设计助手会话页，页面和接口语义都偏 IM：进入定制设计后复用 `assistant` 页面，创建会话、发送消息、轮询消息列表，再在消息气泡里展示结果。

新的产品判断是：定制设计不是普通聊天，而是“基于一张作品图，输入一句改造意图，生成一张新图”的任务流。它应该参考 ai-app 的一句话 P 图页，使用独立页面承载，不再借用现有 IM 窗口。

本设计文档只覆盖方案和静态页复刻范围，不直接修改业务代码。

## 参考实现

ai-app 一句话 P 图模块位于：

- `/Users/chenzhiyuan/work/codes/wmxs/app/ai-app/modules/voice_image_editor/lib/src/page/voice_image_editor/voice_image_editor_page.dart`
- `/Users/chenzhiyuan/work/codes/wmxs/app/ai-app/modules/voice_image_editor/lib/src/page/voice_image_editor/voice_image_editor_logic.dart`
- `/Users/chenzhiyuan/work/codes/wmxs/app/ai-app/modules/voice_image_editor/lib/src/page/voice_image_editor/networks/voice_image_edit_network.dart`
- `/Users/chenzhiyuan/work/codes/wmxs/app/ai-app/modules/voice_image_editor/lib/src/page/voice_image_editor/widgets/voice_editor_image_section.dart`
- `/Users/chenzhiyuan/work/codes/wmxs/app/ai-app/modules/voice_image_editor/lib/src/page/voice_image_editor/widgets/voice_editor_bottom_section.dart`
- `/Users/chenzhiyuan/work/codes/wmxs/app/ai-app/modules/voice_image_editor/lib/src/page/voice_image_editor/widgets/voice_editor_info_panel.dart`

它的核心不是聊天列表，而是：

1. 页面进入时生成 `batchNo`。
2. 加载 `query-config`，拿到 `templateCode/title/tips`。
3. 展示一张原图，后续每次成功生成后把新图追加到图片列表。
4. 用户通过语音、文本或风格卡片提交指令。
5. `submit` 返回 `processRecordCode/say/audioUrl`。
6. 客户端用 `fetch(processRecordCode)` 轮询。
7. 成功后展示新图；失败后展示错误态。
8. 页面关闭时如有任务，调用 `terminate(batchNo)`。

## HomeAI 当前状态

HomeAI H5 当前页面集中在：

- `/Users/chenzhiyuan/work/codes/wmxs/h5-app/apps/homeai/src/app/App.vue`
- `/Users/chenzhiyuan/work/codes/wmxs/h5-app/apps/homeai/src/shared/designAssistantApi.ts`
- `/Users/chenzhiyuan/work/codes/wmxs/h5-app/apps/homeai/app.config.ts`

当前问题：

1. `openCustomDesignFromWork`、`openCustomDesignFromResult` 会把 `activeTab` 切到 `assistant`。
2. 定制设计复用 `assistantMessages`、`assistantSessionKey`、`sendDesignAssistantMessage`。
3. UI 是聊天气泡和输入框，不符合一句话改图的任务流。
4. “历史会话”和“消息列表”对定制设计暂时不是必需能力。

## 设计目标

1. HomeAI 新增独立定制设计页，不复用 `page-assistant`。
2. 第一阶段先复刻静态页面和本地交互状态，接口只预留契约。
3. 页面风格参考 ai-app 一句话 P 图，但要贴合 HomeAI 的装修场景。
4. 定制设计接口参考一句话 P 图 API：`query-config/submit/fetch/terminate`。
5. 暂时不做 history；生成历史只在当前页面内以图片列表体现。
6. 支持不同 `templateCode`，由入口或配置决定本次定制设计使用哪个模板。

## 页面结构

新增 HomeAI 定制设计页面状态：

```text
activeTab = 'customDesign'
```

或者如果不想扩展底部 tab 类型，也可以新增独立页面状态：

```text
activeOverlayPage = 'customDesign'
```

推荐使用 `activeTab = 'customDesign'`，但底部导航不显示它。这样实现简单，和现有 `assistant` 页面切换方式一致。

页面结构参考：

```text
page-custom-design
  header
    close/back
    title: 定制设计
    terminate/reset 可选

  image-stage
    blurred background
    current image
    1/N indicator
    uploading / processing overlay

  instruction-panel
    initial: 展示标题和提示语
    processing: 展示用户刚提交的意图 + 生成中提示
    completed: 展示继续修改提示
    failed: 展示失败提示
    style: 展示风格卡片

  composer
    style toggle
    text input
    submit button
```

静态复刻阶段不接入语音识别，先保留文本输入和风格卡片。语音按钮可以不展示，或者展示为不可用状态；不要把语音能力作为第一阶段阻塞项。

## 页面交互

### 从作品进入

入口：我的作品、生成结果页、不满意修改。

进入时构造页面上下文：

```ts
interface CustomDesignPageContext {
  batchNo: string;
  workId?: string;
  recordId?: string;
  templateCode?: string;
  sourceImageUrl: string;
  sourceImageEncodedData?: string;
}
```

静态阶段：

1. 使用作品封面作为第一张图。
2. 初始化图片列表：`[sourceImage]`。
3. 输入框为空，等待用户输入改造意图。
4. 不自动提交 Agent。

### 提交文本

用户输入一句意图后点击发送：

1. 校验文本非空。
2. 页面进入 `submitting/processing`。
3. 静态阶段用本地 mock 模拟返回结果。
4. 真实接口阶段调用 `submit`。
5. 成功拿到 `processRecordCode` 后进入轮询。

### 图片展示

图片列表只保留当前页面生命周期内的数据：

```ts
interface CustomDesignImageEntry {
  localId: string;
  imageUrl: string;
  encodedData?: string;
  isOriginal: boolean;
}
```

成功生成后追加新图，并自动切到最新图。用户再输入一句话时，默认基于当前选中图继续修改。

### 页面关闭

如果存在未完成任务，真实接口阶段调用 `terminate(batchNo)`。静态阶段只清理本地状态。

## 接口契约

接口命名建议参考一句话 P 图，但放在 HomeAI 自己的命名空间：

```text
POST /api/open/homeai/custom-design/query-config.htm
POST /api/open/homeai/custom-design/submit.htm
POST /api/open/homeai/custom-design/fetch.htm
POST /api/open/homeai/custom-design/terminate.htm
```

暂不提供：

```text
/history
/messages/list
/sessions
```

### query-config

请求：

```json
{
  "templateCode": "homeai_custom_design_default"
}
```

响应：

```json
{
  "templateCode": "homeai_custom_design_default",
  "title": "想怎么改这张图？",
  "tips": "描述你想调整的风格、颜色、软装或问题",
  "styles": [
    {
      "styleCode": "cream",
      "styleName": "奶油风",
      "iconUrl": "https://static.example.com/homeai/styles/cream.png"
    }
  ]
}
```

### submit

请求：

```json
{
  "batchNo": "client-generated-id",
  "templateCode": "homeai_custom_design_default",
  "workId": "work-id",
  "recordId": "generation-record-id",
  "sourceImageUrl": "https://static.example.com/homeai/source-room.png",
  "sourceImageEncodedData": "optional-file-key",
  "paramList": [
    { "key": "image1", "value": "encodedData-or-url" },
    { "key": "text", "value": "把客厅改成奶油风" },
    { "key": "inputType", "value": "text" },
    { "key": "styleCode", "value": "cream" }
  ]
}
```

响应：

```json
{
  "processRecordCode": "process-record-code",
  "nextFetchPeriodMs": 2000,
  "say": ""
}
```

`say/audioUrl` 可以兼容一句话 P 图，但 HomeAI 定制设计页面不依赖它。

### fetch

请求：

```json
{
  "processRecordCode": "process-record-code"
}
```

响应处理中：

```json
{
  "processRecordCode": "process-record-code",
  "status": 0,
  "nextFetchPeriodMs": 2000
}
```

响应成功：

```json
{
  "processRecordCode": "process-record-code",
  "status": 1,
  "image": {
    "large": "https://static.example.com/homeai/custom-design-output.png",
    "encodedData": "file-key"
  }
}
```

响应失败：

```json
{
  "processRecordCode": "process-record-code",
  "status": 2,
  "errorMsg": "生成失败，请稍后重试"
}
```

## templateCode 规则

定制设计必须支持不同 `templateCode`。

规则：

1. 入口有明确模板时，使用入口传入的 `templateCode`。
2. 作品有 `templateId/templateCode` 时，作为默认模板。
3. 都没有时，使用配置默认值 `homeai_custom_design_default`。
4. 每次 submit 都必须把实际使用的 `templateCode` 保存到请求快照。
5. 前端不直接传 worker `sceneCode`；服务端根据 `templateCode` 路由到具体 Agent/Worker。

客户端静态阶段可以先维护：

```ts
const customDesignTemplateCode = computed(() =>
  customDesignContext.value?.templateCode || 'homeai_custom_design_default'
);
```

## 状态机

页面状态参考 ai-app：

```text
idle
uploading
submitting
processing
completed
failed
```

第一阶段静态页只需要：

```text
idle
processing
completed
failed
```

状态说明：

- `idle`：等待输入。
- `processing`：已经提交，禁用输入，展示生成中遮罩。
- `completed`：展示新图，恢复输入。
- `failed`：展示错误文案，允许重新提交。

## H5 改造范围

第一阶段只做静态复刻：

1. 在 `App.vue` 新增 `page-custom-design` 模板区域。
2. 新增定制设计状态变量：上下文、图片列表、当前图片索引、输入文本、页面状态、当前任务。
3. 将 `openCustomDesignFromWork`、`openCustomDesignFromResult` 改为进入 `customDesign` 页面，不再进入 `assistant`。
4. 新增本地 mock 提交逻辑：延迟后追加一张结果图，模拟生成完成。
5. 新增样式，复刻 ai-app 的深色图片舞台、底部输入面板、风格卡片、处理中遮罩。
6. 不接入真实接口，不改服务端。

第二阶段接真实接口：

1. 在 `app.config.ts` 增加 `customDesignQueryConfig/submit/fetch/terminate` endpoint。
2. 新增 `customDesignApi.ts`。
3. 用 `requestBusiness` 调用 HomeAI 定制设计接口。
4. 替换本地 mock 提交和轮询。
5. 页面关闭或切走时终止未完成任务。

## 服务端预期

服务端可以借鉴一句话 P 图流程：

1. `batchNo` 表示当前页面的一组连续定制。
2. `processRecordCode` 表示单次生成任务。
3. 复用 `GenerationRecordEntity` 和 `GenerationProcessRecordEntity`。
4. 新增或复用定制设计 `featureType`。
5. 根据 `templateCode` 解析 worker scene、prompt 模板、价格、输入 schema。
6. `submit` 只创建记录并投递异步任务，不同步等待 Agent。
7. `fetch` 查询单次任务状态和图片结果。

聊天的 session/message 表不参与定制设计。

## 验收标准

静态复刻验收：

1. 从作品列表点击“定制设计”，进入独立定制设计页，而不是 AI 设计助手聊天页。
2. 页面首屏展示源图、标题提示、文本输入框、发送按钮。
3. 用户输入一句话并发送后，页面进入处理中状态，输入禁用。
4. 模拟完成后追加结果图，右上角显示 `2/2`，输入恢复。
5. 点击“不满意，帮我修改”进入同一独立页面，并预填默认修改文案。
6. 底部 AI 入口仍进入普通 AI 设计助手，不受定制设计影响。
7. 暂不出现历史会话、消息气泡、助手消息列表。

真实接口验收：

1. `submit` 请求包含 `batchNo/templateCode/workId/sourceImage/text`。
2. `submit` 返回 `processRecordCode` 后开始轮询 `fetch`。
3. `fetch status=0` 继续等待，使用后端返回的 `nextFetchPeriodMs`。
4. `fetch status=1` 展示结果图。
5. `fetch status=2` 展示失败态。
6. 不调用 `/design-assistant/send.htm`、`/messages/list.htm`、`/sessions.htm`。

## 风险和取舍

1. 静态页第一阶段不接语音，避免把 ASR 权限、录音状态和音频播放复杂度带进 HomeAI H5。
2. 暂不做 history，刷新页面后当前生成列表会丢失；这是本阶段接受的取舍。
3. 如果产品后续要求历史，可以基于服务端 `GenerationProcessRecord` 做“生成记录列表”，不需要回退到 IM 消息表。
4. `templateCode` 必须从第一版就进入页面状态和 submit 请求，否则后续多模板会返工。
5. 当前 HomeAI `app.config.ts` 已有本地改动，实施时需要只提交本任务相关文件，避免混入已有配置变更。

## 推荐结论

按这个方向推进：

1. 定制设计使用独立一句话改图页。
2. AI 设计助手继续使用聊天页。
3. 定制设计第一阶段先做静态复刻和本地 mock。
4. 第二阶段接 HomeAI 自有 `custom-design` 接口。
5. 接口协议参考一句话 P 图，但不复用 IM 的 session/message。
