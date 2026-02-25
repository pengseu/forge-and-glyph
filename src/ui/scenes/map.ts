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
    const isAccessible = node.connections.some(id => state.visitedNodes.has(id) || id === state.currentNodeId)

    const typeEmoji = node.type === 'boss_battle' ? '👑' : node.type === 'elite_battle' ? '⭐' : '💀'
    const statusClass = isCurrent ? 'current' : isCompleted ? 'completed' : isAccessible ? 'accessible' : 'locked'

    return `
      <div class="map-node ${statusClass}" data-node-id="${node.id}" style="left: ${node.x * 100}px; top: ${node.y * 100}px;">
        <div class="node-icon">${typeEmoji}</div>
        <div class="node-label">${node.type === 'boss_battle' ? 'Boss' : node.type === 'elite_battle' ? '精英' : '普通'}</div>
      </div>
    `
  }).join('')

  container.innerHTML = `
    <div class="scene-map">
      <div class="map-container">
        ${nodesHtml}
      </div>
      <div class="deck-info">
        <p>卡组: ${state.deck.length}张</p>
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
