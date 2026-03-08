# Battle Bottom Layout Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure the battle bottom HUD into a three-part control zone with an inline materials pocket and flat-stacked hand layout.

**Architecture:** Extract a pure helper to compute flat hand placement, cover the new classes and spacing rules with unit tests, then recompose the bottom battle markup and CSS so materials live inside the hand tray instead of a separate row.

**Tech Stack:** TypeScript, Vitest, Vite CSS pipeline

---

### Task 1: Add flat hand layout coverage

**Files:**
- Modify: `src/ui/scenes/__tests__/battle-hud-unit.test.ts`
- Modify: `src/ui/scenes/battle.ts`

**Step 1: Write the failing test**
- Add a helper test for a 600px flat hand layout that overlaps only when needed
- Add an HTML contract test for the new `materials-pocket`, `hand-stage`, and `action-cluster`

**Step 2: Run the test to verify it fails**
- Run: `npm test -- src/ui/scenes/__tests__/battle-hud-unit.test.ts`

**Step 3: Write minimal implementation**
- Export a flat-hand layout helper
- Export a bottom-zone helper or update `renderBattle` with new classes

**Step 4: Run the test to verify it passes**
- Run: `npm test -- src/ui/scenes/__tests__/battle-hud-unit.test.ts`

### Task 2: Rebuild bottom control zone

**Files:**
- Modify: `src/ui/scenes/battle.ts`
- Modify: `src/ui/styles/batch2-core.css`

**Step 1: Remove standalone materials bar**
- Inline material buttons into a fixed-width `materials-pocket`

**Step 2: Create three-part bottom layout**
- Left pocket / center tray / right actions

**Step 3: Apply flat hand placement**
- Replace fan rotation and vertical spread with flat placement and optional overlap

**Step 4: Run focused tests**
- Run: `npm test -- src/ui/scenes/__tests__/battle-hud-unit.test.ts src/ui/scenes/__tests__/battle-targeting-unit.test.ts`

### Task 3: Verify no regressions

**Files:**
- Modify: none unless failures require a minimal fix

**Step 1: Run build**
- Run: `npm run build`
