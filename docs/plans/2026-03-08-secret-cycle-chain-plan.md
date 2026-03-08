# Secret Cycle Chain Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在当前 V3.0 分支上，以最小侵入方式接入“轮回层级 / 隐藏 Boss / 锻铸者残响 / 深渊回响 / 裂隙之刃”秘密更新链，并保留首轮发现感与后续可扩展性。

**Architecture:** 新增一个 `src/game/secret-cycle.ts` 作为领域收口模块，负责轮回层级、隐藏线事件流、通关者摘要提取、回响 Boss 规格生成与奖励结算。标题页、元进度、run 初始化、第三幕 Boss 战后流程分别只做薄接线，避免把逻辑散落在 `main.ts` 与多个 scene 文件里。

**Tech Stack:** TypeScript、Vitest、现有事件页/战斗系统、`localStorage` 持久化。

---

### Task 1: 扩展元进度与存档边界

**Files:**
- Modify: `src/game/meta.ts`
- Modify: `src/game/types.ts`
- Modify: `src/game/state-codec.ts`
- Modify: `src/game/save.ts`
- Modify: `src/game/__tests__/meta.test.ts`
- Modify: `src/game/__tests__/save.test.ts`
- Modify: `src/game/__tests__/state-codec.test.ts`

**Step 1: Write the failing test**

在 `src/game/__tests__/meta.test.ts` 增加断言：

```ts
it('initializes secret cycle progress defaults', () => {
  const profile = createDefaultMetaProfile()
  expect(profile.secretCycle.highestUnlockedTier).toBe(0)
  expect(profile.secretCycle.highestClearedTier).toBe(-1)
  expect(profile.secretCycle.hiddenBossClearCount).toBe(0)
})
```

在 `src/game/__tests__/save.test.ts` / `src/game/__tests__/state-codec.test.ts` 增加断言：旧档缺少新字段时仍能正常加载默认值。

**Step 2: Run test to verify it fails**

Run: `npm test -- src/game/__tests__/meta.test.ts src/game/__tests__/save.test.ts src/game/__tests__/state-codec.test.ts`

Expected: FAIL，当前 `MetaProfile` / `GameState` / `RunState` 里还没有秘密轮回字段。

**Step 3: Write minimal implementation**

- 在 `src/game/types.ts` 为 `GameState` 增加：

```ts
selectedCycleTier: number
```

- 在 `src/game/types.ts` 为 `RunState` 增加：

```ts
cycleTier: number
secretState?: {
  hiddenRouteEntered: boolean
  pendingStage: 'none' | 'echo' | 'true_boss'
}
```

- 在 `src/game/meta.ts` 为 `MetaProfile` 增加：

```ts
secretCycle: {
  highestUnlockedTier: number
  highestClearedTier: number
  hiddenBossClearCount: number
  secretEntrySeenCount: number
  unlockedTitles: string[]
  unlockedStarterWeapons: string[]
  latestSummaryByTier: Record<string, ChampionSummary>
}
```

- 为 `loadMetaProfile`、`createDefaultMetaProfile`、`serializeGameState`、`deserializeGameState` 补默认值和兼容处理。

**Step 4: Run test to verify it passes**

Run: `npm test -- src/game/__tests__/meta.test.ts src/game/__tests__/save.test.ts src/game/__tests__/state-codec.test.ts`

Expected: PASS。

**Step 5: Commit**

```bash
git add src/game/meta.ts src/game/types.ts src/game/state-codec.ts src/game/save.ts src/game/__tests__/meta.test.ts src/game/__tests__/save.test.ts src/game/__tests__/state-codec.test.ts
git commit -m "feat: add secret cycle persistence scaffolding"
```

### Task 2: 新增轮回层级解析与标题页封印面板

**Files:**
- Create: `src/game/secret-cycle.ts`
- Modify: `src/ui/scenes/title.ts`
- Modify: `src/ui/renderer.ts`
- Modify: `src/main.ts`
- Modify: `src/ui/styles/batch3-core.css`
- Create: `src/ui/scenes/__tests__/title-unit.test.ts`

