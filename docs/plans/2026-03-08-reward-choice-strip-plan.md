# Reward Choice Strip Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将奖励页改为“上层单行选秀 + 下层自动结算区”的结构，并保持现有回调语义不变。

**Architecture:** 在 `reward.ts` 中抽出统一选秀条 helper，把卡牌奖励与材料奖励都渲染到同一个 choices 容器；下层继续保留自动获得与武器掉落补充区。样式只做局部扩展，不改动奖励数据来源。

**Tech Stack:** TypeScript, Vite, Vitest, 现有 batch2 奖励页 CSS

---

### Task 1: 锁定奖励页结构测试

**Files:**
- Modify: `src/ui/scenes/__tests__/reward-ui-unit.test.ts`
- Test: `src/ui/scenes/__tests__/reward-ui-unit.test.ts`

**Step 1: Write the failing test**
- 为统一选秀条 helper 增加失败测试
- 断言卡牌奖励与材料奖励出现在同一个 `reward-choice-strip`
- 断言自动获得 / 武器掉落不在该容器中

**Step 2: Run test to verify it fails**
- Run: `npm test -- src/ui/scenes/__tests__/reward-ui-unit.test.ts`
- Expected: FAIL with missing helper / mismatched structure

**Step 3: Write minimal implementation**
- 在 `reward.ts` 中新增 helper
- 只输出测试需要的最小结构

**Step 4: Run test to verify it passes**
- Run: `npm test -- src/ui/scenes/__tests__/reward-ui-unit.test.ts`
- Expected: PASS

### Task 2: 接入奖励页实际渲染

**Files:**
- Modify: `src/ui/scenes/reward.ts`

**Step 1: Write the failing test**
- 为材料选择卡增加选择态结构断言

**Step 2: Run test to verify it fails**
- Run: `npm test -- src/ui/scenes/__tests__/reward-ui-unit.test.ts`

**Step 3: Write minimal implementation**
- 新增材料选择卡 HTML
- 将主奖励区改为统一 `reward-choice-strip`
- 将材料领取按钮替换为可点选卡
- 让卡牌 / 材料共享选中与置灰逻辑

**Step 4: Run test to verify it passes**
- Run: `npm test -- src/ui/scenes/__tests__/reward-ui-unit.test.ts`

### Task 3: 收尾样式与回归

**Files:**
- Modify: `src/ui/styles/batch2-core.css`
- Test: `src/ui/scenes/__tests__/reward-ui-unit.test.ts`
- Test: `src/ui/scenes/__tests__/style-lab-unit.test.ts`

**Step 1: Write the failing test**
- 如有必要补充样式相关结构断言

**Step 2: Run test to verify it fails**
- Run: `npm test -- src/ui/scenes/__tests__/reward-ui-unit.test.ts src/ui/scenes/__tests__/style-lab-unit.test.ts`

**Step 3: Write minimal implementation**
- 调整 `reward-choice-strip`、材料选择卡尺寸与对齐
- 确保补充区仍在下方独立展示

**Step 4: Run test to verify it passes**
- Run: `npm test -- src/ui/scenes/__tests__/reward-ui-unit.test.ts src/ui/scenes/__tests__/style-lab-unit.test.ts`

### Task 4: 全量验证

**Files:**
- Modify: `src/ui/scenes/reward.ts`
- Modify: `src/ui/styles/batch2-core.css`

**Step 1: Run focused tests**
- Run: `npm test -- src/ui/scenes/__tests__/reward-ui-unit.test.ts src/ui/scenes/__tests__/style-lab-unit.test.ts src/ui/scenes/__tests__/battle-hud-unit.test.ts`

**Step 2: Run build**
- Run: `npm run build`
- Expected: PASS
