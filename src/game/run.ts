import type { RunState, CardInstance, WeaponInstance } from './types'
import { generateMap } from './map'
import { STARTER_DECK_RECIPE } from './cards'
import { getCardDef } from './cards'

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
    return {
      ...state,
      equippedWeapon: upgraded,
    }
  }
  return state
}
