import type { BattleState, CardCategory, CardEffect } from './types'
import { hasResonance } from './enchantments'
import { getEffectiveCardDef } from './campfire'
import { random } from './random'

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function drawCardsForEffect(state: BattleState, count: number): BattleState {
  let { drawPile, discardPile, hand } = state.player
  const nextHand = [...hand]
  let hp = state.player.hp
  let phase = state.phase

  for (let i = 0; i < count; i++) {
    if (drawPile.length === 0) {
      drawPile = shuffleArray(discardPile)
      discardPile = []
    }
    if (drawPile.length === 0) break
    const drawn = drawPile.pop()!
    const def = getEffectiveCardDef(drawn)
    if (def.onDrawSelfDamage && def.onDrawSelfDamage > 0) {
      hp = Math.max(0, hp - def.onDrawSelfDamage)
      if (hp <= 0) phase = 'defeat'
    }
    if (!def.onDrawExhaust) {
      nextHand.push(drawn)
    }
    if (phase === 'defeat') break
  }

  return {
    ...state,
    phase,
    player: { ...state.player, hp, hand: nextHand, drawPile, discardPile },
  }
}

function dealDamageToEnemy(
  state: BattleState,
  targetIndex: number,
  damage: number,
  armorPenetration: number = 0,
): BattleState {
  const enemy = state.enemies[targetIndex]
  if (!enemy || enemy.hp <= 0) return state
  // Shadow Assassin passive: evade any single hit <= 4 final damage.
  if (enemy.defId === 'shadow_assassin' && damage <= 4) {
    return {
      ...state,
      enemies: state.enemies.map((e, i) =>
        i === targetIndex ? { ...e, evadedThisAction: true } : e
      ),
    }
  }
  let remaining = damage
  let armor = Math.max(0, enemy.armor - armorPenetration)
  let hp = enemy.hp
  let absorbed = 0

  if (armor > 0) {
    absorbed = Math.min(armor, remaining)
    armor -= absorbed
    remaining -= absorbed
  }
  const hpLoss = Math.min(hp, remaining)
  hp = Math.max(0, hp - hpLoss)
  const dealt = absorbed + hpLoss

  let updatedTarget = { ...enemy, armor, hp, damagedThisTurn: true }
  if (updatedTarget.defId === 'iron_golem' && dealt >= 20) {
    updatedTarget = { ...updatedTarget, armor: 0 }
  }
  if (updatedTarget.defId === 'berserker') {
    const lostHp = Math.max(0, updatedTarget.maxHp - updatedTarget.hp)
    const strengthFromLoss = Math.floor(lostHp / 10)
    if (strengthFromLoss > updatedTarget.strength) {
      updatedTarget = { ...updatedTarget, strength: strengthFromLoss }
    }
  }

  let nextState: BattleState = {
    ...state,
    enemies: state.enemies.map((e, i) => (i === targetIndex ? updatedTarget : e)),
    turnTracking: {
      ...state.turnTracking,
      damageDealtThisTurn: state.turnTracking.damageDealtThisTurn + dealt,
    },
  }

  if (updatedTarget.defId === 'thorn_vine' && dealt > 0) {
    nextState = {
      ...nextState,
      player: { ...nextState.player, hp: Math.max(0, nextState.player.hp - 3) },
      turnTracking: {
        ...nextState.turnTracking,
        damageTakenThisTurn: nextState.turnTracking.damageTakenThisTurn + 3,
      },
    }
  }

  const wasKilled = enemy.hp > 0 && updatedTarget.hp <= 0
  if (wasKilled && updatedTarget.defId === 'soul_weaver') {
    nextState = {
      ...nextState,
      enemies: nextState.enemies.map((e, i) => {
        if (i === targetIndex || e.hp <= 0) return e
        return {
          ...e,
          hp: Math.min(e.maxHp, e.hp + 15),
          strength: e.strength + 2,
        }
      }),
    }
  }

  return nextState
}

function applyPoisonOnAttack(state: BattleState, targetIndex: number, category: CardCategory): BattleState {
  if (category === 'combat' && state.player.poisonOnAttack > 0) {
    const enemy = state.enemies[targetIndex]
    if (!enemy || enemy.hp <= 0) return state
    const newEnemies = state.enemies.map((e, i) =>
      i === targetIndex ? { ...e, poison: e.poison + state.player.poisonOnAttack } : e
    )
    return { ...state, enemies: newEnemies }
  }
  return state
}

function applyCombatDmgBonus(baseDmg: number, state: BattleState): number {
  return baseDmg + state.turnTracking.combatDamageBonus
}

