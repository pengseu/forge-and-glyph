# Phase 3 Step 5 MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现附魔台与附魔/共鸣 MVP（6附魔 + 2灼烧共鸣）并接入战斗循环。

**Architecture:** 采用规则模块化：附魔与共鸣规则集中在 `enchantments.ts`，战斗层通过统一钩子调用。运行态仅维护武器附魔数据，进入战斗时做快照，保证行为稳定与可测试。

**Tech Stack:** TypeScript + Vitest + DOM Scene Renderer

---

### Task 1: 扩展类型与场景/节点

**Files:**
- Modify: `src/game/types.ts`
- Modify: `src/game/map.ts`
- Modify: `src/ui/renderer.ts`
- Test: `src/game/__tests__/map.test.ts`

**Step 1: Write failing test**
- 在 `map.test.ts` 增加 `enchant` 节点存在性断言。

**Step 2: Run test to verify fails**
- Run: `npm test -- src/game/__tests__/map.test.ts`
- Expected: FAIL（缺少 enchant 节点）

**Step 3: Minimal implementation**
- 扩展 `NodeType`/`Scene`。
- 地图增加 `enchant` 节点并保证与 `forge` 位置不同且可达。
- renderer 预留 `enchant` scene 分发。

**Step 4: Verify pass**
- Run: `npm test -- src/game/__tests__/map.test.ts`

### Task 2: 附魔规则模块与运行态逻辑

**Files:**
- Create: `src/game/enchantments.ts`
- Modify: `src/game/types.ts`
- Modify: `src/game/run.ts`
- Test: `src/game/__tests__/run.test.ts`

**Step 1: Write failing test**
- 增加测试：附魔消耗 `elemental_essence`、最多2槽、可覆盖槽位。

**Step 2: Run failing test**
- Run: `npm test -- src/game/__tests__/run.test.ts`

**Step 3: Minimal implementation**
- `WeaponInstance` 增加 `enchantments`。
- 新增 `enchantWeapon(state, enchantmentId, replaceIndex?)`。
- 若槽位未满追加；已满需 `replaceIndex` 才覆盖。

**Step 4: Verify pass**
- Run: `npm test -- src/game/__tests__/run.test.ts`

### Task 3: 战斗接入附魔与共鸣效果

**Files:**
- Modify: `src/game/combat.ts`
- Modify: `src/game/effects.ts`
- Modify: `src/game/types.ts`
- Create/Modify: `src/game/enchantments.ts`
- Test: `src/game/__tests__/combat.test.ts`

**Step 1: Write failing tests**
- 覆盖 flame/frost/thunder/soul/void/bless。
- 覆盖 `flame+thunder` 与 `flame+bless`。

**Step 2: Run failing tests**
- Run: `npm test -- src/game/__tests__/combat.test.ts`

**Step 3: Minimal implementation**
- 进入战斗时注入 `equippedEnchantments`。
- 命中前计算（伤害加成/穿甲/共鸣增伤）。
- 命中后处理（灼烧/冻结/弹射/雷焰附烧）。
- 击杀后处理（汲魂）。

**Step 4: Verify pass**
- Run: `npm test -- src/game/__tests__/combat.test.ts`

### Task 4: 附魔场景接入主流程

**Files:**
- Create: `src/ui/scenes/enchant.ts`
- Modify: `src/ui/renderer.ts`
- Modify: `src/main.ts`
- Modify: `src/style.css`

**Step 1: Write failing integration assertions**
- 通过场景回调路径验证 `enchant` 进入与离开逻辑（可用现有 run/main 测试扩展）。

**Step 2: Run related tests**
- Run: `npm test -- src/game/__tests__/run.test.ts src/game/__tests__/map.test.ts`

**Step 3: Minimal implementation**
- 新增附魔 UI：展示武器、槽位、附魔列表、覆盖按钮、可触发共鸣提示。
- main 注册 `onEnchantApply/onEnchantLeave` 回调。

**Step 4: Verify pass**
- 运行相关测试并手动 `npm run dev` 冒烟。

### Task 5: 全量验证

**Files:**
- Modify: `docs/progress.md`（同步状态）

**Step 1: Run all tests**
- Run: `npm test --silent`
- Expected: 全绿

**Step 2: Update docs**
- 将“附魔系统（MVP）”状态同步到进度文档。
