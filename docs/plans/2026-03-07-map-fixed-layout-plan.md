# Map Fixed Layout Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the map page into fixed left/right paper panels with a 582×345 centered map viewport and a fully decoupled right-side art/content panel.

**Architecture:** Keep the current map node/path interaction logic, but reorganize scene DOM and CSS into two fixed visual shells. The left shell becomes an 800px art panel containing an absolutely-positioned viewport, while the right shell becomes a 300px art panel with an independent content layer.

**Tech Stack:** TypeScript, Vite, Vitest, CSS

---

### Task 1: Lock fixed panel layout requirements in tests

**Files:**
- Modify: `src/ui/scenes/__tests__/map-unit.test.ts`
- Modify: `src/ui/scenes/map.ts`

**Step 1: Write the failing test**

Add tests for:
- left map shell width metadata/helper output
- centered viewport size `582x345`
- right side panel width metadata/helper output
- side content style remaining decoupled

**Step 2: Run test to verify it fails**

Run: `npm test -- src/ui/scenes/__tests__/map-unit.test.ts`
Expected: FAIL because fixed layout helpers/structure are not implemented.

**Step 3: Write minimal implementation**

Add small helper outputs in `src/ui/scenes/map.ts` for:
- left shell dimensions
- viewport dimensions/position
- right shell dimensions

**Step 4: Run test to verify it passes**

Run: `npm test -- src/ui/scenes/__tests__/map-unit.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/ui/scenes/__tests__/map-unit.test.ts src/ui/scenes/map.ts
git commit -m "test: lock fixed map panel layout helpers"
```

### Task 2: Restructure map scene DOM for fixed shells

**Files:**
- Modify: `src/ui/scenes/map.ts`

**Step 1: Write the failing test**

Add a render structure test or string assertion that the scene includes:
- left fixed shell wrapper
- viewport wrapper
- right art wrapper
- right content wrapper

**Step 2: Run test to verify it fails**

Run: `npm test -- src/ui/scenes/__tests__/map-unit.test.ts`
Expected: FAIL because current HTML structure still uses the old fluid containers.

**Step 3: Write minimal implementation**

Update `renderMap` markup so that:
- left side renders `map-stage-shell`
- board art is a separate visual layer
- `map-viewport` wraps `map-scroll`
- right side renders art and content as separate siblings

**Step 4: Run test to verify it passes**

Run: `npm test -- src/ui/scenes/__tests__/map-unit.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/ui/scenes/map.ts src/ui/scenes/__tests__/map-unit.test.ts
git commit -m "feat: restructure map scene into fixed shells"
```

### Task 3: Implement fixed left map panel styles

**Files:**
- Modify: `src/ui/styles/batch2-core.css`
- Modify: `src/ui/scenes/map.ts`

**Step 1: Write the failing test**

If practical, add helper assertions for viewport sizing/position values. Otherwise lock values via helper outputs and assert them in `map-unit.test.ts`.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/ui/scenes/__tests__/map-unit.test.ts`
Expected: FAIL because fixed shell/viewport values are not yet wired.

**Step 3: Write minimal implementation**

Style the left panel so that:
- shell width is `800px`
- background art uses `contain`
- viewport is centered and fixed to `582px × 345px`
- viewport clips overflow
- scroll area fills viewport exactly

**Step 4: Run test to verify it passes**

Run: `npm test -- src/ui/scenes/__tests__/map-unit.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/ui/styles/batch2-core.css src/ui/scenes/map.ts src/ui/scenes/__tests__/map-unit.test.ts
git commit -m "feat: add fixed map viewport styles"
```

### Task 4: Implement fixed right panel art/content decoupling

**Files:**
- Modify: `src/ui/styles/batch2-core.css`
- Modify: `src/ui/scenes/map.ts`
- Test: `src/ui/scenes/__tests__/map-unit.test.ts`

**Step 1: Write the failing test**

Add test coverage for the right panel helper/string output showing:
- fixed `300px` shell
- separate art layer
- separate content layer

**Step 2: Run test to verify it fails**

Run: `npm test -- src/ui/scenes/__tests__/map-unit.test.ts`
Expected: FAIL because current structure/styles are not separated enough.

**Step 3: Write minimal implementation**

Update styles so that:
- `map-side-panel` is a fixed-width shell
- `map-side-art` is visual-only
- `map-side-content` is absolutely/relatively positioned independent of art dimensions
- existing content padding remains `100px 40px 24px`

**Step 4: Run test to verify it passes**

Run: `npm test -- src/ui/scenes/__tests__/map-unit.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/ui/styles/batch2-core.css src/ui/scenes/map.ts src/ui/scenes/__tests__/map-unit.test.ts
git commit -m "feat: decouple map side art and content"
```

### Task 5: Re-center scroll and verify interaction

**Files:**
- Modify: `src/ui/scenes/map.ts`

**Step 1: Write the failing test**

Add a helper test for viewport-centered initial scroll target calculation.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/ui/scenes/__tests__/map-unit.test.ts`
Expected: FAIL because centering still assumes the old full-area scroll container.

**Step 3: Write minimal implementation**

Adjust initial scroll logic and drag behavior to use viewport dimensions `582x345` when centering the current node.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/ui/scenes/__tests__/map-unit.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/ui/scenes/map.ts src/ui/scenes/__tests__/map-unit.test.ts
git commit -m "fix: center map scrolling in fixed viewport"
```

### Task 6: Final verification

**Files:**
- Modify: `src/ui/scenes/map.ts`
- Modify: `src/ui/styles/batch2-core.css`
- Modify: `src/ui/scenes/__tests__/map-unit.test.ts`
- Modify: `docs/plans/2026-03-07-map-fixed-layout-design.md`
- Modify: `docs/plans/2026-03-07-map-fixed-layout-plan.md`

**Step 1: Run targeted tests**

Run: `npm test -- src/ui/scenes/__tests__/map-unit.test.ts`
Expected: PASS.

**Step 2: Run build**

Run: `npm run build`
Expected: PASS.

**Step 3: Sanity-check visual structure**

Check that:
- left shell stays fixed-width
- viewport remains centered
- map content only shows inside 582×345 window
- right panel art and text remain visually independent

**Step 4: Commit**

```bash
git add src/ui/scenes/map.ts src/ui/styles/batch2-core.css src/ui/scenes/__tests__/map-unit.test.ts docs/plans/2026-03-07-map-fixed-layout-design.md docs/plans/2026-03-07-map-fixed-layout-plan.md
git commit -m "feat: finalize fixed map panel layout"
```
