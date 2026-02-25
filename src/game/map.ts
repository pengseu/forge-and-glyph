import type { MapNode } from './types'

export function generateMap(): MapNode[] {
  const nodes: MapNode[] = [
    // 第一行
    { id: 'n1', type: 'normal_battle', enemyId: 'goblin_scout', completed: false, x: 0, y: 0, connections: ['n2', 'n4'] },
    { id: 'n2', type: 'normal_battle', enemyId: 'forest_wolf', completed: false, x: 1, y: 0, connections: ['n3', 'campfire_1'] },
    { id: 'n3', type: 'elite_battle', enemyId: 'mushroom_creature', completed: false, x: 2, y: 0, connections: ['n7'] },

    // 第二行（含篝火）
    { id: 'n4', type: 'normal_battle', enemyId: 'goblin_scout', completed: false, x: 0, y: 1, connections: ['campfire_1'] },
    { id: 'campfire_1', type: 'campfire', completed: false, x: 1, y: 1, connections: ['n5', 'n6'] },
    { id: 'n6', type: 'elite_battle', enemyId: 'mushroom_creature', completed: false, x: 2, y: 1, connections: ['n7'] },

    // 第三行
    { id: 'n5', type: 'normal_battle', enemyId: 'forest_wolf', completed: false, x: 0, y: 2, connections: ['n8'] },
    { id: 'n8', type: 'normal_battle', enemyId: 'goblin_scout', completed: false, x: 1, y: 2, connections: ['n7'] },

    // Boss
    { id: 'n7', type: 'boss_battle', enemyId: 'goblin_king', completed: false, x: 1.5, y: 3, connections: [] },
  ]
  return nodes
}

export function getNodeById(nodes: MapNode[], id: string): MapNode | undefined {
  return nodes.find(n => n.id === id)
}