**Step 1: Write the failing test**

在 `src/ui/scenes/__tests__/title-unit.test.ts` 增加两组断言：

```ts
it('renders sealed cycle panel before first hidden clear', () => {
  const html = buildTitleHtml({ hasSecretCycleUnlocked: false, selectedCycleTier: 0 })
  expect(html).toContain('不要进来')
  expect(html).not.toContain('第二轮回·侵影')
})

it('renders cycle tier list with lock reasons after unlock', () => {
  const html = buildTitleHtml({ hasSecretCycleUnlocked: true, highestUnlockedTier: 1, selectedCycleTier: 0 })
  expect(html).toContain('第一轮回')
  expect(html).toContain('第二轮回·侵影')
  expect(html).toContain('深渊回响·1')
  expect(html).toContain('击败第二轮回·侵影')
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/ui/scenes/__tests__/title-unit.test.ts`

Expected: FAIL，当前标题页没有相关结构。

**Step 3: Write minimal implementation**

- 在 `src/game/secret-cycle.ts` 新增：
  - `resolveCycleTierLabel(tier: number): string`
  - `isCycleTierUnlocked(profile, tier): boolean`
  - `resolveCycleTierUnlockHint(profile, tier): string`
- 在 `src/ui/scenes/title.ts` 提炼可测试的 `buildTitleHtml(...)`。
- 在 `src/main.ts` 标题页回调中维护 `selectedCycleTier`。
- 在 `src/ui/styles/batch3-core.css` 增加封印态 / 灰显态 / 选中态样式。

**Step 4: Run test to verify it passes**

Run: `npm test -- src/ui/scenes/__tests__/title-unit.test.ts`

Expected: PASS。

**Step 5: Commit**

```bash
git add src/game/secret-cycle.ts src/ui/scenes/title.ts src/ui/renderer.ts src/main.ts src/ui/styles/batch3-core.css src/ui/scenes/__tests__/title-unit.test.ts
git commit -m "feat: add title cycle tier selector shell"
```

### Task 3: 把轮回层级锁进新开局 run

**Files:**
- Modify: `src/game/run.ts`
- Modify: `src/main.ts`
- Modify: `src/game/__tests__/run.test.ts`

**Step 1: Write the failing test**

在 `src/game/__tests__/run.test.ts` 增加：

```ts
it('stamps selected cycle tier into new run only', () => {
  const run = createRunState({ cycleTier: 2, unlockedBlueprints: [], blueprintMastery: {}, legacyWeaponDefId: null })
  expect(run.cycleTier).toBe(2)
})
```

并补一条继续旧档不覆写 `run.cycleTier` 的行为断言。

**Step 2: Run test to verify it fails**

Run: `npm test -- src/game/__tests__/run.test.ts`

Expected: FAIL。

**Step 3: Write minimal implementation**

- 扩展 `createRunState(...)` 的 seed 参数，支持 `cycleTier`。
- `onStartGame` 根据 `gameState.selectedCycleTier` 创建 run。
- `onContinueGame` / `onLoadSlot` 不改已有 `run.cycleTier`。

**Step 4: Run test to verify it passes**

Run: `npm test -- src/game/__tests__/run.test.ts`

Expected: PASS。

**Step 5: Commit**

```bash
git add src/game/run.ts src/main.ts src/game/__tests__/run.test.ts
git commit -m "feat: persist cycle tier into new runs"
```

### Task 4: 建立隐藏线纯流程模型

**Files:**
- Modify: `src/game/secret-cycle.ts`
- Modify: `src/game/types.ts`
- Create: `src/game/__tests__/secret-cycle.test.ts`

**Step 1: Write the failing test**

在 `src/game/__tests__/secret-cycle.test.ts` 写三条核心流程断言：

