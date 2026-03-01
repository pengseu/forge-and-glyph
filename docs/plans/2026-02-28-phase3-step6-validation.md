# Phase 3 Step 6 Validation Report

## Scope
- 对应 `TODO_PHASE3.md` 的步骤6验证标准 + Phase3 总验证清单。
- 使用自动化测试、构建验证与逻辑烟测作为证据。

## Evidence Commands
- `npm test` -> 185 tests passed
- `npm run build` -> TypeScript + Vite build passed
- 重点烟测：
  - `npm test -- src/game/__tests__/run.test.ts src/game/__tests__/events.test.ts src/game/__tests__/map.test.ts`

## Step6 验证标准
- [x] 卡池40张，新卡在奖励和商店出现
  - 证据：`cards.test.ts`，奖励/商店回归测试
- [x] 新卡效果和升级正确
  - 证据：`effects.test.ts` + `combat.test.ts` + `campfire.test.ts`
- [ ] 武器配合卡和附魔联动正常
  - 现状：已有既有联动测试与部分新卡联动测试；建议补一组“新卡+附魔+武器”组合测试后再勾选
- [x] 状态combo正确结算
  - 证据：`checklist.test.ts` + `effects.test.ts` + `combat.test.ts`
- [x] 7层地图可走通，路线分叉正确
  - 证据：`map.test.ts` + `run.test.ts` act1 smoke
- [x] 所有节点类型正常运作
  - 证据：map/event/shop/forge/enchant/campfire 路径测试与场景接入
- [x] 未知事件随机触发且结果正确
  - 证据：`events.test.ts`
- [ ] 完整通关流程约15-25分钟
  - 需手测：自动化无法验证真实时长与操作节奏

## Phase 3 总验证

### 核心循环
- [x] 每回合有选择压力（资源/状态/减费机制在测试中覆盖）
- [x] 敌人意图影响出牌策略（冻结/虚弱/护甲/精英意图路径覆盖）
- [x] 精英战危险但奖励好（精英奖励与+5最大生命机制已测）
- [ ] Boss战紧张需要策略（主观体验，需手测）

### 构筑深度
- [x] 选卡时在不同build方向间纠结（卡池与稀有度分层已实现）
- [x] 至少发现1个combo（附魔共鸣与状态combo测试已覆盖）
- [x] 武器/附魔/共鸣选择有意义（机制与测试已覆盖）

### 经济系统
- [x] 战后二选一需要纠结（奖励卡牌/材料二选一逻辑已接入）
- [x] 金币够买1-2样但不能全买（商店价格区间与购买限制已测）
- [x] 材料够造1把武器但不够全部（材料上限/配方扣费已测）

### 路线策略
- [x] 地图路线选择需要纠结（7层多分支）
- [x] HP管理影响路线决策（事件/商店/战斗损耗写回）
- [x] 篝火回血vs升级需要选择（campfire行为已接入）

### 情感体验
- [ ] 有成长感、紧张感、兴奋感（需手测）
- [ ] 每局run感觉独特（需手测）

## Conclusion
- 自动化层面已达到“可联调、可构建、可通路”标准。
- 剩余未勾选项集中在手感/时长/体验主观维度，建议执行一次完整人工试玩验收后最终收口。
