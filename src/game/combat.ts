import type { BattleState, CardInstance, EnemyState, TurnTracking } from './types'
import { STARTER_DECK_RECIPE } from './cards'
import { getEnemyDef } from './enemies'
import { applyCardEffects } from './effects'
import { getEffectiveCardDef } from './campfire'
import { EMPTY_MATERIAL_BAG } from './materials'
import { getWeaponDef } from './weapons'

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
    enchantEvents: [],
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
    evadedThisAction: false,
    turnStartArmorGain: 0,
  }
}

function allEnemiesDead(state: BattleState): boolean {
  return state.enemies.every(e => e.hp <= 0)
}

export function createBattleState(
  enemyIds: string[],
  initialDeck?: CardInstance[],
  weaponDefId?: string,
  initialMaterials = EMPTY_MATERIAL_BAG,
  weaponEnchantments: import('./types').EnchantmentId[] = [],
): BattleState {
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
      guardArmorPerTurn: 0,
      tempCostReduction: 0,
      nextTurnStaminaPenalty: 0,
      pendingEndTurnSelfDamage: 0,
      thorns: 0,
      magicAbsorbBonusMana: 0,
      weaponPerTurnUsed: false,
      normalAttackUsedThisTurn: false,
      equippedEnchantments: [...weaponEnchantments],
      hand: [],
      drawPile,
      discardPile: [],
    },
    enemies: enemyIds.map(id => createEnemyState(id)),
    availableMaterials: { ...initialMaterials },
    usedMaterials: {},
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
  const staminaPenalty = s.player.nextTurnStaminaPenalty
  s = {
    ...s,
    player: {
      ...s.player,
      stamina: Math.max(0, s.player.maxStamina - staminaPenalty),
      mana: s.player.maxMana + bonusMana,
      tempCostReduction: 0,
      nextTurnStaminaPenalty: 0,
      weaponPerTurnUsed: false,
      normalAttackUsedThisTurn: false,
    },
    turnTracking: defaultTurnTracking(),
  }

  // Clear player armor (barrier preserves up to N points)
  s = { ...s, player: { ...s.player, armor: Math.min(s.player.armor, s.player.barrier) } }
  if (s.player.guardArmorPerTurn > 0) {
    s = { ...s, player: { ...s.player, armor: s.player.armor + s.player.guardArmorPerTurn } }
  }

  // Reset per-enemy transient flags (enemy armor persists across turns)
  s = {
    ...s,
    enemies: s.enemies.map(e => ({
      ...e,
      damagedThisTurn: false,
      evadedThisAction: false,
      turnStartArmorGain: 0,
    })),
  }
  // Stone Gargoyle passive: gains 8 armor at turn start.
  s = {
    ...s,
    enemies: s.enemies.map(e =>
      e.defId === 'stone_gargoyle' && e.hp > 0 ? { ...e, armor: e.armor + 8, turnStartArmorGain: 8 } : e
    ),
  }

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

export function useBattleMaterial(state: BattleState, materialId: keyof BattleState['availableMaterials']): BattleState {
  if (state.phase !== 'player_turn') return state
  if (state.usedMaterials[materialId]) return state
  if (state.availableMaterials[materialId] <= 0) return state

  let s = state
  const availableMaterials = { ...s.availableMaterials, [materialId]: s.availableMaterials[materialId] - 1 }
  const usedMaterials = { ...s.usedMaterials, [materialId]: true }
  s = { ...s, availableMaterials, usedMaterials }

  if (materialId === 'iron_ingot') {
    s = { ...s, player: { ...s.player, armor: s.player.armor + 8 } }
  } else if (materialId === 'steel_ingot') {
    s = { ...s, player: { ...s.player, armor: s.player.armor + 12 } }
  } else if (materialId === 'elemental_essence') {
    s = {
      ...s,
      enemies: s.enemies.map(e => (e.hp > 0 ? { ...e, burn: e.burn + 2 } : e)),
    }
  } else if (materialId === 'war_essence') {
    s = { ...s, player: { ...s.player, strength: s.player.strength + 2 } }
  } else if (materialId === 'guard_essence') {
    s = { ...s, player: { ...s.player, guardArmorPerTurn: s.player.guardArmorPerTurn + 3 } }
  }

  return s
}

export function canPlayCard(state: BattleState, cardUid: string): boolean {
  const card = state.player.hand.find(c => c.uid === cardUid)
  if (!card) return false

  const def = getEffectiveCardDef(card)
  const reducedCost = Math.max(0, def.cost - state.player.tempCostReduction)
  if (def.costType === 'stamina') {
    const actualCost = Math.max(0, reducedCost - state.player.weaponDiscount)
    return state.player.stamina >= actualCost
  } else if (def.costType === 'mana') {
    return state.player.mana >= reducedCost
  } else if (def.costType === 'hybrid') {
    const staminaCost = Math.max(0, reducedCost - state.player.weaponDiscount)
    return state.player.stamina >= staminaCost && state.player.mana >= reducedCost
  }
  return true
}

