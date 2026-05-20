# APP 复刻流程

## 1. 建立 APP 配置

在 `apps/<app-slug>/app.config.ts` 里填写：

- `appId`：本地唯一标识。
- `displayName`：APP 中文名。
- `packageName`：Android 包名。
- `version`：抓包时 APP 版本。
- `product` / `productCategory`：公共请求参数。
- `hosts`：业务域、认证域、配置域等代理目标。
- `endpoints`：登录、用户信息、首页、作品等接口路径。

## 2. 抓包和对照

- 启动 Android 模拟器中的原 APP。
- 同时启动本地抓包工具和透明代理。
- 先抓启动、首页、登录、我的页，再抓业务深层页面。
- 每张截图和关键接口都要记录入口路径，避免后续不知道页面状态从哪里来。

## 3. 接入公共基建

- 用 `common/src/proxy` 生成 Vite 透明代理。
- 用 `common/src/auth` 接入短信登录，隐藏保存 `smsId` 等后端凭证。
- 用 `common/src/session` 管理 `authToken`、环境和演示模式。
- 用 `common/src/redaction` 统一脱敏日志和调试面板。
- 用 `common/src/network` 生成抓包对齐的 Android 公共 query、form 参数和上游请求头。
- 业务域 HTTP POST 不要发送 JSON request body；按 APP 抓包区分 query 参数和 `x-www-form-urlencoded` 表单参数。遇到 `tnpn2/tnpn4` 这类私有编码时，H5 代理先保持可读的明文 form 语义，并在代理日志里记录与原 APP 的编码差异。

## 4. 页面复刻

- 先搭手机壳、状态栏、底部 Tab、弹层、Toast。
- 再按页面分批复刻：首页、核心业务页、我的页、设置页。
- 图片、作者、作品等数据通过每个 APP 自己的 mapper 转成页面模型。

## 5. 验证

- 构建通过。
- 浏览器逐页点击主要入口。
- 代理事件里目标域和环境正确。
- 登录链路不要求用户输入隐藏凭证。
- 敏感信息扫描不出现 token、手机号、smsId 明文。
