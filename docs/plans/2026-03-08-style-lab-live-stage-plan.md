# Style Lab Live Stage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 让样式工坊中的真实页面预览按游戏实际 `1280×720` 画布进行等比缩放展示，避免位置、比例和滚动边界偏离真实游戏。

**Architecture:** 为样式工坊 live 预览新增固定尺寸舞台常量与缩放 helper，live 场景统一挂到 `1280×720` 内层舞台；外层预览区只负责居中和按可用空间等比缩放，不再额外给真实页面增加内边距。

**Tech Stack:** TypeScript, Vitest, Vite, existing style-lab scene renderer, CSS.

---

### Task 1: 锁定 live 舞台尺寸与缩放测试

**Files:**
- Modify: `src/ui/scenes/__tests__/style-lab-unit.test.ts`

**Step 1: Write the failing test**
- 为 live 舞台尺寸增加 `1280×720` 常量断言。
- 为缩放 helper 增加等比 fit 断言。

**Step 2: Run test to verify it fails**
Run: `npm test -- src/ui/scenes/__tests__/style-lab-unit.test.ts`
Expected: FAIL because helper/constant missing.

**Step 3: Write minimal implementation**
- 在 `src/ui/scenes/style-lab.ts` 中新增 live stage 尺寸与缩放 helper。

**Step 4: Run test to verify it passes**
Run: `npm test -- src/ui/scenes/__tests__/style-lab-unit.test.ts`
Expected: PASS.

### Task 2: 接入 live 舞台容器与缩放逻辑

**Files:**
- Modify: `src/ui/scenes/style-lab.ts`
- Modify: `src/ui/styles/batch3-core.css`

**Step 1: Write the failing test**
- 为 live 预览 HTML 增加“舞台壳 + 内层 1280×720 舞台”结构断言。

**Step 2: Run test to verify it fails**
Run: `npm test -- src/ui/scenes/__tests__/style-lab-unit.test.ts`
Expected: FAIL.

**Step 3: Write minimal implementation**
- `renderStyleLab` 中 live 场景输出新舞台结构。
- 挂载真实页面到内层舞台。
- 在切换场景和窗口变化时同步缩放。
- CSS 去掉 live 预览额外 padding 干扰，改为居中展示。

**Step 4: Run test to verify it passes**
Run: `npm test -- src/ui/scenes/__tests__/style-lab-unit.test.ts`
Expected: PASS.

### Task 3: 回归验证

**Files:**
- Modify: none unless needed

**Step 1: Run targeted tests**
Run: `npm test -- src/ui/scenes/__tests__/style-lab-unit.test.ts src/ui/scenes/__tests__/battle-hud-unit.test.ts src/ui/scenes/__tests__/map-unit.test.ts`
Expected: PASS.

**Step 2: Run build**
Run: `npm run build`
Expected: PASS.