```ts
it('first hidden entry skips ordinary recognition', () => {
  const flow = resolvePostAct3BossSecretFlow({ hiddenBossClearCount: 0, cycleTier: 0 })
  expect(flow.map((s) => s.id)).toEqual(['secret_thanks_first', 'secret_boss_final', 'secret_epilogue'])
})

it('repeat hidden entry uses recognition and dual battle', () => {
  const flow = resolvePostAct3BossSecretFlow({ hiddenBossClearCount: 1, cycleTier: 1 })
  expect(flow.map((s) => s.id)).toEqual([
    'ordinary_recognition',
    'secret_reentry',
    'secret_boss_echo',
    'secret_transition',
    'secret_boss_final',
    'secret_epilogue',
  ])
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/game/__tests__/secret-cycle.test.ts`

Expected: FAIL，当前还没有流程解析器。

**Step 3: Write minimal implementation**

在 `src/game/secret-cycle.ts` 新增纯函数：

```ts
export function resolvePostAct3BossSecretFlow(input: {
  hiddenBossClearCount: number
  cycleTier: number
}): Array<{ id: SecretFlowStepId }>
```

并定义：
- `ordinary_recognition`
- `secret_thanks_first`
- `secret_reentry`
- `secret_reentry_late`
- `secret_transition`
- `secret_epilogue`
- `secret_boss_echo`
- `secret_boss_final`

**Step 4: Run test to verify it passes**

Run: `npm test -- src/game/__tests__/secret-cycle.test.ts`

Expected: PASS。

**Step 5: Commit**

```bash
git add src/game/secret-cycle.ts src/game/types.ts src/game/__tests__/secret-cycle.test.ts
git commit -m "feat: add secret route flow resolver"
```

### Task 5: 接入隐藏线事件文案与污染展示

**Files:**
- Modify: `src/game/secret-cycle.ts`
- Modify: `src/ui/scenes/event.ts`
- Modify: `src/ui/scenes/__tests__/event-unit.test.ts`
- Modify: `src/ui/styles/batch3-core.css`

**Step 1: Write the failing test**

在 `src/ui/scenes/__tests__/event-unit.test.ts` 增加：

```ts
it('supports abyss presentation and multiline body blocks', () => {
  const event = createSecretThanksEvent({ variant: 'first' })
  expect(event.presentation).toBe('abyss')
  expect(event.body?.length).toBeGreaterThan(1)
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/ui/scenes/__tests__/event-unit.test.ts src/game/__tests__/secret-cycle.test.ts`

Expected: FAIL，`EventDef` 目前只有 `description`。

**Step 3: Write minimal implementation**

- 在 `src/game/types.ts` 为 `EventDef` 增加可选字段：

```ts
presentation?: 'default' | 'abyss'
body?: Array<{ text: string; tone?: 'normal' | 'corrupt' | 'whisper' }>
```

- 在 `src/game/secret-cycle.ts` 实现：
  - `createSecretThanksEvent(...)`
  - `createAbyssRecognitionEvent(...)`
  - `createSecretTransitionEvent()`
  - `createSecretEpilogueEvent(...)`
- 在 `src/ui/scenes/event.ts` 渲染多段文本块。
- 在样式中加深色 / 纸张污染 / `？` 文案强调，不新做 cutscene 系统。

**Step 4: Run test to verify it passes**

Run: `npm test -- src/ui/scenes/__tests__/event-unit.test.ts src/game/__tests__/secret-cycle.test.ts`

Expected: PASS。

**Step 5: Commit**

```bash
git add src/game/secret-cycle.ts src/game/types.ts src/ui/scenes/event.ts src/ui/scenes/__tests__/event-unit.test.ts src/ui/styles/batch3-core.css
git commit -m "feat: add abyss-flavored secret route events"
```

### Task 6: 提取通关者摘要与回退模板

**Files:**
- Modify: `src/game/secret-cycle.ts`
- Modify: `src/game/meta.ts`
- Modify: `src/game/cards.ts`
- Modify: `src/game/__tests__/meta.test.ts`
- Modify: `src/game/__tests__/cards.test.ts`
- Modify: `src/game/__tests__/secret-cycle.test.ts`

