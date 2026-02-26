import type { BattleState, CardInstance, EnemyState, TurnTracking } from './types'
import { STARTER_DECK_RECIPE } from './cards'
import { getEnemyDef } from './enemies'
import { applyCardEffects } from './effects'
import { getEffectiveCardDef } from './campfire'

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

function defaultTurnTracking(): TurnTracking {
  return {
    combatCardsPlayedThisTurn: 0,
    damageTakenThisTurn: 0,
    bonusManaNextTurn: 0,
    combatDamageBonus: 0,
  }
}

function createEnemyState(enemyId: string): EnemyState {
  const def = getEnemyDef(enemyId)
  return {
    defId: enemyId,
    hp: def.maxHp,
    maxHp: def.maxHp,
    armor: 0,
    strength: 0,
    burn: 0,
    freeze: 0,
    poison: 0,
    weakened: 0,
    vulnerable: 0,
    freezeImmune: false,
    intentIndex: 0,
    damagedThisTurn: false,
  }
}

function allEnemiesDead(state: BattleState): boolean {
  return state.enemies.every(e => e.hp <= 0)
}

export function createBattleState(enemyIds: string[], initialDeck?: CardInstance[], weaponDefId?: string): BattleState {
  const deck = initialDeck || createDeck()
  const drawPile = shuffleArray(deck)
  return {
    player: {
      hp: 50,
      maxHp: 50,
      stamina: 3,
      maxStamina: 3,
      mana: 2,
      maxMana: 2,
      armor: 0,
      strength: 0,
      weaponDiscount: 0,
      equippedWeaponId: weaponDefId ?? null,
      buffNextCombat: 0,
      poisonOnAttack: 0,
      buffNextCombatDouble: false,
      buffNextSpellDamage: 0,
      buffNextSpellMana: 0,
      poison: 0,
      wisdom: 0,
      barrier: 0,
      charge: 0,
      weakened: 0,
      hand: [],
      drawPile,
      discardPile: [],
    },
    enemies: enemyIds.map(id => createEnemyState(id)),
    turn: 0,
    phase: 'player_turn',
    turnTracking: defaultTurnTracking(),
  }
}

