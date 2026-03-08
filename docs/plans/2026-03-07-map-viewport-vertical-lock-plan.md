# Map Viewport Vertical Lock Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Keep the map viewport visually fixed with a static translucent overlay, constrain map movement to vertical scrolling only, and remove the white card background from nodes.

**Architecture:** Reuse the existing fixed 582×345 viewport, but move overlay visuals to the viewport layer instead of the scroll content layer. Fit node x positions into the viewport width so horizontal scroll is unnecessary, and simplify node visuals to badge/ring/text only.

**Tech Stack:** TypeScript, Vitest, CSS

---

### Task 1: Lock helper expectations in tests

**Files:**
- Modify: `src/ui/scenes/__tests__/map-unit.test.ts`
- Modify: `src/ui/scenes/map.ts`

**Step 1: Write the failing test**
- Add tests for horizontal fit helper and vertical-only scroll target helper.
- Add tests for side effect expectations where `scrollLeft` remains zero.

**Step 2: Run test to verify it fails**
Run: `npm test -- src/ui/scenes/__tests__/map-unit.test.ts`
Expected: FAIL because helpers do not exist yet.

**Step 3: Write minimal implementation**
- Add helper to fit x positions into viewport width.
- Add helper to compute vertical-only scroll target.

**Step 4: Run test to verify it passes**
Run: `npm test -- src/ui/scenes/__tests__/map-unit.test.ts`
Expected: PASS.

### Task 2: Move translucent overlay to fixed viewport layer

**Files:**
- Modify: `src/ui/scenes/map.ts`
- Modify: `src/ui/styles/batch2-core.css`

**Step 1: Write the failing test**
- Add assertion for viewport overlay helper/structure if practical.

**Step 2: Run test to verify it fails**
Run: `npm test -- src/ui/scenes/__tests__/map-unit.test.ts`
Expected: FAIL.

**Step 3: Write minimal implementation**
- Add a fixed `map-viewport-overlay` inside viewport.
- Ensure overlay is separate from scroll content.

**Step 4: Run test to verify it passes**
Run: `npm test -- src/ui/scenes/__tests__/map-unit.test.ts`
Expected: PASS.

### Task 3: Remove horizontal scrolling and center the map content

**Files:**
- Modify: `src/ui/scenes/map.ts`
- Modify: `src/ui/styles/batch2-core.css`

**Step 1: Write the failing test**
- Add tests for fitted node x coordinates staying within the 582px viewport width.

**Step 2: Run test to verify it fails**
Run: `npm test -- src/ui/scenes/__tests__/map-unit.test.ts`
Expected: FAIL.

**Step 3: Write minimal implementation**
- Fit node x coordinates into a centered width inside the viewport.
- Disable horizontal overflow.
- Set initial `scrollLeft = 0`.

**Step 4: Run test to verify it passes**
Run: `npm test -- src/ui/scenes/__tests__/map-unit.test.ts`
Expected: PASS.

### Task 4: Simplify node visuals by removing white card background

**Files:**
- Modify: `src/ui/styles/batch2-core.css`
- Modify: `src/ui/scenes/map.ts`

**Step 1: Write the failing test**
- Add a helper/style expectation test if needed.

**Step 2: Run test to verify it fails**
Run: `npm test -- src/ui/scenes/__tests__/map-unit.test.ts`
Expected: FAIL.

**Step 3: Write minimal implementation**
- Remove white block styling from node container.
- Keep badge/ring/label readable.

**Step 4: Run test to verify it passes**
Run: `npm test -- src/ui/scenes/__tests__/map-unit.test.ts`
Expected: PASS.

### Task 5: Final verification

**Files:**
- Modify: `src/ui/scenes/map.ts`
- Modify: `src/ui/styles/batch2-core.css`
- Modify: `src/ui/scenes/__tests__/map-unit.test.ts`

**Step 1: Run targeted tests**
Run: `npm test -- src/ui/scenes/__tests__/map-unit.test.ts`
Expected: PASS.

**Step 2: Run build**
Run: `npm run build`
Expected: PASS.
