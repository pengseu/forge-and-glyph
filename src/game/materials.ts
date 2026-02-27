import type { MaterialBag, MaterialId, NodeType } from './types'

export const MATERIAL_DEFS: Record<MaterialId, { name: string; icon: string }> = {
  iron_ingot: { name: '铁锭', icon: '🪨' },
  steel_ingot: { name: '精钢锭', icon: '⚙️' },
  elemental_essence: { name: '元素精华', icon: '🔥' },
  war_essence: { name: '战魂精华', icon: '⚔️' },
  guard_essence: { name: '守护精华', icon: '🛡️' },
  goblin_crown_fragment: { name: '地精王冠碎片', icon: '👑' },
}

export const MATERIAL_LIMITS: Record<MaterialId, number> = {
  iron_ingot: 5,
  steel_ingot: 5,
  elemental_essence: 8,
  war_essence: 8,
  guard_essence: 8,
  goblin_crown_fragment: 1,
}

export const EMPTY_MATERIAL_BAG: MaterialBag = {
  iron_ingot: 0,
  steel_ingot: 0,
  elemental_essence: 0,
  war_essence: 0,
  guard_essence: 0,
  goblin_crown_fragment: 0,
}

export function addMaterial(
  bag: MaterialBag,
  materialId: MaterialId,
  value: number,
): MaterialBag {
  const current = bag[materialId]
  const cap = MATERIAL_LIMITS[materialId]
  return {
    ...bag,
    [materialId]: Math.min(cap, current + value),
  }
}

export function formatMaterial(materialId: MaterialId): string {
  const def = MATERIAL_DEFS[materialId]
  return `${def.icon} ${def.name}`
}

export function getBattleMaterialEffectText(materialId: MaterialId): string {
  switch (materialId) {
    case 'iron_ingot':
      return '战斗中：+8护甲（每场限1次）'
    case 'steel_ingot':
      return '战斗中：+12护甲（每场限1次）'
    case 'elemental_essence':
      return '战斗中：全体敌人+2灼烧（每场限1次）'
    case 'war_essence':
      return '战斗中：本场力量+2（每场限1次）'
    case 'guard_essence':
      return '战斗中：本场每回合+3护甲（每场限1次）'
    case 'goblin_crown_fragment':
      return 'Boss材料：当前版本暂无战斗内效果'
    default:
      return ''
  }
}

export function rollMaterialReward(nodeType: NodeType, rng: () => number = Math.random): Partial<MaterialBag> {
  if (nodeType === 'elite_battle') {
    const essences: MaterialId[] = ['elemental_essence', 'war_essence', 'guard_essence']
    const e = essences[Math.floor(rng() * essences.length)]
    return { steel_ingot: 1, [e]: 1 }
  }
  if (nodeType === 'boss_battle') {
    return { goblin_crown_fragment: 1 }
  }
  return { iron_ingot: 1 }
}
