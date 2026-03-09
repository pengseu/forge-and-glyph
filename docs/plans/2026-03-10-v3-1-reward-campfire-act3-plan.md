# V3.1 Reward, Campfire, Act3 And Status Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为宝库/篝火/事件/幕间补清晰奖励提示，重构篝火为背包式面板，修正第三幕战斗层可见性，并整理玩家状态展示主次。

**Architecture:** 把“非战斗奖励摘要”收口为一层可复用的文本构建逻辑，分别接到宝库、事件、篝火和幕间流程。战斗层只调整状态组织与第三幕样式，不改核心战斗规则。篝火页整体复用背包的布局语言，避免继续维护一套孤立视觉。

**Tech Stack:** TypeScript, Vitest, scene string renderers, existing batch CSS system

---

### Task 1: 扩展奖励摘要模型覆盖非卡牌收益

**Files:**
- Modify: `src/game/events.ts`
- Possibly Modify: `src/game/types.ts`
- Test: `src/game/__tests__/events.test.ts`

**Step 1: Write the failing test**

```ts
it('returns a notice for traveler gold reward', () => {
  const result = resolveEventOption(run, travelerEvent, 'traveler_gold', () => 0)
  expect(result.uiNotice).toContain('25 金币')
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/game/__tests__/events.test.ts`
Expected: FAIL because gold/material/heal branches do not emit notices.

**Step 3: Write minimal implementation**

```ts
function buildResourceRewardNotice(parts: string[]): string {
  return `已获得 ${parts.join('、')}`
}
```

- 为金币、材料、回血类事件补 `uiNotice`
- 保持已有得卡提示逻辑不回退

**Step 4: Run test to verify it passes**

Run: `npm test -- src/game/__tests__/events.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/events.ts src/game/__tests__/events.test.ts src/game/types.ts
git commit -m "feat: expand reward notices for event resources"
```

### Task 2: 宝库与篝火接入摘要提示

**Files:**
- Modify: `src/main.ts`
- Modify: `src/game/types.ts`
- Test: `src/ui/scenes/__tests__/event-unit.test.ts`
- Test: `src/ui/scenes/__tests__/campfire-ui-unit.test.ts`

**Step 1: Write the failing test**

```ts
it('renders a treasure notice summary', () => {
  expect(buildEventRewardNoticeHtml('已获得 60 金币、精钢锭×1、元素精华×1')).toContain('event-reward-notice')
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/ui/scenes/__tests__/event-unit.test.ts src/ui/scenes/__tests__/campfire-ui-unit.test.ts`
Expected: FAIL because treasure/campfire summaries are not rendered anywhere.

**Step 3: Write minimal implementation**

```ts
gameState = { ...gameState, eventRewardNotice: '已获得 60 金币、精钢锭×1、元素精华×1' }
```

- 宝库节点先显示摘要，再返回地图
- 篝火回血/升级卡/升级武器后显示结果摘要，再离开节点

**Step 4: Run test to verify it passes**

Run: `npm test -- src/ui/scenes/__tests__/event-unit.test.ts src/ui/scenes/__tests__/campfire-ui-unit.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/main.ts src/game/types.ts src/ui/scenes/__tests__/event-unit.test.ts src/ui/scenes/__tests__/campfire-ui-unit.test.ts
git commit -m "feat: surface treasure and campfire reward summaries"
```

### Task 3: 幕间奖励摘要补齐

**Files:**
- Modify: `src/game/act.ts`
- Modify: `src/main.ts`
- Test: `src/game/__tests__/act.test.ts`

**Step 1: Write the failing test**

```ts
it('describes war loot reserve rewards in an intermission summary', () => {
  const summary = buildIntermissionRewardSummary(run, 'war_loot_reserve', nextRun)
  expect(summary).toContain('40 金币')
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/game/__tests__/act.test.ts`
Expected: FAIL because no summary builder exists.

**Step 3: Write minimal implementation**

```ts
type IntermissionResolution = {
  run: RunState
  uiNotice?: string
}
```

- 对直接推进下一幕的幕间奖励补摘要
- 先覆盖 `war_loot_reserve`、`legend_forge`、`foresight_eye`

**Step 4: Run test to verify it passes**

Run: `npm test -- src/game/__tests__/act.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/act.ts src/main.ts src/game/__tests__/act.test.ts
git commit -m "feat: add intermission reward summaries"
```

### Task 4: 篝火整体改为背包式面板结构

**Files:**
- Modify: `src/ui/scenes/campfire.ts`
- Modify: `src/ui/styles/batch3-core.css`
- Review: `src/ui/scenes/inventory.ts`
- Test: `src/ui/scenes/__tests__/campfire-ui-unit.test.ts`

**Step 1: Write the failing test**

```ts
it('renders campfire with panel header main and footer sections', () => {
  const html = buildCampfireMenuHtml(...)
  expect(html).toContain('campfire-panel')
  expect(html).toContain('campfire-main')
  expect(html).toContain('campfire-footer')
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/ui/scenes/__tests__/campfire-ui-unit.test.ts`
Expected: FAIL because current campfire layout has no inventory-like shell.

**Step 3: Write minimal implementation**

```ts
<section class="panel campfire-panel">
  <header class="campfire-header">...</header>
  <div class="campfire-main">...</div>
  <footer class="campfire-footer">...</footer>
</section>
```

