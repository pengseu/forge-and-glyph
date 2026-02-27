import type { RunState, CardInstance, WeaponInstance, NodeType } from './types'
import { generateMap } from './map'
import { STARTER_DECK_RECIPE } from './cards'
import { getCardDef } from './cards'
import { EMPTY_MATERIAL_BAG, addMaterial } from './materials'
import { canPayMaterials, FORGE_RECIPES } from './forge'

function createDeck(): CardInstance[] {
  const cards: CardInstance[] = []
  let uid = 0
  for (const recipe of STARTER_DECK_RECIPE) {
    for (let i = 0; i < recipe.count; i++) {
      cards.push({ uid: `card_${uid++}`, defId: recipe.cardId })
    }
  }
  return cards
}

export function createRunState(): RunState {
  const mapNodes = generateMap()
  return {
    currentNodeId: mapNodes[0].id,
    visitedNodes: new Set(),
    deck: createDeck(),
    mapNodes,
    turn: 0,
    equippedWeapon: null,
    weaponInventory: [],
    playerHp: 50,
    playerMaxHp: 50,
    gold: 0,
    materials: { ...EMPTY_MATERIAL_BAG },
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
  if (nodeId === state.currentNodeId) return true
  const current = state.mapNodes.find(n => n.id === state.currentNodeId)
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
  if (nodeType !== 'elite_battle') return state
  const nextMaxHp = state.playerMaxHp + 5
  return {
    ...state,
    playerMaxHp: nextMaxHp,
    playerHp: Math.min(nextMaxHp, state.playerHp + 5),
  }
}

export function generateBattleGold(nodeType: NodeType, rng: () => number = Math.random): number {
  if (nodeType === 'elite_battle') {
    return 30 + Math.floor(rng() * 11)
  }
  if (nodeType === 'boss_battle') {
    return 50 + Math.floor(rng() * 21)
  }
  return 15 + Math.floor(rng() * 11)
}

export function addBattleGoldReward(state: RunState, goldReward: number): RunState {
  return { ...state, gold: state.gold + goldReward }
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

export function addCardToDeck(state: RunState, cardId: string): RunState {
  const def = getCardDef(cardId)
  const newCard: CardInstance = {
    uid: `card_${Date.now()}_${Math.random()}`,
    defId: def.id,
  }
  return {
    ...state,
    deck: [...state.deck, newCard],
  }
}

export function removeCardFromDeck(state: RunState, cardUid: string): RunState {
  if (state.gold < 50) return state
  const exists = state.deck.some(c => c.uid === cardUid)
  if (!exists) return state
  return {
    ...state,
    gold: state.gold - 50,
    deck: state.deck.filter(c => c.uid !== cardUid),
  }
}

export function healInShop(state: RunState): RunState {
  if (state.gold < 30 || state.playerHp >= state.playerMaxHp) return state
  const healValue = Math.floor(state.playerMaxHp * 0.3)
  return {
    ...state,
    gold: state.gold - 30,
    playerHp: Math.min(state.playerMaxHp, state.playerHp + healValue),
  }
}

export function addWeaponToInventory(state: RunState, weaponDefId: string): RunState {
  const newWeapon: WeaponInstance = {
    uid: `weapon_${Date.now()}_${Math.random()}`,
    defId: weaponDefId,
  }
  return {
    ...state,
    weaponInventory: [...state.weaponInventory, newWeapon],
  }
}

export function craftWeapon(state: RunState, recipeId: string): RunState {
  const recipe = FORGE_RECIPES.find(r => r.id === recipeId)
  if (!recipe) return state
  if (!canPayMaterials(state.materials, recipe.cost)) return state

  let nextMaterials = { ...state.materials }
  for (const [k, v] of Object.entries(recipe.cost)) {
    const key = k as keyof RunState['materials']
    nextMaterials[key] = Math.max(0, nextMaterials[key] - (v ?? 0))
  }

  const withCostPaid = { ...state, materials: nextMaterials }
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
  if (state.equippedWeapon.defId === 'longsword') {
    const upgraded: WeaponInstance = {
      ...state.equippedWeapon,
      defId: 'longsword_upgraded',
    }
    const weaponInventory = state.weaponInventory.map(w =>
      w.uid === upgraded.uid ? { ...w, defId: 'longsword_upgraded' } : w
    )
    return {
      ...state,
      equippedWeapon: upgraded,
      weaponInventory,
    }
  }
  return state
}
