import type { BattleState, CardInstance, EnemyState, TurnTracking } from './types'
import { createStarterDeck } from './cards'
import { getEnemyDef } from './enemies'
import { applyCardEffects } from './effects'
import { getEffectiveCardDef } from './campfire'
import { EMPTY_MATERIAL_BAG } from './materials'
import { getWeaponDef } from './weapons'
import { random } from './random'

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function defaultTurnTracking(): TurnTracking {
  return {
    combatCardsPlayedThisTurn: 0,
    damageTakenThisTurn: 0,
    damageDealtThisTurn: 0,
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
    bossPhase: 1,
  }
}

function createGeneratedCard(defId: string): CardInstance {
  return {
    uid: `generated_${Date.now()}_${random()}`,
    defId,
  }
}

export function resolveAbyssLordPhase(enemy: EnemyState): 1 | 2 | 3 {
  const hpRate = enemy.maxHp > 0 ? enemy.hp / enemy.maxHp : 1
  if (hpRate > 0.6) return 1
  if (hpRate > 0.3) return 2
  return 3
}

export function resolveDarkWitchPhase(enemy: EnemyState): 1 | 2 {
  const hpRate = enemy.maxHp > 0 ? enemy.hp / enemy.maxHp : 1
  if (hpRate > 0.5) return 1
  return 2
}

export type DarkWitchAction =
  | { type: 'ritual' }
  | { type: 'shadow_arrow'; damage: number; burn: number }
  | { type: 'life_drain'; damage: number; heal: number }
  | { type: 'storm'; damage: number; eyeHeal: number }
  | { type: 'consume_eye'; heal: number; fallbackDamage: number }

export function resolveDarkWitchAction(intentIndex: number, phase: 1 | 2): DarkWitchAction {
  const idx = intentIndex % 4
  if (phase === 1) {
    if (idx === 0) return { type: 'ritual' }
    if (idx === 1) return { type: 'shadow_arrow', damage: 16, burn: 2 }
    if (idx === 2) return { type: 'life_drain', damage: 12, heal: 8 }
    return { type: 'shadow_arrow', damage: 16, burn: 2 }
  }
  if (idx === 0) return { type: 'storm', damage: 14, eyeHeal: 5 }
  if (idx === 1) return { type: 'shadow_arrow', damage: 20, burn: 0 }
  if (idx === 2) return { type: 'consume_eye', heal: 20, fallbackDamage: 18 }
  return { type: 'shadow_arrow', damage: 20, burn: 0 }
}

export type AbyssLordAction =
  | { type: 'gaze' }
  | { type: 'attack'; value: number }
  | { type: 'fortify'; armor: number; strength: number }
  | { type: 'aoe_attack_burn'; value: number; burn: number }
  | { type: 'attack_heal'; value: number; heal: number }
  | { type: 'weaken_attack'; value: number; weaken: number }

export function resolveAbyssLordAction(intentIndex: number, phase: 1 | 2 | 3): AbyssLordAction {
  if (phase === 1) {
    const idx = intentIndex % 4
    if (idx === 0) return { type: 'gaze' }
    if (idx === 1) return { type: 'attack', value: 18 }
    if (idx === 2) return { type: 'fortify', armor: 12, strength: 2 }
    return { type: 'attack', value: 22 }
  }
  if (phase === 2) {
    const idx = intentIndex % 4
    if (idx === 0) return { type: 'attack', value: 20 }
    if (idx === 1) return { type: 'aoe_attack_burn', value: 12, burn: 2 }
    if (idx === 2) return { type: 'attack', value: 20 }
    return { type: 'attack_heal', value: 15, heal: 10 }
  }
  const idx = intentIndex % 2
  if (idx === 0) return { type: 'attack', value: 30 }
  return { type: 'weaken_attack', value: 20, weaken: 3 }
}

function abyssLordIntentCycle(phase: 1 | 2 | 3): number {
  return phase === 3 ? 2 : 4
}

function darkWitchIntentCycle(): number {
  return 4
}

function addCostIncreaseToRandomCards(state: BattleState, count: number): BattleState {
  const seen = new Set<string>()
  for (const card of state.player.hand) seen.add(card.defId)
  for (const card of state.player.drawPile) seen.add(card.defId)
  for (const card of state.player.discardPile) seen.add(card.defId)
  const pool = [...seen].filter(id => !state.player.costIncreasedCardDefIds.includes(id))
  const picked: string[] = []
  while (picked.length < count && pool.length > 0) {
    const idx = Math.floor(random() * pool.length)
    picked.push(pool[idx])
    pool.splice(idx, 1)
  }
  if (picked.length === 0) return state
  return {
    ...state,
    player: {
      ...state.player,
      costIncreasedCardDefIds: [...state.player.costIncreasedCardDefIds, ...picked],
    },
  }
}

