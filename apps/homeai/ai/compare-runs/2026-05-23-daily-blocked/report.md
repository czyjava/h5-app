# 2026-05-23 HomeAI APK-H5 每日差异对齐报告

## 执行结论

- 今日未能完成“从内网下载最新 APK -> 安装启动 -> 抓包 -> APK/H5 复验”的完整闭环。
- 阻塞发生在输入链路和设备链路：
  - `2026-05-23 10:01:59 +08:00` 通过 `curl` 访问 `http://172.20.98.48:8000/` 失败，报错 `curl: (7) Failed to connect to 172.20.98.48 port 8000 via 127.0.0.1 after 1 ms: Could not connect to server`。
  - 同轮执行 `adb devices -l` 时，`adb` 守护进程启动失败，日志为 `could not install *smartsocket* listener: Operation not permitted`，导致无法通过命令行安装 APK、启动应用或导出界面树。
  - 尝试切换桌面 GUI 探测时，`computer-use` 对浏览器访问被平台审批机制拦截，本轮无法继续通过 GUI 验证内网地址或接管模拟器。

## APK 信息

### 今日目标 APK

- 下载地址：`http://172.20.98.48:8000/`
- 拉取时间：`2026-05-23 10:01:59 +08:00`
- 结果：不可访问，未拿到最新 APK 文件名、版本号、构建号和签名信息。

### 本机缓存 APK 基线

- 文件路径：`/Users/chenzhiyuan/Downloads/装修APP.apk`
- 文件修改时间：`2026-05-20 15:10:00 +08:00`
- 文件大小：`135812780` bytes
- SHA-256：`99ef16dfd73ee808a9422e070f7d8e1db848489a37d1a30eae2a73f5c9c3739c`
- 包名：`com.wanmeixiangsu.android.homeai`
- 版本号：`5.26.0`
- 构建号：`500052600`
- 签名摘要（SHA-256）：`37308c7b5e444d64aa041aec8fd7c1986cbd9d449eca4400ef1d6ec3a897e1e7`
- 签名主体：`CN=wanmeixiangsu, OU=wanmeixiangsu, O=wanmeixiangsu, L=武汉, ST=湖北, C=CN`

说明：以上仅用于补充“本机已有旧基线”的识别信息，不能替代今天应从内网拉取的“最新 APK”。

## H5 基线信息

- 工程目录：`/Users/chenzhiyuan/work/codes/wmxs/h5-app/apps/homeai`
- Git 分支：`codex/homeai-apk-h5-align`
- H5 配置版本：`5.27.0`
- 包名配置：`com.wanmeixiangsu.android.homeai`

## 测试设备与工具

- 可见 AVD：
  - `codex_pixel_30`
  - `codex_pixel_35`
  - `home_ai_api36`
- Android SDK 工具：
  - `adb`: `/Users/chenzhiyuan/Library/Android/sdk/platform-tools/adb`
  - `apkanalyzer`: `/Users/chenzhiyuan/Library/Android/sdk/cmdline-tools/latest/bin/apkanalyzer`
  - `apksigner`: `/Users/chenzhiyuan/Library/Android/sdk/build-tools/36.0.0/apksigner`
- 抓包工具候选：
  - `mitmproxy`: `/opt/homebrew/bin/mitmproxy`
  - `tcpdump`: `/usr/sbin/tcpdump`

## 抓包工具与过滤规则

- 计划工具：`mitmproxy`
- 计划过滤规则：
  - 仅记录接口方法、路径、参数键名、响应字段名、调用时机、状态码和错误分支。
  - 禁止记录或输出 token、密码、验证码、手机号、身份证、完整 cookie、签名串等敏感值。
  - 如命中敏感字段，只描述字段类别和接口上下文，不落原值。
- 今日结果：由于 APK 未下载且 `adb` 不可用，本轮未实际启动抓包。

## 对比范围

- 目标范围：页面结构、入口路径、路由跳转、用户交互、功能逻辑、状态变化、异常/空态/加载态、权限/登录态、埋点/关键日志、API 请求方法/路径/参数/响应字段/调用时机/错误处理。
- 今日实际范围：
  - 复核昨日 `2026-05-22` 的 APK 基线报告与两轮修复报告。
  - 验证当前 H5 工程是否存在回退。
  - 未能对“今日最新 APK”进行新一轮界面对齐采集。

## 差异点明细

### 今日新增可证实差异

- 无。原因不是“完全一致”，而是今天缺少最新 APK 输入与可运行设备链路，无法生成新的 APK 证据。

### 仍沿用的历史遗留差异

基于 `ai/compare-runs/2026-05-22-loop-1/report.md` 与 `ai/compare-runs/2026-05-22-loop-2/report.md`，当前仍需关注：

1. 首页素材图、顶部背景与 APK 内置资源仍非同源，当前 H5 使用仓库已提取素材替代。
2. 发现页真实推荐图片与 APK 线上内容可能继续漂移，现阶段无法在无新抓包的情况下确认今日接口结构是否变化。
3. 像素级对比仍受桌面 `phone-shell` 外框影响，只适合作为趋势指标，不适合作为严格验收值。

## 今日实现修复

- 无代码修复。

原因：

1. 本轮未拿到最新 APK，无法确认差异是否仍然成立。
2. `adb` 与 GUI 探测链路都被环境限制卡住，无法完成“复现 -> 根因 -> 修复 -> 复验”的闭环。
3. 在缺少最新 APK 证据时继续修改 H5，风险是把昨天的结论误当成今天的真实差异。

## 验证结果

- `pnpm test`：通过，`6` 个用例全部通过。
- `pnpm build`：通过。
- Git 工作区：执行开始时干净，无未提交业务改动。
- 今日未执行：
  - 最新 APK 下载
  - APK 安装与启动
  - 抓包
  - APK/H5 界面复验

## 未解决风险

1. 内网 APK 服务不可达，无法确认今天是否已升级到新版本。
2. `adb` 权限异常导致自动化安装、启动、截图、导出 UI 树全部不可用。
3. 今天未能抓包，无法确认最新接口字段、调用时机或错误分支是否已变化。
4. 如果服务端已变更推荐内容、会员商品或发现页配置，当前 H5 只能沿用昨日基线，可能出现未被识别的漂移。

## 后续建议

1. 在具备内网访问能力的环境重试 `http://172.20.98.48:8000/`，确认最新 APK 文件名、版本号和构建号。
2. 修复本机 `adb` 守护进程权限问题，再执行安装、启动、截图和抓包闭环。
3. 若需要继续沿用本机缓存 APK，请明确标注它是 `5.26.0` 旧基线，避免与昨日 `5.27.0` APK 基线混淆。
4. 环境恢复后，优先复验首页素材、发现页推荐内容和会员/钻石链路，这三处最容易随 APK 版本或配置漂移。