**Step 1: Write the failing test**

在 `src/game/__tests__/secret-cycle.test.ts` 增加：

```ts
it('extracts champion summary from weapon, enchantments and deck', () => {
  const summary = extractChampionSummary(run, 1)
  expect(summary.weaponDefId).toBe('steel_staff')
  expect(summary.enchantments.length).toBeLessThanOrEqual(2)
  expect(summary.primaryArchetype).toBeTruthy()
  expect(summary.signatureTraitA).toBeTruthy()
})
```

再补一条无真实摘要时使用 `FALLBACK_ECHO_SUMMARIES` 的断言。

**Step 2: Run test to verify it fails**

Run: `npm test -- src/game/__tests__/secret-cycle.test.ts src/game/__tests__/meta.test.ts`

Expected: FAIL。

**Step 3: Write minimal implementation**

在 `src/game/secret-cycle.ts` 新增：

```ts
export function extractChampionSummary(run: RunState, clearedCycleTier: number): ChampionSummary
export function resolveChampionSummaryForTier(profile: MetaProfile, tier: number): ChampionSummary
```

规则：
- 武器直接读 `run.equippedWeapon`
- 附魔取前两个
- 标签通过 deck `CardDef.effects` 统计得分选前二
- `epitaph` 走模板拼接

在 `src/game/meta.ts` 把通关摘要写回 `secretCycle.latestSummaryByTier`。

**Step 4: Run test to verify it passes**

Run: `npm test -- src/game/__tests__/secret-cycle.test.ts src/game/__tests__/meta.test.ts`

Expected: PASS。

**Step 5: Commit**

```bash
git add src/game/secret-cycle.ts src/game/meta.ts src/game/cards.ts src/game/__tests__/meta.test.ts src/game/__tests__/cards.test.ts src/game/__tests__/secret-cycle.test.ts
git commit -m "feat: capture champion summaries for abyss echoes"
```

### Task 7: 实现锻铸者残响 Boss 生成

**Files:**
- Modify: `src/game/types.ts`
- Modify: `src/game/enemies.ts`
- Modify: `src/game/combat.ts`
- Modify: `src/game/secret-cycle.ts`
- Modify: `src/game/__tests__/enemies.test.ts`
- Modify: `src/game/__tests__/combat.test.ts`
- Modify: `src/game/__tests__/secret-cycle.test.ts`

**Step 1: Write the failing test**

先为纯生成逻辑写断言：

```ts
it('builds echo boss from fixed skeleton + summary modules', () => {
  const spec = createEchoBossSpec(summary, 2)
  expect(spec.enemyId).toContain('echo:')
  expect(spec.displayName).toBe('锻铸者残响')
  expect(spec.traits).toContain(summary.signatureTraitA)
})
```

再为 `getEnemyDef('echo:...')` 增加一条断言：

```ts
it('resolves deterministic echo enemy defs from encoded ids', () => {
  const def = getEnemyDef('echo:staff:flame_void:charge_spell:2')
  expect(def.name).toBe('锻铸者残响')
  expect(def.intents.length).toBeGreaterThanOrEqual(4)
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/game/__tests__/enemies.test.ts src/game/__tests__/combat.test.ts src/game/__tests__/secret-cycle.test.ts`

Expected: FAIL。

**Step 3: Write minimal implementation**

- 在 `src/game/secret-cycle.ts` 中把摘要映射为：
  - 武器人格模板
  - 附魔修正包
  - 流派修正包
- 在 `src/game/enemies.ts` 中让 `getEnemyDef(...)` 识别 `echo:` 编码 id，并按规则生成 `EnemyDef`。
- 如确实必要，再在 `src/game/types.ts` / `src/game/combat.ts` 增加一层很小的 `EnemyPassive[]` 支持。

**Step 4: Run test to verify it passes**

Run: `npm test -- src/game/__tests__/enemies.test.ts src/game/__tests__/combat.test.ts src/game/__tests__/secret-cycle.test.ts`

