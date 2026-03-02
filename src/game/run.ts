import type { RunState, CardInstance, WeaponInstance, NodeType, EnchantmentId } from './types'
import { generateMap } from './map'
import { createStarterDeck } from './cards'
import { getCardDef, getRewardPoolByAct } from './cards'
import { EMPTY_MATERIAL_BAG, addMaterial } from './materials'
import { canPayMaterials, FORGE_RECIPES, isRecipeUnlocked, resolveRecipeCost } from './forge'
import { getShopServicePricingByAct } from './shop'
import { RUN_BASE_CONFIG, resolveBattleGoldRange } from './config'

export function createRunState(
  seed?: Pick<RunState, 'unlockedBlueprints' | 'blueprintMastery' | 'legacyWeaponDefId' | 'legacyWeaponEnchantments'>,
  rng: () => number = Math.random,
): RunState {
  const mapNodes = generateMap(rng)
  return {
    act: 1,
    currentNodeId: mapNodes[0].id,
    visitedNodes: new Set(),
    deck: createStarterDeck(),
    mapNodes,
    turn: 0,
    equippedWeapon: null,
    weaponInventory: [],
    playerHp: RUN_BASE_CONFIG.startingHp,
    playerMaxHp: RUN_BASE_CONFIG.startingHp,
    gold: RUN_BASE_CONFIG.startingGold,
    bonusStrength: 0,
    bonusWisdom: 0,
    bonusMaxMana: 0,
    nextBattleEnemyStrengthBonus: 0,
    materials: { ...EMPTY_MATERIAL_BAG },
    unlockedBlueprints: [...(seed?.unlockedBlueprints ?? [])],
    blueprintMastery: { ...(seed?.blueprintMastery ?? {}) },
    legacyWeaponDefId: seed?.legacyWeaponDefId ?? null,
    legacyWeaponEnchantments: [...(seed?.legacyWeaponEnchantments ?? [])],
    legacyEventSeen: false,
    replicaEliteKills: {},
    completedReplicaInheritanceBlueprints: [],
  }
}

export function moveToNode(state: RunState, nodeId: string): RunState {
  const node = state.mapNodes.find(n => n.id === nodeId)
  if (!node) return state

  return {
    ...state,
    currentNodeId: nodeId,
    visitedNodes: new Set([...state.visitedNodes, nodeId]),
  }
}

export function canAccessNode(state: RunState, nodeId: string): boolean {
  const node = state.mapNodes.find(n => n.id === nodeId)
  if (!node || node.completed) return false
  if (node.requiresMaterial && state.materials[node.requiresMaterial] <= 0) return false
  if (nodeId === state.currentNodeId) return true
  const current = state.mapNodes.find(n => n.id === state.currentNodeId)
  if (!current?.completed) return false
  return current?.connections.includes(nodeId) ?? false
}

export function completeNode(state: RunState, nodeId: string): RunState {
  const node = state.mapNodes.find(n => n.id === nodeId)
  if (!node) return state

  return {
    ...state,
    mapNodes: state.mapNodes.map(n =>
      n.id === nodeId ? { ...n, completed: true } : n
    ),
  }
}

export function isBossNode(state: RunState, nodeId: string = state.currentNodeId): boolean {
  const node = state.mapNodes.find(n => n.id === nodeId)
  return node?.type === 'boss_battle'
}

export function applyBattleVictoryRewards(state: RunState, nodeType: NodeType): RunState {
  const baseHeal = RUN_BASE_CONFIG.postBattleHeal
  if (nodeType !== 'elite_battle' && nodeType !== 'trial') {
    return {
      ...state,
      playerHp: Math.min(state.playerMaxHp, state.playerHp + baseHeal),
    }
  }
  const nextMaxHp = state.playerMaxHp + RUN_BASE_CONFIG.eliteBonusMaxHp
  return {
    ...state,
    playerMaxHp: nextMaxHp,
    playerHp: Math.min(nextMaxHp, state.playerHp + baseHeal + RUN_BASE_CONFIG.eliteBonusHeal),
  }
}

export function generateBattleGold(nodeType: NodeType, rng: () => number = Math.random): number {
  const range = resolveBattleGoldRange(nodeType)
  return range.min + Math.floor(rng() * (range.max - range.min + 1))
}

export function addBattleGoldReward(state: RunState, goldReward: number): RunState {
  return { ...state, gold: state.gold + goldReward }
}

export function applySkipRewardCompensation(state: RunState): RunState {
  // New in v2.0: skipping reward grants +25 gold compensation.
  return { ...state, gold: state.gold + 25 }
}

export function addMaterialReward(
  state: RunState,
  rewards: Partial<RunState['materials']>,
): RunState {
  let materials = { ...state.materials }
  for (const [k, v] of Object.entries(rewards)) {
    const value = v ?? 0
    if (value <= 0) continue
    materials = addMaterial(materials, k as keyof RunState['materials'], value)
  }
  return { ...state, materials }
}

export function addCardToDeck(state: RunState, cardId: string, rng: () => number = Math.random): RunState {
  const def = getCardDef(cardId)
  const newCard: CardInstance = {
    uid: `card_${Date.now()}_${rng()}`,
    defId: def.id,
  }
  return {
    ...state,
    deck: [...state.deck, newCard],
  }
}

export function removeCardFromDeck(state: RunState, cardUid: string): RunState {
  const pricing = getShopServicePricingByAct(state.act)
  if (state.gold < pricing.removePrice) return state
  const exists = state.deck.some(c => c.uid === cardUid)
  if (!exists) return state
  return {
    ...state,
    gold: state.gold - pricing.removePrice,
    deck: state.deck.filter(c => c.uid !== cardUid),
  }
}