- 菜单态和升级态共用面板骨架
- 升级卡区域复用背包卡片层次和网格节奏

**Step 4: Run test to verify it passes**

Run: `npm test -- src/ui/scenes/__tests__/campfire-ui-unit.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/ui/scenes/campfire.ts src/ui/styles/batch3-core.css src/ui/scenes/__tests__/campfire-ui-unit.test.ts
git commit -m "refactor: align campfire layout with inventory panels"
```

### Task 5: 重排玩家状态区

**Files:**
- Modify: `src/ui/scenes/battle.ts`
- Modify: `src/ui/styles/batch2-core.css`
- Test: `src/ui/scenes/__tests__/battle-hud-unit.test.ts`

**Step 1: Write the failing test**

```ts
it('keeps all player statuses in top hud and only mirrors critical ones near player', () => {
  const sections = buildBattleHudSections(...)
  expect(sections).toContain('hud-group--statuses')
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/ui/scenes/__tests__/battle-hud-unit.test.ts`
Expected: FAIL because status placement rules are not explicit enough.

**Step 3: Write minimal implementation**

```ts
function partitionPlayerStatusEcho(items: HudStatusItem[]): HudStatusItem[] {
  return items.filter((item) => item.danger)
}
```

- 顶部 HUD 展示完整状态
- 玩家身边只保留弱化回显
- 保证视觉上不再是双份完整状态

**Step 4: Run test to verify it passes**

Run: `npm test -- src/ui/scenes/__tests__/battle-hud-unit.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/ui/scenes/battle.ts src/ui/styles/batch2-core.css src/ui/scenes/__tests__/battle-hud-unit.test.ts
git commit -m "refactor: reorganize player status presentation"
```

### Task 6: 修正第三幕战斗可见性

**Files:**
- Modify: `src/ui/scenes/battle.ts`
- Modify: `src/ui/styles/batch2-core.css`
- Test: `src/ui/scenes/__tests__/battle-hud-unit.test.ts`
- Test: `src/ui/scenes/__tests__/battle-targeting-unit.test.ts`

**Step 1: Write the failing test**

```ts
it('marks act 3 battle with dedicated layout class', () => {
  expect(buildBattleSceneClass(3, false)).toContain('scene-battle--act3')
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/ui/scenes/__tests__/battle-hud-unit.test.ts src/ui/scenes/__tests__/battle-targeting-unit.test.ts`
Expected: FAIL if act3-specific helper or layout marker is missing.

**Step 3: Write minimal implementation**

```css
.scene-battle--act3 .battle-scene-fg {
  opacity: 0.45;
}
```

- 增加 act3 专属层级、位置、遮罩透明度规则
- 保证玩家和敌人主体始终在前景遮罩之上或不被其掩没

**Step 4: Run test to verify it passes**

Run: `npm test -- src/ui/scenes/__tests__/battle-hud-unit.test.ts src/ui/scenes/__tests__/battle-targeting-unit.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/ui/scenes/battle.ts src/ui/styles/batch2-core.css src/ui/scenes/__tests__/battle-hud-unit.test.ts src/ui/scenes/__tests__/battle-targeting-unit.test.ts
git commit -m "fix: restore act3 battle character visibility"
```

### Task 7: Full regression for affected flows

**Files:**
- Review: `src/game/__tests__/events.test.ts`
- Review: `src/game/__tests__/act.test.ts`
- Review: `src/ui/scenes/__tests__/event-unit.test.ts`
- Review: `src/ui/scenes/__tests__/campfire-ui-unit.test.ts`
- Review: `src/ui/scenes/__tests__/battle-hud-unit.test.ts`
- Review: `src/ui/scenes/__tests__/battle-targeting-unit.test.ts`

**Step 1: Run targeted reward and scene suite**

Run: `npm test -- src/game/__tests__/events.test.ts src/game/__tests__/act.test.ts src/ui/scenes/__tests__/event-unit.test.ts src/ui/scenes/__tests__/campfire-ui-unit.test.ts src/ui/scenes/__tests__/battle-hud-unit.test.ts src/ui/scenes/__tests__/battle-targeting-unit.test.ts`
Expected: PASS

**Step 2: Run full suite**

Run: `npm test`
Expected: PASS

**Step 3: Review final diff**

Run: `git diff -- src/main.ts src/game/events.ts src/game/act.ts src/ui/scenes/campfire.ts src/ui/scenes/battle.ts src/ui/styles/batch2-core.css src/ui/styles/batch3-core.css`
Expected: Only intended reward, campfire, and battle presentation changes remain.

**Step 4: Commit**

```bash
git add src/main.ts src/game/events.ts src/game/act.ts src/ui/scenes/campfire.ts src/ui/scenes/battle.ts src/ui/styles/batch2-core.css src/ui/styles/batch3-core.css src/game/__tests__/events.test.ts src/game/__tests__/act.test.ts src/ui/scenes/__tests__/event-unit.test.ts src/ui/scenes/__tests__/campfire-ui-unit.test.ts src/ui/scenes/__tests__/battle-hud-unit.test.ts src/ui/scenes/__tests__/battle-targeting-unit.test.ts
git commit -m "feat: polish reward summaries, campfire, and act3 battle ui"
```
