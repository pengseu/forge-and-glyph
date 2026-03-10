import type { MapNode, RunState } from '../../game/types'
import type { GameCallbacks } from '../renderer'
import { canAccessNode } from '../../game/run'
import { getNodeById } from '../../game/map'
import { describeWeaponEffect, getWeaponDef } from '../../game/weapons'
import { toWebpAsset } from '../../assets'

type NodeVisual = {
  kind: 'battle' | 'elite' | 'boss' | 'campfire' | 'shop' | 'event' | 'forge' | 'enchant' | 'treasure' | 'temple' | 'trial'
  label: string
}

type MapNodeStatus = 'completed' | 'current' | 'available' | 'locked'

const MAP_NODE_HIT_WIDTH = 104
const MAP_NODE_HIT_HEIGHT = 112

export function buildMapNodeHitAreaStyle(): string {
  return `--map-node-hit-width:${MAP_NODE_HIT_WIDTH}px;--map-node-hit-height:${MAP_NODE_HIT_HEIGHT}px;`
}

export function canMapNodeBeSelected(status: MapNodeStatus): boolean {
  return status === 'available' || status === 'current'
}

export function buildMapNodeLabelClass(status: MapNodeStatus): string {
  return status === 'available' || status === 'current'
    ? 'map-node-label map-node-label--visible'
    : 'map-node-label map-node-label--hidden'
}

export function shouldActivateMapNodeKey(key: string): boolean {
  return key === 'Enter' || key === ' '
}

export type MapNodeInfoSummary = {
  title: string
  subtitle: string
  detail: string
  rewardHint: string
  stateHint: string
}

export function resolveNodeVisual(type: RunState['mapNodes'][number]['type']): NodeVisual {
  if (type === 'boss_battle') return { kind: 'boss', label: 'Boss' }
  if (type === 'elite_battle') return { kind: 'elite', label: '精英' }
  if (type === 'trial') return { kind: 'trial', label: '试炼' }
  if (type === 'temple') return { kind: 'temple', label: '圣殿' }
  if (type === 'treasure') return { kind: 'treasure', label: '宝库' }
  if (type === 'campfire') return { kind: 'campfire', label: '篝火' }
  if (type === 'shop') return { kind: 'shop', label: '商店' }
  if (type === 'forge') return { kind: 'forge', label: '铁匠' }
  if (type === 'enchant') return { kind: 'enchant', label: '附魔' }
  if (type === 'event') return { kind: 'event', label: '事件' }
  return { kind: 'battle', label: '战斗' }
}

const MAP_TOP_BAR_WEAPON_ICONS = new Set(['iron_longsword', 'iron_staff'])

