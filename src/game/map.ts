import type { MapNode } from './types'

type Encounter = { enemyIds: string[]; weight: number }

const EARLY_ENCOUNTERS: Encounter[] = [
  { enemyIds: ['goblin_scout', 'goblin_scout'], weight: 3 },
  { enemyIds: ['forest_wolf', 'forest_wolf'], weight: 2 },
  { enemyIds: ['goblin_scout', 'mushroom_creature'], weight: 2 },
]

const MID_ENCOUNTERS: Encounter[] = [
  { enemyIds: ['goblin_scout', 'goblin_scout', 'goblin_scout'], weight: 2 },
  { enemyIds: ['goblin_scout', 'goblin_scout', 'mushroom_creature'], weight: 3 },
  { enemyIds: ['mushroom_creature', 'mushroom_creature'], weight: 2 },
  { enemyIds: ['forest_wolf', 'forest_wolf', 'goblin_scout'], weight: 1 },
]

const ELITE_ENEMIES = ['shadow_assassin', 'stone_gargoyle']

function pickEncounter(pool: Encounter[]): string[] {
  const totalWeight = pool.reduce((sum, e) => sum + e.weight, 0)
  let roll = Math.random() * totalWeight
  for (const enc of pool) {
    roll -= enc.weight
    if (roll <= 0) return enc.enemyIds
  }
  return pool[0].enemyIds
}

function pickEliteEncounter(): string[] {
  const idx = Math.floor(Math.random() * ELITE_ENEMIES.length)
  return [ELITE_ENEMIES[idx]]
}

export function generateMap(): MapNode[] {
  let normalCount = 0

  function makeNormalEncounter(): string[] {
    normalCount++
    return normalCount <= 3 ? pickEncounter(EARLY_ENCOUNTERS) : pickEncounter(MID_ENCOUNTERS)
  }

  const nodes: MapNode[] = [
    // Row 1
    { id: 'n1', type: 'normal_battle', enemyIds: ['forest_wolf', 'forest_wolf'], completed: false, x: 0, y: 0, connections: ['n2', 'n4'] },
    { id: 'n2', type: 'normal_battle', enemyIds: undefined, completed: false, x: 1, y: 0, connections: ['n3', 'campfire_1'] },
    { id: 'n3', type: 'elite_battle', enemyIds: pickEliteEncounter(), completed: false, x: 2, y: 0, connections: ['n8'] },

    // Row 2 (with campfire)
    { id: 'n4', type: 'forge', completed: false, x: 0, y: 1, connections: ['campfire_1'] },
    { id: 'campfire_1', type: 'campfire', completed: false, x: 1, y: 1, connections: ['n5', 'n6'] },
    { id: 'n6', type: 'elite_battle', enemyIds: pickEliteEncounter(), completed: false, x: 2, y: 1, connections: ['n8'] },

    // Row 3
    { id: 'n5', type: 'shop', completed: false, x: 0, y: 2, connections: ['n8'] },
    { id: 'n8', type: 'normal_battle', enemyIds: undefined, completed: false, x: 1, y: 2, connections: ['n7'] },

    // Boss
    { id: 'n7', type: 'boss_battle', enemyIds: ['goblin_king'], completed: false, x: 1.5, y: 3, connections: [] },
  ]

  for (const node of nodes) {
    if (node.type === 'normal_battle' && !node.enemyIds) {
      node.enemyIds = makeNormalEncounter()
    }
  }

  return nodes
}

export function getNodeById(nodes: MapNode[], id: string): MapNode | undefined {
  return nodes.find(n => n.id === id)
}
