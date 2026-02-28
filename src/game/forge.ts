import type { MaterialBag, MaterialId } from './types'

export interface ForgeRecipe {
  id: string
  weaponDefId: string
  name: string
  cost: Partial<Record<MaterialId, number>>
  anyEssenceCost?: number
}

export const FORGE_RECIPES: ForgeRecipe[] = [
  {
    id: 'forge_iron_longsword',
    weaponDefId: 'iron_longsword',
    name: '铁制长剑',
    cost: { iron_ingot: 2 },
  },
  {
    id: 'forge_iron_dagger',
    weaponDefId: 'iron_dagger',
    name: '铁制匕首',
    cost: { iron_ingot: 2 },
  },
  {
    id: 'forge_steel_longsword',
    weaponDefId: 'steel_longsword',
    name: '精钢长剑',
    cost: { steel_ingot: 2 },
    anyEssenceCost: 1,
  },
  {
    id: 'forge_iron_hammer',
    weaponDefId: 'iron_hammer',
    name: '铁制战锤',
    cost: { iron_ingot: 2 },
  },
  {
    id: 'forge_iron_bow',
    weaponDefId: 'iron_bow',
    name: '铁制弓',
    cost: { iron_ingot: 2 },
  },
  {
    id: 'forge_iron_staff',
    weaponDefId: 'iron_staff',
    name: '铁制法杖',
    cost: { iron_ingot: 2 },
  },
]

export function canPayMaterials(
  bag: MaterialBag,
  cost: Partial<Record<MaterialId, number>>,
  anyEssenceCost: number = 0,
): boolean {
  for (const [k, v] of Object.entries(cost)) {
    const mat = k as MaterialId
    if ((v ?? 0) > bag[mat]) return false
  }
  if (anyEssenceCost > 0) {
    const totalEssence = bag.elemental_essence + bag.war_essence + bag.guard_essence
    if (totalEssence < anyEssenceCost) return false
  }
  return true
}
