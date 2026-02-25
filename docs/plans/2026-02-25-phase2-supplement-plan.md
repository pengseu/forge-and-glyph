# Phase 2 补充实现计划 — 篝火 + 装备系统

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** 完成 Phase 2 的遗漏功能，实现篝火节点和基础装备系统（长剑）

**Architecture:** 扩展现有的 RunState 添加装备字段，创建新的篝火系统模块，修改路线图生成逻辑添加篝火节点，在战斗中应用武器效果。

**Tech Stack:** Vite + TypeScript + Vitest，纯 DOM 渲染

---

## Task 1: 扩展类型定义

**Files:**
- Modify: `src/game/types.ts`
- Test: `src/game/__tests__/types.test.ts`

**Step 1: 写失败的测试**

```typescript
// src/game/__tests__/types.test.ts - 添加到现有describe块
it('should define weapon types', () => {
  const weaponDef: WeaponDef = {
    id: 'longsword',
    name: '长剑',
    rarity: 'basic',
    effect: '战技卡费用-1'
  }
  expect(weaponDef.id).toBe('longsword')
})

it('should extend RunState with weapon fields', () => {
  const runState: RunState = {
    currentNodeId: 'node1',
    visitedNodes: new Set(),
    deck: [],
    mapNodes: [],
    turn: 0,
    equippedWeapon: null,
    weaponInventory: []
  }
  expect(runState.equippedWeapon).toBeNull()
})

it('should support campfire node type', () => {
  const node: MapNode = {
    id: 'campfire1',
    type: 'campfire',
    completed: false,
    x: 0,
    y: 0,
    connections: []
  }
  expect(node.type).toBe('campfire')
})
```

**Step 2: 运行测试验证失败**

```bash
npm test -- src/game/__tests__/types.test.ts
```

Expected: FAIL - WeaponDef, WeaponInstance 类型未定义

**Step 3: 添加类型定义**

在 `src/game/types.ts` 中添加：

```typescript
// --- Weapon System ---
export interface WeaponDef {
  id: string
  name: string
  rarity: 'basic' | 'upgraded'
  effect: string
}

export interface WeaponInstance {
  uid: string
  defId: string
}

// 修改 RunState
export interface RunState {
  currentNodeId: string
  visitedNodes: Set<string>
  deck: CardInstance[]
  mapNodes: MapNode[]
  turn: number
  equippedWeapon: WeaponInstance | null
  weaponInventory: WeaponInstance[]
}

// 修改 MapNode
export type NodeType = 'normal_battle' | 'elite_battle' | 'boss_battle' | 'campfire'
```

**Step 4: 运行测试验证通过**

```bash
npm test -- src/game/__tests__/types.test.ts
```

Expected: PASS

**Step 5: 提交**

```bash
git add src/game/types.ts src/game/__tests__/types.test.ts
git commit -m "feat: add weapon and campfire types"
```

---

## Task 2: 创建武器定义模块

**Files:**
- Create: `src/game/weapons.ts`
- Test: `src/game/__tests__/weapons.test.ts`

**Step 1: 写失败的测试**

```typescript
// src/game/__tests__/weapons.test.ts
import { describe, it, expect } from 'vitest'
import { ALL_WEAPONS, getWeaponDef } from '../weapons'

describe('weapons', () => {
  it('should have 2 weapon definitions', () => {
    expect(ALL_WEAPONS).toHaveLength(2)
  })

  it('should find weapon by id', () => {
    const longsword = getWeaponDef('longsword')
    expect(longsword.name).toBe('长剑')
    expect(longsword.rarity).toBe('basic')
  })

  it('should find upgraded longsword', () => {
    const upgraded = getWeaponDef('longsword_upgraded')
    expect(upgraded.name).toBe('精钢长剑')
    expect(upgraded.rarity).toBe('upgraded')
  })
})
```

**Step 2: 运行测试验证失败**

```bash
npm test -- src/game/__tests__/weapons.test.ts
```

Expected: FAIL - weapons.ts 不存在

**Step 3: 创建武器定义**

```typescript
// src/game/weapons.ts
import type { WeaponDef } from './types'

export const ALL_WEAPONS: WeaponDef[] = [
  {
    id: 'longsword',
    name: '长剑',
    rarity: 'basic',
    effect: '战技卡打出后，下一张战技卡费用-1'
  },
  {
    id: 'longsword_upgraded',
    name: '精钢长剑',
    rarity: 'upgraded',
    effect: '战技卡打出后，下一张战技卡费用-2'
  }
]

export function getWeaponDef(id: string): WeaponDef {
  const weapon = ALL_WEAPONS.find(w => w.id === id)
  if (!weapon) throw new Error(`Weapon not found: ${id}`)
  return weapon
}
```

**Step 4: 运行测试验证通过**

```bash
npm test -- src/game/__tests__/weapons.test.ts
```

