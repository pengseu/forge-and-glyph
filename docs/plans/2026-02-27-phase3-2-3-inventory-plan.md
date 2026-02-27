# Phase 3.2 + 3.3 + Inventory Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 完成商店稳定化、材料+锻造首版和背包场景（支持装备切换）。

**Architecture:** 在 `RunState` 统一维护金币、材料、武器、卡组；新增 `inventory` 与 `forge` 场景，地图顶部常驻入口；奖励流扩展为卡牌/材料分支，Boss 追加材料。

**Tech Stack:** TypeScript, Vite, Vitest, DOM scenes

---

### Task 1: 数据模型与材料逻辑

**Files:**
- Modify: `src/game/types.ts`
- Create: `src/game/materials.ts`
- Modify: `src/game/run.ts`
- Test: `src/game/__tests__/run.test.ts`

**Step 1: 写失败测试**
- 材料加法遵循上限
- 锻造消耗不足时失败
- 锻造成功时扣材料并入库

**Step 2: 跑测试确认失败**
Run: `npm test -- src/game/__tests__/run.test.ts`

**Step 3: 实现最小逻辑**
- MaterialId、材料表、上限规则
- run 层 add/consume 材料函数
- run 层 forge 函数（首版武器）

**Step 4: 跑测试确认通过**
Run: `npm test -- src/game/__tests__/run.test.ts`

### Task 2: 地图与铁匠节点

**Files:**
- Modify: `src/game/map.ts`
- Modify: `src/game/__tests__/map.test.ts`

**Step 1: 写失败测试**
- 地图包含 1 个 forge 节点
- 连接关系可达 Boss

**Step 2: 跑测试确认失败**
Run: `npm test -- src/game/__tests__/map.test.ts`

**Step 3: 实现最小逻辑**
- map 接入 forge 节点
- 保持现有节点总量与可达性

**Step 4: 跑测试确认通过**
Run: `npm test -- src/game/__tests__/map.test.ts`

### Task 3: 奖励页材料分支 + Boss 额外材料

**Files:**
- Modify: `src/game/reward.ts`
- Modify: `src/main.ts`
- Modify: `src/ui/scenes/reward.ts`
- Test: `src/game/__tests__/run.test.ts`

**Step 1: 写失败测试**
- 普通/精英可选择材料奖励
- Boss 会追加 Boss 材料

**Step 2: 跑测试确认失败**
Run: `npm test -- src/game/__tests__/run.test.ts`

**Step 3: 实现最小逻辑**
- main 奖励流加 `card/material` 分支状态
- reward scene 加两个入口按钮

**Step 4: 跑测试确认通过**
Run: `npm test -- src/game/__tests__/run.test.ts`

### Task 4: 背包场景（含装备切换）

**Files:**
- Create: `src/ui/scenes/inventory.ts`
- Modify: `src/ui/renderer.ts`
- Modify: `src/ui/scenes/map.ts`
- Modify: `src/main.ts`
- Modify: `src/style.css`

**Step 1: 写失败测试**
- run 层装备切换行为正确（已有测试补充）

**Step 2: 跑测试确认失败**
Run: `npm test -- src/game/__tests__/run.test.ts`

**Step 3: 实现最小逻辑**
- map 顶部常驻背包按钮
- inventory 场景展示卡牌/材料/武器
- 武器支持装备切换

**Step 4: 跑测试确认通过**
Run: `npm test -- src/game/__tests__/run.test.ts`

### Task 5: 商店稳定化与选牌页可读性

**Files:**
- Modify: `src/ui/scenes/shop.ts`
- Modify: `src/style.css`

**Step 1: 调整 UI**
- 商店交互状态可视化
- reward 字号/卡片尺寸强化

**Step 2: 全量回归**
Run: `npm test && npm run build`

