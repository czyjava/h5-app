# 2026-05-26 装修 APP APK-H5 全链路差异对齐报告

## APK 信息

- 下载地址：`http://172.20.98.48:8000/`
- 下载时间：`2026-05-26 09:46:21 +0800`
- 文件名：`zhuangxiu_app-2026-05-26-build2707-full-chain.apk`
- SHA-256：`93ae7305a9eb6feef0d6919ebdd7a58acc65a4b775e8e0afe89752dade20ee8a`
- 包名：`com.wanmeixiangsu.android.homeai`
- 版本号：`5.27.0`
- 版本码：`500052700`
- BuildNo：`2707`
- 签名摘要：SHA-256 `37308c7b5e444d64aa041aec8fd7c1986cbd9d449eca4400ef1d6ec3a897e1e7`，SHA-1 `5b4baf6154560f65ecabf0f59cecd85d284335aa`，MD5 `c1cf819418b738262e143b1870c8cbc1`

## H5 基线信息

- 工程：`@wmxs/h5-homeai`
- 分支：`codex/homeai-apk-h5-align`
- 基线提交：`ea74337`
- H5 配置版本：`5.27.0`
- 本地服务：`pnpm dev`，Vite 实际端口 `5176`

## 测试设备与抓包

- 模拟器：`emulator-5554`，`sdk_gphone_arm64`，Android `11`，SDK `30`
- APK 抓包：`mitmdump --mode regular@8083 -s ai/compare-runs/2026-05-26-full-chain/mitm_sanitize.py`
- 证书状态：模拟器已信任 mitm 证书，路径为 `/data/misc/user/0/cacerts-added/c8750f0d.0`
- 过滤与脱敏规则：只记录 method、host、path、query key、request body key、response key、HTTP status；`token/authToken/password/phone/mobile/idCard/sms/smsCode/smsId/cookie/authorization` 等字段只记录类别，不记录值；加密或非标准表单体记为 `<encrypted-or-nonstandard-form>`
- 验证平台：使用后台短信记录页匹配测试账号最新记录；报告不记录验证码、完整手机号或 token

## 对比范围

- APK：隐私/引导、短信登录、登录后首页、设计页、发现页、我的页、关键接口与埋点
- H5：入口登录门面、短信验证码发送与登录、登录态持久化、首页/设计/发现/我的页、用户资料与作品空态、代理日志脱敏
- 证据目录：`ai/compare-runs/2026-05-26-full-chain/`

## 差异点与证据

- 登录链路：APK 在 `我的 -> 点击登录 -> 手机号 -> 验证码登录 -> 验证码输入 -> 登录成功` 形成完整链路；H5 旧实现仅展示登录门面并 toast “请在 APK 中继续完成验证码登录”，无法执行全链路验证。
- 登录接口：APK 抓包包含 `POST auth.wanmeixiangsu.cn /api/open/v3/login-sms/check.htm`、`POST auth.wanmeixiangsu.cn /api/open/v3/login-sms/login.htm`、`GET auth.wanmeixiangsu.cn /api/open/v2/user/current-user.htm`；H5 旧配置没有 `auth` host 与短信登录端点。
- 登录后用户资料：H5 初次修复后发现 `current-user` 仍走 `homeai-business`，返回 `404`；APK 证据显示该接口应走 `auth` 域。
- 手机号校验：APK/测试平台使用内部测试号段；H5 旧正则只允许 `1` 开头手机号，导致自动化测试账号无法复现。
- 敏感日志：公共代理旧脱敏只覆盖部分 query/form 文本，JSON 里的 `smsId/smsCode/phone/authToken` 与短信正文样式缺少兜底脱敏。
- 已登录页面结构：APK 已登录后四个页签文案为 `首页/设计/发现/我的`，核心内容包括 `开通会员`、`室内设计/客厅设计/卧室设计`、设计上传第一步、发现 `室内/外观`、我的页 `作品/钻石/VIP/邀请好友/用户问卷/空作品态`；H5 保持既有结构，重点补齐登录态进入方式与用户资料接口域名。

## 已实现修复

- 在 `app.config.ts` 增加 `auth` host、`loginSmsCheck`、`loginSmsLogin`，复用签名代理与 `_authVersion=2.0`。
- 在入口登录门面新增真实短信登录流程：发送验证码、验证码输入、重新发送、登录、token 会话保存、登录后重新加载数据。
- 未登录 `我的` 页点击登录时重新打开短信登录门面，不再只 toast。
- 登录后 `current-user` 改走 `auth` host，与 APK 抓包域名一致。
- 验证码页只显示手机号首尾号段，避免自动化截图暴露完整手机号。
- 公共 `redactText` 增强 JSON 字符串、短信正文、任意 11 位手机号、`phone/mobile/smsId/smsCode` 的兜底脱敏。
- 新增静态回归测试覆盖真实短信登录、auth 域 current-user、脱敏规则与未登录入口重开登录门面。

## 验证结果

- APK 安装启动成功，测试账号短信登录成功，登录后采集首页、设计、发现、我的页截图与 UI 树。
- APK 抓包成功捕获 auth/config/pixel-studio/cheetah/埋点等接口，敏感字段已脱敏。
- H5 第三次复验成功：`h5LoggedIn=true`，`hasAuthCurrentUser200=true`，`hasBusinessCurrentUser=false`。
- H5 复验接口证据：
  - `POST /homeai-auth/api/open/v3/login-sms/check.htm` -> `200`
  - `POST /homeai-auth/api/open/v3/login-sms/login.htm` -> `200`
  - `GET /homeai-auth/api/open/v2/user/current-user.htm` -> `200`
- 自动化验证：
  - `pnpm test`：12 项通过
  - `pnpm build`：通过

## 未解决风险

- APK 的短信登录前置包含网易滑块与加密表单体；H5 当前复刻完成服务端短信登录闭环，但没有复刻同款滑块 UI。若产品要求视觉/风控交互完全一致，需追加 H5 滑块交互复刻。
- 登录后部分素材和用户头像仍来自服务端返回或本地兜底，像素级素材不保证与 APK 完全一致。
- 抓包只保留接口形状和字段类别，未保存敏感请求体；如后续需要逐字段协议对齐，必须在受控环境做临时脱敏导出。

## 后续建议

- 将“每次都必须登录并做全链路功能验证对比”作为 HomeAI 与 MagicPen 的共同自动化准入规则。
- 定期检查模拟器 mitm 证书状态；发现不信任时直接修复证书后再跑，不把证书问题作为跳过登录/抓包的理由。
- 后续 APK-H5 对齐报告统一记录 `登录前 -> 登录中 -> 登录后四页签 -> 关键接口`，禁止只做未登录静态页面对比。
