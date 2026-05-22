# 神笔绘画 APK-H5 每日差异对齐报告（阻塞记录）

- 执行日期：2026-05-23
- 执行结论：本轮未能获取 2026-05-23 的最新 APK，也无法启动本地 `adb` 守护进程连接 Android 模拟器，因此未完成新的 APK 安装、抓包和 APK/H5 复验；已复核本地 `5.26.0` 基线 APK、既有差异修复点与验证脚本，确认当前仓库仍保持 2026-05-22 的对齐结果。

## APK 信息

### 本轮下载结果

- 目标地址：`http://172.20.98.48:8000/`
- 访问时间：2026-05-23
- 访问结果：`curl -I --max-time 10 http://172.20.98.48:8000/` 返回 `curl: (7) Failed to connect`
- 阻塞判断：当前运行环境无法连接内网下载地址，无法确认今天是否存在比 `5.26.0` 更新的 APK。

### 可复用本地 APK 基线

- 文件：`ai/apk-downloads/magicpen-5.26.0-ddooo.apk`
- 本地落盘时间：2026-05-22 16:15（文件时间）
- 文件大小：`99M`
- SHA256：`c887fc68f1cecbfec6ea5fb7b744955cc1e43bddd7dcadc30a09338062f0a757`
- MD5：`dbf465e580c2b33f3258035ae02d5342`
- 包名：`com.wanmeixiangsu.android.magicpen`
- 版本号：`5.26.0`
- 构建号：`500052600`
- 签名摘要：
  - SHA1：`5B:4B:AF:61:54:56:0F:65:EC:AB:F0:F5:9C:EC:D8:5D:28:43:35:AA`
  - SHA256：`37:30:8C:7B:5E:44:4D:64:AA:04:1A:EC:8F:D7:C1:98:6C:BD:9D:44:9E:CA:44:00:EF:1D:6E:C3:A8:97:E1:E7`
- 证书主体：`CN=wanmeixiangsu, OU=wanmeixiangsu, O=wanmeixiangsu, L=武汉, ST=湖北, C=CN`

说明：

- 包名、版本号、构建号来自 2026-05-22 安装校验报告 `ai/diff-runs/2026-05-22-latest-apk/report.md`。
- 本轮环境缺少可用 `aapt/apkanalyzer`，且 `adb` 不能连接设备，无法再次直接从安装态回读。

## H5 基线信息

- 工程目录：`/Users/chenzhiyuan/work/codes/wmxs/h5-app/apps/magicpen`
- 当前分支：`codex/homeai-apk-h5-align`
- 基线报告：`ai/diff-runs/2026-05-22-latest-apk/report.md`
- 基线修复记录：`ai/diff-runs/2026-05-22-latest-apk/fix-notes.md`
- 当前差异契约脚本：`scripts/verify-latest-apk-diff-fixes.mjs`

## 测试设备 / 模拟器信息

- 目标设备：Android 模拟器（上一轮记录为 `emulator-5554`，`1080x2340`，density `440`）
- 本轮状态：未能建立 `adb` 连接
- 失败证据：`adb devices -l` 触发 `could not install *smartsocket* listener: Operation not permitted`
- 阻塞判断：当前沙箱限制阻止 `adb` 启动守护进程，因此无法安装 APK、拉起 APP、导出 UI 层级或执行抓包联调。

## 抓包工具和过滤规则

- 计划工具：`mitmproxy`
- 本轮实际状态：未启动
- 原因：APP 未能安装并启动，且无法通过 `adb` 配置代理或联通模拟器
- 脱敏规则：
  - 不记录 token、密码、验证码、手机号、身份证
  - 若后续抓到敏感字段，仅允许描述字段类别与接口上下文，不输出明文

## 对比范围

本轮未执行新的 APK 实机走查，因此对比范围退化为既有基线复核：

- 首页
- 灵感页
- 涂色页
- 拍摄 / 绘画扫描入口
- 我的页
- 既有差异修复契约脚本

## 差异点明细

### 本轮新增差异

- 无法判断。
- 原因：没有获取到 2026-05-23 的最新 APK，也没有新的模拟器运行证据。

### 复核 2026-05-22 已修复项

通过源码与契约脚本复核，以下修复点仍然存在：

1. 拍摄入口统一走 `openCaptureEntry`，未登录时先展示登录前置页。
2. 我的页默认恢复未登录态，展示“点击登录”“当前账号未登录”。
3. 我的页快捷入口包含“口令福利”。
4. 涂色页分组标题为“入门·水果蔬菜”，状态为“待开始”。
5. 首页会员入口文案为“开通会员”。
6. 灵感页“做同款”次数仍压到 APP 首屏量级。

对应证据：

- `src/app/model.ts`
- `src/pages/camera/CameraPage.vue`
- `src/pages/profile/ProfilePage.vue`
- `src/pages/coloring/ColoringPage.vue`
- `src/pages/home/HomePage.vue`
- `src/pages/inspiration/InspirationPage.vue`
- `scripts/verify-latest-apk-diff-fixes.mjs`

## 已实现修复

- 本轮未新增 H5 业务代码修复。
- 原因：缺少新的 APK 与模拟器证据，继续修改会脱离 APK 事实基线。

## 验证结果

本轮执行了最小可行复核：

1. 访问 APK 下载源，确认网络阻塞。
2. 检查 `adb`，确认模拟器链路阻塞。
3. 校验本地 `5.26.0` APK 文件哈希和签名摘要。
4. 复读上轮差异报告与修复记录。
5. 复读 H5 关键页面源码和差异契约脚本。

未执行项：

- 新 APK 下载与安装
- APP 启动与页面走查
- 抓包
- H5 本地启动后的人工对照截图
- APK/H5 二次复验

## 未解决风险

1. 今天的真实最新 APK 版本未知，无法判断是否已升版。
2. 若 APP 在 2026-05-22 之后改动了首页素材、路由、登录态或接口契约，当前 H5 无法及时感知。
3. 当前环境无法启动 `adb`，意味着后续所有依赖模拟器和抓包的自动化步骤都会失败，除非更换执行环境或放开对应权限。

## 后续建议

1. 在可访问内网地址的环境重试 `http://172.20.98.48:8000/`，优先确认 2026-05-23 是否有新包。
2. 在允许 `adb` 启动守护进程的执行环境重跑安装、启动、抓包和截图链路。
3. 若仍无新包，可直接复用 `ai/apk-downloads/magicpen-5.26.0-ddooo.apk` 继续做人审对齐，不必重复下载三方来源。
4. 若需要提升自动化稳定性，建议后续补一个仓库内 APK 元信息提取脚本，避免版本号和包名只能依赖历史报告。