export function drawCards(state: BattleState, count: number): BattleState {
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

  // Refresh resources (+ bonus mana from previous turn)
  const bonusMana = s.turnTracking.bonusManaNextTurn
  s = {
    ...s,
    player: { ...s.player, stamina: s.player.maxStamina, mana: s.player.maxMana + bonusMana },
    turnTracking: defaultTurnTracking(),
  }

  // Clear player armor (barrier preserves up to N points)
  s = { ...s, player: { ...s.player, armor: Math.min(s.player.armor, s.player.barrier) } }

  // Reset per-enemy damagedThisTurn, clear enemy armor
  s = { ...s, enemies: s.enemies.map(e => ({ ...e, damagedThisTurn: false, armor: 0 })) }

  // Player poison tick (poison doesn't decay)
  if (s.player.poison > 0) {
    const poisonDmg = s.player.poison
    const newHp = Math.max(0, s.player.hp - poisonDmg)
    s = { ...s, player: { ...s.player, hp: newHp } }
    s = { ...s, turnTracking: { ...s.turnTracking, damageTakenThisTurn: s.turnTracking.damageTakenThisTurn + poisonDmg } }
    if (s.player.hp <= 0) {
      return { ...s, phase: 'defeat' }
    }
  }

  if (allEnemiesDead(s)) {
    return { ...s, phase: 'victory' }
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

  const def = getEffectiveCardDef(card)
  if (def.costType === 'stamina') {
    const actualCost = Math.max(0, def.cost - state.player.weaponDiscount)
    return state.player.stamina >= actualCost
  } else if (def.costType === 'mana') {
    return state.player.mana >= def.cost
  }
  return true
}

/** Check if a card's effects need a single-target enemy selection */
export function cardNeedsTarget(effects: import('./types').CardEffect[]): boolean {
  const singleTargetTypes = ['damage', 'multi_damage', 'chain_damage', 'execute',
    'conditional_damage', 'scaling_damage', 'damage_gain_armor', 'lifesteal',
    'burn', 'freeze', 'poison', 'weaken_enemy', 'vulnerable']
  const hasAoe = effects.some(e => e.type === 'aoe_damage' || e.type === 'aoe_burn')
  if (hasAoe) return false
  return effects.some(e => singleTargetTypes.includes(e.type))
}

export function playCard(state: BattleState, cardUid: string, targetIndex: number = 0): BattleState {
  if (!canPlayCard(state, cardUid)) return state

  const cardIndex = state.player.hand.findIndex(c => c.uid === cardUid)
  if (cardIndex === -1) return state

  const card = state.player.hand[cardIndex]
  const def = getEffectiveCardDef(card)

  // Deduct resource
  let s = state
  if (def.costType === 'stamina') {
    const actualCost = Math.max(0, def.cost - s.player.weaponDiscount)
    const newDiscount = s.player.weaponDiscount > 0 ? 0 : s.player.weaponDiscount
    s = { ...s, player: { ...s.player, stamina: s.player.stamina - actualCost, weaponDiscount: newDiscount } }
  } else if (def.costType === 'mana') {
    s = { ...s, player: { ...s.player, mana: s.player.mana - def.cost } }
  }

  // Apply effects
  s = applyCardEffects(s, def.effects, targetIndex, def.category)

  // Handle draw_cards effect
  for (const eff of def.effects) {
    if (eff.type === 'draw_cards') {
      s = drawCards(s, eff.value)
    }
  }

  // Move card to discard
  const newHand = s.player.hand.filter((_, i) => i !== cardIndex)
  const newDiscard = [...s.player.discardPile, card]
  s = { ...s, player: { ...s.player, hand: newHand, discardPile: newDiscard } }

  // Track combat cards played
  if (def.category === 'combat') {
    s = { ...s, turnTracking: { ...s.turnTracking, combatCardsPlayedThisTurn: s.turnTracking.combatCardsPlayedThisTurn + 1 } }
  }

  // Weapon effect
  if (def.category === 'combat' && s.player.equippedWeaponId) {
    const discountValue = s.player.equippedWeaponId === 'longsword_upgraded' ? 2 : 1
    s = { ...s, player: { ...s.player, weaponDiscount: discountValue } }
  }

  // Check victory
  if (allEnemiesDead(s)) {
    s = { ...s, phase: 'victory' }
  }

  return s
}

export function endPlayerTurn(state: BattleState): BattleState {
  let s = state

  // Capture enemy count so newly summoned enemies don't act this turn
  const enemyCountBeforeActions = s.enemies.length

  // Each living enemy acts
  for (let ei = 0; ei < enemyCountBeforeActions; ei++) {
    const enemy = s.enemies[ei]
    if (enemy.hp <= 0) continue

    // Check if enemy is frozen
    if (enemy.freeze > 0) {
      const newEnemies = s.enemies.map((e, i) =>
        i === ei ? { ...e, freeze: 0, freezeImmune: true } : e
      )
      s = { ...s, enemies: newEnemies }
    } else {
      const enemyDef = getEnemyDef(enemy.defId)
      const intent = enemyDef.intents[enemy.intentIndex]

      if (intent.type === 'attack') {
        let damage = intent.value + enemy.strength
        if (enemy.weakened > 0) {
          damage = Math.floor(damage * 0.75)
        }
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
        s = { ...s, turnTracking: { ...s.turnTracking, damageTakenThisTurn: s.turnTracking.damageTakenThisTurn + remaining } }
      } else if (intent.type === 'buff') {
        if (intent.buffType === 'strength') {
          const newEnemies = s.enemies.map((e, i) =>
            i === ei ? { ...e, strength: e.strength + intent.value } : e
          )
          s = { ...s, enemies: newEnemies }
        }
      } else if (intent.type === 'defend') {
        const newEnemies = s.enemies.map((e, i) =>
          i === ei ? { ...e, armor: e.armor + intent.value } : e
        )
        s = { ...s, enemies: newEnemies }
      } else if (intent.type === 'poison') {
        s = { ...s, player: { ...s.player, poison: s.player.poison + intent.value } }
      } else if (intent.type === 'summon') {
        const minionCount = s.enemies.filter(e => e.defId === 'goblin_minion' && e.hp > 0).length
        if (minionCount >= 4) {
          let damage = 20 + enemy.strength
          let remaining = damage
          let armor = s.player.armor
          let hp = s.player.hp
          if (armor > 0) { const absorbed = Math.min(armor, remaining); armor -= absorbed; remaining -= absorbed }
          hp = Math.max(0, hp - remaining)
          s = { ...s, player: { ...s.player, armor, hp } }
          s = { ...s, turnTracking: { ...s.turnTracking, damageTakenThisTurn: s.turnTracking.damageTakenThisTurn + remaining } }
        } else {
          s = { ...s, enemies: [...s.enemies, createEnemyState(intent.enemyId)] }
        }
      } else if (intent.type === 'summon_multi') {
        const minionCount = s.enemies.filter(e => e.defId === intent.enemyId && e.hp > 0).length
        if (minionCount >= 4) {
          // Fallback: heavy attack 20
          let damage = 20 + enemy.strength
          let remaining = damage
          let armor = s.player.armor
          let hp = s.player.hp
          if (armor > 0) { const absorbed = Math.min(armor, remaining); armor -= absorbed; remaining -= absorbed }
          hp = Math.max(0, hp - remaining)
          s = { ...s, player: { ...s.player, armor, hp } }
          s = { ...s, turnTracking: { ...s.turnTracking, damageTakenThisTurn: s.turnTracking.damageTakenThisTurn + remaining } }
        } else {
          const toSummon = Math.min(intent.count, 4 - minionCount)
          for (let si = 0; si < toSummon; si++) {
            s = { ...s, enemies: [...s.enemies, createEnemyState(intent.enemyId)] }
          }
        }
      } else if (intent.type === 'defend_attack') {
        // Gain armor
        const newEnemies = s.enemies.map((e, i) =>
          i === ei ? { ...e, armor: e.armor + intent.defendValue } : e
        )
        s = { ...s, enemies: newEnemies }
        // Deal damage
        let damage = intent.attackValue + enemy.strength
        if (enemy.weakened > 0) {
          damage = Math.floor(damage * 0.75)
        }
        let remaining = damage
        let armor = s.player.armor
        let hp = s.player.hp
        if (armor > 0) { const absorbed = Math.min(armor, remaining); armor -= absorbed; remaining -= absorbed }
        hp = Math.max(0, hp - remaining)
        s = { ...s, player: { ...s.player, armor, hp } }
        s = { ...s, turnTracking: { ...s.turnTracking, damageTakenThisTurn: s.turnTracking.damageTakenThisTurn + remaining } }
      }

      // Advance intent index + clear freezeImmune (enemy acted normally)
      const enemyDef2 = getEnemyDef(s.enemies[ei].defId)
      const newEnemies = s.enemies.map((e, i) =>
        i === ei ? { ...e, intentIndex: (e.intentIndex + 1) % enemyDef2.intents.length, freezeImmune: false } : e
      )
      s = { ...s, enemies: newEnemies }
    }

    // Check defeat after each enemy action
    if (s.player.hp <= 0) {
      return { ...s, phase: 'defeat' }
    }
  }

  // --- End-of-turn settlement (after enemy actions, before discard) ---

  // Poison settlement: each enemy takes poison damage (poison persists)
  let eotEnemies = s.enemies.map(e => {
    if (e.hp <= 0 || e.poison <= 0) return e
    let hp = e.hp
    let remaining = e.poison
    let armor = e.armor
    if (armor > 0) {
      const absorbed = Math.min(armor, remaining)
      armor -= absorbed
      remaining -= absorbed
    }
    hp = Math.max(0, hp - remaining)
    return { ...e, hp, armor }
  })
  s = { ...s, enemies: eotEnemies }

  // Burn settlement: each enemy takes burn damage, burn-1
  eotEnemies = s.enemies.map(e => {
    if (e.hp <= 0 || e.burn <= 0) return e
    let hp = e.hp
    let remaining = e.burn
    let armor = e.armor
    if (armor > 0) {
      const absorbed = Math.min(armor, remaining)
      armor -= absorbed
      remaining -= absorbed
    }
    hp = Math.max(0, hp - remaining)
    return { ...e, hp, armor, burn: Math.max(0, e.burn - 1) }
  })
  s = { ...s, enemies: eotEnemies }

  // Decay weakened and vulnerable on enemies, decay player weakened
  eotEnemies = s.enemies.map(e => ({
    ...e,
    weakened: Math.max(0, e.weakened - 1),
    vulnerable: Math.max(0, e.vulnerable - 1),
  }))
  s = { ...s, enemies: eotEnemies }
  s = { ...s, player: { ...s.player, weakened: Math.max(0, s.player.weakened - 1) } }

  // Victory check after settlement
  if (allEnemiesDead(s)) {
    return { ...s, phase: 'victory' }
  }

  // Discard all hand cards
  const newDiscard = [...s.player.discardPile, ...s.player.hand]
  s = { ...s, player: { ...s.player, hand: [], discardPile: newDiscard } }

  // Start next turn
  s = startTurn(s)

  return s
}
