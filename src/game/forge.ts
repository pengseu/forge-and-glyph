import type { MaterialBag, MaterialId } from './types'
import type { RunState } from './types'

export interface ForgeRecipe {
  id: string
  weaponDefId: string
  name: string
  cost: Partial<Record<MaterialId, number>>
  anyEssenceCost?: number
  requiresBlueprint?: string
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
  {
    id: 'forge_steel_longsword',
    weaponDefId: 'steel_longsword',
    name: '精钢长剑',
    cost: { steel_ingot: 2 },
    anyEssenceCost: 1,
  },
  {
    id: 'forge_steel_staff',
    weaponDefId: 'steel_staff',
    name: '精钢法杖',
    cost: { steel_ingot: 2 },
    anyEssenceCost: 1,
  },
  {
    id: 'forge_steel_dagger',
    weaponDefId: 'steel_dagger',
    name: '精钢匕首',
    cost: { steel_ingot: 2 },
    anyEssenceCost: 1,
  },
  {
    id: 'forge_steel_hammer',
    weaponDefId: 'steel_hammer',
    name: '精钢战锤',
    cost: { steel_ingot: 2 },
    anyEssenceCost: 1,
  },
  {
    id: 'forge_steel_bow',
    weaponDefId: 'steel_bow',
    name: '精钢弓',
    cost: { steel_ingot: 2 },
    anyEssenceCost: 1,
  },
  {
    id: 'forge_replica_ant_swarm_dagger',
    weaponDefId: 'replica_ant_swarm_dagger',
    name: '凡人仿品·蚁群',
    cost: { iron_ingot: 3, elemental_essence: 1 },
    requiresBlueprint: 'mythic_ant_swarm_dagger',
  },
  {
    id: 'forge_replica_twilight_staff',
    weaponDefId: 'replica_twilight_staff',
    name: '凡人仿品·暮影',
    cost: { steel_ingot: 3, elemental_essence: 1 },
    requiresBlueprint: 'mythic_twilight_staff',
  },
  {
    id: 'forge_replica_finale_greatsword',
    weaponDefId: 'replica_finale_greatsword',
    name: '凡人仿品·终焉',
    cost: { mythril_ingot: 3, war_essence: 1 },
    requiresBlueprint: 'mythic_finale_greatsword',
  },
]

export function resolveRecipeCost(recipe: ForgeRecipe, masteryLevel: number): Pick<ForgeRecipe, 'cost' | 'anyEssenceCost'> {
  const normalizedMastery = Math.max(0, Math.min(3, Math.floor(masteryLevel)))
  const cost: Partial<Record<MaterialId, number>> = { ...recipe.cost }
  let anyEssenceCost = recipe.anyEssenceCost ?? 0
  if (normalizedMastery >= 1) {
    anyEssenceCost = Math.max(0, anyEssenceCost - 1)
  }
  if (normalizedMastery >= 3) {
    const keys = Object.keys(cost) as MaterialId[]
    if (keys.length > 0) {
      const first = keys[0]
      cost[first] = Math.max(0, (cost[first] ?? 0) - 1)
    }
  }
  return { cost, anyEssenceCost }
}

export function isRecipeUnlocked(run: RunState, recipe: ForgeRecipe): boolean {
  if (!recipe.requiresBlueprint) return true
  return run.unlockedBlueprints?.includes(recipe.requiresBlueprint) ?? false
}

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