export function canUseNormalAttack(state: BattleState): boolean {
  if (state.phase !== 'player_turn') return false
  if (!state.player.equippedWeaponId) return false
  if (state.player.normalAttackUsedThisTurn) return false
  return state.enemies.some(e => e.hp > 0)
}

export function useNormalAttack(state: BattleState, targetIndex: number = 0): BattleState {
  if (!canUseNormalAttack(state)) return state
  const weaponId = state.player.equippedWeaponId
  if (!weaponId) return state
  const attack = getWeaponDef(weaponId).normalAttack

  let actualTarget = targetIndex
  const target = state.enemies[targetIndex]
  if (!target || target.hp <= 0) {
    actualTarget = state.enemies.findIndex(e => e.hp > 0)
    if (actualTarget === -1) return state
  }

  const effects: import('./types').CardEffect[] = attack.hits && attack.hits > 1
    ? [{ type: 'multi_damage', value: attack.damage, hits: attack.hits }]
    : [{ type: 'damage', value: attack.damage }]

  let s: BattleState = {
    ...state,
    enemies: state.enemies.map(e => ({ ...e, evadedThisAction: false })),
  }
  s = applyCardEffects(s, effects, actualTarget, 'combat')
  s = { ...s, player: { ...s.player, normalAttackUsedThisTurn: true } }
  if (allEnemiesDead(s)) {
    s = { ...s, phase: 'victory' }
  }
  return s
}

