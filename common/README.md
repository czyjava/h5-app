# 复刻公共基建

`common` 放可跨 APP 复用的能力，目标是让新 APP 只提供配置、接口 mapper 和页面代码。

## 已沉淀范围

- APP 配置类型：`src/types.ts`
- 当前会话状态：`src/session.ts`
- 敏感信息脱敏：`src/redaction.ts`
- 短信登录公共流程：`src/auth/smsAuth.ts`
- 设置页 / 实时 API / 代理调试控制台公共 Vue 组件：`src/ui/*`，其中短信登录表单由具体 APP 显式开启或关闭。
- WMXS URL 签名：`src/proxy/magicSign.ts`
- Vite 透明代理：`src/proxy/transparentProxy.ts`

## 不放在公共层的内容

- 每个 APP 的页面布局。
- 接口响应到页面模型的 mapper。
- 特定 APP 的文案、图标、路由和主题色。