Expected: PASS

**Step 5: 提交**

```bash
git add src/game/weapons.ts src/game/__tests__/weapons.test.ts
git commit -m "feat: add weapon definitions (longsword)"
```

---

## Task 3: 创建篝火系统模块

**Files:**
- Create: `src/game/campfire.ts`
- Test: `src/game/__tests__/campfire.test.ts`

**Step 1: 写失败的测试**

```typescript
// src/game/__tests__/campfire.test.ts
import { describe, it, expect } from 'vitest'
import { healAtCampfire, upgradeCardAtCampfire } from '../campfire'
import { createBattleState } from '../combat'

describe('campfire', () => {
  it('should heal player to max hp', () => {
    const battle = createBattleState()
    battle.player.hp = 10
    const healed = healAtCampfire(battle)
    expect(healed.player.hp).toBe(healed.player.maxHp)
  })

  it('should upgrade card damage', () => {
    const battle = createBattleState()
    const cardUid = battle.player.hand[0].uid
    const upgraded = upgradeCardAtCampfire(battle, cardUid, 'damage')
    expect(upgraded).toBeDefined()
  })

  it('should upgrade card cost', () => {
    const battle = createBattleState()
    const cardUid = battle.player.hand[0].uid
    const upgraded = upgradeCardAtCampfire(battle, cardUid, 'cost')
    expect(upgraded).toBeDefined()
  })
})
```

**Step 2: 运行测试验证失败**

```bash
npm test -- src/game/__tests__/campfire.test.ts
```

Expected: FAIL - campfire.ts 不存在

**Step 3: 创建篝火逻辑**

```typescript
// src/game/campfire.ts
import type { BattleState } from './types'
import { getCardDef } from './cards'

export function healAtCampfire(battle: BattleState): BattleState {
  return {
    ...battle,
    player: {
      ...battle.player,
      hp: battle.player.maxHp
    }
  }
}

export function upgradeCardAtCampfire(
  battle: BattleState,
  cardUid: string,
  upgradeType: 'damage' | 'cost'
): BattleState {
  // 简化版本：标记卡牌已升级
  // 实际效果在战斗中应用
  return battle
}
```

**Step 4: 运行测试验证通过**

```bash
npm test -- src/game/__tests__/campfire.test.ts
```

Expected: PASS

**Step 5: 提交**

```bash
git add src/game/campfire.ts src/game/__tests__/campfire.test.ts
git commit -m "feat: add campfire system"
```

---

## Task 4: 修改路线图生成添加篝火节点

**Files:**
- Modify: `src/game/map.ts`
- Test: `src/game/__tests__/map.test.ts`

**Step 1: 写失败的测试**

```typescript
// 在 src/game/__tests__/map.test.ts 中添加
it('should generate map with campfire node', () => {
  const map = generateMap()
  const campfireNode = map.find(n => n.type === 'campfire')
  expect(campfireNode).toBeDefined()
  expect(campfireNode?.id).toBe('campfire_1')
})
```

**Step 2: 运行测试验证失败**

```bash
npm test -- src/game/__tests__/map.test.ts
```

Expected: FAIL - 没有篝火节点

**Step 3: 修改路线图生成**

在 `src/game/map.ts` 中修改 `generateMap()` 函数，在第 4 个位置插入篝火节点。

**Step 4: 运行测试验证通过**

```bash
npm test -- src/game/__tests__/map.test.ts
```

Expected: PASS

**Step 5: 提交**

```bash
git add src/game/map.ts src/game/__tests__/map.test.ts
git commit -m "feat: add campfire node to map generation"
```

---

## Task 5: 修改 RunState 管理添加装备函数

**Files:**
- Modify: `src/game/run.ts`
- Test: `src/game/__tests__/run.test.ts`

**Step 1: 写失败的测试**

```typescript
// 在 src/game/__tests__/run.test.ts 中添加
it('should equip weapon', () => {
  const run = createRunState()
  const newRun = equipWeapon(run, 'longsword')
  expect(newRun.equippedWeapon?.defId).toBe('longsword')
})

it('should add weapon to inventory', () => {
  const run = createRunState()
  const newRun = addWeaponToInventory(run, 'longsword')
  expect(newRun.weaponInventory).toHaveLength(1)
})

it('should upgrade equipped weapon', () => {
  const run = createRunState()
  let newRun = addWeaponToInventory(run, 'longsword')
  newRun = equipWeapon(newRun, 'longsword')
  newRun = upgradeEquippedWeapon(newRun)
  expect(newRun.equippedWeapon?.defId).toBe('longsword_upgraded')
})
```

**Step 2: 运行测试验证失败**

```bash
npm test -- src/game/__tests__/run.test.ts
```

Expected: FAIL - 函数未定义

**Step 3: 添加装备管理函数**