/** Check if a card's effects need a single-target enemy selection */
export function cardNeedsTarget(effects: import('./types').CardEffect[]): boolean {
  const singleTargetTypes = ['damage', 'multi_damage', 'chain_damage', 'execute',
    'conditional_damage', 'scaling_damage', 'damage_gain_armor', 'lifesteal',
    'burn', 'freeze', 'poison', 'weaken_enemy', 'vulnerable', 'burn_burst', 'poison_burst']
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
  const targetBefore = state.enemies[targetIndex]
  const targetBeforeHpArmor = targetBefore ? targetBefore.hp + targetBefore.armor : 0

  // Deduct resource
  let s: BattleState = {
    ...state,
    enemies: state.enemies.map(e => ({ ...e, evadedThisAction: false })),
  }
  let spentStaminaCost = 0
  const reducedCost = Math.max(0, def.cost - s.player.tempCostReduction)
  if (def.costType === 'stamina') {
    const actualCost = Math.max(0, reducedCost - s.player.weaponDiscount)
    spentStaminaCost = actualCost
    const newDiscount = s.player.weaponDiscount > 0 ? 0 : s.player.weaponDiscount
    s = { ...s, player: { ...s.player, stamina: s.player.stamina - actualCost, weaponDiscount: newDiscount } }
  } else if (def.costType === 'mana') {
    s = { ...s, player: { ...s.player, mana: s.player.mana - reducedCost } }
  } else if (def.costType === 'hybrid') {
    spentStaminaCost = reducedCost
    const newDiscount = s.player.weaponDiscount > 0 ? 0 : s.player.weaponDiscount
    s = {
      ...s,
      player: {
        ...s.player,
        stamina: s.player.stamina - Math.max(0, reducedCost - s.player.weaponDiscount),
        mana: s.player.mana - reducedCost,
        weaponDiscount: newDiscount,
      },
    }
  }

  // Apply effects
  s = applyCardEffects(s, def.effects, targetIndex, def.category)

  // Handle draw_cards effect
  for (const eff of def.effects) {
    if (eff.type === 'draw_cards') {
      s = drawCards(s, eff.value)
    }
    if (eff.type === 'draw_cards_if_affordable') {
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

  // Longsword effect: next stamina card discount
  const equippedWeaponId = s.player.equippedWeaponId || ''
  if (def.category === 'combat' && ['longsword', 'longsword_upgraded', 'iron_longsword', 'steel_longsword'].includes(equippedWeaponId)) {
    const discountValue = ['longsword_upgraded', 'steel_longsword'].includes(equippedWeaponId) ? 2 : 1
    s = { ...s, player: { ...s.player, weaponDiscount: discountValue } }
  }
  // Dagger effect: first low-cost combat card each turn draws 1
  if (
    s.player.equippedWeaponId === 'iron_dagger' &&
    def.category === 'combat' &&
    spentStaminaCost <= 1 &&
    !s.player.weaponPerTurnUsed
  ) {
    s = drawCards(s, 1)
    s = { ...s, player: { ...s.player, weaponPerTurnUsed: true } }
  }
  // Hammer effect: heavy hit shatters 3 armor if this card dealt >= 15 total impact.
  if (s.player.equippedWeaponId === 'iron_hammer' && def.category === 'combat') {
    const targetAfter = s.enemies[targetIndex]
    if (targetAfter) {
      const targetAfterHpArmor = targetAfter.hp + targetAfter.armor
      const dealt = Math.max(0, targetBeforeHpArmor - targetAfterHpArmor)
      if (dealt >= 15 && targetAfter.armor > 0) {
        s = {
          ...s,
          enemies: s.enemies.map((e, i) =>
            i === targetIndex ? { ...e, armor: Math.max(0, e.armor - 3) } : e
          ),
        }
      }
    }
  }
  // Staff effect: each spell grants 1 charge after cast.
  if (s.player.equippedWeaponId === 'iron_staff' && def.category === 'spell') {
    s = { ...s, player: { ...s.player, charge: s.player.charge + 1 } }
  }

  // Check victory
  if (allEnemiesDead(s)) {
    s = { ...s, phase: 'victory' }
  }

  return s
}

export function endPlayerTurn(state: BattleState): BattleState {
  let s = state
  // Clear previous action enchant feedback; keep only latest turn's triggers.
  s = { ...s, turnTracking: { ...s.turnTracking, enchantEvents: [] } }

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
      if (s.player.equippedEnchantments.includes('frost') && s.player.equippedEnchantments.includes('thunder')) {
        const frozenTarget = s.enemies[ei]
        if (frozenTarget) {
          let remaining = 15
          let armor = frozenTarget.armor
          let hp = frozenTarget.hp
          if (armor > 0) {
            const absorbed = Math.min(armor, remaining)
            armor -= absorbed
            remaining -= absorbed
          }
          hp = Math.max(0, hp - remaining)
          s = {
            ...s,
            enemies: s.enemies.map((e, i) => (i === ei ? { ...e, armor, hp } : e)),
            turnTracking: { ...s.turnTracking, enchantEvents: [...s.turnTracking.enchantEvents, '风暴触发'] },
          }
        }
      }
    } else {
      const enemyDef = getEnemyDef(enemy.defId)
      const intent = enemyDef.intents[enemy.intentIndex]
      const retaliateToEnemy = (index: number): void => {
        const targetEnemy = s.enemies[index]
        if (!targetEnemy || targetEnemy.hp <= 0 || s.player.thorns <= 0) return
        let remaining = s.player.thorns
        let armor = targetEnemy.armor
        let hp = targetEnemy.hp
        if (armor > 0) {
          const absorbed = Math.min(armor, remaining)
          armor -= absorbed
          remaining -= absorbed
        }
        hp = Math.max(0, hp - remaining)
        s = {
          ...s,
          enemies: s.enemies.map((e, i) => (i === index ? { ...e, armor, hp } : e)),
        }
      }

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
        retaliateToEnemy(ei)
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
      } else if (intent.type === 'weaken') {
        s = { ...s, player: { ...s.player, weakened: s.player.weakened + intent.value } }
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
          retaliateToEnemy(ei)
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
          retaliateToEnemy(ei)
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
        retaliateToEnemy(ei)
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
    if (s.player.equippedEnchantments.includes('flame') && s.player.equippedEnchantments.includes('frost')) {
      remaining = remaining * 2
    }
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
  if (s.player.equippedEnchantments.includes('flame') && s.player.equippedEnchantments.includes('frost')) {
    s = { ...s, turnTracking: { ...s.turnTracking, enchantEvents: [...s.turnTracking.enchantEvents, '熔岩触发'] } }
  }

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

  if (s.player.magicAbsorbBonusMana > 0 && s.player.armor > 0) {
    s = {
      ...s,
      turnTracking: {
        ...s.turnTracking,
        bonusManaNextTurn: s.turnTracking.bonusManaNextTurn + s.player.magicAbsorbBonusMana,
      },
    }
  }

  if (s.player.pendingEndTurnSelfDamage > 0) {
    const nextHp = Math.max(0, s.player.hp - s.player.pendingEndTurnSelfDamage)
    s = {
      ...s,
      player: { ...s.player, hp: nextHp, pendingEndTurnSelfDamage: 0, magicAbsorbBonusMana: 0 },
    }
    if (nextHp <= 0) {
      return { ...s, phase: 'defeat' }
    }
  } else {
    s = { ...s, player: { ...s.player, magicAbsorbBonusMana: 0 } }
  }

  // Discard all hand cards
  const newDiscard = [...s.player.discardPile, ...s.player.hand]
  s = { ...s, player: { ...s.player, hand: [], discardPile: newDiscard } }

  // Start next turn
  s = startTurn(s)

  return s
}