Expected: PASS。

**Step 5: Commit**

```bash
git add src/game/types.ts src/game/enemies.ts src/game/combat.ts src/game/secret-cycle.ts src/game/__tests__/enemies.test.ts src/game/__tests__/combat.test.ts src/game/__tests__/secret-cycle.test.ts
git commit -m "feat: add forged echo boss generator"
```

### Task 8: 接通第三幕 Boss 战后隐藏线顺序

**Files:**
- Modify: `src/main.ts`
- Modify: `src/game/meta.ts`
- Modify: `src/game/secret-cycle.ts`
- Modify: `src/game/__tests__/meta.test.ts`
- Modify: `src/game/__tests__/secret-cycle.test.ts`

**Step 1: Write the failing test**

优先把流程决策继续放在纯函数里验证：

```ts
it('awards transcendence rewards on first hidden clear', () => {
  const next = applySecretVictoryToMeta(profile, { clearedTier: 0, firstClear: true, summary })
  expect(next.secretCycle.highestUnlockedTier).toBe(1)
  expect(next.secretCycle.unlockedTitles).toContain('超越者')
  expect(next.secretCycle.unlockedStarterWeapons).toContain('rift_blade')
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/game/__tests__/meta.test.ts src/game/__tests__/secret-cycle.test.ts`

Expected: FAIL。

**Step 3: Write minimal implementation**

- 在 `src/game/secret-cycle.ts` / `src/game/meta.ts` 中新增：
  - `applySecretVictoryToMeta(...)`
  - `shouldShowOrdinaryRecognition(profile): boolean`
- 在 `src/main.ts` 的第三幕 Boss 胜利分支调用隐藏线流程解析器，按顺序切 `scene: 'event'` / `scene: 'battle'`。
- 首次隐藏激活不显示普通最终 Boss 识别台词。
- 二次及以后显示 `门的回声` 后进入双战。

**Step 4: Run test to verify it passes**

Run: `npm test -- src/game/__tests__/meta.test.ts src/game/__tests__/secret-cycle.test.ts`

Expected: PASS。

**Step 5: Commit**

```bash
git add src/main.ts src/game/meta.ts src/game/secret-cycle.ts src/game/__tests__/meta.test.ts src/game/__tests__/secret-cycle.test.ts
git commit -m "feat: wire post-act3 secret route progression"
```

### Task 9: 加入裂隙之刃与轮回武器逻辑

**Files:**
- Modify: `src/game/weapons.ts`
- Modify: `src/game/meta.ts`
- Modify: `src/main.ts`
- Modify: `src/ui/scenes/weapon-select.ts`
- Modify: `src/game/__tests__/weapons.test.ts`
- Modify: `src/ui/scenes/__tests__/weapon-select-unit.test.ts`

**Step 1: Write the failing test**

```ts
it('rift blade keeps base normal attack and resolves one battle persona', () => {
  const weapon = getWeaponDef('rift_blade')
  expect(weapon.normalAttack.damage).toBe(5)
  expect(weapon.name).toBe('裂隙之刃')
})
```

再补 UI 断言：首次隐藏首通前不显示，解锁后在隐藏起始武器区可见。

**Step 2: Run test to verify it fails**

Run: `npm test -- src/game/__tests__/weapons.test.ts src/ui/scenes/__tests__/weapon-select-unit.test.ts`

Expected: FAIL。

**Step 3: Write minimal implementation**

- 在 `src/game/weapons.ts` 增加 `rift_blade` 定义。
- 只作为隐藏起始武器解锁，不进入普通配方或掉落池。
- 在开战时根据随机人格解析战斗态效果；不要把它做成稳定数值上位。
- 在 `weapon-select` 页面仅当 `metaProfile.secretCycle.unlockedStarterWeapons` 包含它时显示。

**Step 4: Run test to verify it passes**

Run: `npm test -- src/game/__tests__/weapons.test.ts src/ui/scenes/__tests__/weapon-select-unit.test.ts`

