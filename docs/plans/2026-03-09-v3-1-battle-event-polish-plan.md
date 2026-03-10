# V3.1 Battle And Event Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 收口铁匠附魔说明、敌人密集布局、事件得卡轻提示、地精术士意图标题，以及第二幕战斗布局异常。

**Architecture:** 以最小行为改动为前提，把 UI 反馈和布局问题收口到现有 `battle.ts`、`forge.ts`、`event.ts` 与 `events.ts`。战斗页通过数量类和幕类组合驱动布局，事件页通过结算摘要驱动轻提示，不引入新的全局状态系统。

**Tech Stack:** TypeScript, Vitest, existing DOM-string scene renderers, project CSS batches

---

### Task 1: 事件结算返回轻提示摘要

**Files:**
- Modify: `src/game/events.ts`
- Test: `src/game/__tests__/events.test.ts`

**Step 1: Write the failing test**

```ts
it('returns a ui notice when mysterious merchant grants a rare card', () => {
  const resolved = resolveEventOption(run, merchantEvent, 'trade_hp_for_rare', () => 0)
  expect(resolved.uiNotice).toContain('已获得')
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/game/__tests__/events.test.ts`
Expected: FAIL because `uiNotice` is missing from the event resolution.

**Step 3: Write minimal implementation**

```ts
type EventResolution = {
  run: RunState
  triggerBattleEnemyIds?: string[]
  uiNotice?: string
}
```

- 为所有得卡分支生成简洁提示文案。
- 单卡优先显示卡名，多卡显示摘要。

**Step 4: Run test to verify it passes**

Run: `npm test -- src/game/__tests__/events.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/events.ts src/game/__tests__/events.test.ts
git commit -m "feat: add event reward notice summaries"
```

### Task 2: 事件页渲染轻提示

**Files:**
- Modify: `src/main.ts`
- Modify: `src/ui/scenes/event.ts`
- Modify: `src/ui/renderer.ts`
- Test: `src/ui/scenes/__tests__/event-unit.test.ts`

**Step 1: Write the failing test**

```ts
it('renders event reward notice when provided', () => {
  const html = buildEventRewardNoticeHtml('已获得稀有卡【寒霜箭】')
  expect(html).toContain('event-reward-notice')
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/ui/scenes/__tests__/event-unit.test.ts`
Expected: FAIL because the event scene has no reward notice support.

**Step 3: Write minimal implementation**

```ts
renderEvent(container, eventDef, onChoose, rewardNotice)
```

- 在 `main.ts` 挂接 `resolved.uiNotice`。
- 在事件页渲染轻提示条。
- 结算离开事件页时清空该提示。

**Step 4: Run test to verify it passes**

Run: `npm test -- src/ui/scenes/__tests__/event-unit.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/main.ts src/ui/renderer.ts src/ui/scenes/event.ts src/ui/scenes/__tests__/event-unit.test.ts
git commit -m "feat: show inline event reward notices"
```

### Task 3: 铁匠附魔 hover 说明面板

**Files:**
- Modify: `src/ui/scenes/forge.ts`
- Modify: `src/ui/styles/batch3-core.css`
- Test: `src/ui/scenes/__tests__/forge-ui-unit.test.ts`

**Step 1: Write the failing test**

```ts
it('renders forge enchant detail panel content', () => {
  const html = buildForgeEnchantDetailHtml('烈焰', '攻击额外附加灼烧')
  expect(html).toContain('forge-enchant-detail')
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/ui/scenes/__tests__/forge-ui-unit.test.ts`
Expected: FAIL because forge enchant detail helpers do not exist.

**Step 3: Write minimal implementation**

```ts
<div class="forge-enchant-detail" data-forge-enchant-detail>...</div>
```

- 为附魔按钮输出效果与可选共鸣提示的数据属性。
- hover/focus 时更新说明面板。
- 保证仅增强交互，不改变现有附魔回调。

**Step 4: Run test to verify it passes**

Run: `npm test -- src/ui/scenes/__tests__/forge-ui-unit.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/ui/scenes/forge.ts src/ui/styles/batch3-core.css src/ui/scenes/__tests__/forge-ui-unit.test.ts
git commit -m "feat: add forge enchant hover details"
```

### Task 4: 地精术士意图标题与敌人数布局类

**Files:**
- Modify: `src/ui/scenes/battle.ts`
- Test: `src/ui/scenes/__tests__/battle-hud-unit.test.ts`

