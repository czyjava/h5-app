# 2026-05-26 HomeAI APK-H5 每日差异对齐报告

## APK 信息

- 下载地址：`http://172.20.98.48:8000/download/zhuangxiu_app`
- 下载页时间：`2026-05-26T01:44:08.496826+08:00`
- 本地下载完成：`2026-05-26 02:01:57 +08:00`
- 下载产物：`ai/apks/zhuangxiu_app-2026-05-26-build2707.apk`
- 文件大小：`130M`
- SHA-256：`93ae7305a9eb6feef0d6919ebdd7a58acc65a4b775e8e0afe89752dade20ee8a`
- 下载页元信息：`BuildNo:2707 branch:master`
- 包名：`com.wanmeixiangsu.android.homeai`
- 版本号：`5.27.0`
- 版本码：`500052700`
- 目标 SDK：`33`
- 签名摘要：
  - SHA-256：`37308c7b5e444d64aa041aec8fd7c1986cbd9d449eca4400ef1d6ec3a897e1e7`
  - SHA-1：`5b4baf6154560f65ecabf0f59cecd85d284335aa`
  - MD5：`c1cf819418b738262e143b1870c8cbc1`

## H5 基线信息

- 工程目录：`/Users/chenzhiyuan/work/codes/wmxs/h5-app/apps/homeai`
- Git 分支：`codex/homeai-apk-h5-align`
- 基线提交：`4928e5f`
- H5 配置版本：`5.27.0`
- 本轮关键代码：
  - `src/app/App.vue`
  - `src/shared/appContent.test.mjs`

## 测试设备与工具

- 模拟器：`codex_pixel_30`
- `adb device`：`emulator-5554`
- Android 版本：`11`
- SDK：`30`
- 机型：`sdk_gphone_arm64`
- 抓包工具：`mitmdump`
- 抓包脚本：`ai/compare-runs/2026-05-26-daily/mitm_sanitize.py`
- 脱敏规则：
  - 仅记录 `method / host / path / queryKeys / requestBodyKeys / responseKeys / statusCode`
  - `token / password / phone / mobile / idCard / smsCode / authorization / cookie` 等键名统一记为 `<sensitive>`
  - 不落真实请求体、响应体、验证码、手机号、token

## 对比范围

- 首启入口与首页跳转链路
- 首页、设计页、发现页、我的页结构与关键文案
- 登录态与游客态入口
- 抓包可见的请求域名、TLS 行为与阻塞点

## APK 采样证据

- 登录首屏：`apk/apk-home-initial.png`、`apk/apk-home-initial.xml`
- 首页：`apk/apk-top-action.png`、`apk/apk-home-tab.xml`
- 设计页：`apk/apk-design-tab.png`、`apk/apk-design-tab.xml`
- 发现页：`apk/apk-discover-tab.png`、`apk/apk-discover-tab.xml`
- 我的页：`apk/apk-mine-tab.png`、`apk/apk-mine-tab.xml`
- 抓包摘要：`mitm-summary.jsonl`

## 差异点明细

### 1. 首启入口已从旧问卷链路切为登录落地页

- APK 证据：
  - `apk-home-initial.xml` 出现 `请输入手机号 / 验证码登录 / 我已阅读并同意「AI装修大师」的 / 其他登录方式 / 微信登录`
  - 截图 `apk-home-initial.png` 可见左上返回箭头，说明可退回游客浏览态
- H5 旧行为：
  - 首屏仍是 `个人信息保护指引 -> 身份问卷 -> 来源问卷 -> 引导页`
- 影响：
  - 首次进入 H5 与 APK 主路径完全不一致，导致复刻入口失真

### 2. 最新 APK 抓包链路存在证书信任阻塞

- 抓包设置：
  - 模拟器代理指向 `10.0.2.2:8082`
  - `mitmdump --mode regular@8082 -s ai/compare-runs/2026-05-26-daily/mitm_sanitize.py`
- 观测结果：
  - 已看到 `config.wanmeixiangsu.cn`、`pixel-studio.wanmeixiangsu.cn`、`auth.wanmeixiangsu.cn` 发起连接
  - 但 TLS 握手报 `client does not trust the proxy's certificate`
- 结论：
  - 本轮只能确认 APK 访问核心业务域名，无法在不改系统证书的前提下稳定抓到 HTTPS 请求明细

### 3. 首页、设计页、发现页、我的页主结构与上轮 H5 基线基本一致

- APK 文本抽样：
  - 首页：`开通会员 / 室内设计 / 客厅设计 / 卧室设计 / 去试试`
  - 设计页：`下一步 / 第一步 / 上传照片,AI生成设计方案 / 上传图片 / 参考示例 / 免费`
  - 发现页：`发现 / 室内 / 外观 / 卧室 / 查看全部 / 客厅 / 厨房`
  - 我的页：`作品 / 点击登录 / 登录后获取更多功能信息 / 超多会员特权等你体验 / 邀请好友 / 用户问卷 / 当前账号未登录`
- 结论：
  - 最新 Build 2707 的主要新增差异集中在首启登录门面，已对齐其余主 tab 文案基线

## 已实现修复

- 在 `src/app/App.vue` 新增 APK Build 2707 登录门面：
  - 手机号输入框
  - 协议勾选
  - `验证码登录`
  - `其他登录方式 / 微信登录`
  - 左上返回首页能力
- 将旧的 `隐私 -> 问卷 -> 引导` 默认首启链路替换为当前 APK 首屏逻辑
- 保留游客态浏览首页、设计页、发现页、我的页的既有对齐结果
- 新增源码级回归测试，锁定登录门面关键文案和游客回退入口

## 验证结果

- APK 复验：
  - 成功安装并启动 `zhuangxiu_app-2026-05-26-build2707.apk`
  - 已采集登录首屏、首页、设计页、发现页、我的页截图与 UI 树
- H5 验证：
  - `pnpm test`：通过，`9/9`
  - `pnpm build`：通过
  - `pnpm dev` 已启动并提供 `http://localhost:5175/?__homeai_reset=1`
- 浏览器复验限制：
  - 本轮尝试通过桌面自动化读取 Chrome/Safari 窗口时，均返回 `cgWindowNotFound`
  - 因此 H5 视觉复验以源码、测试和构建结果为主，未产出新的浏览器截图

## 未解决风险

- 未给模拟器安装 mitm 根证书，HTTPS 请求的 method/path/参数/响应字段仍缺少运行时明细证据
- H5 首屏登录门面当前只复刻视觉和入口语义，未接入真实验证码登录、微信登录
- 仍未解决首页与发现页素材非 APK 同源的问题

## 后续建议

1. 为 `codex_pixel_30` 安装并信任 mitm 根证书，重新抓取 `config / auth / pixel-studio` 的 HTTPS 请求摘要。
2. 如果后续需要继续对齐登录体验，可把 H5 登录门面接入只读调试模式，至少记录“请求已发起”与“等待 APK 完成登录”的状态反馈。
3. 若要做更严格视觉验收，需要恢复浏览器窗口自动化，补采 H5 首屏截图与 APK 登录页做并排对照。
