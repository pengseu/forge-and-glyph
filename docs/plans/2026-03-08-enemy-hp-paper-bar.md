# Enemy HP Paper Bar Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将敌人空血槽改成类似敌人名字的小纸片容器，并使用 `public/assets/血条.png` 作为血量填充图。

**Architecture:** 保持现有敌人 HUD 结构不变，只调整敌人血条的 DOM 细节与 CSS 外观。空血槽由纯 CSS 纸片容器承担，红色填充通过素材图裁切显示，并保留 hover 才显示血量数值的逻辑。

**Tech Stack:** TypeScript、Vitest、Vite、CSS

---

### Task 1: Add failing tests

**Files:**
- Modify: `src/ui/scenes/__tests__/battle-hud-unit.test.ts`
- Modify: `src/ui/scenes/battle.ts`

**Step 1: Write the failing test**
- Assert enemy HP bar contains a paper slot class and references `/assets/血条.png`.

**Step 2: Run test to verify it fails**
Run: `npm test -- src/ui/scenes/__tests__/battle-hud-unit.test.ts`
Expected: FAIL because old HP bar markup does not include the new paper slot wrapper.

**Step 3: Write minimal implementation**
- Add a small inner wrapper for the fill image.
- Keep existing hover text logic.

**Step 4: Run test to verify it passes**
Run: `npm test -- src/ui/scenes/__tests__/battle-hud-unit.test.ts`
Expected: PASS

### Task 2: Style the paper slot

**Files:**
- Modify: `src/ui/styles/batch2-core.css`

**Step 1: Add minimal paper slot styling**
- Make the empty slot visually match enemy name plate language.
- Size the fill image to a stable pixel height.

**Step 2: Verify build**
Run: `npm run build`
Expected: PASS
