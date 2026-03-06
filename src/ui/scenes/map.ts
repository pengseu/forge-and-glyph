import type { RunState } from '../../game/types'
import type { GameCallbacks } from '../renderer'
import { canAccessNode } from '../../game/run'

type NodeVisual = {
  kind: 'battle' | 'elite' | 'boss' | 'campfire' | 'shop' | 'event' | 'forge' | 'enchant' | 'treasure' | 'temple' | 'trial'
  icon: string
  label: string
}

function resolveNodeVisual(type: RunState['mapNodes'][number]['type']): NodeVisual {
  if (type === 'boss_battle') return { kind: 'boss', icon: '👑', label: 'Boss' }
  if (type === 'elite_battle') return { kind: 'elite', icon: '💀', label: '精英' }
  if (type === 'trial') return { kind: 'trial', icon: '⚡', label: '试炼' }
  if (type === 'temple') return { kind: 'temple', icon: '🏛️', label: '圣殿' }
  if (type === 'treasure') return { kind: 'treasure', icon: '💎', label: '宝库' }
  if (type === 'campfire') return { kind: 'campfire', icon: '🔥', label: '篝火' }
  if (type === 'shop') return { kind: 'shop', icon: '🛒', label: '商店' }
  if (type === 'forge') return { kind: 'forge', icon: '⚒️', label: '铁匠' }
  if (type === 'enchant') return { kind: 'enchant', icon: '🔮', label: '附魔' }
  if (type === 'event') return { kind: 'event', icon: '❓', label: '事件' }
  return { kind: 'battle', icon: '⚔️', label: '战斗' }
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

export function renderMap(
  container: HTMLElement,
  state: RunState,
  _saveSlots: Array<{ slot: 1 | 2 | 3; savedAt: number | null }>,
  callbacks: GameCallbacks,
): void {
  const NODE_SIZE = 56
  const SPACING_X = 126
  const SPACING_Y = 126
  const PADDING = 40
  const maxX = Math.max(...state.mapNodes.map((n) => n.x))
  const maxY = Math.max(...state.mapNodes.map((n) => n.y))
  const canvasWidth = Math.max(420, Math.ceil(maxX * SPACING_X + PADDING * 2 + NODE_SIZE))
  const canvasHeight = Math.max(620, Math.ceil(maxY * SPACING_Y + PADDING * 2 + NODE_SIZE))
  const hpPercent = Math.max(0, Math.min(100, (state.playerHp / state.playerMaxHp) * 100))

  function nodeLeft(x: number): number {
    return Math.round(x * SPACING_X + PADDING)
  }

  function nodeTop(y: number): number {
    return Math.round(y * SPACING_Y + PADDING)
  }

  const linksHtml = state.mapNodes.flatMap((node, nodeIndex) =>
    node.connections.map((targetId, connectionIndex) => {
      const target = state.mapNodes.find((n) => n.id === targetId)
      if (!target) return ''
      const x1 = nodeLeft(node.x) + NODE_SIZE / 2
      const y1 = nodeTop(node.y) + NODE_SIZE / 2
      const x2 = nodeLeft(target.x) + NODE_SIZE / 2
      const y2 = nodeTop(target.y) + NODE_SIZE / 2
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
    const statusClass = isCompleted ? 'completed' : isCurrent ? 'current' : isAvailable ? 'available' : 'locked'
    return `
      <div
        class="map-node map-node--${visual.kind} map-node--${statusClass}"
        data-node-id="${node.id}"
        style="left: ${nodeLeft(node.x)}px; top: ${nodeTop(node.y)}px;"
        tabindex="${isAvailable ? '0' : '-1'}"
        role="button"
        aria-label="${visual.label}节点"
        title="${visual.label}"
      >
        <div class="map-node-icon">${visual.icon}</div>
      </div>
    `
  }).join('')

  const weaponName = state.equippedWeapon ? '⚔️ 已装备武器' : ''

  container.innerHTML = `
    <div class="scene-map scene-map-v2">
      <div class="map-player-bar">
        <div class="hp-bar map-hp-bar">
          <div class="hp-bar-fill" style="width:${hpPercent}%"></div>
          <div class="hp-bar-text">HP ${state.playerHp}/${state.playerMaxHp}</div>
        </div>
        <span class="stat">幕 ${state.act}</span>
        <span class="stat">💰 ${state.gold}</span>
        <span class="stat">🃏 ${state.deck.length}</span>
        ${weaponName ? `<span class="stat">${weaponName}</span>` : ''}
        <button class="btn btn-sm" id="btn-open-inventory">背包</button>
      </div>
      <div class="map-container">
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
  `

  container.querySelectorAll<HTMLElement>('.map-node.map-node--available, .map-node.map-node--current').forEach((el) => {
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
