# 地图页素材清单

> 用途：用于地图页视觉升级（地图板、节点、状态环、信息面板、装饰）
> 
> 约定：
> - 地图页专用素材统一放在 `public/assets/ui/map/`
> - 文件先生成 `png` 即可，后续可通过 `npm run assets:webp` 自动生成同名 `webp`
> - 所有素材默认透明背景，除地图底板/信息板这类整张底图外

## 一、目录约定

### 主目录
- `public/assets/ui/map/`

### 子分类建议
- 地图底板：`public/assets/ui/map/`
- 节点徽章：`public/assets/ui/map/nodes/`
- 状态外环：`public/assets/ui/map/rings/`
- 装饰贴片：`public/assets/ui/map/decor/`

---

## 二、核心底板素材

| 文件名 | 建议尺寸 | 推荐存放位置 | 用途说明 |
|---|---:|---|---|
| `map-board-forest.png` | `1600×1100` | `public/assets/ui/map/map-board-forest.png` | 地图主承载板，作为路线图绘制底图 |
| `map-side-panel-forest.png` | `720×960` | `public/assets/ui/map/map-side-panel-forest.png` | 右侧节点信息卡底板 |

---

## 三、节点素材

| 文件名 | 建议尺寸 | 推荐存放位置 | 用途说明 |
|---|---:|---|---|
| `map-node-battle.png` | `128×128` | `public/assets/ui/map/nodes/map-node-battle.png` | 普通战斗节点底徽章 |
| `map-node-elite.png` | `128×128` | `public/assets/ui/map/nodes/map-node-elite.png` | 精英节点底徽章 |
| `map-node-forge.png` | `128×128` | `public/assets/ui/map/nodes/map-node-forge.png` | 工坊节点底徽章 |
| `map-node-shop.png` | `128×128` | `public/assets/ui/map/nodes/map-node-shop.png` | 商店节点底徽章 |
| `map-node-event.png` | `128×128` | `public/assets/ui/map/nodes/map-node-event.png` | 事件节点底徽章 |
| `map-node-boss.png` | `160×160` | `public/assets/ui/map/nodes/map-node-boss.png` | Boss 节点底徽章 |

---

## 四、节点状态素材

| 文件名 | 建议尺寸 | 推荐存放位置 | 用途说明 |
|---|---:|---|---|
| `map-node-ring-active.png` | `160×160` | `public/assets/ui/map/rings/map-node-ring-active.png` | 当前可选节点高亮外环 |
| `map-node-ring-completed.png` | `160×160` | `public/assets/ui/map/rings/map-node-ring-completed.png` | 已完成节点外环 |
| `map-path-glow.png` | `512×64` | `public/assets/ui/map/rings/map-path-glow.png` | 可选路径发光刷层，可选素材 |

---

## 五、地图装饰素材

| 文件名 | 建议尺寸 | 推荐存放位置 | 用途说明 |
|---|---:|---|---|
| `map-corner-leaves-forest.png` | `512×512` | `public/assets/ui/map/decor/map-corner-leaves-forest.png` | 地图板角落森林装饰 |
| `map-pin-paper-tape.png` | `256×128` | `public/assets/ui/map/decor/map-pin-paper-tape.png` | 地图板固定胶带/贴纸装饰 |

---

## 六、优先生成顺序

### 第一批（够开始做地图页）
- `public/assets/ui/map/map-board-forest.png`
- `public/assets/ui/map/map-side-panel-forest.png`
- `public/assets/ui/map/nodes/map-node-battle.png`
- `public/assets/ui/map/nodes/map-node-event.png`
- `public/assets/ui/map/rings/map-node-ring-active.png`

### 第二批（补齐节点类型）
- `public/assets/ui/map/nodes/map-node-elite.png`
- `public/assets/ui/map/nodes/map-node-forge.png`
- `public/assets/ui/map/nodes/map-node-shop.png`
- `public/assets/ui/map/nodes/map-node-boss.png`

### 第三批（装饰和细节）
- `public/assets/ui/map/rings/map-node-ring-completed.png`
- `public/assets/ui/map/rings/map-path-glow.png`
- `public/assets/ui/map/decor/map-corner-leaves-forest.png`
- `public/assets/ui/map/decor/map-pin-paper-tape.png`

---

## 七、使用建议

- 节点底图尽量只做“底徽章”，不要把文字或 emoji 烤死在图里。
- 真正的节点图标（如 `⚔ / 💀 / ⚒ / 🏪`）建议由前端叠加，这样后续换主题更灵活。
- 地图底板和信息面板要留足中间留白，避免后续节点和说明文字显得拥挤。
- 所有素材生成后，先放 `png` 到上面对应目录，再执行：
  - `npm run assets:webp`

---

## 八、后续可扩展目录

如果后面做 Act2 / Act3 的主题差异，建议继续沿用同样结构：

- `public/assets/ui/map/forest/`
- `public/assets/ui/map/swamp/`
- `public/assets/ui/map/abyss/`

当前阶段先不拆主题子目录，统一放在：
- `public/assets/ui/map/`
