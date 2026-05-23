# 2026-05-23 HomeAI APK-H5 继续差异对齐

## 输入基线

- APK 下载源：`http://172.20.98.48:8000/download/zhuangxiu_app`
- 下载时间：`2026-05-23 08:54 +08:00`
- 下载产物：`ai/apks/zhuangxiu_app-2026-05-22-build2688.apk`
- SHA-256：`3de18097858f2627a8d8ee290d2e30a19596ac6e79e7f20f0ba29c6e80d42d29`
- 包名：`com.wanmeixiangsu.android.homeai`
- 版本号：`5.27.0`
- 版本码：`500052700`
- 下载页元信息：`BuildNo:2688 branch:master`

## 环境恢复

- `curl --noproxy '*' http://172.20.98.48:8000/`：已恢复，返回 `200 OK`。
- `adb devices -l`：已恢复，可连接 `emulator-5554`。
- 模拟器：`codex_pixel_30`。

## 本轮 APK 采样

- 首启隐私弹窗：`apk-current.png` / `apk-current.xml`
- 身份问卷页：`apk-after-agree.png` / `apk-after-agree.xml`
- 来源问卷页：`apk-onboarding-source.png` / `apk-onboarding-source.xml`
- 引导页跳过后首页：`apk-home.png` / `apk-home.xml`
- 设计页：`apk-design-tab.png` / `apk-design-tab.xml`
- 发现页：`apk-discover-tab.png` / `apk-discover-tab.xml`
- 我的页：`apk-mine-tab.png` / `apk-mine-tab.xml`

## 已确认差异与修复

1. 来源问卷 H5 缺少 `朋友分享`，最后一项文案也与 APK 不一致。已按 APK 顺序改为：
   `设计师/装修公司推荐 / 小红书 / 抖音 / 微信视频号 / 朋友分享 / 应用商店搜索 / 问的AI，如豆包/千问/文心一言（百度）/kimi/夸克/元宝等`。
2. 身份问卷标题缺少 APK 后半句 `我们会为您推荐最合适的功能。`，来源问卷多了一行 H5 说明文案。已对齐。
3. APK 未登录“我的”页展示 `点击登录`、`登录后获取更多功能信息`、`当前账号未登录`。H5 原先仍按昵称/钻石结构渲染，已改为按 `userId` 判断登录态。
4. APK 未登录“发现”页仍展示 `室内 / 外观` 分段和 `卧室 / 客厅 / 厨房` 推荐架。H5 原先在实时接口无数据时展示空态，已保留发现页 APK 本地结构，但不伪造账号和作品数据。
5. VIP 卡标题已由纯图片替换为 APK 可读文案 `超多会员特权等你体验`，继续保留 `立即开通` 和三项权益。

## 修复后 H5 采样

- `h5-home.png`
- `h5-design-tab.png`
- `h5-discover-tab.png`
- `h5-mine-tab.png`
- `h5-onboarding-source.png`

修复后文本抽查：

- 首页：`室内设计 / 客厅设计 / 卧室设计`
- 设计页：`第一步 / 上传照片,AI生成设计方案 / 上传图片 / 参考示例 / 下一步`
- 发现页：`发现 / 室内 / 外观 / 卧室 / 客厅 / 厨房`
- 我的页：`点击登录 / 登录后获取更多功能信息 / 超多会员特权等你体验 / 当前账号未登录`
- 来源问卷：已包含 `朋友分享` 和完整 AI 来源文案。

## 验证

- `pnpm test`：通过，`9` 个用例。
- `pnpm build`：通过。
- Playwright + 系统 Chrome：已采集修复后 H5 首页、设计页、发现页、我的页和来源问卷截图。

## 遗留风险

- 首页、发现页图片素材仍非 APK 同源素材，只能继续使用仓库已提取的空间类素材。
- H5 截图仍带桌面 `phone-shell` 外框，APK 为模拟器全屏，像素级指标仍不适合作为严格验收。
- 真实登录、验证码、支付、邀请分享和问卷提交接口未在本轮接入；本轮只对齐可证实的未登录 UI 和入口语义。
