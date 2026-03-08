# Enemy Status Shared Paper Row Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将敌人状态改为单条共享纸片容器展示，内部显示 `icon + 层数`，过多时自动换行。

**Architecture:** 保持当前敌人 HUD 布局不变，只替换敌人状态行的内部渲染方式与样式。状态容器沿用怪名牌的纸片语义，但做成更宽更矮的共享栏，图标从 `public/assets/icon` 读取，层数文本覆盖在每个状态项中。

**Tech Stack:** TypeScript、Vitest、Vite、CSS

---

### Task 1: Add failing tests for enemy status row

**Files:**
- Modify: `src/ui/scenes/__tests__/battle-hud-unit.test.ts`
- Modify: `src/ui/scenes/battle.ts`

**Step 1: Write the failing test**
- Add expectations that enemy status row contains a shared paper container class.
- Add expectations that a status item can render icon paths from `public/assets/icon`.

**Step 2: Run test to verify it fails**
Run: `npm test -- src/ui/scenes/__tests__/battle-hud-unit.test.ts`
Expected: FAIL because new shared-row structure and icon helper do not exist yet.

**Step 3: Write minimal implementation**
- Add helper(s) to resolve icon paths and build status items.
- Use the helper(s) in enemy slot status generation.

**Step 4: Run test to verify it passes**
Run: `npm test -- src/ui/scenes/__tests__/battle-hud-unit.test.ts`
Expected: PASS

### Task 2: Style shared paper status row

**Files:**
- Modify: `src/ui/styles/batch2-core.css`

**Step 1: Add minimal CSS for shared row**
- Create a paper-like shared container near the enemy name.
- Add wrap layout, icon sizing, and count badge styling.

**Step 2: Verify no overlap regression**
Run: `npm test -- src/ui/scenes/__tests__/battle-hud-unit.test.ts`
Expected: PASS

### Task 3: Verify build output

**Files:**
- Modify: `src/ui/scenes/battle.ts`
- Modify: `src/ui/styles/batch2-core.css`
- Modify: `src/ui/scenes/__tests__/battle-hud-unit.test.ts`

**Step 1: Run production verification**
Run: `npm run build`
Expected: PASS
