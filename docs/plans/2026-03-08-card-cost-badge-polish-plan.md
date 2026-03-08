# Card Cost Badge Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将卡牌左上角费用角标升级为更易扫读的资源徽记纸签样式，提升体力、法力、混合费用与减费的区分度，并统一战斗、奖励、商店、背包等页面的表现。

**Architecture:** 保持现有 `buildCardCostBadgeHtml` 作为统一入口，在 helper 内把纯文本 `costLabel` 解析为结构化片段，再由共享 CSS 实现“资源徽记 + 数字签”的视觉层次。优先兼容现有调用方，减少 scene 级改动，只补齐遗留页面对 helper 的复用。

**Tech Stack:** TypeScript、Vitest、共享 CSS 组件样式。

---

### Task 1: 补齐费用角标结构测试

**Files:**
- Modify: `src/ui/__tests__/card-cost-unit.test.ts`
- Modify: `src/ui/card-cost.ts`

**Step 1: Write the failing test**
- 为体力、法力、免费、减费、混合费用补充结构断言。
- 断言资源徽记、数值区、旧值/新值结构类名存在。

**Step 2: Run test to verify it fails**
- Run: `npm test -- src/ui/__tests__/card-cost-unit.test.ts`
- Expected: FAIL，当前 helper 只输出单段文本。

**Step 3: Write minimal implementation**
- 在 `src/ui/card-cost.ts` 中新增对 `costLabel` 的结构化解析。
- 保持外部 API 不变，继续返回一段 HTML。

**Step 4: Run test to verify it passes**
- Run: `npm test -- src/ui/__tests__/card-cost-unit.test.ts`
- Expected: PASS。

### Task 2: 实现共享纸签样式

**Files:**
- Modify: `src/ui/styles/components/card.css`

**Step 1: Write the failing test**
- 本任务依赖 Task 1 的结构测试，不单独新增样式测试。

**Step 2: Write minimal implementation**
- 为资源徽记、数字签、减费旧值/新值、混合费用双徽记补样式。
- 保持 `free` 和 `neutral` 的回退样式可用。

**Step 3: Run focused validation**
- Run: `npm test -- src/ui/__tests__/card-cost-unit.test.ts`
- Expected: PASS。

### Task 3: 统一遗留卡牌页面的费用角标入口

**Files:**
- Modify: `src/ui/scenes/campfire.ts`
- Modify: `src/ui/scenes/act-transition.ts`
- Modify: `src/ui/card-cost.ts`
- Test: `src/ui/__tests__/card-cost-unit.test.ts`

**Step 1: Write the failing test**
- 为 helper 继续补充最小回退断言，确保纯数字和未知类型仍能稳定输出。

**Step 2: Write minimal implementation**
- 让篝火页、幕间页复用 `buildCardCostBadgeHtml` 与 `resolveReadableCostLabel`。
- 避免这些页面继续显示旧式裸文本角标。

**Step 3: Run focused validation**
- Run: `npm test -- src/ui/__tests__/card-cost-unit.test.ts`
- Expected: PASS。

### Task 4: 做一轮回归验证

**Files:**
- Review: `src/ui/scenes/battle.ts`
- Review: `src/ui/scenes/reward.ts`
- Review: `src/ui/scenes/shop.ts`
- Review: `src/ui/scenes/inventory.ts`

**Step 1: Run targeted tests**
- Run: `npm test -- src/ui/__tests__/card-cost-unit.test.ts src/ui/scenes/__tests__/battle-hud-unit.test.ts src/ui/scenes/__tests__/style-lab-unit.test.ts`
- Expected: PASS。

**Step 2: Run build**
- Run: `npm run build`
- Expected: PASS。
