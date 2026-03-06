# Battle HUD Readability Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild battle top HUD into a two-row information hierarchy so core combat data is readable at a glance while secondary tactical info is de-emphasized.

**Architecture:** Keep battle gameplay logic unchanged, and only refactor battle scene rendering/output structure plus CSS. Introduce testable HUD helper functions in `battle.ts` for status partition and section assembly, then map those helpers into DOM output. Apply scene-scoped CSS updates in batch styles so map/reward/title scenes are not impacted.

**Tech Stack:** TypeScript, Vite, Vitest, CSS (existing token system in `src/ui/styles/tokens.css`)

---

### Task 1: Define HUD status partition behavior with failing tests

**Files:**
- Create: `src/ui/scenes/__tests__/battle-hud-unit.test.ts`
- Modify: `src/ui/scenes/battle.ts`
- Test: `src/ui/scenes/__tests__/battle-hud-unit.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { partitionHudStatuses } from '../battle'

describe('partitionHudStatuses', () => {
  it('should keep danger statuses in main row and move others to sub row', () => {
    const { main, sub } = partitionHudStatuses([
      { key: 'poison', html: '<span>☠️2</span>', danger: true },
      { key: 'weakened', html: '<span>😵1</span>', danger: true },
      { key: 'charge', html: '<span>⚡蓄3</span>', danger: false },
    ])
    expect(main).toHaveLength(2)
    expect(sub).toHaveLength(1)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/ui/scenes/__tests__/battle-hud-unit.test.ts`  
Expected: FAIL with missing export or missing function.

**Step 3: Write minimal implementation**

```ts
export function partitionHudStatuses(items: Array<{ key: string; html: string; danger: boolean }>) {
  return {
    main: items.filter((item) => item.danger),
    sub: items.filter((item) => !item.danger),
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/ui/scenes/__tests__/battle-hud-unit.test.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/ui/scenes/battle.ts src/ui/scenes/__tests__/battle-hud-unit.test.ts
git commit -m "test: add hud status partition helper coverage"
```

### Task 2: Define HUD section HTML contract with failing tests

**Files:**
- Modify: `src/ui/scenes/__tests__/battle-hud-unit.test.ts`
- Modify: `src/ui/scenes/battle.ts`
- Test: `src/ui/scenes/__tests__/battle-hud-unit.test.ts`

**Step 1: Write the failing test**

```ts
import { buildBattleHudSections } from '../battle'

it('should output hud-main and hud-sub wrappers with grouped blocks', () => {
  const html = buildBattleHudSections({
    hpText: '60/60',
    armorText: '🛡️ 2',
    staminaText: '⚡ 3/3',
    manaText: '◆ 2/2',
    weaponText: '⚔️ 铁制长剑',
    turnText: '回合 1',
    dangerStatusHtml: '<span class="status-badge status-debuff">☠️2</span>',
    subStatusHtml: '<span class="status-badge">⚡蓄3</span>',
    trialText: '试炼: 烈焰',
    enchantText: '🔮 bless',
    enchantFeedback: '触发: 共鸣',
  })
  expect(html).toContain('class="hud-main"')
  expect(html).toContain('class="hud-sub"')
  expect(html).toContain('class="hud-group hud-group--vitals"')
  expect(html).toContain('class="hud-group hud-group--resources"')
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/ui/scenes/__tests__/battle-hud-unit.test.ts`  
Expected: FAIL with missing `buildBattleHudSections`.

**Step 3: Write minimal implementation**

```ts
export function buildBattleHudSections(input: BattleHudSectionsInput): string {
  return `
    <div class="hud-main">
      <div class="hud-group hud-group--vitals">${input.hpText}${input.armorText}</div>
      <div class="hud-group hud-group--resources">${input.staminaText}${input.manaText}</div>
      <div class="hud-group hud-group--combat">${input.weaponText}${input.turnText}${input.dangerStatusHtml}</div>
    </div>
    <div class="hud-sub">
      <div class="hud-group hud-group--meta">${input.trialText}${input.enchantText}${input.enchantFeedback}</div>
      <div class="hud-group hud-group--statuses">${input.subStatusHtml}</div>
    </div>
  `
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/ui/scenes/__tests__/battle-hud-unit.test.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/ui/scenes/battle.ts src/ui/scenes/__tests__/battle-hud-unit.test.ts
git commit -m "feat: add battle hud section builder"
```

