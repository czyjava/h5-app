# H5 APP 复刻工作区

这个目录用于沉淀后续所有被复刻的 APP。每个 APP 独立放在 `apps/<app-slug>/`，公共的接口、登录、环境、代理和调试能力放在 `common/`。

## 目录结构

```text
h5-app/
  common/              # 复刻公共基建，不放具体 APP 页面
  apps/
    magicpen/          # 神笔绘画复刻登记位，当前实现仍在 ../h5-magicpen
    homeguru/          # 装修国际版 / Home Guru H5 复刻
  docs/                # 跨 APP 的复刻流程、迁移说明和约定
```

## 复刻原则

- 页面、布局、交互细节跟随每个 APP 独立实现。
- 请求签名、透明代理、短信登录、环境切换、调试面板和脱敏策略优先复用 `common/`。
- 不把 token、验证码、短信凭证、手机号等敏感信息写入仓库。
- 新 APP 先建 `apps/<app-slug>/app.config.ts`，再按配置接入公共基建。
