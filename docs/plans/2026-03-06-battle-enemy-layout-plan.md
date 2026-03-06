# Battle Enemy Layout Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebalance battle enemy UI so the sprite is the visual center and tactical text stops crowding the top edge.

**Architecture:** Extract enemy-slot markup into a small pure helper in `battle.ts`, cover the new HTML contract with unit tests, then update the battle CSS to move vitals, name, statuses, and tooltip to their new anchors. Keep the existing battle state and interaction handlers unchanged.

**Tech Stack:** TypeScript, Vitest, Vite CSS pipeline

---

### Task 1: Add enemy layout HTML coverage

**Files:**
- Modify: `src/ui/scenes/__tests__/battle-hud-unit.test.ts`
- Modify: `src/ui/scenes/battle.ts`

**Step 1: Write the failing test**
- Assert the enemy slot HTML no longer renders legacy `enemy-intent-hint`
- Assert it renders `enemy-vitals`, bottom-anchored status row, and tooltip content

**Step 2: Run test to verify it fails**
- Run: `npm test -- src/ui/scenes/__tests__/battle-hud-unit.test.ts`

**Step 3: Write minimal implementation**
- Export a pure helper from `battle.ts` that builds a single enemy slot block
- Make `renderBattle` call that helper instead of inline string assembly

**Step 4: Run test to verify it passes**
- Run: `npm test -- src/ui/scenes/__tests__/battle-hud-unit.test.ts`

### Task 2: Apply the new enemy visual hierarchy

**Files:**
- Modify: `src/ui/styles/batch2-core.css`

**Step 1: Write the failing style expectation indirectly through HTML classes**
- Reuse Task 1 tests so CSS hooks exist before styling

**Step 2: Write minimal implementation**
- Move status row to bottom anchor
- Add vitals row below intent
- Convert passive/details into hover/focus tooltip
- Turn enemy name into bottom tag

**Step 3: Run focused tests**
- Run: `npm test -- src/ui/scenes/__tests__/battle-hud-unit.test.ts`

### Task 3: Verify no battle HUD regressions

**Files:**
- Modify: none unless failures require a minimal fix

**Step 1: Run targeted verification**
- Run: `npm test -- src/ui/scenes/__tests__/battle-hud-unit.test.ts src/ui/scenes/__tests__/battle-targeting-unit.test.ts`

**Step 2: Run build if time permits**
- Run: `npm run build`
