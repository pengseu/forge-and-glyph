# Phase 3 Step 6 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 完成 40 卡池扩展、第一幕 7 层地图与未知事件，形成可完整通关的第一幕流程。

**Architecture:** 先做数据层（卡牌定义与升级映射），再做效果与接入，最后做地图/事件系统和整局联调。所有改动以不可变状态与最小侵入为原则，优先复用现有 `run/combat/effects` 管线。

**Tech Stack:** TypeScript + Vitest + Vite + Vanilla DOM

---

### Task 1: 卡牌数据层（任务A）

**Files:**
- Modify: `src/game/cards.ts`
- Modify: `src/game/campfire.ts`
- Test: `src/game/__tests__/cards.test.ts`
- Test: `src/game/__tests__/campfire.test.ts`

**Step 1: Write failing tests**
- 断言新增 13 张卡均可 `getCardDef` 获取。
- 断言总卡牌数达到 40。
- 断言 13 张卡均有升级映射（`upgradeCard` 后名称/关键值变化）。

**Step 2: Run tests to verify RED**
- Run: `npm test -- src/game/__tests__/cards.test.ts src/game/__tests__/campfire.test.ts`
- Expected: FAIL（缺失新卡与升级映射）

**Step 3: Minimal implementation**
- 在 `cards.ts` 增加 13 张新卡定义。
- 在 `campfire.ts` 增加对应升级条目。

**Step 4: Verify GREEN**
- Run: `npm test -- src/game/__tests__/cards.test.ts src/game/__tests__/campfire.test.ts`

### Task 2: 卡牌效果实现层（任务B）

**Files:**
- Modify: `src/game/types.ts`
- Modify: `src/game/effects.ts`
- Modify: `src/game/combat.ts`（如需）
- Test: `src/game/__tests__/effects.test.ts`
- Test: `src/game/__tests__/combat.test.ts`

**Step 1: Write failing tests**
- 覆盖引燃、寒霜新星、蚀骨毒、易伤诅咒、透支、魔力涌流、平衡、荆棘甲、魔法吸收、剑魔合一、血之狂怒。

**Step 2: Run RED**
- Run: `npm test -- src/game/__tests__/effects.test.ts src/game/__tests__/combat.test.ts`

**Step 3: Minimal implementation**
- 新增 `CardEffect` 变体并在 `applyCardEffects` 接入。
- 处理状态联动（灼烧/冻结/中毒/易伤/力量/资源）。

**Step 4: Verify GREEN**
- 同上测试命令应全绿。

### Task 3: 奖励与商店接入（任务C）

**Files:**
- Modify: `src/game/reward.ts`
- Modify: `src/game/shop.ts`
- Test: `src/game/__tests__/run.test.ts`
- Test: `src/game/__tests__/checklist.test.ts`

**Step 1: Write failing tests**
- 新卡可进入奖励候选与商店候选。
- 稀有度与价格区间仍满足规则。

**Step 2: RED**
- Run: `npm test -- src/game/__tests__/run.test.ts src/game/__tests__/checklist.test.ts`

**Step 3: Minimal implementation**
- 接入卡池来源过滤与商店展示池。

**Step 4: GREEN**
- 相关测试通过。

### Task 4: 第一幕7层地图重构（任务D）

**Files:**
- Modify: `src/game/map.ts`
- Modify: `src/ui/scenes/map.ts`
- Test: `src/game/__tests__/map.test.ts`

**Step 1: Write failing tests**
- 层数、节点分布、前置约束、Boss 可达性。

**Step 2: RED**
- Run: `npm test -- src/game/__tests__/map.test.ts`

**Step 3: Minimal implementation**
- 重构地图生成与展示。

**Step 4: GREEN**
- 地图测试通过。

### Task 5: 未知事件系统（任务E）

**Files:**
- Create/Modify: `src/game/events.ts`（或并入 run）
- Modify: `src/game/types.ts`
- Modify: `src/game/run.ts`
- Create/Modify: `src/ui/scenes/event.ts`
- Modify: `src/ui/renderer.ts`
- Modify: `src/main.ts`
- Test: `src/game/__tests__/run.test.ts`

**Step 1: Write failing tests**
- 事件抽取权重与结果写回（HP/金币/材料/卡牌升级）。

**Step 2: RED**
- Run: `npm test -- src/game/__tests__/run.test.ts`

**Step 3: Minimal implementation**
- 事件结构、抽取器、最小交互场景。

**Step 4: GREEN**
- 事件相关测试通过。

### Task 6: 完整流程联调（任务F）

**Files:**
- Modify: 按联调缺陷涉及文件
- Test: 全量

**Step 1: 冒烟并补回归测试**
- Run: `npm test`
- 手动 `npm run dev` 从开局打到 Boss 验证无阻断。

### Task 7: Phase 3 总验证（任务G）

**Files:**
- Modify: `docs/progress.md`
- Modify: `TODO_PHASE3.md`（勾选项）

**Step 1: 验证清单逐项核对**
- 核心循环 / 构筑 / 经济 / 路线 / 体验。

**Step 2: 更新文档**
- 同步完成状态与剩余风险。
