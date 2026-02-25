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

    const nodeIcon = `/assets/nodes/${node.type}.png`
    const typeLabel = node.type === 'boss_battle' ? 'Boss' : node.type === 'elite_battle' ? '精英' : node.type === 'campfire' ? '篝火' : '普通'
    const statusClass = isCurrent ? 'current' : isCompleted ? 'completed' : isAccessible ? 'accessible' : 'locked'

    return `
      <div class="map-node ${statusClass}" data-node-id="${node.id}" style="left: ${node.x * 100}px; top: ${node.y * 100}px;">
        <img class="node-icon-img" src="${nodeIcon}" alt="${typeLabel}" />
        <div class="node-label">${typeLabel}</div>
      </div>
    `
  }).join('')

  container.innerHTML = `
    <div class="scene-map" style="background: url('/assets/backgrounds/map.png') center/cover no-repeat;">
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
