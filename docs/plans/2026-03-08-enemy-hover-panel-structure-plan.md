# Enemy Hover Panel Structure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将敌人 hover 提示从简单 tooltip 升级为结构化敌情纸签，提升战斗信息可读性。

**Architecture:** 在 `battle.ts` 中新增敌人详细面板 helper，并为敌人构建流程补充意图标题与状态明细；在 `batch2-core.css` 中把现有 tooltip 样式升级为结构化右侧纸签。通过 `battle-hud-unit` 对输出结构做回归测试。

**Tech Stack:** TypeScript、Vitest、Vite、现有战斗 HUD 渲染系统

---

### Task 1: 为结构化 hover 面板补失败测试

**Files:**
- Modify: `src/ui/scenes/__tests__/battle-hud-unit.test.ts`
- Modify: `src/ui/scenes/battle.ts`

**Step 1: Write the failing test**
- 为新的敌人详细面板 helper 写测试
- 验证输出包含：怪名、血量、护甲、意图标题、意图说明、状态列表、被动描述

**Step 2: Run test to verify it fails**
Run: `npm test -- src/ui/scenes/__tests__/battle-hud-unit.test.ts`
Expected: FAIL，因为新 helper 尚不存在或结构未更新

### Task 2: 实现敌人详细面板 helper

**Files:**
- Modify: `src/ui/scenes/battle.ts`

**Step 3: Write minimal implementation**
- 新增 `buildBattleEnemyDetailPanelHtml`
- 在 `buildBattleEnemySlotHtml` 中替换旧 `enemy-tooltip`
- 为敌人渲染流程补充 `intentDetailTitle` 与 `enemyDetailStatusHtml`

**Step 4: Run test to verify it passes**
Run: `npm test -- src/ui/scenes/__tests__/battle-hud-unit.test.ts`
Expected: PASS

### Task 3: 升级右侧纸签样式

**Files:**
- Modify: `src/ui/styles/batch2-core.css`

**Step 5: Write minimal implementation**
- 新增 `enemy-detail-panel` 与各区块样式
- 默认隐藏，hover/focus 淡入
- 保持默认态敌人布局不被破坏

**Step 6: Verify style-related tests still pass**
Run: `npm test -- src/ui/scenes/__tests__/battle-hud-unit.test.ts src/ui/scenes/__tests__/style-lab-unit.test.ts`
Expected: PASS

### Task 4: 全量验证

**Files:**
- Verify only

**Step 7: Run focused validation**
Run: `npm test -- src/ui/scenes/__tests__/battle-hud-unit.test.ts src/ui/scenes/__tests__/battle-targeting-unit.test.ts src/ui/scenes/__tests__/style-lab-unit.test.ts src/ui/__tests__/renderer-unit.test.ts && npm run build`
Expected: PASS
