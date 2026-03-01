import type { MapNode, NodeType } from './types'

type Encounter = { enemyIds: string[]; weight: number }

const ACT1_EARLY_ENCOUNTERS: Encounter[] = [
  { enemyIds: ['forest_wolf', 'forest_wolf'], weight: 3 },
  { enemyIds: ['goblin_scout', 'mushroom_creature'], weight: 3 },
  { enemyIds: ['goblin_scout', 'goblin_shaman'], weight: 2 },
]

const ACT1_MID_ENCOUNTERS: Encounter[] = [
  { enemyIds: ['goblin_scout', 'goblin_scout', 'goblin_shaman'], weight: 3 },
  { enemyIds: ['mushroom_creature', 'goblin_scout'], weight: 2 },
  { enemyIds: ['forest_wolf', 'forest_wolf'], weight: 2 },
  { enemyIds: ['goblin_brute'], weight: 1 },
]

const ACT1_LATE_ENCOUNTERS: Encounter[] = [
  { enemyIds: ['goblin_scout', 'mushroom_creature', 'goblin_shaman'], weight: 3 },
  { enemyIds: ['forest_wolf', 'forest_wolf', 'goblin_scout'], weight: 2 },
  { enemyIds: ['mushroom_creature', 'mushroom_creature'], weight: 2 },
  { enemyIds: ['goblin_brute', 'goblin_scout'], weight: 2 },
]

const ACT1_ELITE_ENEMIES = ['shadow_assassin', 'stone_gargoyle'] as const

const ACT2_EARLY_ENCOUNTERS: Encounter[] = [
  { enemyIds: ['goblin_scout', 'goblin_scout', 'mushroom_creature'], weight: 2 },
  { enemyIds: ['berserker'], weight: 3 },
  { enemyIds: ['shadow_walker', 'goblin_scout'], weight: 3 },
]

const ACT2_MID_ENCOUNTERS: Encounter[] = [
  { enemyIds: ['thorn_vine', 'shadow_walker'], weight: 3 },
  { enemyIds: ['berserker', 'goblin_shaman'], weight: 2 },
  { enemyIds: ['mushroom_creature', 'mushroom_creature', 'thorn_vine'], weight: 2 },
  { enemyIds: ['shadow_walker', 'shadow_walker'], weight: 1 },
]

const ACT2_LATE_ENCOUNTERS: Encounter[] = [
  { enemyIds: ['berserker', 'berserker'], weight: 2 },
  { enemyIds: ['thorn_vine', 'berserker', 'goblin_scout'], weight: 3 },
  { enemyIds: ['shadow_walker', 'thorn_vine'], weight: 2 },
  { enemyIds: ['goblin_brute', 'goblin_shaman'], weight: 2 },
]

const ACT2_ELITE_ENEMIES = ['lich', 'iron_golem'] as const

const ACT3_EARLY_ENCOUNTERS: Encounter[] = [
  { enemyIds: ['berserker', 'berserker'], weight: 2 },
  { enemyIds: ['shadow_walker', 'thorn_vine'], weight: 2 },
  { enemyIds: ['void_messenger', 'goblin_scout'], weight: 3 },
  { enemyIds: ['elemental_symbiote', 'goblin_shaman'], weight: 2 },
]

const ACT3_MID_ENCOUNTERS: Encounter[] = [
  { enemyIds: ['void_messenger', 'soul_weaver'], weight: 3 },
  { enemyIds: ['elemental_symbiote', 'elemental_symbiote'], weight: 2 },
  { enemyIds: ['berserker', 'soul_weaver', 'goblin_scout'], weight: 2 },
  { enemyIds: ['shadow_walker', 'shadow_walker', 'void_messenger'], weight: 2 },
]

const ACT3_LATE_ENCOUNTERS: Encounter[] = [
  { enemyIds: ['void_messenger', 'void_messenger'], weight: 2 },
  { enemyIds: ['soul_weaver', 'elemental_symbiote', 'berserker'], weight: 3 },
  { enemyIds: ['thorn_vine', 'thorn_vine', 'shadow_walker'], weight: 2 },
  { enemyIds: ['goblin_brute', 'goblin_brute', 'goblin_shaman'], weight: 1 },
]

const ACT3_ELITE_ENEMIES = ['abyss_knight', 'fate_weaver'] as const

