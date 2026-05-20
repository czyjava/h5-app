# HomeAI H5 Replica Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `/Users/chenzhiyuan/work/codes/wmxs/h5-app/apps/homeai` 复刻 `装修APP.apk` 的首版 H5 体验。

**Architecture:** 新建独立 Vue/Vite 应用，复用 `@wmxs/h5-replica-common` 的会话、透明代理、调试面板和设置组件。业务侧拆成配置、资源表、演示数据、接口 mapper、页面入口五块，真实接口失败时安全降级为演示数据。

**Tech Stack:** Vue 3、Vite、TypeScript、lucide-vue-next、Node test runner、`@wmxs/h5-replica-common`。

---

### Task 1: 数据归一化测试

**Files:**
- Create: `/Users/chenzhiyuan/work/codes/wmxs/h5-app/apps/homeai/src/shared/homeaiApi.test.mjs`
- Create: `/Users/chenzhiyuan/work/codes/wmxs/h5-app/apps/homeai/src/shared/homeaiMappers.mjs`
- Modify: `/Users/chenzhiyuan/work/codes/wmxs/h5-app/apps/homeai/package.json`

- [ ] **Step 1: Write the failing test**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeHomeAiSnapshot } from './homeaiMappers.mjs';

test('normalizeHomeAiSnapshot maps user, work, and discover payloads with fallbacks', () => {
  const snapshot = normalizeHomeAiSnapshot({
    user: { nickname: '设计师', userId: 42, credit: 18, vipName: 'VIP 体验' },
    generationList: { list: [{ recordCode: 'r1', templateName: '客厅改造', resultUrl: '//cdn.example.com/a.png', generationStatus: 'FINISHED' }] },
    recommendList: { list: [{ title: '现代客厅', coverUrl: 'https://cdn.example.com/b.png', tag: '室内' }] },
  });

  assert.equal(snapshot.user.nickname, '设计师');
  assert.equal(snapshot.user.diamondCount, 18);
  assert.equal(snapshot.works[0].coverUrl, 'https://cdn.example.com/a.png');
  assert.equal(snapshot.discover[0].tag, '室内');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @wmxs/h5-homeai test`
Expected: FAIL because `homeaiMappers.mjs` or `normalizeHomeAiSnapshot` does not exist.

- [ ] **Step 3: Write minimal mapper implementation**

Implement `normalizeHomeAiSnapshot` with `pickArray`, `pickString`, and URL normalization.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @wmxs/h5-homeai test`
Expected: PASS.

### Task 2: APP shell and APK resources

**Files:**
- Create: `/Users/chenzhiyuan/work/codes/wmxs/h5-app/apps/homeai/package.json`
- Create: `/Users/chenzhiyuan/work/codes/wmxs/h5-app/apps/homeai/index.html`
- Create: `/Users/chenzhiyuan/work/codes/wmxs/h5-app/apps/homeai/tsconfig.json`
- Create: `/Users/chenzhiyuan/work/codes/wmxs/h5-app/apps/homeai/vite.config.ts`
- Create: `/Users/chenzhiyuan/work/codes/wmxs/h5-app/apps/homeai/app.config.ts`
- Create: `/Users/chenzhiyuan/work/codes/wmxs/h5-app/apps/homeai/public/assets/homeai/*`

- [ ] **Step 1: Extract only HomeAI-related APK assets**

Run `unzip` for `assets/images`, `packages/home_ai_guru_lib`, `packages/home_shared_lib`, and selected common business images, flattening to `public/assets/homeai`.

- [ ] **Step 2: Add app config**

Use package `com.wanmeixiangsu.android.homeai`, product `homeai`, routes from `homeai.nav.wanmeixiangsu.com`, business proxy `/homeai-business`, and API paths discovered from `libapp.so`.

### Task 3: HomeAI H5 pages

**Files:**
- Create: `/Users/chenzhiyuan/work/codes/wmxs/h5-app/apps/homeai/src/main.ts`
- Create: `/Users/chenzhiyuan/work/codes/wmxs/h5-app/apps/homeai/src/app/App.vue`
- Create: `/Users/chenzhiyuan/work/codes/wmxs/h5-app/apps/homeai/src/shared/assets.ts`
- Create: `/Users/chenzhiyuan/work/codes/wmxs/h5-app/apps/homeai/src/shared/demoData.ts`
- Create: `/Users/chenzhiyuan/work/codes/wmxs/h5-app/apps/homeai/src/shared/homeaiApi.ts`
- Create: `/Users/chenzhiyuan/work/codes/wmxs/h5-app/apps/homeai/src/shared/types.ts`

- [ ] **Step 1: Build four-tab shell**

Implement 首页、AI 设计、发现、我的四个 Tab，保留手机壳、状态栏、底部导航和 Toast。

- [ ] **Step 2: Build design flow**

Implement upload -> style -> result flow, using APK guide images and local state.

- [ ] **Step 3: Wire proxy settings**

Reuse `ReplicaApiModePanel`, `ReplicaSettingsPanel`, and `ReplicaProxyLifecycleOverlay`; logs must redact sensitive fields.

### Task 4: Verification and session

**Files:**
- Create: `/Users/chenzhiyuan/work/doc/knowledge/projects/h5-app/sessions/2026-05-20-homeai-h5-replica.md`

- [ ] **Step 1: Run tests**

Run: `pnpm --filter @wmxs/h5-homeai test`
Expected: PASS.

- [ ] **Step 2: Build**

Run: `pnpm --filter @wmxs/h5-homeai build`
Expected: PASS.

- [ ] **Step 3: Browser smoke test**

Start dev server and verify 首页、设计、发现、我的、`#/api-debug` render without blank screens.

- [ ] **Step 4: Write session**

Record scope, verification, risks, and Git limitation in the h5-app project knowledge base.
