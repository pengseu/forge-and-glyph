import type { RunState } from '../../game/types'
import type { GameCallbacks } from '../renderer'
import { canAccessNode } from '../../game/run'

export function renderMap(
  container: HTMLElement,
  state: RunState,
  callbacks: GameCallbacks,
): void {
  const NODE_SIZE = 60
  const SPACING_X = 120
  const SPACING_Y = 120
  const PADDING = 40
  const maxX = Math.max(...state.mapNodes.map(n => n.x))
  const maxY = Math.max(...state.mapNodes.map(n => n.y))
  const canvasWidth = Math.max(420, Math.ceil(maxX * SPACING_X + PADDING * 2 + NODE_SIZE))
  const canvasHeight = Math.max(620, Math.ceil(maxY * SPACING_Y + PADDING * 2 + NODE_SIZE))

  function nodeLeft(x: number): number {
    return Math.round(x * SPACING_X + PADDING)
  }

  function nodeTop(y: number): number {
    return Math.round(y * SPACING_Y + PADDING)
  }

  // Generate node HTML
  const currentNode = state.mapNodes.find(n => n.id === state.currentNodeId)
  const linesHtml = state.mapNodes.flatMap(node =>
    node.connections.map(targetId => {
      const target = state.mapNodes.find(n => n.id === targetId)
      if (!target) return ''
      const isActive = node.id === state.currentNodeId || targetId === state.currentNodeId || (currentNode?.connections.includes(targetId) ?? false)
      const x1 = nodeLeft(node.x) + NODE_SIZE / 2
      const y1 = nodeTop(node.y) + NODE_SIZE / 2
      const x2 = nodeLeft(target.x) + NODE_SIZE / 2
      const y2 = nodeTop(target.y) + NODE_SIZE / 2
      return `
        <line
          x1="${x1}"
          y1="${y1}"
          x2="${x2}"
          y2="${y2}"
          class="map-line ${isActive ? 'active' : ''}"
        />
      `
    })
  ).join('')

  const nodesHtml = state.mapNodes.map(node => {
    const isCurrent = node.id === state.currentNodeId
    const isCompleted = node.completed
    const isAccessible = canAccessNode(state, node.id)

    const typeEmoji = node.type === 'boss_battle'
      ? '👑'
      : node.type === 'elite_battle'
        ? '⭐'
        : node.type === 'campfire'
          ? '🔥'
          : node.type === 'shop'
            ? '🏪'
            : node.type === 'forge'
              ? '⚒️'
              : node.type === 'enchant'
                ? '🔮'
                : node.type === 'event'
                  ? '❓'
            : '💀'
    const typeLabel = node.type === 'boss_battle'
      ? 'Boss'
      : node.type === 'elite_battle'
        ? '精英'
        : node.type === 'campfire'
          ? '篝火'
          : node.type === 'shop'
            ? '商店'
            : node.type === 'forge'
              ? '铁匠'
              : node.type === 'enchant'
                ? '附魔台'
                : node.type === 'event'
                  ? '事件'
            : '普通'
    const statusClass = isCompleted ? 'completed' : isCurrent ? 'current' : isAccessible ? 'accessible' : 'locked'

    return `
      <div class="map-node ${statusClass}" data-node-id="${node.id}" style="left: ${nodeLeft(node.x)}px; top: ${nodeTop(node.y)}px;" tabindex="${isAccessible ? '0' : '-1'}" role="button" aria-label="${typeLabel}节点">
        <div class="node-icon">${typeEmoji}</div>
        <div class="node-label">${typeLabel}</div>
      </div>
    `
  }).join('')

  const weaponName = state.equippedWeapon ? '⚔️ 已装备' : ''

  container.innerHTML = `
    <div class="scene-map">
      <div class="map-player-bar">
        <span class="stat stat-hp">♥ ${state.playerHp}/${state.playerMaxHp}</span>
        <span class="stat">金币: ${state.gold}</span>
        <span class="stat">卡组: ${state.deck.length}张</span>
        <button class="btn btn-small" id="btn-open-inventory">背包</button>
        ${weaponName ? `<span class="stat" style="color:#f0a500;">${weaponName}</span>` : ''}
      </div>
      <div class="map-container">
        <div class="map-scroll" id="map-scroll" aria-label="可滚动地图区域">
          <div class="map-canvas" style="width:${canvasWidth}px;height:${canvasHeight}px;">
            <svg class="map-lines" width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}">
              ${linesHtml}
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