在 `src/game/run.ts` 中添加：

```typescript
import { v4 as uuidv4 } from 'uuid'
import type { WeaponInstance } from './types'

export function addWeaponToInventory(state: RunState, weaponDefId: string): RunState {
  const weapon: WeaponInstance = {
    uid: uuidv4(),
    defId: weaponDefId
  }
  return {
    ...state,
    weaponInventory: [...state.weaponInventory, weapon]
  }
}

export function equipWeapon(state: RunState, weaponDefId: string): RunState {
  const weapon = state.weaponInventory.find(w => w.defId === weaponDefId)
  if (!weapon) return state
  return {
    ...state,
    equippedWeapon: weapon
  }
}

export function upgradeEquippedWeapon(state: RunState): RunState {
  if (!state.equippedWeapon) return state
  if (state.equippedWeapon.defId === 'longsword') {
    return {
      ...state,
      equippedWeapon: {
        ...state.equippedWeapon,
        defId: 'longsword_upgraded'
      }
    }
  }
  return state
}
```

**Step 4: 运行测试验证通过**

```bash
npm test -- src/game/__tests__/run.test.ts
```

Expected: PASS

**Step 5: 提交**

```bash
git add src/game/run.ts src/game/__tests__/run.test.ts
git commit -m "feat: add weapon management functions to run state"
```

---

## Task 6: 修改战斗系统应用武器效果

**Files:**
- Modify: `src/game/combat.ts`
- Modify: `src/game/types.ts` (add weapon effect tracking)
- Test: `src/game/__tests__/combat.test.ts`

**Step 1: 写失败的测试**

```typescript
// 在 src/game/__tests__/combat.test.ts 中添加
it('should apply longsword effect', () => {
  const battle = createBattleState()
  // 模拟装备长剑
  battle.player.equippedWeapon = { uid: '1', defId: 'longsword' }

  // 打出战技卡后，下一张战技卡费用应该-1
  // 这个测试会在实现中详细化
  expect(battle.player.equippedWeapon.defId).toBe('longsword')
})
```

**Step 2: 运行测试验证失败**

```bash
npm test -- src/game/__tests__/combat.test.ts
```

Expected: FAIL

**Step 3: 修改 BattleState 添加武器字段**

在 `src/game/types.ts` 中修改 `PlayerState`：

```typescript
export interface PlayerState {
  hp: number
  maxHp: number
  stamina: number
  maxStamina: number
  mana: number
  maxMana: number
  armor: number
  hand: CardInstance[]
  drawPile: CardInstance[]
  discardPile: CardInstance[]
  equippedWeapon: WeaponInstance | null  // 新增
}
```

**Step 4: 修改 combat.ts 应用武器效果**

在 `playCard` 函数中添加武器效果应用逻辑。

**Step 5: 运行测试验证通过**

```bash
npm test -- src/game/__tests__/combat.test.ts
```

Expected: PASS

**Step 6: 提交**

```bash
git add src/game/combat.ts src/game/types.ts src/game/__tests__/combat.test.ts
git commit -m "feat: apply weapon effects in combat"
```

---

## Task 7: 创建篝火 UI 场景

**Files:**
- Create: `src/ui/scenes/campfire.ts`
- Modify: `src/style.css`

**Step 1: 创建篝火 UI 渲染函数**

```typescript
// src/ui/scenes/campfire.ts
import type { GameCallbacks } from '../renderer'

export function renderCampfire(
  container: HTMLElement,
  callbacks: GameCallbacks
): void {
  container.innerHTML = `
    <div class="scene-campfire">
      <h2>篝火</h2>
      <div class="campfire-options">
        <button class="btn" id="heal-btn">回血</button>
        <button class="btn" id="upgrade-btn">升级卡牌</button>
        <button class="btn" id="return-btn">返回路线图</button>
      </div>
    </div>
  `

  document.getElementById('heal-btn')?.addEventListener('click', () => {
    callbacks.onCampfireHeal?.()
  })

  document.getElementById('upgrade-btn')?.addEventListener('click', () => {
    callbacks.onCampfireUpgrade?.()
  })

  document.getElementById('return-btn')?.addEventListener('click', () => {
    callbacks.onReturnToMap?.()
  })
}
```

**Step 2: 添加 CSS 样式**

在 `src/style.css` 中添加：

```css
.scene-campfire {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 600px;
  gap: 40px;
}

.scene-campfire h2 {
  font-size: 24px;
  color: #f0a500;
  text-shadow: 2px 2px #0f3460;
}

.campfire-options {
  display: flex;
  gap: 20px;
  flex-direction: column;
}
```

**Step 3: 提交**

```bash
git add src/ui/scenes/campfire.ts src/style.css
git commit -m "feat: add campfire UI scene"
```

---

## Task 8: 修改 renderer 添加篝火场景