function applyDmgMods(
  dmg: number, s: BattleState, targetIdx: number, category: CardCategory
): { dmg: number; s: BattleState; armorPenetration: number } {
  let armorPenetration = 0
  const isAttackCategory = category === 'combat' || category === 'spell'
  if (isAttackCategory && s.player.attackDamageMultiplierThisTurn !== 1) {
    dmg = Math.floor(dmg * s.player.attackDamageMultiplierThisTurn)
  }
  // Strength (combat only)
  if (category === 'combat') {
    dmg += s.player.strength
  }
  if (isAttackCategory && s.player.equippedEnchantments.includes('bless')) {
    dmg += 3
    s = { ...s, turnTracking: { ...s.turnTracking, enchantEvents: [...s.turnTracking.enchantEvents, '祝福触发'] } }
  }
  if (isAttackCategory && s.player.equippedEnchantments.includes('abyss') && s.turnTracking.damageDealtThisTurn >= 30) {
    dmg += 10
    s = { ...s, turnTracking: { ...s.turnTracking, enchantEvents: [...s.turnTracking.enchantEvents, '深渊触发'] } }
  }
  const target = s.enemies[targetIdx]
  if (
    isAttackCategory &&
    hasResonance(s.player.equippedEnchantments, 'flame', 'bless') &&
    target &&
    target.burn > 0
  ) {
    dmg = Math.floor(dmg * 1.5)
    s = { ...s, turnTracking: { ...s.turnTracking, enchantEvents: [...s.turnTracking.enchantEvents, '圣火触发'] } }
  }
  if (isAttackCategory && hasResonance(s.player.equippedEnchantments, 'abyss', 'void')) {
    armorPenetration = 999
    const nextHp = Math.max(1, s.player.hp - 5)
    const selfDamage = s.player.hp - nextHp
    s = {
      ...s,
      player: { ...s.player, hp: nextHp },
      turnTracking: {
        ...s.turnTracking,
        damageTakenThisTurn: s.turnTracking.damageTakenThisTurn + selfDamage,
        enchantEvents: [...s.turnTracking.enchantEvents, '终焉触发'],
      },
    }
  } else if (isAttackCategory && s.player.equippedEnchantments.includes('void')) {
    armorPenetration = 4
    s = { ...s, turnTracking: { ...s.turnTracking, enchantEvents: [...s.turnTracking.enchantEvents, '虚空触发'] } }
  }
  if (isAttackCategory && (s.player.equippedWeaponId === 'iron_bow' || s.player.equippedWeaponId === 'steel_bow') && !s.player.weaponPerTurnUsed) {
    dmg = Math.floor(dmg * 1.3)
    if (s.player.equippedWeaponId === 'steel_bow' && s.turnTracking.damageTakenThisTurn === 0) {
      dmg += 2
    }
    s = { ...s, player: { ...s.player, weaponPerTurnUsed: true } }
  }
  if (category === 'combat' && s.player.equippedWeaponId === 'legend_kings_blade' && !s.player.weaponPerTurnUsed) {
    dmg = Math.floor(dmg * 1.5)
    s = { ...s, player: { ...s.player, weaponPerTurnUsed: true } }
  }
  // Wisdom (spell only)
  if (category === 'spell' && s.player.wisdom > 0) {
    dmg += s.player.wisdom
  }
  if (category === 'spell') {
    if (s.player.equippedWeaponId === 'iron_staff') {
      dmg = Math.floor(dmg * 1.2)
    } else if (s.player.equippedWeaponId === 'steel_staff') {
      dmg = Math.floor(dmg * 1.3)
    } else if (s.player.equippedWeaponId === 'legend_prismatic_scepter') {
      dmg = Math.floor(dmg * 1.4)
    }
  }
  if (category === 'combat' && s.player.equippedWeaponId === 'legend_doom_hammer') {
    const target = s.enemies[targetIdx]
    if (target && target.armor > 0) {
      dmg = Math.floor(dmg * 1.5)
    }
  }
  // Charge (spell only): +10% per stack, then clear
  if (category === 'spell' && s.player.charge > 0) {
    dmg = Math.floor(dmg * (1 + s.player.charge * 0.1))
    s = { ...s, player: { ...s.player, charge: 0 } }
  }
  // Player weakened: -25%
  if (s.player.weakened > 0) {
    dmg = Math.floor(dmg * 0.75)
  }
  // Target vulnerable: +50%
  const enemy = s.enemies[targetIdx]
  if (enemy && enemy.vulnerable > 0) {
    dmg = Math.floor(dmg * 1.5)
  }
  return { dmg, s, armorPenetration }
}

