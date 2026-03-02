import type { RunState } from '../../game/types'
import type { GameCallbacks } from '../renderer'
import { canAccessNode } from '../../game/run'
import mapBg from '../../assets/map/bg-map.png'
import iconBoss from '../../assets/nodes/boss_battle.png'
import iconCampfire from '../../assets/nodes/campfire.png'
import iconElite from '../../assets/nodes/elite_battle.png'
import iconEnchant from '../../assets/nodes/enchant.png'
import iconEvent from '../../assets/nodes/event.png'
import iconForge from '../../assets/nodes/forge.png'
import iconNormal from '../../assets/nodes/normal_battle.png'
import iconShop from '../../assets/nodes/shop.png'
import iconTemple from '../../assets/nodes/temple.png'
import iconTreasure from '../../assets/nodes/treasure.png'
import iconTrial from '../../assets/nodes/trial.png'

const MAP_RUNE_POOL = ['✦', '✧', '✶', '✷', '∆', '∴', 'ᛉ', 'ᛊ', '☿', '⚜', '⛤']

function hashString(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

const NODE_VISUALS: Record<
  RunState['mapNodes'][number]['type'],
  { label: string; icon: string | null; fallbackText?: string }
> = {
  normal_battle: { label: '普通战斗', icon: iconNormal },
  elite_battle: { label: '精英战斗', icon: iconElite },
  boss_battle: { label: 'Boss战', icon: iconBoss },
  campfire: { label: '篝火', icon: iconCampfire },
  shop: { label: '商店', icon: iconShop },
  forge: { label: '铁匠', icon: iconForge },
  enchant: { label: '附魔台', icon: iconEnchant },
  event: { label: '随机事件', icon: iconEvent },
  trial: { label: '试炼', icon: iconTrial },
  temple: { label: '圣殿', icon: iconTemple },
  treasure: { label: '宝库', icon: iconTreasure },
}

export function renderMap(
  container: HTMLElement,
  state: RunState,
  callbacks: GameCallbacks,
): void {
  const NODE_SIZE = 60
  const H_STEP = 150
  const V_LANE = 170
  const SAFE_LEFT_RATIO = 0.1
  const SAFE_RIGHT_RATIO = 0.9
  const SAFE_TOP_RATIO = 1 / 6
  const SAFE_BOTTOM_RATIO = 5 / 6
  const PADDING = 120
  const maxX = Math.max(...state.mapNodes.map(n => n.x))
  const maxY = Math.max(...state.mapNodes.map(n => n.y))
  const canvasWidth = Math.max(1000, Math.ceil((maxY + 1) * H_STEP + PADDING * 2))
  const canvasHeight = Math.max(560, Math.ceil((maxX + 1) * V_LANE + PADDING))
  const safeLeft = canvasWidth * SAFE_LEFT_RATIO
  const safeRight = canvasWidth * SAFE_RIGHT_RATIO
  const safeTop = canvasHeight * SAFE_TOP_RATIO
  const safeBottom = canvasHeight * SAFE_BOTTOM_RATIO
  const safeWidth = Math.max(1, safeRight - safeLeft - NODE_SIZE)
  const safeHeight = Math.max(1, safeBottom - safeTop - NODE_SIZE)
  const xDenom = maxY > 0 ? maxY : 1
  const yDenom = maxX > 0 ? maxX : 1

  function mapProgressX(nodeY: number): number {
    if (maxY <= 0) return safeLeft + safeWidth * 0.5
    return safeLeft + (nodeY / xDenom) * safeWidth
  }

  function mapLaneY(nodeX: number): number {
    if (maxX <= 0) return safeTop + safeHeight * 0.5
    return safeTop + (nodeX / yDenom) * safeHeight
  }

  function nodeLeft(node: Pick<RunState['mapNodes'][number], 'y'>): number {
    return Math.round(mapProgressX(node.y))
  }

  function nodeTop(node: Pick<RunState['mapNodes'][number], 'x'>): number {
    return Math.round(mapLaneY(node.x))
  }

  // Generate node HTML
  const currentNode = state.mapNodes.find(n => n.id === state.currentNodeId)
  const linksHtml = state.mapNodes.flatMap(node =>
    node.connections.map(targetId => {
      const target = state.mapNodes.find(n => n.id === targetId)
      if (!target) return ''
      const isActive = node.id === state.currentNodeId || targetId === state.currentNodeId || (currentNode?.connections.includes(targetId) ?? false)
      const x1 = nodeLeft(node) + NODE_SIZE / 2
      const y1 = nodeTop(node) + NODE_SIZE / 2
      const x2 = nodeLeft(target) + NODE_SIZE / 2
      const y2 = nodeTop(target) + NODE_SIZE / 2
      const dx = x2 - x1
      const dy = y2 - y1
      const length = Math.hypot(dx, dy)
      if (length < 1) return ''
      const nx = -dy / length
      const ny = dx / length
      const seed = hashString(`${node.id}->${targetId}`)
      const rand = mulberry32(seed)
      const bend = (10 + rand() * 18) * (rand() > 0.5 ? 1 : -1)
      const cx = (x1 + x2) / 2 + nx * bend
      const cy = (y1 + y2) / 2 + ny * bend
      const pathId = `map-path-${node.id}-${targetId}`.replace(/[^a-zA-Z0-9_-]/g, '_')
      const runeCount = Math.max(2, Math.min(6, Math.floor(length / 72)))
      const runesHtml = Array.from({ length: runeCount }).map((_, idx) => {
        const baseOffset = ((idx + 1) / (runeCount + 1)) * 100
        const jitter = (rand() * 8) - 4
        const dyOffset = (rand() * 8) - 4
        const runeIdx = Math.floor(rand() * MAP_RUNE_POOL.length)
        const rune = MAP_RUNE_POOL[runeIdx]
        return `
          <text class="map-link-rune ${isActive ? 'active' : 'locked'}" dy="${dyOffset.toFixed(1)}">
            <textPath href="#${pathId}" startOffset="${(baseOffset + jitter).toFixed(1)}%">${rune}</textPath>
          </text>
        `
      }).join('')
      return `
        <path id="${pathId}" class="map-link ${isActive ? 'active' : 'locked'}" d="M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}" />
        ${runesHtml}
      `
    })
  ).join('')

  const nodesHtml = state.mapNodes.map(node => {
    const isCurrent = node.id === state.currentNodeId
    const isCompleted = node.completed
    const isAccessible = canAccessNode(state, node.id)
    const nodeVisual = NODE_VISUALS[node.type]
    const typeLabel = nodeVisual.label
    const statusClass = isCompleted ? 'completed' : isCurrent ? 'current' : isAccessible ? 'accessible' : 'locked'
    const iconHtml = nodeVisual.icon
      ? `<img class="node-icon-img" src="${nodeVisual.icon}" alt="${typeLabel}" />`
      : `<span class="node-icon-fallback">${nodeVisual.fallbackText ?? '节点'}</span>`

    return `
      <div class="map-node-wrap" style="left: ${nodeLeft(node)}px; top: ${nodeTop(node)}px;">
        <div class="map-node ${statusClass}" data-node-id="${node.id}" tabindex="${isAccessible ? '0' : '-1'}" role="button" aria-label="${typeLabel}节点">
          <div class="node-icon">${iconHtml}</div>
        </div>
        <div class="node-label">${typeLabel}</div>
      </div>
    `
  }).join('')

  const weaponName = state.equippedWeapon ? '⚔️ 已装备' : ''

  container.innerHTML = `
    <div class="scene-map">
      <div class="map-player-bar">
        <span class="stat">第${state.act}幕</span>
        <span class="stat stat-hp">♥ ${state.playerHp}/${state.playerMaxHp}</span>
        <span class="stat">金币: ${state.gold}</span>
        <span class="stat">卡组: ${state.deck.length}张</span>
        <button class="btn btn-small" id="btn-open-inventory">背包</button>
        ${weaponName ? `<span class="stat" style="color:#f0a500;">${weaponName}</span>` : ''}
      </div>
      <div class="map-container">
        <div class="map-scroll" id="map-scroll" aria-label="可滚动地图区域">
          <div class="map-canvas map-canvas-horizontal" style="width:${canvasWidth}px;height:${canvasHeight}px;background-image:url('${mapBg}')">
            <svg class="map-links" width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}">
              ${linksHtml}
            </svg>
            ${nodesHtml}
          </div>
        </div>
      </div>
    </div>
  `

  // Bind node click events
  container.querySelectorAll<HTMLElement>('.map-node.accessible, .map-node.current').forEach(el => {
    el.addEventListener('click', () => {
      const nodeId = el.dataset.nodeId!
      callbacks.onSelectNode(nodeId)
    })
    el.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
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
  let startX = 0
  let startY = 0
  let startLeft = 0
  let startTop = 0

  scrollEl.addEventListener('pointerdown', (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return
    const targetEl = event.target as HTMLElement | null
    if (targetEl?.closest('.map-node')) return
    dragging = true
    startX = event.clientX
    startY = event.clientY
    startLeft = scrollEl.scrollLeft
    startTop = scrollEl.scrollTop
    scrollEl.classList.add('dragging')
    scrollEl.setPointerCapture(event.pointerId)
  })

  scrollEl.addEventListener('pointermove', (event: PointerEvent) => {
    if (!dragging) return
    const dx = event.clientX - startX
    const dy = event.clientY - startY
    scrollEl.scrollLeft = startLeft - dx
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
}
