# 装修国际版 H5 复刻

当前目录实现 `装修国际版 / Home Guru` 的 H5 复刻入口，参考 APK 与原生 `home_ai_guru_lib` 的页面分层完成：

- `app.config.ts`：登记包名 `com.wanmeixiangsu.android.homeguru`、版本 `5.26.0`、产品标识 `homeguru`、代理域名和核心接口。
- `vite.config.ts`：复用 `../../common` 的签名、脱敏和透明代理能力。
- `src/shared/homeguruApi.ts`：只放 Home Guru 自己的接口 mapper 与演示数据降级，不重复公共签名逻辑。
- `src/app/App.vue`：复刻四个主 Tab、设计步骤、发现页和个人页；设置页、实时 API、代理调试控制台复用 `@wmxs/h5-replica-common/ui`。

## 启动

```bash
pnpm install
pnpm --filter @wmxs/h5-homeguru dev
```

默认端口是 `5174`。`Mine` 页内的设置区与神笔共用同一套基础能力，可切换生产/测试环境、手动填入会话级 `authToken`，右下角 Network 入口打开 `#/api-debug` 代理控制台。