export function healInShop(state: RunState): RunState {
  const pricing = getShopServicePricingByAct(state.act)
  if (state.gold < pricing.healPrice || state.playerHp >= state.playerMaxHp) return state
  const healValue = Math.floor(state.playerMaxHp * pricing.healPercent)
  return {
    ...state,
    gold: state.gold - pricing.healPrice,
    playerHp: Math.min(state.playerMaxHp, state.playerHp + healValue),
  }
}

export function transformCardInShop(state: RunState, cardUid: string, rng: () => number = Math.random): RunState {
  const pricing = getShopServicePricingByAct(state.act)
  const transformPrice = pricing.transformPrice
  if (!transformPrice || state.gold < transformPrice) return state
  const index = state.deck.findIndex(card => card.uid === cardUid)
  if (index === -1) return state
  const target = state.deck[index]
  const targetDef = getCardDef(target.defId)
  const pool = getRewardPoolByAct(state.act)
    .filter(card => card.rarity === targetDef.rarity && card.id !== target.defId)
  if (pool.length === 0) return state
  const picked = pool[Math.floor(rng() * pool.length)]
  if (!picked) return state
  return {
    ...state,
    gold: state.gold - transformPrice,
    deck: state.deck.map((card, i) =>
      i === index ? { ...card, defId: picked.id, upgraded: false } : card
    ),
  }
}

export function addWeaponToInventory(state: RunState, weaponDefId: string): RunState {
  const newWeapon: WeaponInstance = {
    uid: `weapon_${Date.now()}_${Math.random()}`,
    defId: weaponDefId,
    enchantments: [],
  }
  return {
    ...state,
    weaponInventory: [...state.weaponInventory, newWeapon],
  }
}

export function craftWeapon(state: RunState, recipeId: string): RunState {
  const recipe = FORGE_RECIPES.find(r => r.id === recipeId)
  if (!recipe) return state
  if (!isRecipeUnlocked(state, recipe)) return state

  const masteryLevel = recipe.requiresBlueprint ? (state.blueprintMastery?.[recipe.requiresBlueprint] ?? 0) : 0
  const effective = resolveRecipeCost(recipe, masteryLevel)
  if (!canPayMaterials(state.materials, effective.cost, effective.anyEssenceCost ?? 0)) return state

  let nextMaterials = { ...state.materials }
  for (const [k, v] of Object.entries(effective.cost)) {
    const key = k as keyof RunState['materials']
    nextMaterials[key] = Math.max(0, nextMaterials[key] - (v ?? 0))
  }
  if ((effective.anyEssenceCost ?? 0) > 0) {
    let remaining = effective.anyEssenceCost ?? 0
    const essenceOrder: Array<keyof RunState['materials']> = ['elemental_essence', 'war_essence', 'guard_essence']
    for (const essence of essenceOrder) {
      if (remaining <= 0) break
      const take = Math.min(nextMaterials[essence], remaining)
      nextMaterials[essence] -= take
      remaining -= take
    }
  }

  let withCostPaid: RunState = { ...state, materials: nextMaterials }
  if (recipe.requiresBlueprint) {
    const current = withCostPaid.blueprintMastery?.[recipe.requiresBlueprint] ?? 0
    withCostPaid = {
      ...withCostPaid,
      blueprintMastery: {
        ...(withCostPaid.blueprintMastery ?? {}),
        [recipe.requiresBlueprint]: Math.min(3, current + 1),
      },
    }
  }
  return addWeaponToInventory(withCostPaid, recipe.weaponDefId)
}

export function equipWeapon(state: RunState, weaponUid: string): RunState {
  const weapon = state.weaponInventory.find(w => w.uid === weaponUid)
  if (!weapon) return state
  return {
    ...state,
    equippedWeapon: weapon,
  }
}

export function upgradeEquippedWeapon(state: RunState): RunState {
  if (!state.equippedWeapon) return state
  const upgradeMap: Record<string, string> = {
    iron_longsword: 'steel_longsword',
    iron_staff: 'steel_staff',
    iron_dagger: 'steel_dagger',
    iron_hammer: 'steel_hammer',
    iron_bow: 'steel_bow',
  }
  const nextDefId = upgradeMap[state.equippedWeapon.defId]
  if (!nextDefId) return state
  const upgraded: WeaponInstance = {
    ...state.equippedWeapon,
    defId: nextDefId,
  }
  const weaponInventory = state.weaponInventory.map(w =>
    w.uid === upgraded.uid ? { ...w, defId: nextDefId } : w
  )
  return {
    ...state,
    equippedWeapon: upgraded,
    weaponInventory,
  }
}

export function enchantWeapon(
  state: RunState,
  enchantmentId: EnchantmentId,
  replaceIndex?: number,
): RunState {
  if (!state.equippedWeapon) return state
  if (state.materials.elemental_essence < 1) return state

  const current = state.equippedWeapon.enchantments
  let nextEnchantments: EnchantmentId[] = current

  if (current.length < 2) {
    nextEnchantments = [...current, enchantmentId]
  } else {
    if (replaceIndex === undefined || replaceIndex < 0 || replaceIndex > 1) return state
    nextEnchantments = current.map((e, i) => (i === replaceIndex ? enchantmentId : e))
  }

  const updatedWeapon: WeaponInstance = {
    ...state.equippedWeapon,
    enchantments: nextEnchantments,
  }
  return {
    ...state,
    equippedWeapon: updatedWeapon,
    weaponInventory: state.weaponInventory.map(w => (w.uid === updatedWeapon.uid ? updatedWeapon : w)),
    materials: {
      ...state.materials,
      elemental_essence: state.materials.elemental_essence - 1,
    },
  }
}
