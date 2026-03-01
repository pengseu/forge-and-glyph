import type { MaterialBag, MaterialId, NodeType } from './types'

export const MATERIAL_DEFS: Record<MaterialId, { name: string; icon: string }> = {
  iron_ingot: { name: '铁锭', icon: '🪨' },
  steel_ingot: { name: '精钢锭', icon: '⚙️' },
  mythril_ingot: { name: '秘银锭', icon: '🥈' },
  meteor_iron_ingot: { name: '陨铁锭', icon: '☄️' },
  elemental_essence: { name: '元素精华', icon: '🔥' },
  war_essence: { name: '战魂精华', icon: '⚔️' },
  guard_essence: { name: '守护精华', icon: '🛡️' },
  goblin_crown_fragment: { name: '地精王冠碎片', icon: '👑' },
  shadow_crystal: { name: '暗影水晶', icon: '🌙' },
  abyss_heart: { name: '深渊之心', icon: '🕳️' },
}

export const MATERIAL_LIMITS: Record<MaterialId, number> = {
  iron_ingot: 5,
  steel_ingot: 5,
  mythril_ingot: 5,
  meteor_iron_ingot: 3,
  elemental_essence: 8,
  war_essence: 8,
  guard_essence: 8,
  goblin_crown_fragment: 1,
  shadow_crystal: 1,
  abyss_heart: 1,
}

export const EMPTY_MATERIAL_BAG: MaterialBag = {
  iron_ingot: 0,
  steel_ingot: 0,
  mythril_ingot: 0,
  meteor_iron_ingot: 0,
  elemental_essence: 0,
  war_essence: 0,
  guard_essence: 0,
  goblin_crown_fragment: 0,
  shadow_crystal: 0,
  abyss_heart: 0,
}

const ESSENCE_IDS: MaterialId[] = ['elemental_essence', 'war_essence', 'guard_essence']

function essenceTotal(bag: MaterialBag): number {
  return ESSENCE_IDS.reduce((sum, id) => sum + bag[id], 0)
}

export function addMaterial(
  bag: MaterialBag,
  materialId: MaterialId,
  value: number,
): MaterialBag {
  const current = bag[materialId]
  const cap = MATERIAL_LIMITS[materialId]
  let next = Math.min(cap, current + value)

  // Essence shares a global cap (total of all three essences <= 8).
  if (ESSENCE_IDS.includes(materialId)) {
    const totalWithoutCurrent = essenceTotal(bag) - current
    const maxForThisEssence = Math.max(0, 8 - totalWithoutCurrent)
    next = Math.min(next, maxForThisEssence)
  }

  return {
    ...bag,
    [materialId]: next,
  }
}

export function formatMaterial(materialId: MaterialId): string {
  const def = MATERIAL_DEFS[materialId]
  return `${def.icon} ${def.name}`
}

export function getBattleMaterialEffectText(materialId: MaterialId): string {
  switch (materialId) {
    case 'iron_ingot':
      return '战斗中：+10护甲（每场限1次）'
    case 'steel_ingot':
      return '战斗中：+15护甲（每场限1次）'
    case 'elemental_essence':
      return '战斗中：全体敌人+3灼烧（每场限1次）'
    case 'war_essence':
      return '战斗中：本场力量+3（每场限1次）'
    case 'guard_essence':
      return '战斗中：本场每回合+5护甲（每场限1次）'
    case 'mythril_ingot':
      return '战斗中：本回合所有卡费用-1（每场限1次）'
    case 'meteor_iron_ingot':
      return '战斗中：本回合所有攻击伤害+50%（每场限1次）'
    case 'goblin_crown_fragment':
      return 'Boss材料：用于剧情/锻造/传承系统'
    case 'shadow_crystal':
      return 'Boss材料：用于幕间传说锻造催化'
    case 'abyss_heart':
      return 'Boss材料：传承时可保留2个附魔'
    default:
      return ''
  }
}

export function rollMaterialReward(nodeType: NodeType, rng: () => number = Math.random): Partial<MaterialBag> {
  return rollMaterialRewardByAct(nodeType, 1, rng)
}

export function rollMaterialRewardByAct(
  nodeType: NodeType,
  act: 1 | 2 | 3,
  rng: () => number = Math.random,
): Partial<MaterialBag> {
  const randomEssence = (): MaterialId => {
    const essences: MaterialId[] = ['elemental_essence', 'war_essence', 'guard_essence']
    return essences[Math.floor(rng() * essences.length)]
  }
  const randomEssenceBundle = (count: number): Partial<MaterialBag> => {
    const drop: Partial<MaterialBag> = {}
    for (let i = 0; i < count; i++) {
      const id = randomEssence()
      drop[id] = (drop[id] ?? 0) + 1
    }
    return drop
  }

  if (nodeType === 'boss_battle') {
    if (act === 1) return { goblin_crown_fragment: 1 }
    if (act === 2) return { shadow_crystal: 1, steel_ingot: 1, ...randomEssenceBundle(1) }
    return { abyss_heart: 1, meteor_iron_ingot: 1, ...randomEssenceBundle(2) }
  }

  if (act === 1) {
    if (nodeType === 'elite_battle' || nodeType === 'trial') {
      return { elemental_essence: 1 }
    }
    return { iron_ingot: 1 }
  }

  if (act === 2) {
    if (nodeType === 'elite_battle' || nodeType === 'trial') {
      return { steel_ingot: 1, ...randomEssenceBundle(1) }
    }
    return rng() < 0.5 ? { iron_ingot: 1 } : { steel_ingot: 1 }
  }

  if (nodeType === 'elite_battle' || nodeType === 'trial') {
    if (rng() < 0.2) {
      return { mythril_ingot: 1, meteor_iron_ingot: 1, ...randomEssenceBundle(2) }
    }
    return { mythril_ingot: 1, ...randomEssenceBundle(2) }
  }
  return rng() < 0.6 ? { steel_ingot: 1 } : { mythril_ingot: 1 }
}
