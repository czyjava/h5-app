# 神笔绘画 H5 复刻

基于抓包与模拟器页面走查结果实现的 H5 复刻原型，当前以 Vue 3 + Vite + TypeScript 构建。

## 启动

```bash
npm install
npm run dev
```

## 架构分层

- `src/app`：应用入口、全局状态和样式。
- `src/pages`：业务页面，包括首页、灵感、拍摄、涂色、我的。
- `src/widgets`：跨页面复用的壳、底部弹层、Toast 等。
- `src/entities`：领域类型与数据映射。
- `src/features`：可独立复用的功能片段。
- `src/shared`：API 适配、抓包 fixture、配置、基础 UI 和工具。

真实服务端 token、签名和用户隐私信息不进入仓库。当前默认使用实时接口优先模式，启动后会按抓包域名映射请求真实接口：业务接口经 `/magicpen-business` 转发到 `pixel-studio.wanmeixiangsu.cn`，认证接口经 `/magicpen-auth` 转发到 `auth.wanmeixiangsu.cn`，配置接口预留 `/magicpen-config`。实时接口如果遇到 `URL签名错误` 或 HTTP 拒绝，会自动降级到抓包数据，页面层不感知。设置面板可切换为“仅抓包数据”模式，用于离线浏览。
