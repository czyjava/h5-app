# 神笔绘画 5.26.0 差异修复记录

- 修复日期：2026-05-22
- 目标：收敛 `report.md` 中已确认的最新 APK-H5 差异。

## 已处理

1. 拍摄入口：新增统一 `openCaptureEntry`，首页「绘画扫描」、底部相机按钮和涂色卡制作入口都先进入 `#/capture` 的登录前置页；未登录时不直接展示扫描相机。
2. 我的页：默认未登录态显示「点击登录」「当前账号未登录」，作品/帖子/画作区域不再伪造瀑布流；演示模式仍可手动开启脱敏模拟资料。
3. 快捷入口：补齐「口令福利」，替换此前与 APP 5.26.0 不一致的「活动」入口。
4. 涂色页：分组标题固定为「入门·水果蔬菜」，增加「待开始」状态 pill。
5. 首页：会员入口改为黑色 pill「开通会员」。
6. 灵感页：做同款次数先压到 APP 首屏量级，避免 H5 历史统计数过大影响视觉对比。

## 验证

- `npm run test:diff-fixes`
- `npm run build`
- Playwright 截图验证：
  - `ai/screenshots/latest-diff-fix-home.png`
  - `ai/screenshots/latest-diff-fix-capture.png`
  - `ai/screenshots/latest-diff-fix-coloring.png`
  - `ai/screenshots/latest-diff-fix-profile-final.png`
  - `ai/screenshots/latest-diff-fix-inspiration.png`

## 仍需后续确认

- 本轮没有登录 APP 进入拍摄后置流程；登录后的拍摄页细节仍以既有 H5 原型保留。
- 首页和灵感页的实时素材排序仍依赖线上接口，后续若要像素级贴齐，需要继续抓取 APP 同一时刻接口响应并固化 fixture。