function countAliveByDef(state: BattleState, defId: string): number {
  return state.enemies.filter(enemy => enemy.defId === defId && enemy.hp > 0).length
}

function healEnemyAt(state: BattleState, index: number, value: number): BattleState {
  const target = state.enemies[index]
  if (!target) return state
  return {
    ...state,
    enemies: state.enemies.map((enemy, i) =>
      i === index ? { ...enemy, hp: Math.min(enemy.maxHp, enemy.hp + value) } : enemy,
    ),
  }
}

function damagePlayerIgnoringArmor(state: BattleState, value: number): BattleState {
  const hp = Math.max(0, state.player.hp - value)
  return {
    ...state,
    player: { ...state.player, hp },
    turnTracking: {
      ...state.turnTracking,
      damageTakenThisTurn: state.turnTracking.damageTakenThisTurn + value,
    },
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
  const deck = initialDeck || createStarterDeck()
  const drawPile = shuffleArray(deck)
  return {
    player: {
      hp: 60,
      maxHp: 60,
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
      damageTakenMultiplier: 1,
      doubleDamageArmorThisTurn: false,
      attackDamageMultiplierThisTurn: 1,
      firstSpellDiscountUsed: false,
      spellDiscountUsedCountThisTurn: 0,
      weaponPerTurnUsed: false,
      attackCounterThisBattle: 0,
      spellCounterThisBattle: 0,
      costIncreasedCardDefIds: [],
      normalAttackUsedThisTurn: false,
      equippedEnchantments: [...weaponEnchantments],
      frostCounter: 0,
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
  let hp = state.player.hp
  let phase = state.phase

  for (let i = 0; i < count; i++) {
    if (drawPile.length === 0) {
      drawPile = shuffleArray(discardPile)
      discardPile = []
    }
    if (drawPile.length > 0) {
      const drawn = drawPile.pop()!
      const def = getEffectiveCardDef(drawn)
      if (def.onDrawSelfDamage && def.onDrawSelfDamage > 0) {
        hp = Math.max(0, hp - def.onDrawSelfDamage)
        if (hp <= 0) {
          phase = 'defeat'
        }
      }
      if (!def.onDrawExhaust) {
        newHand.push(drawn)
      }
      if (phase === 'defeat') break
    }
  }

  return {
    ...state,
    phase,
    player: { ...state.player, hp, hand: newHand, drawPile, discardPile },
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
      damageTakenMultiplier: 1,
      doubleDamageArmorThisTurn: false,
      attackDamageMultiplierThisTurn: 1,
      firstSpellDiscountUsed: false,
      spellDiscountUsedCountThisTurn: 0,
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
  // Stone Gargoyle passive: gains 6 armor at turn start.
  s = {
    ...s,
    enemies: s.enemies.map(e =>
      e.defId === 'stone_gargoyle' && e.hp > 0 ? { ...e, armor: e.armor + 6, turnStartArmorGain: 6 } : e
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

  // Trial modifier: all characters gain +1 burn each turn.
  if (s.trialModifier === 'flame') {
    s = {
      ...s,
      player: {
        ...s.player,
        pendingEndTurnSelfDamage: s.player.pendingEndTurnSelfDamage + 1,
      },
      enemies: s.enemies.map((enemy) => (enemy.hp > 0 ? { ...enemy, burn: enemy.burn + 1 } : enemy)),
    }
  }

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
    s = { ...s, player: { ...s.player, armor: s.player.armor + 10 } }
  } else if (materialId === 'steel_ingot') {
    s = { ...s, player: { ...s.player, armor: s.player.armor + 15 } }
  } else if (materialId === 'mythril_ingot') {
    s = { ...s, player: { ...s.player, tempCostReduction: s.player.tempCostReduction + 1 } }
  } else if (materialId === 'meteor_iron_ingot') {
    s = { ...s, player: { ...s.player, attackDamageMultiplierThisTurn: 1.5 } }
  } else if (materialId === 'elemental_essence') {
    s = {
      ...s,
      enemies: s.enemies.map(e => (e.hp > 0 ? { ...e, burn: e.burn + 3 } : e)),
    }
  } else if (materialId === 'war_essence') {
    s = { ...s, player: { ...s.player, strength: s.player.strength + 3 } }
  } else if (materialId === 'guard_essence') {
    s = { ...s, player: { ...s.player, guardArmorPerTurn: s.player.guardArmorPerTurn + 5 } }
  }

  return s
}

export function canPlayCard(state: BattleState, cardUid: string): boolean {
  const card = state.player.hand.find(c => c.uid === cardUid)
  if (!card) return false

  const def = getEffectiveCardDef(card)
  if (def.unplayable) return false
  const gazeCostIncrease = state.player.costIncreasedCardDefIds.includes(def.id) ? 1 : 0
  const baseReducedCost = Math.max(0, def.cost + gazeCostIncrease - state.player.tempCostReduction)
  const spellDiscount = (() => {
    if (def.category !== 'spell') return 0
    const weaponId = state.player.equippedWeaponId
    if ((weaponId === 'iron_staff' || weaponId === 'steel_staff') && !state.player.firstSpellDiscountUsed) {
      return 1
    }
    if (weaponId === 'legend_prismatic_scepter' && state.player.spellDiscountUsedCountThisTurn < 2) {
      return 1
    }
    return 0
  })()
  const reducedCost = Math.max(0, baseReducedCost - spellDiscount)
  const thirdCombatFree = state.player.equippedWeaponId === 'legend_shadow_daggers'
    && def.category === 'combat'
    && state.turnTracking.combatCardsPlayedThisTurn >= 2
  if (def.costType === 'stamina') {
    const actualCost = thirdCombatFree ? 0 : Math.max(0, reducedCost - state.player.weaponDiscount)
    return state.player.stamina >= actualCost
  } else if (def.costType === 'mana') {
    return state.player.mana >= reducedCost
  } else if (def.costType === 'hybrid') {
    const staminaCost = thirdCombatFree ? 0 : Math.max(0, reducedCost - state.player.weaponDiscount)
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
  const category: import('./types').CardCategory = weaponId === 'legend_prismatic_scepter' ? 'spell' : 'combat'

  let s: BattleState = {
    ...state,
    enemies: state.enemies.map(e => ({ ...e, evadedThisAction: false })),
  }
  s = applyCardEffects(s, effects, actualTarget, category)
  s = { ...s, player: { ...s.player, normalAttackUsedThisTurn: true } }
  if (allEnemiesDead(s)) {
    s = { ...s, phase: 'victory' }
  }
  return s
}

/** Check if a card's effects need a single-target enemy selection */
export function cardNeedsTarget(effects: import('./types').CardEffect[]): boolean {
  const singleTargetTypes = ['damage', 'multi_damage', 'chain_damage', 'execute',
    'conditional_damage', 'scaling_damage', 'damage_gain_armor', 'damage_shred_armor', 'lifesteal',
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
  const gazeCostIncrease = s.player.costIncreasedCardDefIds.includes(def.id) ? 1 : 0
  const baseReducedCost = Math.max(0, def.cost + gazeCostIncrease - s.player.tempCostReduction)
  const spellDiscount = (() => {
    if (def.category !== 'spell') return 0
    const weaponId = s.player.equippedWeaponId
    if ((weaponId === 'iron_staff' || weaponId === 'steel_staff') && !s.player.firstSpellDiscountUsed) {
      return 1
    }
    if (weaponId === 'legend_prismatic_scepter' && s.player.spellDiscountUsedCountThisTurn < 2) {
      return 1
    }
    return 0
  })()
  const reducedCost = Math.max(0, baseReducedCost - spellDiscount)
  const thirdCombatFree = s.player.equippedWeaponId === 'legend_shadow_daggers'
    && def.category === 'combat'
    && s.turnTracking.combatCardsPlayedThisTurn >= 2
  if (def.costType === 'stamina') {
    const actualCost = thirdCombatFree ? 0 : Math.max(0, reducedCost - s.player.weaponDiscount)
    spentStaminaCost = actualCost
    const newDiscount = s.player.weaponDiscount > 0 ? 0 : s.player.weaponDiscount
    s = { ...s, player: { ...s.player, stamina: s.player.stamina - actualCost, weaponDiscount: newDiscount } }
  } else if (def.costType === 'mana') {
    s = { ...s, player: { ...s.player, mana: s.player.mana - reducedCost } }
  } else if (def.costType === 'hybrid') {
    spentStaminaCost = thirdCombatFree ? 0 : reducedCost
    const newDiscount = s.player.weaponDiscount > 0 ? 0 : s.player.weaponDiscount
    s = {
      ...s,
      player: {
        ...s.player,
        stamina: s.player.stamina - (thirdCombatFree ? 0 : Math.max(0, reducedCost - s.player.weaponDiscount)),
        mana: s.player.mana - reducedCost,
        weaponDiscount: newDiscount,
      },
    }
  }

  if (def.category === 'spell' && spellDiscount > 0) {
    const shouldMarkFirstUsed = s.player.equippedWeaponId === 'iron_staff' || s.player.equippedWeaponId === 'steel_staff'
    s = {
      ...s,
      player: {
        ...s.player,
        firstSpellDiscountUsed: shouldMarkFirstUsed ? true : s.player.firstSpellDiscountUsed,
        spellDiscountUsedCountThisTurn: s.player.spellDiscountUsedCountThisTurn + 1,
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
    if (eff.type === 'redraw_hand') {
      const keptHand = s.player.hand.filter((c) => c.uid !== cardUid)
      s = {
        ...s,
        player: {
          ...s.player,
          hand: [],
          discardPile: [...s.player.discardPile, ...keptHand],
        },
      }
      s = drawCards(s, eff.value)
    }
    if (eff.type === 'purge_curse_in_hand_draw') {
      const keptHand = s.player.hand.filter((c) => !c.defId.startsWith('curse_'))
      const removed = s.player.hand.length - keptHand.length
      s = { ...s, player: { ...s.player, hand: keptHand } }
      if (removed > 0) {
        s = drawCards(s, removed)
      }
    }
  }

  // Move card to discard unless exhausted
  const newHand = s.player.hand.filter((c) => c.uid !== cardUid)
  const newDiscard = def.exhaust ? s.player.discardPile : [...s.player.discardPile, card]
  s = { ...s, player: { ...s.player, hand: newHand, discardPile: newDiscard } }

  // Track combat cards played
  if (def.category === 'combat') {
    s = { ...s, turnTracking: { ...s.turnTracking, combatCardsPlayedThisTurn: s.turnTracking.combatCardsPlayedThisTurn + 1 } }
  }

  const equippedWeaponId = s.player.equippedWeaponId
  if (equippedWeaponId) {
    const weapon = getWeaponDef(equippedWeaponId)
    if (weapon.onCardPlayed) {
      s = weapon.onCardPlayed({
        state: s,
        cardDef: def,
        spentStaminaCost,
        targetIndex,
        targetBeforeHpArmor,
        drawCards,
      })
    }
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

      const dealDamageToPlayer = (damage: number): void => {
        const trialMultiplier = s.enemyDamageMultiplier ?? 1
        const totalMultiplier = trialMultiplier * s.player.damageTakenMultiplier
        let remaining = Math.max(0, Math.floor(damage * totalMultiplier))
        let armor = s.player.armor
        let hp = s.player.hp
        if (armor > 0) {
          const absorbed = Math.min(armor, remaining)
          armor -= absorbed
          remaining -= absorbed
        }
        hp = Math.max(0, hp - remaining)
        s = { ...s, player: { ...s.player, armor, hp } }
        s = {
          ...s,
          turnTracking: { ...s.turnTracking, damageTakenThisTurn: s.turnTracking.damageTakenThisTurn + remaining },
        }
        retaliateToEnemy(ei)
      }

      if (enemy.defId === 'iron_golem') {
        s = {
          ...s,
          enemies: s.enemies.map((e, i) => (i === ei ? { ...e, armor: e.armor + 10 } : e)),
        }
      }
      if (enemy.defId === 'lich' && enemy.intentIndex > 0 && enemy.intentIndex % 2 === 0) {
        s = healEnemyAt(s, ei, 8)
      }

      const goblinKingPhase2 = enemy.defId === 'goblin_king' && enemy.hp <= Math.floor(enemy.maxHp * 0.4)
      if (enemy.defId === 'abyss_lord') {
        const phase = resolveAbyssLordPhase(enemy)
        if (phase > enemy.bossPhase) {
          if (phase === 2) {
            s = {
              ...s,
              enemies: s.enemies.map((e, i) =>
                i === ei ? { ...e, strength: e.strength + 3, burn: 0, poison: 0, weakened: 0, vulnerable: 0, freeze: 0, bossPhase: 2 } : e,
              ),
            }
          } else {
            s = {
              ...s,
              enemies: s.enemies.map((e, i) => (i === ei ? { ...e, armor: 0, bossPhase: 3 } : e)),
            }
          }
        }
        if (phase === 2) {
          s = {
            ...s,
            enemies: s.enemies.map((e, i) => (i === ei ? { ...e, armor: e.armor + 5 } : e)),
          }
        }
        const action = resolveAbyssLordAction(enemy.intentIndex, phase)
        if (action.type === 'gaze') {
          s = addCostIncreaseToRandomCards(s, 3)
        } else if (action.type === 'attack') {
          let damage = action.value + enemy.strength
          if (enemy.weakened > 0) {
            damage = Math.floor(damage * 0.75)
          }
          dealDamageToPlayer(damage)
        } else if (action.type === 'fortify') {
          s = {
            ...s,
            enemies: s.enemies.map((e, i) =>
              i === ei ? { ...e, armor: e.armor + action.armor, strength: e.strength + action.strength } : e,
            ),
          }
        } else if (action.type === 'aoe_attack_burn') {
          let damage = action.value + enemy.strength
          if (enemy.weakened > 0) {
            damage = Math.floor(damage * 0.75)
          }
          dealDamageToPlayer(damage)
          s = {
            ...s,
            player: { ...s.player, pendingEndTurnSelfDamage: s.player.pendingEndTurnSelfDamage + action.burn },
          }
        } else if (action.type === 'attack_heal') {
          let damage = action.value + enemy.strength
          if (enemy.weakened > 0) {
            damage = Math.floor(damage * 0.75)
          }
          dealDamageToPlayer(damage)
          s = healEnemyAt(s, ei, action.heal)
        } else if (action.type === 'weaken_attack') {
          let damage = action.value + enemy.strength
          if (enemy.weakened > 0) {
            damage = Math.floor(damage * 0.75)
          }
          dealDamageToPlayer(damage)
          s = { ...s, player: { ...s.player, weakened: s.player.weakened + action.weaken } }
        }
      } else if (enemy.defId === 'dark_witch') {
        const phase = resolveDarkWitchPhase(enemy)
        if (phase > enemy.bossPhase) {
          const eyesToSummon = Math.max(0, 2 - countAliveByDef(s, 'shadow_eye'))
          for (let si = 0; si < eyesToSummon; si++) {
            s = { ...s, enemies: [...s.enemies, createEnemyState('shadow_eye')] }
          }
          s = {
            ...s,
            enemies: s.enemies.map((e, i) => (i === ei ? { ...e, bossPhase: 2 } : e)),
          }
        }
        const action = resolveDarkWitchAction(enemy.intentIndex, phase)
        if (action.type === 'ritual') {
          s = {
            ...s,
            enemies: s.enemies.map((e, i) => (i === ei ? { ...e, strength: e.strength + 3 } : e)),
            player: {
              ...s.player,
              discardPile: [...s.player.discardPile, createGeneratedCard('curse_pain'), createGeneratedCard('curse_pain')],
            },
          }
        } else if (action.type === 'shadow_arrow') {
          dealDamageToPlayer(action.damage + enemy.strength)
          if (action.burn > 0) {
            s = {
              ...s,
              player: { ...s.player, pendingEndTurnSelfDamage: s.player.pendingEndTurnSelfDamage + action.burn },
            }
          }
        } else if (action.type === 'life_drain') {
          dealDamageToPlayer(action.damage + enemy.strength)
          s = healEnemyAt(s, ei, action.heal)
        } else if (action.type === 'storm') {
          dealDamageToPlayer(action.damage + enemy.strength)
          s = {
            ...s,
            enemies: s.enemies.map((e) =>
              e.defId === 'shadow_eye' && e.hp > 0 ? { ...e, hp: Math.min(e.maxHp, e.hp + action.eyeHeal) } : e,
            ),
          }
        } else if (action.type === 'consume_eye') {
          const eyeIndex = s.enemies.findIndex((e) => e.defId === 'shadow_eye' && e.hp > 0)
          if (eyeIndex >= 0) {
            s = {
              ...s,
              enemies: s.enemies.map((e, i) => (i === eyeIndex ? { ...e, hp: 0, armor: 0 } : e)),
            }
            s = healEnemyAt(s, ei, action.heal)
          } else {
            dealDamageToPlayer(action.fallbackDamage + enemy.strength)
          }
        }
      } else if (goblinKingPhase2) {
        const phase2Step = enemy.intentIndex % 2
        if (phase2Step === 0) {
          let damage = 20 + enemy.strength
          if (enemy.weakened > 0) {
            damage = Math.floor(damage * 0.75)
          }
          dealDamageToPlayer(damage)
        } else {
          s = {
            ...s,
            enemies: s.enemies.map((e, i) => (i === ei ? { ...e, armor: e.armor + 10 } : e)),
          }
          let damage = 12 + enemy.strength
          if (enemy.weakened > 0) {
            damage = Math.floor(damage * 0.75)
          }
          dealDamageToPlayer(damage)
        }
      } else if (intent.type === 'attack') {
        let damage = intent.value + enemy.strength
        if (enemy.weakened > 0) {
          damage = Math.floor(damage * 0.75)
        }
        if (enemy.defId === 'void_messenger') {
          const ignoredArmor = Math.floor(s.player.armor * 0.5)
          const trialMultiplier = s.enemyDamageMultiplier ?? 1
          const totalMultiplier = trialMultiplier * s.player.damageTakenMultiplier
          let remaining = Math.max(0, Math.floor(damage * totalMultiplier))
          let armor = Math.max(0, s.player.armor - ignoredArmor)
          let hp = s.player.hp
          if (armor > 0) {
            const absorbed = Math.min(armor, remaining)
            armor -= absorbed
            remaining -= absorbed
          }
          hp = Math.max(0, hp - remaining)
          s = { ...s, player: { ...s.player, armor, hp } }
          s = {
            ...s,
            turnTracking: { ...s.turnTracking, damageTakenThisTurn: s.turnTracking.damageTakenThisTurn + remaining },
          }
          retaliateToEnemy(ei)
        } else {
          dealDamageToPlayer(damage)
        }
      } else if (intent.type === 'buff') {
        if (intent.buffType === 'strength') {
          const newEnemies = s.enemies.map((e, i) =>
            i === ei ? { ...e, strength: e.strength + intent.value } : e
          )
          s = { ...s, enemies: newEnemies }
        }
      } else if (intent.type === 'defend') {
        if (enemy.defId === 'shadow_eye') {
          const witchIndex = s.enemies.findIndex((e) => e.defId === 'dark_witch' && e.hp > 0)
          if (witchIndex >= 0) {
            s = {
              ...s,
              enemies: s.enemies.map((e, i) =>
                i === witchIndex ? { ...e, armor: e.armor + 6 } : e,
              ),
            }
          }
        } else {
          const newEnemies = s.enemies.map((e, i) =>
            i === ei ? { ...e, armor: e.armor + intent.value } : e
          )
          s = { ...s, enemies: newEnemies }
        }
      } else if (intent.type === 'poison') {
        s = { ...s, player: { ...s.player, poison: s.player.poison + intent.value } }
      } else if (intent.type === 'weaken') {
        s = { ...s, player: { ...s.player, weakened: s.player.weakened + intent.value } }
      } else if (intent.type === 'curse') {
        const generated = Array.from({ length: intent.count }, () => createGeneratedCard(intent.cardId))
        s = {
          ...s,
          player: {
            ...s.player,
            discardPile: [...s.player.discardPile, ...generated],
          },
        }
      } else if (intent.type === 'summon') {
        const minionCount = s.enemies.filter(e => e.defId === 'goblin_minion' && e.hp > 0).length
        const summonCap = enemy.defId === 'goblin_king' ? 2 : 4
        if (minionCount >= summonCap) {
          let damage = (enemy.defId === 'goblin_king' ? 16 : 20) + enemy.strength
          dealDamageToPlayer(damage)
        } else {
          s = { ...s, enemies: [...s.enemies, createEnemyState(intent.enemyId)] }
          if (enemy.defId === 'goblin_king') {
            s = {
              ...s,
              enemies: s.enemies.map((e, i) => (i === ei ? { ...e, armor: e.armor + 8 } : e)),
            }
          }
        }
      } else if (intent.type === 'summon_multi') {
        const minionCount = s.enemies.filter(e => e.defId === intent.enemyId && e.hp > 0).length
        const summonCap = enemy.defId === 'goblin_king' ? 2 : 4
        if (minionCount >= summonCap) {
          // Fallback: heavy attack
          let damage = (enemy.defId === 'goblin_king' ? 16 : 20) + enemy.strength
          dealDamageToPlayer(damage)
        } else {
          const toSummon = Math.min(intent.count, summonCap - minionCount)
          for (let si = 0; si < toSummon; si++) {
            s = { ...s, enemies: [...s.enemies, createEnemyState(intent.enemyId)] }
          }
          if (enemy.defId === 'goblin_king') {
            s = {
              ...s,
              enemies: s.enemies.map((e, i) => (i === ei ? { ...e, armor: e.armor + 8 } : e)),
            }
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
        dealDamageToPlayer(damage)
      } else if (intent.type === 'heal_ally_lowest') {
        const alive = s.enemies
          .map((e, idx) => ({ e, idx }))
          .filter(({ e }) => e.hp > 0)
        if (alive.length > 0) {
          const lowest = alive.reduce((min, cur) => (cur.e.hp < min.e.hp ? cur : min))
          s = {
            ...s,
            enemies: s.enemies.map((e, i) =>
              i === lowest.idx ? { ...e, hp: Math.min(e.maxHp, e.hp + intent.value) } : e
            ),
          }
        }
      } else if (intent.type === 'buff_ally_highest_hp') {
        const alive = s.enemies
          .map((e, idx) => ({ e, idx }))
          .filter(({ e }) => e.hp > 0)
        if (alive.length > 0) {
          const highest = alive.reduce((max, cur) => (cur.e.hp > max.e.hp ? cur : max))
          s = {
            ...s,
            enemies: s.enemies.map((e, i) =>
              i === highest.idx ? { ...e, strength: e.strength + intent.value } : e
            ),
          }
        }
      }

      // Advance intent index + clear freezeImmune (enemy acted normally)
      const enemyDef2 = getEnemyDef(s.enemies[ei].defId)
      const actedEnemy = s.enemies[ei]
      const modulo = actedEnemy.defId === 'goblin_king' && actedEnemy.hp > 0 && actedEnemy.hp <= Math.floor(actedEnemy.maxHp * 0.4)
        ? 2
        : actedEnemy.defId === 'dark_witch'
          ? darkWitchIntentCycle()
        : actedEnemy.defId === 'abyss_lord'
          ? abyssLordIntentCycle(resolveAbyssLordPhase(actedEnemy))
          : enemyDef2.intents.length
      const newEnemies = s.enemies.map((e, i) =>
        i === ei ? { ...e, intentIndex: (e.intentIndex + 1) % modulo, freezeImmune: false } : e
      )
      s = { ...s, enemies: newEnemies }
    }

    // Check defeat after each enemy action
    if (s.player.hp <= 0) {
      return { ...s, phase: 'defeat' }
    }
  }

  // --- End-of-turn settlement (after enemy actions, before discard) ---
  const livingAbyssLord = s.enemies.find((enemy) => enemy.defId === 'abyss_lord' && enemy.hp > 0)
  if (livingAbyssLord && resolveAbyssLordPhase(livingAbyssLord) === 3) {
    s = damagePlayerIgnoringArmor(s, 5)
    if (s.player.hp <= 0) {
      return { ...s, phase: 'defeat' }
    }
  }

  // Poison settlement: each enemy takes poison damage (poison persists)
  let eotEnemies = s.enemies.map(e => {
    if (e.hp <= 0 || e.poison <= 0 || e.defId === 'elemental_symbiote') return e
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
    if (e.hp <= 0 || e.burn <= 0 || e.defId === 'elemental_symbiote') return e
    let hp = e.hp
    let remaining = e.burn
    if (s.player.equippedEnchantments.includes('flame') && s.player.equippedEnchantments.includes('frost')) {
      remaining = remaining * 2
    }
    if (s.player.equippedEnchantments.includes('abyss') && s.player.equippedEnchantments.includes('flame')) {
      remaining += e.burn * 3
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
  if (s.player.equippedEnchantments.includes('abyss') && s.player.equippedEnchantments.includes('flame')) {
    s = { ...s, turnTracking: { ...s.turnTracking, enchantEvents: [...s.turnTracking.enchantEvents, '末日触发'] } }
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

  // Trial modifier: speed trial fails if turn limit exceeded.
  if (s.trialModifier === 'speed' && s.trialTurnLimit && s.turn > s.trialTurnLimit && s.phase !== 'victory') {
    return { ...s, phase: 'defeat' }
  }

  return s
}
