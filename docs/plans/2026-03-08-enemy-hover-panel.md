# Enemy Hover Panel Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 以右侧 hover 纸片面板替换当前敌人 tooltip，并在面板中整合怪名、血量、意图说明、状态详情与被动说明。

**Architecture:** 在 `battle.ts` 中新增敌人意图图标与状态详情 helper，并将 `buildBattleEnemySlotHtml` 输出升级为结构化 hover 面板。CSS 仅增强 tooltip 展示，不改默认态敌人主布局。

**Tech Stack:** TypeScript、Vitest、Vite、CSS

---

### Task 1: Write failing tests

**Files:**
- Modify: `src/ui/scenes/__tests__/battle-hud-unit.test.ts`
- Modify: `src/ui/scenes/battle.ts`

**Step 1: Write the failing test**
- Assert enemy slot html contains structured hover panel classes.
- Assert intent icon helper resolves to `public/assets/icon` assets.
- Assert status detail item html contains icon + label + optional count.

**Step 2: Run test to verify it fails**
Run: `npm test -- src/ui/scenes/__tests__/battle-hud-unit.test.ts`
Expected: FAIL because structured panel helpers do not exist yet.

**Step 3: Write minimal implementation**
- Add intent icon helper.
- Add status detail helper.
- Update enemy slot builder and enemy status assembly.

**Step 4: Run test to verify it passes**
Run: `npm test -- src/ui/scenes/__tests__/battle-hud-unit.test.ts`
Expected: PASS

### Task 2: Style the hover panel

**Files:**
- Modify: `src/ui/styles/batch2-core.css`

**Step 1: Style the right-side paper panel**
- Replace tiny tooltip feel with a taller fixed-width paper card.
- Style title, hp, intent row, status detail list, passive row.

**Step 2: Verify panel behavior remains hover-triggered**
Run: `npm test -- src/ui/scenes/__tests__/battle-hud-unit.test.ts`
Expected: PASS

### Task 3: Build verification

**Files:**
- Modify: `src/ui/scenes/battle.ts`
- Modify: `src/ui/styles/batch2-core.css`
- Modify: `src/ui/scenes/__tests__/battle-hud-unit.test.ts`

**Step 1: Run production verification**
Run: `npm run build`
Expected: PASS
