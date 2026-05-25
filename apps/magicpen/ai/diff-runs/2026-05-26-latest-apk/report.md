# 神笔绘画 5.27.0 APK-H5 每日差异对齐报告

- 对比日期：2026-05-26
- 执行结论：已下载并安装最新 `5.27.0` APK，完成首页、灵感、涂色、我的、绘画扫描入口对比；已修复 H5 未登录拍摄入口与 APK 5.27.0 不一致的问题。仍有首启链路和部分视觉细节未完全收敛。

## APK 信息

| 项 | 值 |
| --- | --- |
| 下载地址 | `http://172.20.98.48:8000/download/magic_pen` |
| 下载时间 | `2026-05-26 03:01:46 +0800` |
| 文件名 | `ai/diff-runs/2026-05-26-latest-apk/apk/magic_pen-latest.apk` |
| 包名 | `com.wanmeixiangsu.android.magicpen` |
| 版本名 | `5.27.0` |
| 版本号 | `500052700` |
| 构建号 | `2706` |
| 文件大小 | `137768709` bytes |
| MD5 | `7b08569a5684f99e8f060e0599e3f547` |
| SHA256 | `82fdb3771d8d3c2d61801c8192550f95349b4c9d842166430c09d8d860412f06` |
| 签名 SHA256 | `37308c7b5e444d64aa041aec8fd7c1986cbd9d449eca4400ef1d6ec3a897e1e7` |
| 签名 DN | `CN=wanmeixiangsu, OU=wanmeixiangsu, O=wanmeixiangsu, L=武汉, ST=湖北, C=CN` |

## H5 基线信息

| 项 | 值 |
| --- | --- |
| 工程目录 | `apps/magicpen` |
| 本地地址 | `http://localhost:5177/` |
| 当前分支 | `codex/homeai-apk-h5-align` |
| 关键验证脚本 | `npm run test:diff-fixes` |
| 本轮修复页面 | `#/capture` 未登录态 |

## 测试设备与抓包

| 项 | 值 |
| --- | --- |
| 模拟器 | `emulator-5554 / sdk_gphone_arm64` |
| 系统 | `Android 11` |
| 分辨率 | `1080x2340` |
| density | `440` |
| 抓包工具 | `mitmdump 监听 10.0.2.2:8081` |
| 过滤规则 | 仅记录接口路径、状态与调用时机；手机号、验证码、token 不写日志或报告 |

抓包结果：

- 代理模式下 APP 首屏进入空态，`mitmdump` 本轮未产出有效 flow 文件。
- 结合恢复直连后的页面恢复，可判断当前模拟器尚未建立可用的 HTTPS 代理信任链；本轮接口层结论主要来自页面行为、APK UI XML 和现有 H5 网络实现，而不是新抓包。

## 对比范围与证据

- APK 截图与 XML：
  - `ai/diff-runs/2026-05-26-latest-apk/app/home.(png|xml)`
  - `ai/diff-runs/2026-05-26-latest-apk/app/inspiration.(png|xml)`
  - `ai/diff-runs/2026-05-26-latest-apk/app/coloring.(png|xml)`
  - `ai/diff-runs/2026-05-26-latest-apk/app/profile.(png|xml)`
  - `ai/diff-runs/2026-05-26-latest-apk/app/capture-from-home.(png|xml)`
- H5 截图：
  - `ai/diff-runs/2026-05-26-latest-apk/h5/home.png`
  - `ai/diff-runs/2026-05-26-latest-apk/h5/inspiration.png`
  - `ai/diff-runs/2026-05-26-latest-apk/h5/coloring.png`
  - `ai/diff-runs/2026-05-26-latest-apk/h5/profile.png`
  - `ai/diff-runs/2026-05-26-latest-apk/h5/capture-fixed.png`

## 差异点明细

### 1. 首启链路新增“新人专享”页

- APK 复现步骤：
  1. 冷启动 APP。
  2. 跳过开屏广告。
  3. 进入“新人专享 / 画里的故事开始了”引导页。
  4. 点击“先看一看精选作品”进入灵感页。
- 证据：
  - `current/app-after-skip1.(png|xml)`
- H5 现状：
  - 仅复刻“来源调查 + 启动广告”，尚未补“新人专享”第三步。
- 影响：
  - 首启用户路径与 APK 不一致，H5 首次进入业务主链路更短。
- 处理状态：
  - 未在本轮修复，保留为后续体验对齐项。

### 2. 绘画扫描未登录页结构不一致

- APK 复现步骤：
  1. 首页点击“绘画扫描”。
  2. 进入手机号登录页。
- APK 关键结构：
  - `+86`
  - `请输入手机号`
  - `验证码登录`
  - 协议勾选文案
  - `其他登录方式`
  - `微信登录`
- H5 修复前：
  - 展示内部“实时 API / token / 短信登录同步”面板，偏开发工具，不像 APK 用户页。
- 处理状态：
  - 已修复。

### 3. 涂色页仍有布局细节差异

- APK：
  - 互动场景卡片只占单行，分组进度与卡片网格更紧凑。
  - 顶部按钮是完整插画卡片。
- H5：
  - 互动场景右侧文案占比更大，卡片栅格更规整，首屏密度与 APK 仍有差距。
- 处理状态：
  - 本轮未改。

### 4. 灵感页素材内容仍非同源快照

- APK：
  - 当前热门流是“兰花的鲜明 / 山中有一兔”等内容。
- H5：
  - 频道结构、按钮和次数样式基本一致，但右列素材与实际 APP 首屏不完全同源。
- 处理状态：
  - 本轮未改，需依赖最新社区接口快照或补素材映射。

## 已实现修复

- 文件：
  - `src/pages/camera/CameraPage.vue`
  - `src/app/styles/global.css`
  - `scripts/verify-latest-apk-diff-fixes.mjs`
- 修复内容：
  - 将未登录 `#/capture` 从内部调试面板改为 APK 5.27.0 风格的手机号登录页。
  - 复用现有短信发送与验证码登录接口，不新增伪接口。
  - 保留微信登录占位按钮，仅提示 H5 原型暂不接入，避免误导为真实打通。
  - 新增契约检查，约束手机号输入框、协议文案、其他登录方式和微信登录入口。

## 验证结果

已执行：

- `npm run test:diff-fixes`
- `npm run build`
- 重新截图 `ai/diff-runs/2026-05-26-latest-apk/h5/capture-fixed.png`
- 重新对照 APK `ai/diff-runs/2026-05-26-latest-apk/app/capture-from-home.png`

验证结论：

- `#/capture` 未登录页已从开发面板切换为 APK 同类手机号登录布局。
- 短信登录链路仍复用真实接口，满足后续继续联调的前提。
- 首页、灵感、我的主结构保持上轮对齐结果，没有因本次修复回退。

## 未解决风险

1. 代理抓包未拿到有效新 flow，API 调用时机只能以页面行为和现有实现推断，仍建议补一次可信代理抓包。
2. 首启新增“新人专享”页尚未复刻，首次进入主链路仍与 APK 5.27.0 有一跳差异。
3. H5 截图依赖临时自动化方式写入首启完成态，只用于本轮本地验证，没有沉淀成正式测试脚本。

## 后续建议

1. 优先补齐首启“新人专享”页，并把首启三段流程做成可脚本化回归。
2. 在模拟器中安装 mitm CA 或改走可用抓包方案，补抓 5.27.0 首页与灵感流接口。
3. 若后续继续做视觉收敛，下一优先级应放在涂色页首屏密度和灵感页素材映射。