function applyAttackHitEnchantments(
  s: BattleState,
  targetIndex: number,
  killed: boolean,
  dealtDamage: number,
): BattleState {
  const target = s.enemies[targetIndex]
  if (!target) return s
  const nextAttackCount = s.player.attackCounterThisBattle + 1
  s = { ...s, player: { ...s.player, attackCounterThisBattle: nextAttackCount } }

  if (s.player.equippedWeaponId === 'mythic_ant_swarm_dagger') {
    s = dealDamageToEnemy(s, targetIndex, 3)
  }
  if (s.player.equippedWeaponId === 'replica_ant_swarm_dagger' && nextAttackCount % 3 === 0) {
    s = dealDamageToEnemy(s, targetIndex, 3)
  }
  if (s.player.equippedWeaponId === 'mythic_finale_greatsword' && dealtDamage > 0) {
    const splash = Math.max(1, Math.floor(dealtDamage * 0.5))
    s = {
      ...s,
      enemies: s.enemies.map((enemy, idx) => {
        if (idx === targetIndex || enemy.hp <= 0) return enemy
        let remaining = splash
        let armor = enemy.armor
        let hp = enemy.hp
        if (armor > 0) {
          const absorbed = Math.min(armor, remaining)
          armor -= absorbed
          remaining -= absorbed
        }
        hp = Math.max(0, hp - remaining)
        return { ...enemy, armor, hp }
      }),
    }
  }
  if (s.player.equippedWeaponId === 'replica_finale_greatsword' && killed) {
    const adjacent = [targetIndex - 1, targetIndex + 1]
    for (const idx of adjacent) {
      if (idx < 0 || idx >= s.enemies.length) continue
      s = dealDamageToEnemy(s, idx, 8)
    }
  }

  if (s.player.equippedEnchantments.includes('flame') && target.hp > 0) {
    s = {
      ...s,
      enemies: s.enemies.map((e, i) => (i === targetIndex ? { ...e, burn: e.burn + 1 } : e)),
      turnTracking: { ...s.turnTracking, enchantEvents: [...s.turnTracking.enchantEvents, '烈焰触发'] },
    }
  }

  if (s.player.equippedEnchantments.includes('frost') && target.hp > 0 && !target.freezeImmune) {
    const nextCounter = s.player.frostCounter + 1
    if (nextCounter >= 3) {
      s = {
        ...s,
        player: { ...s.player, frostCounter: 0 },
        enemies: s.enemies.map((e, i) => (i === targetIndex ? { ...e, freeze: 1 } : e)),
        turnTracking: { ...s.turnTracking, enchantEvents: [...s.turnTracking.enchantEvents, '寒冰触发'] },
      }
    } else {
      s = { ...s, player: { ...s.player, frostCounter: nextCounter } }
    }
  }

  if (s.player.equippedEnchantments.includes('thunder')) {
    const candidates = s.enemies
      .map((e, i) => ({ e, i }))
      .filter(({ e, i }) => i !== targetIndex && e.hp > 0)
    const chainIdx = candidates.length > 0
      ? candidates[Math.floor(random() * candidates.length)].i
      : -1
    if (chainIdx >= 0) {
      s = dealDamageToEnemy(s, chainIdx, 4)
      s = { ...s, turnTracking: { ...s.turnTracking, enchantEvents: [...s.turnTracking.enchantEvents, '雷电触发'] } }
      if (hasResonance(s.player.equippedEnchantments, 'flame', 'thunder')) {
        s = {
          ...s,
          enemies: s.enemies.map((e, i) => (i === chainIdx ? { ...e, burn: e.burn + 1 } : e)),
          turnTracking: { ...s.turnTracking, enchantEvents: [...s.turnTracking.enchantEvents, '雷焰触发'] },
        }
      }
    }
  }

  if (killed && s.player.equippedEnchantments.includes('soul')) {
    const reaper = hasResonance(s.player.equippedEnchantments, 'soul', 'void')
    const samsara = hasResonance(s.player.equippedEnchantments, 'abyss', 'soul')
    if (samsara) {
      s = {
        ...s,
        player: { ...s.player, hp: s.player.maxHp },
        turnTracking: { ...s.turnTracking, enchantEvents: [...s.turnTracking.enchantEvents, '轮回触发'] },
      }
      s = drawCardsForEffect(s, 2)
    } else if (reaper) {
      s = {
        ...s,
        player: { ...s.player, hp: s.player.maxHp },
        turnTracking: { ...s.turnTracking, enchantEvents: [...s.turnTracking.enchantEvents, '死神触发'] },
      }
    } else {
      s = {
        ...s,
        player: { ...s.player, hp: Math.min(s.player.maxHp, s.player.hp + 5) },
        turnTracking: { ...s.turnTracking, enchantEvents: [...s.turnTracking.enchantEvents, '汲魂触发'] },
      }
    }
  }

  return s
}