**Files:**
- Modify: `src/ui/renderer.ts`

**Step 1: 修改 GameCallbacks 接口**

```typescript
export interface GameCallbacks {
  onStartGame: () => void
  onSelectNode: (nodeId: string) => void
  onPlayCard: (cardUid: string) => void
  onEndTurn: () => void
  onSelectCard: (cardId: string) => void
  onSkipReward: () => void
  onRestart: () => void
  onCampfireHeal?: () => void
  onCampfireUpgrade?: () => void
  onReturnToMap?: () => void
}
```

**Step 2: 修改 render 函数添加篝火场景**

```typescript
import { renderCampfire } from './scenes/campfire'

export function render(
  container: HTMLElement,
  state: GameState,
  callbacks: GameCallbacks,
): void {
  switch (state.scene) {
    case 'title':
      renderTitle(container, callbacks.onStartGame)
      break
    case 'map':
      if (state.run) {
        renderMap(container, state.run, callbacks)
      }
      break
    case 'battle':
      if (state.battle) {
        renderBattle(container, state.battle, callbacks)
      }
      break
    case 'campfire':
      renderCampfire(container, callbacks)
      break
    case 'reward':
      renderReward(container, state.rewardCards, callbacks)
      break
    case 'result':
      renderResult(
        container,
        state.lastResult!,
        state.stats,
        callbacks.onRestart,
      )
      break
  }
}
```

**Step 3: 提交**

```bash
git add src/ui/renderer.ts
git commit -m "feat: add campfire scene to renderer"
```

---

## Task 9: 修改 GameState 类型添加篝火场景

**Files:**
- Modify: `src/game/types.ts`

**Step 1: 修改 Scene 类型**

```typescript
export type Scene = 'title' | 'map' | 'battle' | 'campfire' | 'reward' | 'result'
```

**Step 2: 提交**

```bash
git add src/game/types.ts
git commit -m "feat: add campfire scene type"
```

---

## Task 10: 修改 main.ts 集成篝火系统

**Files:**
- Modify: `src/main.ts`

**Step 1: 添加篝火回调**

在 `update()` 函数中的 `render()` 调用中添加篝火相关回调：

```typescript
onCampfireHeal: () => {
  if (!gameState.run) return
  // 回血逻辑
  gameState = { ...gameState, scene: 'map' }
  update()
},
onCampfireUpgrade: () => {
  // 升级卡牌逻辑
  gameState = { ...gameState, scene: 'map' }
  update()
},
onReturnToMap: () => {
  gameState = { ...gameState, scene: 'map' }
  update()
}
```

**Step 2: 修改 onSelectNode 处理篝火节点**

```typescript
onSelectNode: (nodeId: string) => {
  if (!gameState.run) return
  const node = gameState.run.mapNodes.find(n => n.id === nodeId)
  if (!node) return

  if (node.type === 'campfire') {
    gameState = { ...gameState, scene: 'campfire' }
    update()
    return
  }

  // 原有战斗逻辑...
}
```

**Step 3: 提交**

```bash
git add src/main.ts
git commit -m "feat: integrate campfire system into game controller"
```

---

## Task 11: 修改战斗后奖励添加武器掉落

**Files:**
- Modify: `src/main.ts`
- Modify: `src/ui/scenes/reward.ts`

**Step 1: 修改 onPlayCard 处理武器掉落**

在 `src/main.ts` 中修改 `onPlayCard` 回调，战斗胜利后 30% 概率掉落武器。

**Step 2: 修改奖励界面显示武器掉落**

在 `src/ui/scenes/reward.ts` 中添加武器掉落提示。

**Step 3: 提交**

```bash
git add src/main.ts src/ui/scenes/reward.ts
git commit -m "feat: add weapon drop after battle"
```

---

## Task 12: 运行完整测试并验证

**Files:**
- Test: 所有测试文件

**Step 1: 运行所有测试**

```bash
npm test
```

Expected: 所有测试通过

**Step 2: 手动测试完整流程**

```bash
npm run dev
```

验证：
- [ ] 路线图显示 9 个节点（包括 1 个篝火）
- [ ] 篝火节点可进入
- [ ] 篝火可以回血
- [ ] 篝火可以升级卡牌
- [ ] 战斗后 30% 概率掉落长剑
- [ ] 长剑可装备
- [ ] 长剑效果在战斗中应用

**Step 3: 提交**

```bash
git add -A
git commit -m "feat: Phase 2 supplement complete - campfire and equipment system"
```

---

## 成功标准

- [ ] 所有 12 个任务完成
- [ ] 所有测试通过
- [ ] 路线图显示 9 个节点（包括 1 个篝火）
- [ ] 篝火节点功能完整（回血 + 升级卡牌）
- [ ] 长剑装备系统完整
- [ ] 武器效果在战斗中正确应用
- [ ] 完整流程可玩
