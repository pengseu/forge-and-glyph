# Weapon Drop And Emoji Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将奖励页武器掉落改为自动入背包并支持立即装备，同时按统一规则清理全局文本 emoji，保留已素材化图示系统不变。

**Architecture:** 在 `main.ts` 中调整奖励结算与装备回调，令武器掉落先入包再在奖励页中做“立即装备”处理；在各场景文件中抽出纯文字 helper 或直接替换模板文案，删除文本 emoji。使用现有测试补红测并逐步放行。

**Tech Stack:** TypeScript, Vite, Vitest, 现有 UI scene 渲染体系

---

### Task 1: 锁定武器掉落自动入包行为

**Files:**
- Modify: `src/ui/__tests__/renderer-unit.test.ts`
- Modify: `src/ui/scenes/__tests__/reward-ui-unit.test.ts`
- Modify: `src/main.ts`

**Step 1: Write the failing test**
- 为奖励武器文案与回调补测试：武器区文案体现“已收入背包”与“立即装备”语义
- 若有合适入口，为主流程补测试：存在 `droppedWeaponId` 时不装备也不会丢失武器

**Step 2: Run test to verify it fails**
- Run: `npm test -- src/ui/scenes/__tests__/reward-ui-unit.test.ts src/ui/__tests__/renderer-unit.test.ts`
- Expected: FAIL

**Step 3: Write minimal implementation**
- 在战斗胜利后把掉落武器直接加入背包
- `onEquipWeapon` 改为从已有掉落武器中切换装备，而不是再次创建新武器
- 奖励页文案改为“已收入背包 / 立即装备”

**Step 4: Run test to verify it passes**
- Run: `npm test -- src/ui/scenes/__tests__/reward-ui-unit.test.ts src/ui/__tests__/renderer-unit.test.ts`
- Expected: PASS

### Task 2: 锁定商店与奖励页文本 emoji 清理

**Files:**
- Modify: `src/ui/scenes/__tests__/shop-ui-unit.test.ts`
- Modify: `src/ui/scenes/__tests__/reward-ui-unit.test.ts`
- Modify: `src/ui/scenes/shop.ts`
- Modify: `src/ui/scenes/reward.ts`

**Step 1: Write the failing test**
- 为商店标题 / 价格 / 服务标题 / 离开按钮断言纯文字
- 为奖励页标题 / 跳过按钮断言纯文字价格样式

**Step 2: Run test to verify it fails**
- Run: `npm test -- src/ui/scenes/__tests__/shop-ui-unit.test.ts src/ui/scenes/__tests__/reward-ui-unit.test.ts`

**Step 3: Write minimal implementation**
- 移除 `shop.ts`、`reward.ts` 中残余文本 emoji
- 保持素材化内容不变

**Step 4: Run test to verify it passes**
- Run: `npm test -- src/ui/scenes/__tests__/shop-ui-unit.test.ts src/ui/scenes/__tests__/reward-ui-unit.test.ts`

### Task 3: 扩展全局页面文本 emoji 清理

**Files:**
- Modify: `src/ui/scenes/title.ts`
- Modify: `src/ui/scenes/weapon-select.ts`
- Modify: `src/ui/scenes/inventory.ts`
- Modify: `src/ui/scenes/campfire.ts`
- Modify: `src/ui/scenes/enchant.ts`
- Modify: `src/ui/scenes/act-transition.ts`
- Modify: `src/ui/scenes/map.ts`
- Modify: `src/ui/scenes/battle.ts`
- Modify: `src/ui/scenes/style-lab.ts` (仅 mock 文案)
- Test: 相关 unit tests

**Step 1: Write the failing test**
- 为已有相关测试补充纯文字断言；没有测试的页面可加最小 helper 测试

**Step 2: Run test to verify it fails**
- Run: `npm test -- src/ui/scenes/__tests__/weapon-select-unit.test.ts src/ui/scenes/__tests__/inventory-ui-unit.test.ts src/ui/scenes/__tests__/map-unit.test.ts src/ui/scenes/__tests__/battle-hud-unit.test.ts src/ui/scenes/__tests__/style-lab-unit.test.ts`

**Step 3: Write minimal implementation**
- 清理文本 emoji
- 若页面依赖 emoji 传达类型，改为短文字标签

**Step 4: Run test to verify it passes**
- Run: 同上

### Task 4: 全量验证

**Files:**
- Modify: 上述文件

**Step 1: Run focused tests**
- Run: `npm test -- src/ui/scenes/__tests__/reward-ui-unit.test.ts src/ui/scenes/__tests__/shop-ui-unit.test.ts src/ui/scenes/__tests__/inventory-ui-unit.test.ts src/ui/scenes/__tests__/weapon-select-unit.test.ts src/ui/scenes/__tests__/map-unit.test.ts src/ui/scenes/__tests__/battle-hud-unit.test.ts src/ui/scenes/__tests__/style-lab-unit.test.ts src/ui/__tests__/renderer-unit.test.ts`

**Step 2: Run build**
- Run: `npm run build`
- Expected: PASS
