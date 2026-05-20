# 装修 APP H5 复刻

当前目录实现 `装修 APP / HomeAI` 的 H5 首版复刻，来源 APK 为 `/Users/chenzhiyuan/Downloads/装修APP.apk`。

- `app.config.ts`：登记包名 `com.wanmeixiangsu.android.homeai`、产品标识 `homeai`、代理域名和 APK 中识别出的核心接口。
- `public/assets/homeai/`：从 APK 的 Flutter assets 中抽取 HomeAI、Home Shared 和必要公共图片资源。
- `src/app/App.vue`：复刻首页、AI 设计流程、发现页、我的页和代理调试入口。
- `src/shared/homeaiApi.ts`：接入透明代理与接口降级逻辑，日志只输出脱敏后的请求摘要。
- `src/shared/homeaiMappers.ts`：归一化用户、作品、发现流数据，保证真实接口异常时不白屏。

## 启动

```bash
pnpm install
pnpm --filter @wmxs/h5-homeai dev
```

默认端口是 `5175`。访问 `http://localhost:5175/#/api-debug` 可查看透明代理事件。
