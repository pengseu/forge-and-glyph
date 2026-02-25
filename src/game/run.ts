import type { RunState, CardInstance } from './types'
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
