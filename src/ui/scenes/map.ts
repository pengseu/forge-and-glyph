import type { RunState } from '../../game/types'
import type { GameCallbacks } from '../renderer'
import { canAccessNode } from '../../game/run'

export function renderMap(
  container: HTMLElement,
  state: RunState,
  callbacks: GameCallbacks,
): void {
  // Generate node HTML
  const currentNode = state.mapNodes.find(n => n.id === state.currentNodeId)
  const linesHtml = state.mapNodes.flatMap(node =>
    node.connections.map(targetId => {
      const target = state.mapNodes.find(n => n.id === targetId)
      if (!target) return ''
      const isActive = node.id === state.currentNodeId || targetId === state.currentNodeId || (currentNode?.connections.includes(targetId) ?? false)
      return `
        <line
          x1="${node.x * 100 + 30}"
          y1="${node.y * 100 + 30}"
          x2="${target.x * 100 + 30}"
          y2="${target.y * 100 + 30}"
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
            : '普通'
    const statusClass = isCompleted ? 'completed' : isCurrent ? 'current' : isAccessible ? 'accessible' : 'locked'

    return `
      <div class="map-node ${statusClass}" data-node-id="${node.id}" style="left: ${node.x * 100}px; top: ${node.y * 100}px;" tabindex="${isAccessible ? '0' : '-1'}" role="button" aria-label="${typeLabel}节点">
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
        <svg class="map-lines" width="100%" height="100%">
          ${linesHtml}
        </svg>
        ${nodesHtml}
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
}