export function applyCardEffects(
  state: BattleState, effects: CardEffect[], targetIndex: number,
  category: CardCategory = 'combat'
): BattleState {
  let s = state
  for (const effect of effects) {
    switch (effect.type) {
      case 'damage': {
        let dmg = effect.value
        if (s.player.doubleDamageArmorThisTurn) {
          dmg *= 2
        }
        dmg = applyCombatDmgBonus(dmg, s)
        if (s.player.buffNextCombatDouble) {
          dmg = dmg * 2
          s = { ...s, player: { ...s.player, buffNextCombatDouble: false } }
        }
        if (s.player.buffNextCombat > 0) {
          dmg = Math.floor(dmg * (1 + s.player.buffNextCombat / 100))
          s = { ...s, player: { ...s.player, buffNextCombat: 0 } }
        }
        if (s.player.buffNextSpellDamage > 0) {
          dmg += s.player.buffNextSpellDamage
          const bonusMana = s.player.buffNextSpellMana
          s = { ...s, player: { ...s.player, buffNextSpellDamage: 0, buffNextSpellMana: 0, mana: s.player.mana + bonusMana } }
        }
        let armorPenetration = 0
        ;({ dmg, s, armorPenetration } = applyDmgMods(dmg, s, targetIndex, category))
        const beforeTarget = s.enemies[targetIndex]
        s = dealDamageToEnemy(s, targetIndex, dmg, armorPenetration)
        s = applyPoisonOnAttack(s, targetIndex, category)
        const afterTarget = s.enemies[targetIndex]
        const killed = !!beforeTarget && beforeTarget.hp > 0 && !!afterTarget && afterTarget.hp <= 0
        if (category === 'combat' || category === 'spell') {
          const dealt = beforeTarget && afterTarget ? Math.max(0, (beforeTarget.hp + beforeTarget.armor) - (afterTarget.hp + afterTarget.armor)) : 0
          s = applyAttackHitEnchantments(s, targetIndex, killed, dealt)
        }
        break
      }
      case 'damage_shred_armor': {
        let dmg = effect.damage
        if (s.player.doubleDamageArmorThisTurn) {
          dmg *= 2
        }
        dmg = applyCombatDmgBonus(dmg, s)
        let armorPenetration = effect.shred
        ;({ dmg, s, armorPenetration } = applyDmgMods(dmg, s, targetIndex, category))
        const beforeTarget = s.enemies[targetIndex]
        s = dealDamageToEnemy(s, targetIndex, dmg, armorPenetration)
        s = applyPoisonOnAttack(s, targetIndex, category)
        const afterTarget = s.enemies[targetIndex]
        const killed = !!beforeTarget && beforeTarget.hp > 0 && !!afterTarget && afterTarget.hp <= 0
        if (category === 'combat' || category === 'spell') {
          const dealt = beforeTarget && afterTarget ? Math.max(0, (beforeTarget.hp + beforeTarget.armor) - (afterTarget.hp + afterTarget.armor)) : 0
          s = applyAttackHitEnchantments(s, targetIndex, killed, dealt)
        }
        break
      }
      case 'multi_damage': {
        for (let i = 0; i < effect.hits; i++) {
          let dmg = effect.value
          if (s.player.doubleDamageArmorThisTurn) {
            dmg *= 2
          }
          dmg = applyCombatDmgBonus(dmg, s)
          if (s.player.buffNextCombatDouble) {
            dmg = dmg * 2
            s = { ...s, player: { ...s.player, buffNextCombatDouble: false } }
          }
          let armorPenetration = 0
          ;({ dmg, s, armorPenetration } = applyDmgMods(dmg, s, targetIndex, category))
          const beforeTarget = s.enemies[targetIndex]
          s = dealDamageToEnemy(s, targetIndex, dmg, armorPenetration)
          s = applyPoisonOnAttack(s, targetIndex, category)
          const afterTarget = s.enemies[targetIndex]
          const killed = !!beforeTarget && beforeTarget.hp > 0 && !!afterTarget && afterTarget.hp <= 0
          if (category === 'combat' || category === 'spell') {
            const dealt = beforeTarget && afterTarget ? Math.max(0, (beforeTarget.hp + beforeTarget.armor) - (afterTarget.hp + afterTarget.armor)) : 0
            s = applyAttackHitEnchantments(s, targetIndex, killed, dealt)
          }
        }
        break
      }
      case 'armor':
        s = {
          ...s,
          player: {
            ...s.player,
            armor: s.player.armor + (s.player.doubleDamageArmorThisTurn ? effect.value * 2 : effect.value),
          },
        }
        break
      case 'heal':
        s = { ...s, player: { ...s.player, hp: Math.min(s.player.maxHp, s.player.hp + effect.value) } }
        break
      case 'gain_mana':
        s = { ...s, player: { ...s.player, mana: s.player.mana + effect.value } }
        break
      case 'gain_stamina':
        s = { ...s, player: { ...s.player, stamina: s.player.stamina + effect.value } }
        break
      case 'burn': {
        const enemy = s.enemies[targetIndex]
        if (enemy && enemy.hp > 0) {
          if (enemy.defId === 'elemental_symbiote') break
          const newEnemies = s.enemies.map((e, i) =>
            i === targetIndex ? { ...e, burn: e.burn + effect.value } : e
          )
          s = { ...s, enemies: newEnemies }
        }
        break
      }
      case 'burn_burst': {
        const enemy = s.enemies[targetIndex]
        if (!enemy || enemy.hp <= 0) break
        let dmg = enemy.burn * effect.perStack
        if (dmg <= 0) break
        let armorPenetration = 0
        ;({ dmg, s, armorPenetration } = applyDmgMods(dmg, s, targetIndex, category))
        s = dealDamageToEnemy(s, targetIndex, dmg, armorPenetration)
        break
      }
      case 'freeze': {
        const enemy = s.enemies[targetIndex]
        if (enemy && enemy.hp > 0 && !enemy.freezeImmune) {
          if (enemy.defId === 'elemental_symbiote') {
            const healed = Math.min(enemy.maxHp, enemy.hp + 10)
            s = {
              ...s,
              enemies: s.enemies.map((e, i) =>
                i === targetIndex ? { ...e, hp: healed } : e
              ),
            }
            break
          }
          const newEnemies = s.enemies.map((e, i) =>
            i === targetIndex ? { ...e, freeze: 1 } : e
          )
          s = { ...s, enemies: newEnemies }
        }
        break
      }
      case 'poison': {
        const enemy = s.enemies[targetIndex]
        if (enemy && enemy.hp > 0) {
          if (enemy.defId === 'elemental_symbiote') break
          const newEnemies = s.enemies.map((e, i) =>
            i === targetIndex ? { ...e, poison: e.poison + effect.value } : e
          )
          s = { ...s, enemies: newEnemies }
        }
        break
      }
      case 'poison_burst': {
        const enemy = s.enemies[targetIndex]
        if (!enemy || enemy.hp <= 0) break
        let dmg = effect.base + (enemy.poison * effect.perPoison)
        let armorPenetration = 0
        ;({ dmg, s, armorPenetration } = applyDmgMods(dmg, s, targetIndex, category))
        s = dealDamageToEnemy(s, targetIndex, dmg, armorPenetration)
        break
      }
      case 'gain_strength':
        s = { ...s, player: { ...s.player, strength: s.player.strength + effect.value } }
        break
      case 'weaken_enemy': {
        const enemy = s.enemies[targetIndex]
        if (enemy && enemy.hp > 0) {
          const newEnemies = s.enemies.map((e, i) =>
            i === targetIndex ? { ...e, weakened: e.weakened + effect.value } : e
          )
          s = { ...s, enemies: newEnemies }
        }
        break
      }
      case 'convert_mana_to_stamina': {
        const mana = s.player.mana
        s = { ...s, player: { ...s.player, mana: 0, stamina: s.player.stamina + mana } }
        break
      }
      case 'buff_next_combat':
        s = { ...s, player: { ...s.player, buffNextCombat: effect.value } }
        break
      case 'conditional_damage': {
        const enemy = s.enemies[targetIndex]
        let dmg = effect.base
        dmg = applyCombatDmgBonus(dmg, s)
        if (effect.condition === 'enemy_damaged' && enemy?.damagedThisTurn) {
          dmg = effect.base + effect.value
          dmg = applyCombatDmgBonus(dmg, s)
        } else if (effect.condition === 'combat_played' && s.turnTracking.combatCardsPlayedThisTurn > 0) {
          dmg += effect.value
        }
        if (s.player.buffNextCombatDouble) {
          dmg = dmg * 2
          s = { ...s, player: { ...s.player, buffNextCombatDouble: false } }
        }
        let armorPenetration = 0
        ;({ dmg, s, armorPenetration } = applyDmgMods(dmg, s, targetIndex, category))
        const beforeTarget = s.enemies[targetIndex]
        s = dealDamageToEnemy(s, targetIndex, dmg, armorPenetration)
        s = applyPoisonOnAttack(s, targetIndex, category)
        const afterTarget = s.enemies[targetIndex]
        const killed = !!beforeTarget && beforeTarget.hp > 0 && !!afterTarget && afterTarget.hp <= 0
        if (category === 'combat' || category === 'spell') {
          const dealt = beforeTarget && afterTarget ? Math.max(0, (beforeTarget.hp + beforeTarget.armor) - (afterTarget.hp + afterTarget.armor)) : 0
          s = applyAttackHitEnchantments(s, targetIndex, killed, dealt)
        }
        break
      }
      case 'conditional_damage_vs_vulnerable': {
        const target = s.enemies[targetIndex]
        const raw = target && target.vulnerable > 0 ? effect.vulnerableDamage : effect.base
        let dmg = applyCombatDmgBonus(raw, s)
        if (s.player.buffNextCombatDouble) {
          dmg = dmg * 2
          s = { ...s, player: { ...s.player, buffNextCombatDouble: false } }
        }
        let armorPenetration = 0
        ;({ dmg, s, armorPenetration } = applyDmgMods(dmg, s, targetIndex, category))
        const beforeTarget = s.enemies[targetIndex]
        s = dealDamageToEnemy(s, targetIndex, dmg, armorPenetration)
        s = applyPoisonOnAttack(s, targetIndex, category)
        const afterTarget = s.enemies[targetIndex]
        const killed = !!beforeTarget && beforeTarget.hp > 0 && !!afterTarget && afterTarget.hp <= 0
        if (category === 'combat' || category === 'spell') {
          const dealt = beforeTarget && afterTarget ? Math.max(0, (beforeTarget.hp + beforeTarget.armor) - (afterTarget.hp + afterTarget.armor)) : 0
          s = applyAttackHitEnchantments(s, targetIndex, killed, dealt)
        }
        break
      }
      case 'execute': {
        const enemy = s.enemies[targetIndex]
        if (!enemy) break
        const hpPercent = (enemy.hp / enemy.maxHp) * 100
        let dmg = (hpPercent <= effect.threshold ? effect.damage : effect.baseDamage)
        dmg = applyCombatDmgBonus(dmg, s)
        if (s.player.buffNextCombatDouble) {
          dmg = dmg * 2
          s = { ...s, player: { ...s.player, buffNextCombatDouble: false } }
        }
        let armorPenetration = 0
        ;({ dmg, s, armorPenetration } = applyDmgMods(dmg, s, targetIndex, category))
        const beforeTarget = s.enemies[targetIndex]
        s = dealDamageToEnemy(s, targetIndex, dmg, armorPenetration)
        s = applyPoisonOnAttack(s, targetIndex, category)
        const afterTarget = s.enemies[targetIndex]
        const killed = !!beforeTarget && beforeTarget.hp > 0 && !!afterTarget && afterTarget.hp <= 0
        if (category === 'combat' || category === 'spell') {
          const dealt = beforeTarget && afterTarget ? Math.max(0, (beforeTarget.hp + beforeTarget.armor) - (afterTarget.hp + afterTarget.armor)) : 0
          s = applyAttackHitEnchantments(s, targetIndex, killed, dealt)
        }
        break
      }
      case 'buff_next_combat_double':
        s = { ...s, player: { ...s.player, buffNextCombatDouble: true } }
        break
      case 'buff_next_spell':
        s = { ...s, player: { ...s.player, buffNextSpellDamage: effect.bonusDamage, buffNextSpellMana: effect.bonusMana } }
        break
      case 'self_damage_gain_mana': {
        const newHp = Math.max(0, s.player.hp - effect.damage)
        s = { ...s, player: { ...s.player, hp: newHp, mana: s.player.mana + effect.mana } }
        s = { ...s, turnTracking: { ...s.turnTracking, damageTakenThisTurn: s.turnTracking.damageTakenThisTurn + effect.damage } }
        break
      }
      case 'scaling_damage': {
        let dmg = effect.base + (effect.perCombatPlayed * s.turnTracking.combatCardsPlayedThisTurn)
        dmg = applyCombatDmgBonus(dmg, s)
        if (s.player.buffNextCombatDouble) {
          dmg = dmg * 2
          s = { ...s, player: { ...s.player, buffNextCombatDouble: false } }
        }
        let armorPenetration = 0
        ;({ dmg, s, armorPenetration } = applyDmgMods(dmg, s, targetIndex, category))
        const beforeTarget = s.enemies[targetIndex]
        s = dealDamageToEnemy(s, targetIndex, dmg, armorPenetration)
        s = applyPoisonOnAttack(s, targetIndex, category)
        const afterTarget = s.enemies[targetIndex]
        const killed = !!beforeTarget && beforeTarget.hp > 0 && !!afterTarget && afterTarget.hp <= 0
        if (category === 'combat' || category === 'spell') {
          const dealt = beforeTarget && afterTarget ? Math.max(0, (beforeTarget.hp + beforeTarget.armor) - (afterTarget.hp + afterTarget.armor)) : 0
          s = applyAttackHitEnchantments(s, targetIndex, killed, dealt)
        }
        break
      }
      case 'chain_damage': {
        for (let i = 0; i < effect.bounces; i++) {
          let dmg = effect.value
          let armorPenetration = 0
          ;({ dmg, s, armorPenetration } = applyDmgMods(dmg, s, targetIndex, category))
          const beforeTarget = s.enemies[targetIndex]
          s = dealDamageToEnemy(s, targetIndex, dmg, armorPenetration)
          const afterTarget = s.enemies[targetIndex]
          const killed = !!beforeTarget && beforeTarget.hp > 0 && !!afterTarget && afterTarget.hp <= 0
          if (category === 'combat' || category === 'spell') {
            const dealt = beforeTarget && afterTarget ? Math.max(0, (beforeTarget.hp + beforeTarget.armor) - (afterTarget.hp + afterTarget.armor)) : 0
            s = applyAttackHitEnchantments(s, targetIndex, killed, dealt)
          }
        }
        s = applyPoisonOnAttack(s, targetIndex, category)
        break
      }
      case 'permanent_poison_on_attack':
        s = { ...s, player: { ...s.player, poisonOnAttack: s.player.poisonOnAttack + effect.value } }
        break
      case 'damage_gain_armor': {
        let dmg = effect.damage
        if (s.player.doubleDamageArmorThisTurn) {
          dmg *= 2
        }
        dmg = applyCombatDmgBonus(dmg, s)
        if (s.player.buffNextCombatDouble) {
          dmg = dmg * 2
          s = { ...s, player: { ...s.player, buffNextCombatDouble: false } }
        }
        let armorPenetration = 0
        ;({ dmg, s, armorPenetration } = applyDmgMods(dmg, s, targetIndex, category))
        const beforeTarget = s.enemies[targetIndex]
        s = dealDamageToEnemy(s, targetIndex, dmg, armorPenetration)
        s = {
          ...s,
          player: {
            ...s.player,
            armor: s.player.armor + (s.player.doubleDamageArmorThisTurn ? effect.armor * 2 : effect.armor),
          },
        }
        s = applyPoisonOnAttack(s, targetIndex, category)
        const afterTarget = s.enemies[targetIndex]
        const killed = !!beforeTarget && beforeTarget.hp > 0 && !!afterTarget && afterTarget.hp <= 0
        if (category === 'combat' || category === 'spell') {
          const dealt = beforeTarget && afterTarget ? Math.max(0, (beforeTarget.hp + beforeTarget.armor) - (afterTarget.hp + afterTarget.armor)) : 0
          s = applyAttackHitEnchantments(s, targetIndex, killed, dealt)
        }
        break
      }
      case 'conditional_armor': {
        if (effect.condition === 'damage_taken' && s.turnTracking.damageTakenThisTurn > 0) {
          s = { ...s, player: { ...s.player, armor: s.player.armor + effect.value } }
        }
        break
      }
      case 'draw_cards':
        // handled in combat.ts after applyCardEffects
        break
      case 'aoe_damage': {
        for (let i = 0; i < s.enemies.length; i++) {
          if (s.enemies[i].hp <= 0) continue
          let dmg = effect.value
          if (s.player.doubleDamageArmorThisTurn) {
            dmg *= 2
          }
          dmg = applyCombatDmgBonus(dmg, s)
          if (s.player.buffNextCombatDouble) {
            dmg = dmg * 2
            s = { ...s, player: { ...s.player, buffNextCombatDouble: false } }
          }
          let armorPenetration = 0
          ;({ dmg, s, armorPenetration } = applyDmgMods(dmg, s, i, category))
          const beforeTarget = s.enemies[i]
          s = dealDamageToEnemy(s, i, dmg, armorPenetration)
          s = applyPoisonOnAttack(s, i, category)
          const afterTarget = s.enemies[i]
          const killed = !!beforeTarget && beforeTarget.hp > 0 && !!afterTarget && afterTarget.hp <= 0
          if (category === 'combat' || category === 'spell') {
            const dealt = beforeTarget && afterTarget ? Math.max(0, (beforeTarget.hp + beforeTarget.armor) - (afterTarget.hp + afterTarget.armor)) : 0
            s = applyAttackHitEnchantments(s, i, killed, dealt)
          }
        }
        break
      }
      case 'aoe_burn': {
        const newEnemies = s.enemies.map(e =>
          e.hp > 0 && e.defId !== 'elemental_symbiote' ? { ...e, burn: e.burn + effect.value } : e
        )
        s = { ...s, enemies: newEnemies }
        break
      }
      case 'aoe_freeze': {
        const newEnemies = s.enemies.map(e =>
          e.hp > 0 && !e.freezeImmune ? { ...e, freeze: 1 } : e
        )
        s = { ...s, enemies: newEnemies }
        break
      }
      case 'lifesteal': {
        let dmg = effect.value
        if (s.player.doubleDamageArmorThisTurn) {
          dmg *= 2
        }
        if (s.player.buffNextSpellDamage > 0) {
          dmg += s.player.buffNextSpellDamage
          const bonusMana = s.player.buffNextSpellMana
          s = { ...s, player: { ...s.player, buffNextSpellDamage: 0, buffNextSpellMana: 0, mana: s.player.mana + bonusMana } }
        }
        let armorPenetration = 0
        ;({ dmg, s, armorPenetration } = applyDmgMods(dmg, s, targetIndex, category))
        const beforeTarget = s.enemies[targetIndex]
        s = dealDamageToEnemy(s, targetIndex, dmg, armorPenetration)
        s = { ...s, player: { ...s.player, hp: Math.min(s.player.maxHp, s.player.hp + dmg) } }
        s = applyPoisonOnAttack(s, targetIndex, category)
        const afterTarget = s.enemies[targetIndex]
        const killed = !!beforeTarget && beforeTarget.hp > 0 && !!afterTarget && afterTarget.hp <= 0
        if (category === 'combat' || category === 'spell') {
          const dealt = beforeTarget && afterTarget ? Math.max(0, (beforeTarget.hp + beforeTarget.armor) - (afterTarget.hp + afterTarget.armor)) : 0
          s = applyAttackHitEnchantments(s, targetIndex, killed, dealt)
        }
        break
      }
      case 'combat_damage_bonus': {
        s = { ...s, turnTracking: { ...s.turnTracking, combatDamageBonus: s.turnTracking.combatDamageBonus + effect.value } }
        break
      }
      case 'vulnerable': {
        const enemy = s.enemies[targetIndex]
        if (enemy && enemy.hp > 0) {
          const newEnemies = s.enemies.map((e, i) =>
            i === targetIndex ? { ...e, vulnerable: e.vulnerable + effect.value } : e
          )
          s = { ...s, enemies: newEnemies }
        }
        break
      }
      case 'gain_wisdom':
        s = { ...s, player: { ...s.player, wisdom: s.player.wisdom + effect.value } }
        break
      case 'gain_barrier':
        s = { ...s, player: { ...s.player, barrier: s.player.barrier + effect.value } }
        break
      case 'gain_charge':
        s = { ...s, player: { ...s.player, charge: s.player.charge + effect.value } }
        break
      case 'set_next_turn_stamina_penalty':
        s = {
          ...s,
          player: { ...s.player, nextTurnStaminaPenalty: s.player.nextTurnStaminaPenalty + effect.value },
        }
        break
      case 'set_end_turn_self_damage':
        s = {
          ...s,
          player: { ...s.player, pendingEndTurnSelfDamage: s.player.pendingEndTurnSelfDamage + effect.value },
        }
        break
      case 'gain_thorns':
        s = { ...s, player: { ...s.player, thorns: s.player.thorns + effect.value } }
        break
      case 'set_magic_absorb':
        s = { ...s, player: { ...s.player, magicAbsorbBonusMana: effect.bonusMana } }
        break
      case 'global_cost_reduction':
        s = { ...s, player: { ...s.player, tempCostReduction: s.player.tempCostReduction + effect.value } }
        break
      case 'set_damage_taken_multiplier':
        s = { ...s, player: { ...s.player, damageTakenMultiplier: Math.max(0.1, Math.min(1, effect.value)) } }
        break
      case 'set_double_damage_armor_this_turn':
        s = { ...s, player: { ...s.player, doubleDamageArmorThisTurn: true } }
        break
      case 'hp_percent_for_strength': {
        const loseHp = Math.max(1, Math.floor(s.player.maxHp * effect.hpPercent / 100))
        const hp = Math.max(1, s.player.hp - loseHp)
        s = { ...s, player: { ...s.player, hp, strength: s.player.strength + effect.strength } }
        break
      }
      case 'current_hp_percent_for_strength': {
        const loseHp = Math.max(1, Math.floor(s.player.hp * effect.hpPercent / 100))
        const hp = Math.max(1, s.player.hp - loseHp)
        s = { ...s, player: { ...s.player, hp, strength: s.player.strength + effect.strength } }
        break
      }
      case 'self_damage': {
        const hp = Math.max(1, s.player.hp - effect.value)
        s = { ...s, player: { ...s.player, hp } }
        break
      }
      case 'purge_curse': {
        let remaining = effect.value
        const isCurse = (id: string) => id.startsWith('curse_')
        const removeFromPile = (pile: import('./types').CardInstance[]) => {
          const next: import('./types').CardInstance[] = []
          for (const card of pile) {
            if (remaining > 0 && isCurse(card.defId)) {
              remaining--
            } else {
              next.push(card)
            }
          }
          return next
        }
        s = {
          ...s,
          player: {
            ...s.player,
            hand: removeFromPile(s.player.hand),
            drawPile: removeFromPile(s.player.drawPile),
            discardPile: removeFromPile(s.player.discardPile),
          },
        }
        break
      }
      case 'draw_cards_if_affordable':
        // handled in combat.ts after applyCardEffects
        break
      case 'redraw_hand':
      case 'purge_curse_in_hand_draw':
        // handled in combat.ts after applyCardEffects
        break
    }
  }
  return s
}