function escapeHtmlAttr(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function resolveWeaponFallbackGlyph(weaponDefId: string): string {
  if (weaponDefId.includes('staff')) return '杖'
  if (weaponDefId.includes('dagger')) return '匕'
  if (weaponDefId.includes('hammer')) return '锤'
  if (weaponDefId.includes('bow')) return '弓'
  return '刃'
}

export function buildMapTopStatHtml(label: string, value: string | number, title: string): string {
  return `<span class="stat map-top-stat" title="${escapeHtmlAttr(title)}"><span class="map-top-stat-label">${label}</span><span class="map-top-stat-value">${value}</span></span>`
}

export function resolveMapWeaponIconSrc(weaponDefId: string): string | null {
  if (!MAP_TOP_BAR_WEAPON_ICONS.has(weaponDefId)) return null
  return toWebpAsset(`/assets/weapons/${weaponDefId}.png`)
}

export function buildMapWeaponStatTitle(weaponDefId: string): string {
  const weaponDef = getWeaponDef(weaponDefId)
  return `已装备武器：${weaponDef.name}｜${describeWeaponEffect(weaponDef.effect)}`
}

export function buildMapWeaponStatHtml(weaponDefId?: string | null): string {
  if (!weaponDefId) return ''
  const weaponDef = getWeaponDef(weaponDefId)
  const title = buildMapWeaponStatTitle(weaponDefId)
  const iconSrc = resolveMapWeaponIconSrc(weaponDefId)
  const iconHtml = iconSrc
    ? `<span class="map-weapon-stat-icon"><img class="img-contain" src="${iconSrc}" alt="" loading="lazy" /></span>`
    : `<span class="map-weapon-stat-icon map-weapon-stat-icon--fallback" aria-hidden="true">${resolveWeaponFallbackGlyph(weaponDefId)}</span>`
  return `<span class="stat map-top-stat map-top-stat--weapon" title="${escapeHtmlAttr(title)}">${iconHtml}<span class="map-top-stat-value">${weaponDef.name}</span></span>`
}

export function resolveMapNodeBadgeSrc(kind: NodeVisual['kind']): string {
  const assetKind = kind === 'campfire'
    ? 'event'
    : kind === 'enchant'
      ? 'event'
      : kind === 'treasure'
        ? 'elite'
        : kind === 'temple'
          ? 'shop'
          : kind === 'trial'
            ? 'elite'
            : kind
  return toWebpAsset(`/assets/ui/map/map-node-${assetKind}.png`)
}

export function buildMapNodeInfoSummary(node: MapNode, act: 1 | 2 | 3): MapNodeInfoSummary {
  const layer = node.y + 1
  switch (node.type) {
    case 'boss_battle':
      return {
        title: `Boss 节点`,
        subtitle: `Act ${act} · 第 ${layer} 层 · 幕终战`,
        detail: '幕终战节点，建议在进入前确认血量、武器、牌组节奏与关键资源是否就绪。',
        rewardHint: 'Boss 奖励：高价值战利品、关键材料与幕间推进。',
        stateHint: '选择后将直接进入本幕终点战斗。',
      }
    case 'forge':
      return {
        title: `铁匠节点`,
        subtitle: `第 ${layer} 层 · 工坊锻造`,
        detail: '在这里进行武器锻造、路线转型与资源投入，是中期构筑修正的重要节点。',
        rewardHint: '主要收益：锻造、升级路线、消耗材料换强度。',
        stateHint: '选择后进入工坊，可根据材料决定是否投入锻造。',
      }
    case 'shop':
      return {
        title: `商店节点`,
        subtitle: `第 ${layer} 层 · 补给与交易`,
        detail: '商店用于购买卡牌、材料与战前补给，适合补短板或提前准备 Boss 战。',
        rewardHint: '主要收益：消费金币换取卡牌、材料与即时补强。',
        stateHint: '选择后进入商店，可先观察价格再决定购买。',
      }
    case 'event':
      return {
        title: `事件节点`,
        subtitle: `第 ${layer} 层 · 随机事件`,
        detail: '事件节点通常提供风险与收益并存的分支选择，适合寻找构筑突破口。',
        rewardHint: '可能收益：金币、材料、卡牌变化或特殊状态。',
        stateHint: '选择后将进入事件分支，请根据当前构筑谨慎取舍。',
      }
    case 'elite_battle':
      return {
        title: `精英战斗`,
        subtitle: `第 ${layer} 层 · 高风险战斗`,
        detail: '精英战斗强度更高，但通常会提供比普通战斗更优质的战利品。',
        rewardHint: '主要收益：更多金币、更好奖励与更稀有的资源。',
        stateHint: '选择前请确认血量与爆发手段是否充足。',
      }
    case 'trial':
      return {
        title: `试炼节点`,
        subtitle: `第 ${layer} 层 · 特殊战斗修正`,
        detail: '试炼会带来额外规则变化，要求你用更清晰的构筑逻辑去处理战斗。',
        rewardHint: '主要收益：更高价值奖励与路线判定优势。',
        stateHint: '选择前建议先确认本套牌能否适应特殊规则。',
      }
    case 'temple':
      return {
        title: `圣殿节点`,
        subtitle: `第 ${layer} 层 · 高价值抉择`,
        detail: act === 3
          ? '圣殿提供重要而不可逆的选择，通常会显著影响本局后续强度曲线。深处的石门上刻着你看不懂的文字，但你能感觉到，它在等待什么。'
          : '圣殿提供重要而不可逆的选择，通常会显著影响本局后续强度曲线。',
        rewardHint: '主要收益：高价值强化或关键分支奖励。',
        stateHint: '进入后请仔细阅读选项说明，再做最终决定。',
      }
    case 'treasure':
      return {
        title: `宝库节点`,
        subtitle: `第 ${layer} 层 · 隐藏收益`,
        detail: act === 2
          ? '宝库是高价值探索节点，通常意味着额外收益或路径奖励。角落里有一扇半掩的门，门缝里传来低沉的回声。'
          : act === 3
            ? '宝库是高价值探索节点，通常意味着额外收益或路径奖励。墙壁上的裂缝里透出微弱的光，像是在呼唤着什么。'
            : '宝库是高价值探索节点，通常意味着额外收益或路径奖励。',
        rewardHint: '主要收益：金币、材料或稀有掉落。',
        stateHint: '若当前能进入，通常值得优先查看。',
      }
    case 'campfire':
      return {
        title: `篝火节点`,
        subtitle: `第 ${layer} 层 · 恢复与整备`,
        detail: '篝火用于恢复与升级，是节奏修复和强度巩固的重要节点。',
        rewardHint: '主要收益：回血、升级与节奏稳定。',
        stateHint: '选择后可进行整备，再继续推进路线。',
      }
    case 'enchant':
      return {
        title: `附魔节点`,
        subtitle: `第 ${layer} 层 · 武器强化`,
        detail: '附魔节点提供武器方向强化，适合围绕当前核心武器构筑战斗节奏。',
        rewardHint: '主要收益：附魔、共鸣强化与武器质变。',
        stateHint: '选择前可先确认手上是否有适合强化的武器。',
      }
    default:
      return {
        title: `普通战斗`,
        subtitle: `第 ${layer} 层 · 基础推进战斗`,
        detail: '普通战斗是主要推进节点，用于稳定获取金币、卡牌与基础材料。',
        rewardHint: '主要收益：金币、卡牌奖励与常规材料。',
        stateHint: '选择后进入战斗，赢下即可继续向上推进。',
      }
  }
}

export type ContainRect = {
  width: number
  height: number
  left: number
  top: number
}

export type MapBoardRect = ContainRect

export function computeMapBoardRect(
  canvasWidth: number,
  canvasHeight: number,
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
): MapBoardRect {
  const insetX = 22
  const insetY = 16
  const assetWidth = 1600
  const assetHeight = 1100
  const usableWidth = Math.max(0, canvasWidth - insetX * 2)
  const desiredWidth = bounds.maxX - bounds.minX + 180
  const desiredHeight = bounds.maxY - bounds.minY + 146
  const scale = Math.max(desiredWidth / assetWidth, desiredHeight / assetHeight)
  const width = Math.min(usableWidth, roundRectValue(assetWidth * scale))
  const height = roundRectValue((width / assetWidth) * assetHeight)
  const centerX = (bounds.minX + bounds.maxX) / 2
  const left = roundRectValue(Math.max(insetX, Math.min(centerX - width / 2, canvasWidth - insetX - width)))
  const top = roundRectValue(Math.max(insetY, Math.min(bounds.minY - 46, canvasHeight - insetY - height)))
  return { width, height, left, top }
}

function roundRectValue(value: number): number {
  return Math.round(value * 100) / 100
}

export function fitRectContain(boxWidth: number, boxHeight: number, assetWidth: number, assetHeight: number): ContainRect {
  if (boxWidth <= 0 || boxHeight <= 0 || assetWidth <= 0 || assetHeight <= 0) {
    return { width: 0, height: 0, left: 0, top: 0 }
  }
  const scale = Math.min(boxWidth / assetWidth, boxHeight / assetHeight)
  const width = roundRectValue(assetWidth * scale)
  const height = roundRectValue(assetHeight * scale)
  return {
    width,
    height,
    left: roundRectValue((boxWidth - width) / 2),
    top: roundRectValue((boxHeight - height) / 2),
  }
}

export function buildMapStageShellRect(): { width: number; height: number } {
  return { width: 800, height: 550 }
}

export function buildMapViewportRect(): { width: number; height: number; left: number; top: number } {
  const shell = buildMapStageShellRect()
  const width = 582
  const height = 345
  return {
    width,
    height,
    left: Math.round((shell.width - width) / 2),
    top: Math.round((shell.height - height) / 2),
  }
}

export function buildMapSideShellRect(): { width: number; height: number } {
  return { width: 300, height: 572 }
}

export function buildMapSideContentStyle(): string {
  return 'padding:100px 40px 24px;'
}

export function buildMapSideArtStyle(): string {
  return 'left:0px;top:0px;width:300px;height:572px;'
}

export function buildMapSideMetaVisibility(): { legend: boolean; footer: boolean } {
  return { legend: false, footer: false }
}

export function buildMapCompletedStampHtml(completed: boolean): string {
  return completed
    ? '<div class="map-node-stamp map-node-stamp--completed" aria-hidden="true">已达成</div>'
    : ''
}

export function buildMapRewardHintHtml(rewardHint: string): string {
  const matched = rewardHint.match(/^([^：:]+[：:])(.*)$/)
  if (!matched) return rewardHint
  const [, prefix, body] = matched
  return `<span class="map-side-block-prefix">${prefix}</span><span class="map-side-block-emphasis">${body.trim()}</span>`
}

export function buildMapCurrentNodeAccentHtml(isCurrent: boolean, isCompleted = false): string {
  return isCurrent && !isCompleted
    ? '<div class="map-node-current-accent" aria-hidden="true">当前</div>'
    : ''
}

export function buildMapViewportOverlayStyle(): string {
  const viewport = buildMapViewportRect()
  return `left:0px;top:0px;width:${viewport.width}px;height:${viewport.height}px;`
}

export function fitMapNodeCenterX(nodeX: number, minNodeX: number, maxNodeX: number, viewportWidth: number): number {
  if (maxNodeX <= minNodeX) return Math.round(viewportWidth / 2)
  const sidePadding = 72
  const usableWidth = Math.max(0, viewportWidth - sidePadding * 2)
  const ratio = (nodeX - minNodeX) / (maxNodeX - minNodeX)
  return Math.round(sidePadding + usableWidth * ratio)
}

export function computeMapScrollTarget(
  nodeTop: number,
  nodeHeight: number,
  viewportHeight: number,
): { left: number; top: number } {
  return {
    left: 0,
    top: nodeTop - (viewportHeight / 2) + (nodeHeight / 2),
  }
}

export function buildMapCurvePath(x1: number, y1: number, x2: number, y2: number, curveIndex: number): string {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.max(1, Math.hypot(dx, dy))
  const nx = -dy / len
  const ny = dx / len
  const direction = curveIndex % 2 === 0 ? 1 : -1
  const magnitude = 20 + (Math.abs(curveIndex) % 3) * 10
  const cx = Math.round(mx + nx * magnitude * direction)
  const cy = Math.round(my + ny * magnitude * direction)
  return `M ${x1},${y1} Q ${cx},${cy} ${x2},${y2}`
}

function buildMapSidePanelHtml(node: MapNode, state: RunState): string {
  const summary = buildMapNodeInfoSummary(node, state.act)
  const nodeState = node.completed
    ? '已完成'
    : node.id === state.currentNodeId
      ? '当前位置'
      : canAccessNode(state, node.id)
        ? '当前可选'
        : '暂未到达'
  return `
    <div class="map-side-art" aria-hidden="true" style="${buildMapSideArtStyle()}"><img class="map-side-art-img img-contain" src="${toWebpAsset('/assets/ui/map/map-side-panel-forest.png')}" alt="" loading="lazy" /></div>
    <div class="map-side-content" style="${buildMapSideContentStyle()}">
      <div class="map-side-kicker">${nodeState}</div>
      <h3 class="map-side-title">${summary.title}</h3>
      <div class="map-side-subtitle">${summary.subtitle}</div>
      <div class="map-side-divider" aria-hidden="true"></div>
      <p class="map-side-detail">${summary.detail}</p>
      <div class="map-side-block">
        <div class="map-side-block-label">可能收益</div>
        <div class="map-side-block-text">${buildMapRewardHintHtml(summary.rewardHint)}</div>
      </div>
      <div class="map-side-block">
        <div class="map-side-block-label">操作提示</div>
        <div class="map-side-block-text">${summary.stateHint}</div>
      </div>
    </div>
  `
}

export function renderMap(
  container: HTMLElement,
  state: RunState,
  _saveSlots: Array<{ slot: 1 | 2 | 3; savedAt: number | null }>,
  callbacks: GameCallbacks,
): void {
  const NODE_SIZE = 76
  const SPACING_Y = 142
  const PADDING_Y = 92
  const maxX = Math.max(...state.mapNodes.map((n) => n.x))
  const minX = Math.min(...state.mapNodes.map((n) => n.x))
  const maxY = Math.max(...state.mapNodes.map((n) => n.y))
  const hpPercent = Math.max(0, Math.min(100, (state.playerHp / state.playerMaxHp) * 100))

  function nodeCenterX(x: number): number {
    return fitMapNodeCenterX(x, minX, maxX, buildMapViewportRect().width)
  }

  function nodeCenterY(y: number): number {
    return Math.round(y * SPACING_Y + PADDING_Y)
  }

  const stageShellRect = buildMapStageShellRect()
  const viewportRect = buildMapViewportRect()
  const sideShellRect = buildMapSideShellRect()
  const canvasWidth = viewportRect.width
  const canvasHeight = Math.max(920, Math.ceil(maxY * SPACING_Y + PADDING_Y * 2 + NODE_SIZE))

  const linksHtml = state.mapNodes.flatMap((node, nodeIndex) =>
    node.connections.map((targetId, connectionIndex) => {
      const target = state.mapNodes.find((n) => n.id === targetId)
      if (!target) return ''
      const x1 = nodeCenterX(node.x)
      const y1 = nodeCenterY(node.y)
      const x2 = nodeCenterX(target.x)
      const y2 = nodeCenterY(target.y)
      const path = buildMapCurvePath(x1, y1, x2, y2, nodeIndex * 13 + connectionIndex)
      const fromAvailable = canAccessNode(state, node.id)
      const toAvailable = canAccessNode(state, targetId)
      const linkClass = node.completed && target.completed
        ? 'map-link--completed'
        : (fromAvailable || toAvailable)
            ? 'map-link--available'
            : 'map-link--locked'
      return `<path d="${path}" class="map-link ${linkClass}" />`
    }),
  ).join('')

  const nodesHtml = state.mapNodes.map((node) => {
    const isCurrent = node.id === state.currentNodeId
    const isCompleted = node.completed
    const isAvailable = canAccessNode(state, node.id)
    const visual = resolveNodeVisual(node.type)
    const statusClass: MapNodeStatus = isCompleted ? 'completed' : isCurrent ? 'current' : isAvailable ? 'available' : 'locked'
    const summary = buildMapNodeInfoSummary(node, state.act)

    const isSecretBossNode = node.type === 'boss_battle' && state.act === 3 && state.cycleTier > 0
    const secretClass = isSecretBossNode ? ' map-node--secret' : ''

    return `
      <div
        class="map-node map-node--${visual.kind} map-node--${statusClass}${secretClass}"
        data-node-id="${node.id}"
        data-title="${summary.title}"
        data-subtitle="${summary.subtitle}"
        data-detail="${summary.detail}"
        data-reward-hint="${summary.rewardHint}"
        data-state-hint="${summary.stateHint}"
        style="left:${nodeCenterX(node.x)}px;top:${nodeCenterY(node.y)}px;${buildMapNodeHitAreaStyle()}"
        tabindex="${canMapNodeBeSelected(statusClass) ? '0' : '-1'}"
        role="button"
        aria-label="${visual.label}节点"
        title="${visual.label}"
      >
        <div class="map-node-ring map-node-ring--active" aria-hidden="true"></div>
        <div class="map-node-ring map-node-ring--completed" aria-hidden="true"></div>
        <div class="map-node-badge">
          <img src="${resolveMapNodeBadgeSrc(visual.kind)}" alt="" loading="lazy" />
        </div>
        ${buildMapCompletedStampHtml(isCompleted)}
        ${buildMapCurrentNodeAccentHtml(isCurrent, isCompleted)}
        <div class="${buildMapNodeLabelClass(statusClass)}">${visual.label}</div>
      </div>
    `
  }).join('')

  const weaponStatHtml = buildMapWeaponStatHtml(state.equippedWeapon?.defId)
  const focusNode = getNodeById(state.mapNodes, state.currentNodeId)
    ?? state.mapNodes.find((node) => canAccessNode(state, node.id))
    ?? state.mapNodes[0]

  container.innerHTML = `
    <div class="scene-map scene-map-v3">
      <div class="map-player-bar">
        <div class="hp-bar map-hp-bar">
          <div class="hp-bar-fill" style="width:${hpPercent}%"></div>
          <div class="hp-bar-text">HP ${state.playerHp}/${state.playerMaxHp}</div>
        </div>
        ${buildMapTopStatHtml('幕', state.act, `当前章节：第 ${state.act} 幕`)}
        ${buildMapTopStatHtml('金币', state.gold, '金币：用于商店、事件与部分锻造消耗')}
        ${buildMapTopStatHtml('牌组', state.deck.length, `当前牌组张数：${state.deck.length}`)}
        ${weaponStatHtml}
        <button class="btn btn-sm" id="btn-open-inventory" title="打开背包与材料库存">背包</button>
      </div>
      <div class="map-layout">
        <div class="map-stage-shell" style="width:${stageShellRect.width}px;height:${stageShellRect.height}px;">
          <div class="map-stage-art" aria-hidden="true">
            <img class="map-stage-art-img img-contain" src="${toWebpAsset('/assets/ui/map/map-board-forest.png')}" alt="" loading="lazy" />
          </div>
          <div class="map-viewport" style="left:${viewportRect.left}px;top:${viewportRect.top}px;width:${viewportRect.width}px;height:${viewportRect.height}px;">
            <div class="map-viewport-overlay" aria-hidden="true" style="${buildMapViewportOverlayStyle()}"></div>
            <div class="map-scroll" id="map-scroll" aria-label="可滚动地图区域">
              <div class="map-canvas" style="width:${canvasWidth}px;height:${canvasHeight}px;">
                <svg class="map-links" width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}">
                  ${linksHtml}
                </svg>
                ${nodesHtml}
              </div>
            </div>
          </div>
        </div>
        <aside class="map-side-panel" id="map-side-panel" style="width:${sideShellRect.width}px;height:${sideShellRect.height}px;">
          ${focusNode ? buildMapSidePanelHtml(focusNode, state) : ''}
        </aside>
      </div>
    </div>
  `

  const sidePanel = container.querySelector<HTMLElement>('#map-side-panel')
  const syncInfoPanel = (el: HTMLElement) => {
    if (!sidePanel) return
    const nodeId = el.dataset.nodeId
    const node = nodeId ? getNodeById(state.mapNodes, nodeId) : null
    if (!node) return
    sidePanel.innerHTML = buildMapSidePanelHtml(node, state)
  }

  container.querySelectorAll<HTMLElement>('.map-node').forEach((el) => {
    el.addEventListener('mouseenter', () => syncInfoPanel(el))
    el.addEventListener('focus', () => syncInfoPanel(el))
  })

  container.querySelectorAll<HTMLElement>('.map-node.map-node--available, .map-node.map-node--current').forEach((el) => {
    el.addEventListener('click', () => {
      syncInfoPanel(el)
      const nodeId = el.dataset.nodeId!
      callbacks.onSelectNode(nodeId)
    })
    el.addEventListener('keydown', (event: KeyboardEvent) => {
      if (shouldActivateMapNodeKey(event.key)) {
        event.preventDefault()
        syncInfoPanel(el)
        const nodeId = el.dataset.nodeId!
        callbacks.onSelectNode(nodeId)
      }
    })
  })

  container.querySelector('#btn-open-inventory')?.addEventListener('click', () => {
    callbacks.onOpenInventory()
  })

  const scrollEl = container.querySelector<HTMLElement>('#map-scroll')
  if (!scrollEl) return

  let dragging = false
  let startY = 0
  let startTop = 0

  scrollEl.addEventListener('pointerdown', (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return
    const targetEl = event.target as HTMLElement | null
    if (targetEl?.closest('.map-node')) return
    dragging = true
    startY = event.clientY
    startTop = scrollEl.scrollTop
    scrollEl.classList.add('dragging')
    scrollEl.setPointerCapture(event.pointerId)
  })

  scrollEl.addEventListener('pointermove', (event: PointerEvent) => {
    if (!dragging) return
    const dy = event.clientY - startY
    scrollEl.scrollLeft = 0
    scrollEl.scrollTop = startTop - dy
  })

  const stopDrag = (event: PointerEvent) => {
    if (!dragging) return
    dragging = false
    scrollEl.classList.remove('dragging')
    if (scrollEl.hasPointerCapture(event.pointerId)) {
      scrollEl.releasePointerCapture(event.pointerId)
    }
  }

  scrollEl.addEventListener('pointerup', stopDrag)
  scrollEl.addEventListener('pointercancel', stopDrag)

  const currentNodeEl = container.querySelector<HTMLElement>(`.map-node[data-node-id="${state.currentNodeId}"]`)
  if (currentNodeEl) {
    const viewport = buildMapViewportRect()
    const target = computeMapScrollTarget(
      currentNodeEl.offsetTop,
      currentNodeEl.clientHeight,
      viewport.height,
    )
    scrollEl.scrollLeft = 0
    scrollEl.scrollTop = Math.max(0, target.top)
  }
}
