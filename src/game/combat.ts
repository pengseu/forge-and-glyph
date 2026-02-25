import type { BattleState, CardInstance } from './types'
import { getCardDef, STARTER_DECK_RECIPE } from './cards'
import { getEnemyDef } from './enemies'
import { applyCardEffects } from './effects'

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function createDeck(): CardInstance[] {
  const cards: CardInstance[] = []
  let uid = 0
  for (const recipe of STARTER_DECK_RECIPE) {
    for (let i = 0; i < recipe.count; i++) {
      cards.push({ uid: `card_${uid++}`, defId: recipe.cardId })
    }
  }
  return shuffleArray(cards)
}

export function createBattleState(): BattleState {
  const drawPile = createDeck()
  return {
    player: {
      hp: 50,
      maxHp: 50,
      stamina: 3,
      maxStamina: 3,
      mana: 2,
      maxMana: 2,
      armor: 0,
      hand: [],
      drawPile,
      discardPile: [],
    },
    enemy: {
      defId: 'goblin_scout',
      hp: 20,
      maxHp: 20,
      armor: 0,
      strength: 0,
      burn: 0,
      intentIndex: 0,
    },
    turn: 0,
    phase: 'player_turn',
  }
}

function drawCards(state: BattleState, count: number): BattleState {
  let { drawPile, discardPile, hand } = state.player
  const newHand = [...hand]

  for (let i = 0; i < count; i++) {
    if (drawPile.length === 0) {
      drawPile = shuffleArray(discardPile)
      discardPile = []
    }
    if (drawPile.length > 0) {
      newHand.push(drawPile.pop()!)
    }
  }

  return {
    ...state,
    player: { ...state.player, hand: newHand, drawPile, discardPile },
  }
}

export function startTurn(state: BattleState): BattleState {
  let s = state

  // Refresh resources
  s = { ...s, player: { ...s.player, stamina: s.player.maxStamina, mana: s.player.maxMana } }

  // Clear armor
  s = { ...s, player: { ...s.player, armor: 0 } }

  // Resolve burn on enemy
  if (s.enemy.burn > 0) {
    s = applyCardEffects(s, [{ type: 'damage', value: s.enemy.burn }])
    s = { ...s, enemy: { ...s.enemy, burn: Math.max(0, s.enemy.burn - 1) } }
  }

  // Draw 5 cards
  s = drawCards(s, 5)

  // Increment turn and set phase
  s = { ...s, turn: s.turn + 1, phase: 'player_turn' }

  return s
}

export function canPlayCard(state: BattleState, cardUid: string): boolean {
  const card = state.player.hand.find(c => c.uid === cardUid)
  if (!card) return false

  const def = getCardDef(card.defId)
  if (def.costType === 'stamina') {
    return state.player.stamina >= def.cost
  } else if (def.costType === 'mana') {
    return state.player.mana >= def.cost
  }
  return true // free cards always playable
}

export function playCard(state: BattleState, cardUid: string): BattleState {
  if (!canPlayCard(state, cardUid)) return state

  const cardIndex = state.player.hand.findIndex(c => c.uid === cardUid)
  if (cardIndex === -1) return state

  const card = state.player.hand[cardIndex]
  const def = getCardDef(card.defId)

  // Deduct resource
  let s = state
  if (def.costType === 'stamina') {
    s = { ...s, player: { ...s.player, stamina: s.player.stamina - def.cost } }
  } else if (def.costType === 'mana') {
    s = { ...s, player: { ...s.player, mana: s.player.mana - def.cost } }
  }

  // Apply effects
  s = applyCardEffects(s, def.effects)

  // Move card to discard
  const newHand = s.player.hand.filter((_, i) => i !== cardIndex)
  const newDiscard = [...s.player.discardPile, card]
  s = { ...s, player: { ...s.player, hand: newHand, discardPile: newDiscard } }

  // Check victory
  if (s.enemy.hp <= 0) {
    s = { ...s, phase: 'victory' }
  }

  return s
}

export function endPlayerTurn(state: BattleState): BattleState {
  let s = state

  // Execute enemy intent
  const enemyDef = getEnemyDef(s.enemy.defId)
  const intent = enemyDef.intents[s.enemy.intentIndex]

  if (intent.type === 'attack') {
    const damage = intent.value + s.enemy.strength
    let remaining = damage
    let armor = s.player.armor
    let hp = s.player.hp

    if (armor > 0) {
      const absorbed = Math.min(armor, remaining)
      armor -= absorbed
      remaining -= absorbed
    }
    hp = Math.max(0, hp - remaining)

    s = { ...s, player: { ...s.player, armor, hp } }
  } else if (intent.type === 'buff') {
    if (intent.buffType === 'strength') {
      s = { ...s, enemy: { ...s.enemy, strength: s.enemy.strength + intent.value } }
    }
  }

  // Check defeat
  if (s.player.hp <= 0) {
    s = { ...s, phase: 'defeat' }
    return s
  }

  // Advance intent index
  s = { ...s, enemy: { ...s.enemy, intentIndex: (s.enemy.intentIndex + 1) % enemyDef.intents.length } }

  // Discard all hand cards
  const newDiscard = [...s.player.discardPile, ...s.player.hand]
  s = { ...s, player: { ...s.player, hand: [], discardPile: newDiscard } }

  // Start next turn
  s = startTurn(s)

  return s
}