function pickEncounter(pool: Encounter[], rng: () => number): string[] {
  const totalWeight = pool.reduce((sum, e) => sum + e.weight, 0)
  let roll = rng() * totalWeight
  for (const enc of pool) {
    roll -= enc.weight
    if (roll <= 0) return enc.enemyIds
  }
  return pool[0].enemyIds
}

function pickFrom<T>(pool: readonly T[], rng: () => number): T {
  return pool[Math.floor(rng() * pool.length)]
}

function drawWithoutReplacement<T>(pool: T[], count: number, rng: () => number): T[] {
  const copy = [...pool]
  const picked: T[] = []
  while (picked.length < count && copy.length > 0) {
    const idx = Math.floor(rng() * copy.length)
    picked.push(copy[idx])
    copy.splice(idx, 1)
  }
  return picked
}

function withAct1Enemies(type: NodeType, stage: 'early' | 'mid' | 'late', rng: () => number): Pick<MapNode, 'type' | 'enemyIds'> {
  if (type === 'normal_battle') {
    const pool = stage === 'early' ? ACT1_EARLY_ENCOUNTERS : stage === 'mid' ? ACT1_MID_ENCOUNTERS : ACT1_LATE_ENCOUNTERS
    return { type, enemyIds: pickEncounter(pool, rng) }
  }
  if (type === 'elite_battle') {
    return { type, enemyIds: [pickFrom(ACT1_ELITE_ENEMIES, rng)] }
  }
  return { type }
}

function withAct2Enemies(type: NodeType, stage: 'early' | 'mid' | 'late', rng: () => number): Pick<MapNode, 'type' | 'enemyIds'> {
  if (type === 'normal_battle') {
    const pool = stage === 'early' ? ACT2_EARLY_ENCOUNTERS : stage === 'mid' ? ACT2_MID_ENCOUNTERS : ACT2_LATE_ENCOUNTERS
    return { type, enemyIds: pickEncounter(pool, rng) }
  }
  if (type === 'elite_battle') {
    return { type, enemyIds: [pickFrom(ACT2_ELITE_ENEMIES, rng)] }
  }
  return { type }
}

function withAct3Enemies(type: NodeType, stage: 'early' | 'mid' | 'late', rng: () => number): Pick<MapNode, 'type' | 'enemyIds'> {
  if (type === 'normal_battle') {
    const pool = stage === 'early' ? ACT3_EARLY_ENCOUNTERS : stage === 'mid' ? ACT3_MID_ENCOUNTERS : ACT3_LATE_ENCOUNTERS
    return { type, enemyIds: pickEncounter(pool, rng) }
  }
  if (type === 'elite_battle') {
    return { type, enemyIds: [pickFrom(ACT3_ELITE_ENEMIES, rng)] }
  }
  return { type }
}

function generateAct1Map(rng: () => number): MapNode[] {
  const l2Pool: NodeType[] = ['event', 'normal_battle', 'normal_battle']
  const l3Pool: NodeType[] = ['campfire', 'forge', 'elite_battle', 'normal_battle']
  const l4Pool: NodeType[] = ['normal_battle', 'normal_battle', 'campfire']
  const l6Pool: NodeType[] = ['normal_battle', 'normal_battle', 'event']

  const [l2aType, l2bType] = drawWithoutReplacement(l2Pool, 2, rng)
  const [l3aType, l3bType, l3cType] = drawWithoutReplacement(l3Pool, 3, rng)
  const [l4aType, l4bType] = drawWithoutReplacement(l4Pool, 2, rng)
  const [l6aType, l6bType] = drawWithoutReplacement(l6Pool, 2, rng)

  const l1 = { type: 'normal_battle' as const, enemyIds: ['goblin_scout', 'goblin_scout'] }
  const l2a = withAct1Enemies(l2aType, 'early', rng)
  const l2b = withAct1Enemies(l2bType, 'early', rng)
  const l3a = withAct1Enemies(l3aType, 'mid', rng)
  const l3b = withAct1Enemies(l3bType, 'mid', rng)
  const l3c = withAct1Enemies(l3cType, 'mid', rng)
  const l4a = withAct1Enemies(l4aType, 'mid', rng)
  const l4b = withAct1Enemies(l4bType, 'mid', rng)
  const l6a = withAct1Enemies(l6aType, 'late', rng)
  const l6b = withAct1Enemies(l6bType, 'late', rng)

  return [
    { id: 'l1_start', ...l1, completed: false, x: 1, y: 0, connections: ['l2_a', 'l2_b'] },

    { id: 'l2_a', ...l2a, completed: false, x: 0, y: 1, connections: ['l3_a', 'l3_b'] },
    { id: 'l2_b', ...l2b, completed: false, x: 2, y: 1, connections: ['l3_b', 'l3_c'] },

    { id: 'l3_a', ...l3a, completed: false, x: 0, y: 2, connections: ['l4_a'] },
    { id: 'l3_b', ...l3b, completed: false, x: 1, y: 2, connections: ['l4_a', 'l4_b'] },
    { id: 'l3_c', ...l3c, completed: false, x: 2, y: 2, connections: ['l4_b'] },

    { id: 'l4_a', ...l4a, completed: false, x: 0.5, y: 3, connections: ['l5_shop'] },
    { id: 'l4_b', ...l4b, completed: false, x: 1.5, y: 3, connections: ['l5_shop'] },

    { id: 'l5_shop', type: 'shop', completed: false, x: 1, y: 4, connections: ['l6_a', 'l6_b'] },

    { id: 'l6_a', ...l6a, completed: false, x: 0.5, y: 5, connections: ['l7_boss'] },
    { id: 'l6_b', ...l6b, completed: false, x: 1.5, y: 5, connections: ['l7_boss'] },

    { id: 'l7_boss', type: 'boss_battle', enemyIds: ['goblin_king'], completed: false, x: 1, y: 6, connections: [] },
  ]
}

