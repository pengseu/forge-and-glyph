# UI Followups Batch Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 批量修复战斗、奖励、地图、商店与材料展示的一组高优先级 UI 问题，并保证现有风格与素材体系一致。

**Architecture:** 优先复用现有 `getMaterialIconSrc` 与 battle/map/shop 的 helper 层，把“素材来源”“状态映射”“布局文案”收敛到场景 helper；先用单测锁住映射与 HTML 结构，再最小改动渲染与样式，最后补一份三怪/四怪布局方案文档和快速验证说明。

**Tech Stack:** TypeScript, Vitest, Vite, existing scene-based UI renderer, CSS batches.

---

### Task 1: 锁定材料素材统一测试

**Files:**
- Modify: `src/ui/scenes/__tests__/shop-ui-unit.test.ts`
- Modify: `src/ui/scenes/__tests__/result-summary-unit.test.ts`
- Modify: `src/ui/scenes/__tests__/battle-hud-unit.test.ts`

**Steps:**
1. 为商店材料项补“使用材料素材图而非 emoji/icon 文本”测试。
2. 为 boss / 奖励材料文案补“使用材料图块 HTML”测试。
3. 为战斗采集袋补“仅展示可用材料、hover title 保留效果说明”测试。
4. 运行相关测试，确认先红。

**Acceptance Criteria:**
- 测试明确要求材料展示使用 `getMaterialIconSrc(...)` 生成的图片素材。
- 旧的 `📦` / emoji 风格断言被替换或补充为素材断言。

### Task 2: 锁定地图与战斗意图 bug 测试

**Files:**
- Modify: `src/ui/scenes/__tests__/map-unit.test.ts`
- Modify: `src/ui/scenes/__tests__/battle-hud-unit.test.ts`
- Modify: `src/ui/scenes/__tests__/battle-targeting-unit.test.ts`

**Steps:**
1. 给地图当前节点强调补“已完成节点不再同时显示当前纸签”测试。
2. 给 summon / combo / defend / debuff 意图补更精确的 icon 映射测试。
3. 给复合意图与飘字 icon 文本策略补结构测试。
4. 运行相关测试，确认先红。

**Acceptance Criteria:**
- `completed + current` 状态不会同时渲染两种视觉标签。
- 召唤、强化、控制、连击等意图有确定素材映射，不回退到错误 icon。

### Task 3: 统一奖励/商店/结果/战斗材料实现

**Files:**
- Modify: `src/ui/scenes/reward.ts`
- Modify: `src/ui/scenes/shop.ts`
- Modify: `src/ui/scenes/result.ts`
- Modify: `src/ui/scenes/battle.ts`
- Modify: `src/game/materials.ts` (only if helper extraction needed)
- Modify: `src/ui/styles/batch2-core.css`
- Modify: `src/ui/styles/batch3-core.css`

**Steps:**
1. 提取可复用的材料展示小块 HTML helper。
2. 替换奖励页材料奖励与 boss 自动获得提示。
3. 替换商店材料 tab 为背包风格卡片。
4. 替换战斗采集袋中不可用材料过滤与 hover 说明。
5. 运行相关测试确保转绿。

**Acceptance Criteria:**
- 奖励页、Boss 自动获得、商店、战斗采集袋统一使用背包同款材料素材。
- 不可使用材料不在采集袋展示。
- 视觉结构与现有纸片风一致。

### Task 4: 修地图节点与玩家/敌人状态表现

**Files:**
- Modify: `src/ui/scenes/map.ts`
- Modify: `src/ui/scenes/battle.ts`
- Modify: `src/ui/animations.ts`
- Modify: `src/ui/styles/batch2-core.css`

**Steps:**
1. 修正地图 completed/current 冲突的渲染逻辑。
2. 修正敌人召唤与地精王复合意图 icon / 冗余喇叭 icon。
3. 把玩家额外状态栏改为徽标 + 数字。
4. 把灼烧/中毒飘字改为徽标化文本。
5. 运行 battle/map 测试确保转绿。

**Acceptance Criteria:**
- 地图节点状态唯一、可读。
- 玩家与敌人的状态展示语言统一。
- 飘字不再夹杂旧 emoji/icon。

### Task 5: 商店页面统一风格与文档补充

**Files:**
- Modify: `src/ui/scenes/shop.ts`
- Modify: `src/ui/styles/batch3-core.css`
- Create: `docs/plans/2026-03-08-enemy-layout-3-4-design.md`

**Steps:**
1. 对齐商店卡牌页/材料页与服务页的分栏、标题、卡片容器风格。
2. 补三怪/四怪布局方案文档，方便你后续做素材和布局决策。
3. 汇总快速验证清单。

**Acceptance Criteria:**
- 商店三页签风格统一。
- 三怪/四怪方案有明确尺寸、优缺点和切换条件。
- 最终说明里包含快速验证办法。
