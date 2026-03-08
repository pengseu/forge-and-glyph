# Enemy Armor Asset Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将敌人护甲显示从 emoji 改为护甲素材，并区分默认态与 hover 详情态的信息密度。

**Architecture:** 保持现有敌人血条与 hover 面板结构不变，只替换护甲显示的渲染片段。顶部血条右侧显示“护甲素材徽标 + 数字”，hover 面板中显示“护甲素材徽标 + 护甲文字 + 数字”。

**Tech Stack:** TypeScript、Vitest、Vite、CSS

---

### Task 1: Write failing tests

**Files:**
- Modify: `src/ui/scenes/__tests__/battle-hud-unit.test.ts`
- Modify: `src/ui/scenes/battle.ts`

**Step 1: Write the failing test**
- Assert top armor block references `public/assets/icon/护甲.webp` and contains dedicated armor classes.
- Assert hover detail HP block contains dedicated armor detail classes.

**Step 2: Run test to verify it fails**
Run: `npm test -- src/ui/scenes/__tests__/battle-hud-unit.test.ts`
Expected: FAIL because current armor output still uses emoji / plain text.

**Step 3: Write minimal implementation**
- Add armor markup in top HUD and hover detail panel.
- Reuse `toWebpAsset('/assets/icon/护甲.png')`.

**Step 4: Run test to verify it passes**
Run: `npm test -- src/ui/scenes/__tests__/battle-hud-unit.test.ts`
Expected: PASS

### Task 2: Style armor asset presentation

**Files:**
- Modify: `src/ui/styles/batch2-core.css`

**Step 1: Add small CSS for top armor and detail armor rows**
- Top area: icon + number only.
- Hover panel: icon + text + number.

**Step 2: Run build verification**
Run: `npm run build`
Expected: PASS