function generateAct2Map(rng: () => number): MapNode[] {
  const l2Pool: NodeType[] = ['event', 'normal_battle', 'normal_battle']
  const l3Pool: NodeType[] = ['elite_battle', 'campfire', 'normal_battle', 'normal_battle']
  const l4Pool: NodeType[] = ['normal_battle', 'normal_battle', 'campfire']
  const l6Pool: NodeType[] = ['normal_battle', 'normal_battle', 'event']

  const [l2aType, l2bType] = drawWithoutReplacement(l2Pool, 2, rng)
  const [l3aType, l3bType, l3cType] = drawWithoutReplacement(l3Pool, 3, rng)
  const [l4aType, l4bType] = drawWithoutReplacement(l4Pool, 2, rng)
  const [l6aType, l6bType] = drawWithoutReplacement(l6Pool, 2, rng)

  const l2a = withAct2Enemies(l2aType, 'early', rng)
  const l2b = withAct2Enemies(l2bType, 'early', rng)
  const l3a = withAct2Enemies(l3aType, 'early', rng)
  const l3b = withAct2Enemies(l3bType, 'early', rng)
  const l3c = withAct2Enemies(l3cType, 'early', rng)
  const l4a = withAct2Enemies(l4aType, 'mid', rng)
  const l4b = withAct2Enemies(l4bType, 'mid', rng)
  const l6a = withAct2Enemies(l6aType, 'late', rng)
  const l6b = withAct2Enemies(l6bType, 'late', rng)

  return [
    { id: 'l1_combat', type: 'normal_battle', enemyIds: pickEncounter(ACT2_EARLY_ENCOUNTERS, rng), completed: false, x: 1, y: 0, connections: ['l2_a', 'l2_b'] },

    { id: 'l2_a', ...l2a, completed: false, x: 0, y: 1, connections: ['l3_a', 'l3_b'] },
    { id: 'l2_b', ...l2b, completed: false, x: 2, y: 1, connections: ['l3_b', 'l3_c'] },

    { id: 'l3_a', ...l3a, completed: false, x: 0, y: 2, connections: ['l4_a'] },
    { id: 'l3_b', ...l3b, completed: false, x: 1, y: 2, connections: ['l4_a', 'l4_b'] },
    { id: 'l3_c', ...l3c, completed: false, x: 2, y: 2, connections: ['l4_b'] },

    { id: 'l4_a', ...l4a, completed: false, x: 0.5, y: 3, connections: ['l5_workshop'] },
    { id: 'l4_b', ...l4b, completed: false, x: 1.5, y: 3, connections: ['l5_workshop', 'l5_secret'] },

    { id: 'l5_workshop', type: 'forge', completed: false, x: 0.6, y: 4, connections: ['l6_a', 'l6_b'] },
    {
      id: 'l5_secret',
      type: 'treasure',
      requiresMaterial: 'goblin_crown_fragment',
      completed: false,
      x: 1.8,
      y: 4,
      connections: ['l6_b'],
    },

    { id: 'l6_a', ...l6a, completed: false, x: 0.5, y: 5, connections: ['l7_shop'] },
    { id: 'l6_b', ...l6b, completed: false, x: 1.5, y: 5, connections: ['l7_shop'] },

    { id: 'l7_shop', type: 'shop', completed: false, x: 1, y: 6, connections: ['l8_boss'] },

    { id: 'l8_boss', type: 'boss_battle', enemyIds: ['dark_witch'], completed: false, x: 1, y: 7, connections: [] },
  ]
}

