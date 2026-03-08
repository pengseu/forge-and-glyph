# Enemy Hover Panel Design

**Goal:** 用一个 hover 右侧信息面板替换当前敌人小 tooltip，在不增加默认态拥挤度的前提下，完整展示敌人关键战斗信息。

**Scope:** 仅调整战斗页敌人信息层；不改卡牌系统、敌人数值逻辑与战斗结算逻辑。

## 设计结论

采用“默认态轻量 + hover 态完整面板”的双态设计：

- 默认态保留：顶部意图、血条、怪名、状态纸片栏
- hover 态替换当前小 tooltip，为立绘右侧更高的纸片信息卡
- 不保留旧 tooltip，避免重复信息与两套 hover 面板冲突

## Hover 面板内容

从上到下：

1. 怪名
2. 当前血量 / 最大血量
3. 当前意图：图标 + 详细说明
4. 当前状态列表：icon + 名称 + 层数
5. 被动/特性说明（若有）

## 资源策略

- 状态图标继续使用 `public/assets/icon/*.webp`
- 敌人意图图标在现有素材不足的前提下，先使用同目录内最接近语义的纸片图标：
  - 攻击 → `力量`
  - 防御 → `护甲`
  - 减益/控制 → `诅咒`
- 这是基于现有素材的临时映射；后续若补充专用攻击图标，可无缝替换 helper 映射

## 结构方案

- 保留 `.enemy-tooltip` 类名，避免大面积改事件逻辑
- 但将内容结构升级为：
  - `.enemy-detail-panel`
  - `.enemy-detail-title`
  - `.enemy-detail-hp`
  - `.enemy-detail-intent`
  - `.enemy-detail-status-list`
  - `.enemy-detail-passive`
- 状态底部共享纸片栏继续保留，hover 面板显示“带名称”的详细列表

## 风险控制

- 不动默认态主布局，避免再次引发战场层级与遮挡问题
- hover 面板只在 `.enemy-unit:hover` / `:focus-visible` 时显示
- 面板宽度限制在约 `180-210px`，保证 1~4 敌人场景都可接受