### Task 3: Refactor battle scene render to consume new HUD helpers

**Files:**
- Modify: `src/ui/scenes/battle.ts`
- Test: `src/ui/scenes/__tests__/battle-targeting-unit.test.ts`
- Test: `src/ui/scenes/__tests__/layout-helpers-unit.test.ts`

**Step 1: Write a failing assertion around new markup usage**

```ts
// add in battle-hud-unit.test.ts
import { renderBattle } from '../battle'
// render with minimal battle fixture and assert:
expect(container.querySelector('.hud-main')).not.toBeNull()
expect(container.querySelector('.hud-sub')).not.toBeNull()
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/ui/scenes/__tests__/battle-hud-unit.test.ts`  
Expected: FAIL (old `.player-bar` flat content still used).

**Step 3: Implement minimal render refactor**

```ts
const partitioned = partitionHudStatuses(playerStatusItems)
const hudHtml = buildBattleHudSections({...})

container.innerHTML = `
  <div class="scene-battle">
    <div class="player-bar">${hudHtml}</div>
    ...
  </div>
`
```

Also keep `id="btn-status-help"` and existing callbacks unchanged.

**Step 4: Run tests to verify no behavior regressions**

Run:  
`npm test -- src/ui/scenes/__tests__/battle-hud-unit.test.ts src/ui/scenes/__tests__/battle-targeting-unit.test.ts src/ui/scenes/__tests__/layout-helpers-unit.test.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/ui/scenes/battle.ts src/ui/scenes/__tests__/battle-hud-unit.test.ts
git commit -m "refactor: split battle hud into main and sub rows"
```

### Task 4: Apply scene-scoped HUD readability styles

**Files:**
- Modify: `src/ui/styles/batch2-core.css`
- Modify: `src/ui/styles/batch5-polish.css`

**Step 1: Add failing visual regression checklist (manual test script)**

Create checklist comments in plan execution notes (not code):
- Main HUD must not wrap unexpectedly at 1280x720
- Core numbers remain readable with 2-digit/3-digit transitions
- Secondary info remains visible but de-emphasized

**Step 2: Implement minimal CSS**

```css
.scene-battle .player-bar { min-height: 60px; display: grid; grid-template-rows: auto auto; }
.scene-battle .hud-main { display: flex; gap: 12px; align-items: center; }
.scene-battle .hud-sub { display: flex; gap: 10px; align-items: center; font-size: 10px; color: var(--ink-secondary); }
.scene-battle .hud-number { font-family: var(--font-number); font-size: 14px; min-width: 44px; }
.scene-battle .hud-danger { color: var(--color-danger); }
```

**Step 3: Run build to verify style changes compile**

Run: `npm run build`  
Expected: PASS, no TypeScript/CSS import errors.

**Step 4: Manual verify in dev server**

Run: `npm run dev`  
Expected: battle scene top HUD renders two rows, no overlap with battle main area.

**Step 5: Commit**

```bash
git add src/ui/styles/batch2-core.css src/ui/styles/batch5-polish.css
git commit -m "style: improve battle hud hierarchy and readability"
```

### Task 5: Regression sweep and documentation sync

**Files:**
- Modify: `docs/progress.md`
- Test: `src/ui/scenes/__tests__/battle-hud-unit.test.ts`
- Test: `src/ui/scenes/__tests__/battle-targeting-unit.test.ts`
- Test: `src/ui/scenes/__tests__/layout-helpers-unit.test.ts`

**Step 1: Update progress log entry**

```md
- 战斗 HUD 重构为主副两层信息栏，核心读数与战术信息分离
```

**Step 2: Run focused test suite**

Run:  
`npm test -- src/ui/scenes/__tests__/battle-hud-unit.test.ts src/ui/scenes/__tests__/battle-targeting-unit.test.ts src/ui/scenes/__tests__/layout-helpers-unit.test.ts`  
Expected: PASS.

**Step 3: Run full test suite**

Run: `npm test`  
Expected: PASS.

**Step 4: Final build verification**

Run: `npm run build`  
Expected: PASS.

**Step 5: Commit**

```bash
git add docs/progress.md
git commit -m "docs: record battle hud readability optimization"
```

## Execution Notes

- Keep this execution DRY/YAGNI: no unrelated scene redesign.
- Follow @superpowers:test-driven-development for each helper/style-affecting behavior change.
- Execute this plan via @superpowers:executing-plans in a separate focused run or with subagent orchestration.
