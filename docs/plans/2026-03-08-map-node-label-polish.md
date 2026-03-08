# Map Node Label Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 优化地图节点的文字展示，避免所有节点常驻汉字标签导致画面廉价和拥挤，仅让当前节点与可选节点保留更轻量的小纸签。

**Architecture:** 在 `map.ts` 中为节点标签增加状态类，让标签显示逻辑由节点状态驱动；在 `batch2-core.css` 中将标签默认收起，仅对 `current` 与 `available` 节点显示轻量纸签，同时保留 hover/focus 交互强化。通过 `map-unit` 测试覆盖状态类生成，确保行为不会回退。

**Tech Stack:** TypeScript、Vitest、Vite、现有地图场景样式系统

---

### Task 1: 为节点标签补状态测试

**Files:**
- Modify: `src/ui/scenes/__tests__/map-unit.test.ts`
- Modify: `src/ui/scenes/map.ts`

**Step 1: Write the failing test**

- 为地图节点标签增加一个可测试 helper，例如根据 `MapNodeStatus` 返回标签 class
- 在 `map-unit.test.ts` 新增断言：
  - `current` -> 可见类
  - `available` -> 可见类
  - `completed` -> 隐藏类
  - `locked` -> 隐藏类

**Step 2: Run test to verify it fails**

Run: `npm test -- src/ui/scenes/__tests__/map-unit.test.ts`
Expected: FAIL，提示新 helper 不存在或输出不符

### Task 2: 实现节点标签状态类

**Files:**
- Modify: `src/ui/scenes/map.ts`

**Step 3: Write minimal implementation**

- 新增 `buildMapNodeLabelClass(status: MapNodeStatus): string`
- 在节点 HTML 中将标签改为：
  - `map-node-label map-node-label--visible` 用于 `current / available`
  - `map-node-label map-node-label--hidden` 用于 `completed / locked`

**Step 4: Run test to verify it passes**

Run: `npm test -- src/ui/scenes/__tests__/map-unit.test.ts`
Expected: PASS

### Task 3: 调整地图节点标签样式

**Files:**
- Modify: `src/ui/styles/batch2-core.css`

**Step 5: Write minimal implementation**

- 默认标签缩小为轻量纸签风格
- `--hidden`：透明、不可见、不占视觉重心
- `--visible`：显示为轻量纸签
- hover / focus 时保持现有轻微抬升反馈
- 不改动节点 hit area 与当前/已完成印章逻辑

**Step 6: Verify style behavior**

Run: `npm test -- src/ui/scenes/__tests__/map-unit.test.ts`
Expected: PASS

### Task 4: 全量验证

**Files:**
- Verify only

**Step 7: Run focused validation**

Run: `npm test -- src/ui/scenes/__tests__/map-unit.test.ts src/ui/scenes/__tests__/style-lab-unit.test.ts src/ui/__tests__/renderer-unit.test.ts && npm run build`
Expected: PASS