function generateAct3Map(rng: () => number): MapNode[] {
  const l2Pool: NodeType[] = ['normal_battle', 'elite_battle', 'campfire']
  const l3Pool: NodeType[] = ['campfire', 'normal_battle', 'event']
  const l5Pool: NodeType[] = ['normal_battle', 'normal_battle', 'event']
  const l6Pool: NodeType[] = ['normal_battle', 'elite_battle', 'event']
  const l8Pool: NodeType[] = ['normal_battle', 'event']

  const [l2aType, l2bType] = drawWithoutReplacement(l2Pool, 2, rng)
  const [l3bType] = drawWithoutReplacement(l3Pool, 1, rng)
  const [l5aType, l5bType] = drawWithoutReplacement(l5Pool, 2, rng)
  const [l6aType, l6bType] = drawWithoutReplacement(l6Pool, 2, rng)
  const [l8aType] = drawWithoutReplacement(l8Pool, 1, rng)

  const l2a = withAct3Enemies(l2aType, 'early', rng)
  const l2b = withAct3Enemies(l2bType, 'early', rng)
  const l3b = withAct3Enemies(l3bType, 'early', rng)
  const l5a = withAct3Enemies(l5aType, 'mid', rng)
  const l5b = withAct3Enemies(l5bType, 'mid', rng)
  const l6a = withAct3Enemies(l6aType, 'late', rng)
  const l6b = withAct3Enemies(l6bType, 'late', rng)
  const l8a = withAct3Enemies(l8aType, 'late', rng)

  return [
    { id: 'l1_combat', type: 'normal_battle', enemyIds: pickEncounter(ACT3_EARLY_ENCOUNTERS, rng), completed: false, x: 1, y: 0, connections: ['l2_a', 'l2_b'] },

    { id: 'l2_a', ...l2a, completed: false, x: 0, y: 1, connections: ['l3_trial', 'l3_b'] },
    { id: 'l2_b', ...l2b, completed: false, x: 2, y: 1, connections: ['l3_trial', 'l3_b'] },

    { id: 'l3_trial', type: 'trial', enemyIds: pickEncounter(ACT3_MID_ENCOUNTERS, rng), completed: false, x: 0.6, y: 2, connections: ['l4_workshop'] },
    { id: 'l3_b', ...l3b, completed: false, x: 1.6, y: 2, connections: ['l4_workshop'] },

    { id: 'l4_workshop', type: 'forge', completed: false, x: 1, y: 3, connections: ['l5_a', 'l5_b'] },

    { id: 'l5_a', ...l5a, completed: false, x: 0.5, y: 4, connections: ['l6_a', 'l6_b'] },
    { id: 'l5_b', ...l5b, completed: false, x: 1.5, y: 4, connections: ['l6_a', 'l6_b'] },

    { id: 'l6_a', ...l6a, completed: false, x: 0.5, y: 5, connections: ['l7_shop'] },
    { id: 'l6_b', ...l6b, completed: false, x: 1.5, y: 5, connections: ['l7_shop'] },

    { id: 'l7_shop', type: 'shop', completed: false, x: 1, y: 6, connections: ['l8_a', 'l8_sanctum'] },

    { id: 'l8_a', ...l8a, completed: false, x: 0.5, y: 7, connections: ['l9_boss'] },
    { id: 'l8_sanctum', type: 'temple', completed: false, x: 1.5, y: 7, connections: ['l9_boss'] },

    { id: 'l9_boss', type: 'boss_battle', enemyIds: ['abyss_lord'], completed: false, x: 1, y: 8, connections: [] },
  ]
}

export function generateMapByAct(act: 1 | 2 | 3, rng: () => number = Math.random): MapNode[] {
  if (act === 1) return generateAct1Map(rng)
  if (act === 2) return generateAct2Map(rng)
  return generateAct3Map(rng)
}

export function generateMap(rng: () => number = Math.random): MapNode[] {
  return generateMapByAct(1, rng)
}

export function getNodeById(nodes: MapNode[], id: string): MapNode | undefined {
  return nodes.find(n => n.id === id)
}