Expected: PASS。

**Step 5: Commit**

```bash
git add src/game/weapons.ts src/game/meta.ts src/main.ts src/ui/scenes/weapon-select.ts src/game/__tests__/weapons.test.ts src/ui/scenes/__tests__/weapon-select-unit.test.ts
git commit -m "feat: add rift blade secret starter"
```

### Task 10: 加入深渊回响词缀、幕前低语与隐藏线标记

**Files:**
- Modify: `src/game/secret-cycle.ts`
- Modify: `src/game/events.ts`
- Modify: `src/ui/scenes/map.ts`
- Modify: `src/ui/scenes/act-transition.ts`
- Modify: `src/ui/styles/batch3-core.css`
- Modify: `src/ui/scenes/__tests__/map-unit.test.ts`
- Modify: `src/ui/scenes/__tests__/act-transition-unit.test.ts`

**Step 1: Write the failing test**

- 为 `resolveCycleTierAffixes(tier)` 增加断言：高层不只是 HP 增长。
- 为地图特殊标记和幕前低语增加最小结构断言。

```ts
it('adds non-numeric affixes for abyss echo tiers', () => {
  const affixes = resolveCycleTierAffixes(3)
  expect(affixes.length).toBeGreaterThan(0)
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/ui/scenes/__tests__/map-unit.test.ts src/ui/scenes/__tests__/act-transition-unit.test.ts src/game/__tests__/secret-cycle.test.ts`

Expected: FAIL。

**Step 3: Write minimal implementation**

- 在 `src/game/secret-cycle.ts` 加 `灼蚀 / 淬毒 / 铁幕 / 蓄压 / 容器筛选` 等可落地词缀。
- 在幕前低语 / 地图节点只加轻量提示与特殊标记，不重做整套 UI。

**Step 4: Run test to verify it passes**

Run: `npm test -- src/ui/scenes/__tests__/map-unit.test.ts src/ui/scenes/__tests__/act-transition-unit.test.ts src/game/__tests__/secret-cycle.test.ts`

Expected: PASS。

**Step 5: Commit**

```bash
git add src/game/secret-cycle.ts src/game/events.ts src/ui/scenes/map.ts src/ui/scenes/act-transition.ts src/ui/styles/batch3-core.css src/ui/scenes/__tests__/map-unit.test.ts src/ui/scenes/__tests__/act-transition-unit.test.ts
git commit -m "feat: add abyss echo affixes and hidden route foreshadowing"
```

### Task 11: 做一轮定向回归

**Files:**
- Review: `src/main.ts`
- Review: `src/game/meta.ts`
- Review: `src/game/secret-cycle.ts`
- Review: `src/game/enemies.ts`
- Review: `src/game/combat.ts`
- Review: `src/ui/scenes/title.ts`
- Review: `src/ui/scenes/event.ts`
- Review: `src/ui/scenes/map.ts`
- Review: `src/ui/scenes/weapon-select.ts`

**Step 1: Run targeted tests**

Run: `npm test -- src/game/__tests__/meta.test.ts src/game/__tests__/save.test.ts src/game/__tests__/state-codec.test.ts src/game/__tests__/run.test.ts src/game/__tests__/secret-cycle.test.ts src/game/__tests__/enemies.test.ts src/game/__tests__/combat.test.ts src/game/__tests__/weapons.test.ts src/ui/scenes/__tests__/title-unit.test.ts src/ui/scenes/__tests__/event-unit.test.ts src/ui/scenes/__tests__/map-unit.test.ts src/ui/scenes/__tests__/weapon-select-unit.test.ts src/ui/scenes/__tests__/act-transition-unit.test.ts`

Expected: PASS。

**Step 2: Run build**

Run: `npm run build`

Expected: PASS。

**Step 3: Commit**

```bash
git add src docs/plans/2026-03-08-secret-cycle-chain-design.md docs/plans/2026-03-08-secret-cycle-chain-plan.md
git commit -m "feat: ship secret cycle chain"
```
