# Phase 2 补充设计 — 篝火 + 装备系统

> **目标：** 完成 Phase 2 的遗漏功能，实现篝火节点和基础装备系统（长剑）

---

## 核心设计决策

### 架构方案：最小化扩展

复用现有的 RunState 和 MapNode，添加装备相关字段。状态流转保持不变：

```
标题 → 路线图 → 战斗 → 选卡 → 路线图 → 篝火 → 路线图 → ... → Boss战斗 → 结算
```

---

## 篝火系统

### 路线图结构修改

- 原有 8 个节点中，第 4 个节点改为篝火节点
- 路线图变为：5 个战斗 + 1 个篝火 + 2 个精英 + 1 个 Boss = 9 个节点
- 篝火节点固定位置，不随机生成

### 篝火功能

1. **回血** - 恢复到满血（30 HP）
2. **升级卡牌** - 选择 1 张卡牌升级：
   - 选项 A：伤害 +2（如果卡牌有伤害效果）
   - 选项 B：费用 -1（如果费用 ≥ 1）
   - 每张卡牌最多升级 1 次

### UI

- 篝火节点显示为 🔥 图标
- 点击进入篝火界面
- 显示"回血"和"升级卡牌"两个选项
- 返回路线图按钮

---

## 装备系统（长剑）

### 长剑特性

**基础长剑：** 战技卡打出后，下一张战技卡费用 -1

**精钢长剑：** 战技卡打出后，下一张战技卡费用 -2

### 获取方式

- 战斗胜利后 30% 概率掉落"长剑"
- 玩家可选择装备或不装备
- 同时只能装备 1 把武器

### 升级

- 篝火可以将"长剑"升级为"精钢长剑"
- 升级后特性增强（费用减少从 -1 变为 -2）

### 战斗中应用

- 玩家装备武器后，武器效果在战斗中自动生效
- 武器在战斗间持久化（不会丢失）
- 战斗 UI 显示当前装备的武器名称和效果

---

## 数据结构修改

### RunState 扩展

```typescript
interface RunState {
  currentNodeId: string
  visitedNodes: Set<string>
  deck: CardInstance[]
  mapNodes: MapNode[]
  turn: number

  // 新增
  equippedWeapon: WeaponInstance | null
  weaponInventory: WeaponInstance[]
}
```

### 新增类型

```typescript
interface WeaponDef {
  id: string
  name: string
  rarity: 'basic' | 'upgraded'
  effect: string
}

interface WeaponInstance {
  uid: string
  defId: string  // 'longsword' 或 'longsword_upgraded'
}
```

### MapNode 修改

```typescript
interface MapNode {
  id: string
  type: NodeType | 'campfire'
  enemyId?: string
  completed: boolean
  x: number
  y: number
  connections: string[]
}
```

---

## 游戏流程修改

### 新增场景：campfire

- 显示当前 HP 和最大 HP
- 显示"回血"按钮
- 显示"升级卡牌"按钮
- 返回路线图按钮

### 路线图修改

- 篝火节点显示为 🔥 图标
- 点击篝火节点进入篝火界面

### 战斗 UI 修改

- 显示当前装备的武器名称和效果
- 战斗中应用武器效果

### 战斗后奖励修改

- 战斗胜利后显示选卡界面
- 同时显示武器掉落提示（如果掉落）
- 玩家可选择装备或不装备

---

## 成功标准

- [ ] 路线图显示 9 个节点（包括 1 个篝火）
- [ ] 篝火节点可进入，显示回血和升级卡牌选项
- [ ] 卡牌升级正确应用（伤害 +2 或费用 -1）
- [ ] 战斗后 30% 概率掉落长剑
- [ ] 长剑可装备，战斗中应用效果（战技费用 -1）
- [ ] 篝火可升级长剑为精钢长剑（费用 -2）
- [ ] 武器在战斗间持久化
- [ ] 所有测试通过
- [ ] 完整流程可玩

---

## 技术栈

- 继续使用 Vite + TypeScript + Vitest
- 纯 DOM 渲染，无框架
- 像素复古风 UI
