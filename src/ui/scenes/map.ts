import type { RunState } from '../../game/types'
import type { GameCallbacks } from '../renderer'

export function renderMap(
  container: HTMLElement,
  state: RunState,
  callbacks: GameCallbacks,
): void {
  // Generate node HTML
  const nodesHtml = state.mapNodes.map(node => {
    const isCurrent = node.id === state.currentNodeId
    const isCompleted = node.completed
    const currentNode = state.mapNodes.find(n => n.id === state.currentNodeId)
    const isAccessible = node.id === state.currentNodeId || node.completed || (currentNode?.connections.includes(node.id) ?? false)

    const typeEmoji = node.type === 'boss_battle' ? '👑' : node.type === 'elite_battle' ? '⭐' : node.type === 'campfire' ? '🔥' : '💀'
    const typeLabel = node.type === 'boss_battle' ? 'Boss' : node.type === 'elite_battle' ? '精英' : node.type === 'campfire' ? '篝火' : '普通'
    const statusClass = isCurrent ? 'current' : isCompleted ? 'completed' : isAccessible ? 'accessible' : 'locked'

    return `
      <div class="map-node ${statusClass}" data-node-id="${node.id}" style="left: ${node.x * 100}px; top: ${node.y * 100}px;">
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
        <span class="stat">卡组: ${state.deck.length}张</span>
        ${weaponName ? `<span class="stat" style="color:#f0a500;">${weaponName}</span>` : ''}
      </div>
      <div class="map-container">
        ${nodesHtml}
      </div>
    </div>
  `

  // Bind node click events
  container.querySelectorAll('.map-node.accessible, .map-node.current').forEach(el => {
    el.addEventListener('click', () => {
      const nodeId = (el as HTMLElement).dataset.nodeId!
      callbacks.onSelectNode(nodeId)
    })
  })
}