**Step 1: Write the failing test**

```ts
it('labels healing intent as treatment instead of generic action', () => {
  expect(resolveEnemyIntentDetailTitle('10', '为生命最低的敌人回复 10 点生命')).toBe('治疗')
})

it('outputs enemy count class for crowded formations', () => {
  expect(buildBattleEnemyAreaClass(4)).toContain('enemy-area--count-4')
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/ui/scenes/__tests__/battle-hud-unit.test.ts`
Expected: FAIL because healing semantics and count class helper are missing.

**Step 3: Write minimal implementation**

```ts
if (intentHint.includes('回复')) return '治疗'
```

- 为治疗、友方增益补标题语义。
- 抽一个敌人数 class helper，供 battle scene 输出。

**Step 4: Run test to verify it passes**

Run: `npm test -- src/ui/scenes/__tests__/battle-hud-unit.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/ui/scenes/battle.ts src/ui/scenes/__tests__/battle-hud-unit.test.ts
git commit -m "fix: improve enemy intent labels and count classes"
```

### Task 5: 收口第二幕与密集敌人布局

**Files:**
- Modify: `src/ui/styles/batch2-core.css`
- Review: `src/ui/scenes/battle.ts`
- Test: `src/ui/scenes/__tests__/battle-hud-unit.test.ts`

**Step 1: Write the failing test**

```ts
it('renders battle root with act and enemy count classes', () => {
  const html = renderBattle(container, battleState, callbacks)
  expect(container.innerHTML).toContain('scene-battle--act2')
  expect(container.innerHTML).toContain('enemy-area--count-4')
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/ui/scenes/__tests__/battle-hud-unit.test.ts`
Expected: FAIL if count classes are not wired into rendered battle HTML.

**Step 3: Write minimal implementation**

```css
.scene-battle--act2 .player-area,
.scene-battle--act2 .enemy-area,
.scene-battle--act2 .enemy-slot {
  /* align to act1 stable layout */
}
```

- 让 `act2` 共享 `act1` 的稳定定位体系。
- 对 `enemy-area--count-3`、`enemy-area--count-4` 补更紧凑的排布和尺寸。
- 不修改战斗逻辑。

**Step 4: Run test to verify it passes**

Run: `npm test -- src/ui/scenes/__tests__/battle-hud-unit.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/ui/styles/batch2-core.css src/ui/scenes/battle.ts src/ui/scenes/__tests__/battle-hud-unit.test.ts
git commit -m "style: tighten crowded enemy layouts and align act2 battle"
```

### Task 6: Full regression for touched surfaces

**Files:**
- Review: `src/game/__tests__/events.test.ts`
- Review: `src/ui/scenes/__tests__/event-unit.test.ts`
- Review: `src/ui/scenes/__tests__/forge-ui-unit.test.ts`
- Review: `src/ui/scenes/__tests__/battle-hud-unit.test.ts`

**Step 1: Run targeted test suite**

Run: `npm test -- src/game/__tests__/events.test.ts src/ui/scenes/__tests__/event-unit.test.ts src/ui/scenes/__tests__/forge-ui-unit.test.ts src/ui/scenes/__tests__/battle-hud-unit.test.ts`
Expected: PASS

**Step 2: Run broader safety suite**

Run: `npm test -- src/ui/scenes/__tests__/battle-targeting-unit.test.ts src/ui/scenes/__tests__/layout-helpers-unit.test.ts`
Expected: PASS

**Step 3: Review final diff**

Run: `git diff -- src/game/events.ts src/main.ts src/ui/renderer.ts src/ui/scenes/event.ts src/ui/scenes/forge.ts src/ui/scenes/battle.ts src/ui/styles/batch2-core.css src/ui/styles/batch3-core.css`
Expected: Only intended battle, forge, and event changes remain.

**Step 4: Commit**

```bash
git add src/game/events.ts src/main.ts src/ui/renderer.ts src/ui/scenes/event.ts src/ui/scenes/forge.ts src/ui/scenes/battle.ts src/ui/styles/batch2-core.css src/ui/styles/batch3-core.css src/game/__tests__/events.test.ts src/ui/scenes/__tests__/event-unit.test.ts src/ui/scenes/__tests__/forge-ui-unit.test.ts src/ui/scenes/__tests__/battle-hud-unit.test.ts
git commit -m "feat: polish forge, event, and battle feedback"
```
