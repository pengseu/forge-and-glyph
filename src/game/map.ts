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
    return normalCount <= 4 ? pickEncounter(EARLY_ENCOUNTERS) : pickEncounter(MID_ENCOUNTERS)
  }

  return [
    // Layer 1
    { id: 'l1_start', type: 'normal_battle', enemyIds: makeNormalEncounter(), completed: false, x: 1, y: 0, connections: ['l2_left', 'l2_right'] },

    // Layer 2
    { id: 'l2_left', type: 'normal_battle', enemyIds: makeNormalEncounter(), completed: false, x: 0, y: 1, connections: ['l3_left', 'l3_mid'] },
    { id: 'l2_right', type: 'normal_battle', enemyIds: makeNormalEncounter(), completed: false, x: 2, y: 1, connections: ['l3_mid', 'l3_right'] },

    // Layer 3
    { id: 'l3_left', type: 'shop', completed: false, x: 0, y: 2, connections: ['l4_left'] },
    { id: 'l3_mid', type: 'event', completed: false, x: 1, y: 2, connections: ['l4_left', 'l4_right'] },
    { id: 'l3_right', type: 'elite_battle', enemyIds: pickEliteEncounter(), completed: false, x: 2, y: 2, connections: ['l4_right'] },

    // Layer 4
    { id: 'l4_left', type: 'normal_battle', enemyIds: makeNormalEncounter(), completed: false, x: 0.5, y: 3, connections: ['l5_left', 'l5_mid'] },
    { id: 'l4_right', type: 'campfire', completed: false, x: 1.5, y: 3, connections: ['l5_mid', 'l5_right'] },

    // Layer 5
    { id: 'l5_left', type: 'forge', completed: false, x: 0, y: 4, connections: ['l6_left'] },
    { id: 'l5_mid', type: 'elite_battle', enemyIds: pickEliteEncounter(), completed: false, x: 1, y: 4, connections: ['l6_left', 'l6_right'] },
    { id: 'l5_right', type: 'enchant', completed: false, x: 2, y: 4, connections: ['l6_right'] },

    // Layer 6
    { id: 'l6_left', type: 'normal_battle', enemyIds: makeNormalEncounter(), completed: false, x: 0.5, y: 5, connections: ['l7_boss'] },
    { id: 'l6_right', type: 'campfire', completed: false, x: 1.5, y: 5, connections: ['l7_boss'] },

    // Layer 7
    { id: 'l7_boss', type: 'boss_battle', enemyIds: ['goblin_king'], completed: false, x: 1, y: 6, connections: [] },
  ]
}

export function getNodeById(nodes: MapNode[], id: string): MapNode | undefined {
  return nodes.find(n => n.id === id)
}
