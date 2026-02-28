import type { BattleState, CardCategory, CardEffect } from './types'
import { hasResonance } from './enchantments'

function dealDamageToEnemy(
  state: BattleState,
  targetIndex: number,
  damage: number,
  armorPenetration: number = 0,
): BattleState {
  const enemy = state.enemies[targetIndex]
  if (!enemy || enemy.hp <= 0) return state
  // Shadow Assassin passive: evade any single hit <= 5 final damage.
  if (enemy.defId === 'shadow_assassin' && damage <= 5) {
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

  if (armor > 0) {
    const absorbed = Math.min(armor, remaining)
    armor -= absorbed
    remaining -= absorbed
  }
  hp = Math.max(0, hp - remaining)

  const newEnemies = state.enemies.map((e, i) =>
    i === targetIndex ? { ...e, armor, hp, damagedThisTurn: true } : e
  )
  return { ...state, enemies: newEnemies }
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
  // Strength (combat only)
  if (category === 'combat') {
    dmg += s.player.strength
  }
  if (category === 'combat' && s.player.equippedEnchantments.includes('bless')) {
    dmg += 3
    s = { ...s, turnTracking: { ...s.turnTracking, enchantEvents: [...s.turnTracking.enchantEvents, '祝福触发'] } }
  }
  const target = s.enemies[targetIdx]
  if (
    category === 'combat' &&
    hasResonance(s.player.equippedEnchantments, 'flame', 'bless') &&
    target &&
    target.burn > 0
  ) {
    dmg = Math.floor(dmg * 1.5)
    s = { ...s, turnTracking: { ...s.turnTracking, enchantEvents: [...s.turnTracking.enchantEvents, '圣火触发'] } }
  }
  if (category === 'combat' && s.player.equippedEnchantments.includes('void')) {
    armorPenetration = 3
    s = { ...s, turnTracking: { ...s.turnTracking, enchantEvents: [...s.turnTracking.enchantEvents, '虚空触发'] } }
  }
  // Iron bow: if player was unharmed this turn, combat damage +30%.
  if (category === 'combat' && s.player.equippedWeaponId === 'iron_bow' && s.turnTracking.damageTakenThisTurn === 0) {
    dmg = Math.floor(dmg * 1.3)
  }
  // Wisdom (spell only)
  if (category === 'spell' && s.player.wisdom > 0) {
    dmg += s.player.wisdom
  }
  // Iron staff: spell damage +20%.
  if (category === 'spell' && s.player.equippedWeaponId === 'iron_staff') {
    dmg = Math.floor(dmg * 1.2)
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

function applyCombatHitEnchantments(
  s: BattleState,
  targetIndex: number,
  killed: boolean,
): BattleState {
  const target = s.enemies[targetIndex]
  if (!target) return s

  if (s.player.equippedEnchantments.includes('flame') && target.hp > 0) {
    s = {
      ...s,
      enemies: s.enemies.map((e, i) => (i === targetIndex ? { ...e, burn: e.burn + 1 } : e)),
      turnTracking: { ...s.turnTracking, enchantEvents: [...s.turnTracking.enchantEvents, '烈焰触发'] },
    }
  }

  if (s.player.equippedEnchantments.includes('frost') && target.hp > 0 && !target.freezeImmune) {
    if (Math.random() < 0.2) {
      s = {
        ...s,
        enemies: s.enemies.map((e, i) => (i === targetIndex ? { ...e, freeze: 1 } : e)),
        turnTracking: { ...s.turnTracking, enchantEvents: [...s.turnTracking.enchantEvents, '寒冰触发'] },
      }
    }
  }

  if (s.player.equippedEnchantments.includes('thunder')) {
    const candidates = s.enemies
      .map((e, i) => ({ e, i }))
      .filter(({ e, i }) => i !== targetIndex && e.hp > 0)
    const chainIdx = candidates.length > 0
      ? candidates[Math.floor(Math.random() * candidates.length)].i
      : -1
    if (chainIdx >= 0) {
      s = dealDamageToEnemy(s, chainIdx, 3)
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
    const healToFull = hasResonance(s.player.equippedEnchantments, 'soul', 'void')
    s = {
      ...s,
      player: { ...s.player, hp: healToFull ? s.player.maxHp : Math.min(s.player.maxHp, s.player.hp + 5) },
      turnTracking: {
        ...s.turnTracking,
        enchantEvents: [...s.turnTracking.enchantEvents, healToFull ? '死神触发' : '汲魂触发'],
      },
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
        if (category === 'combat') {
          s = applyCombatHitEnchantments(s, targetIndex, killed)
        }
        break
      }
      case 'multi_damage': {
        for (let i = 0; i < effect.hits; i++) {
          let dmg = effect.value
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
          if (category === 'combat') {
            s = applyCombatHitEnchantments(s, targetIndex, killed)
          }
        }
        break
      }
      case 'armor':
        s = { ...s, player: { ...s.player, armor: s.player.armor + effect.value } }
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
          const newEnemies = s.enemies.map((e, i) =>
            i === targetIndex ? { ...e, burn: e.burn + effect.value } : e
          )
          s = { ...s, enemies: newEnemies }
        }
        break
      }
      case 'freeze': {
        const enemy = s.enemies[targetIndex]
        if (enemy && enemy.hp > 0 && !enemy.freezeImmune) {
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
          const newEnemies = s.enemies.map((e, i) =>
            i === targetIndex ? { ...e, poison: e.poison + effect.value } : e
          )
          s = { ...s, enemies: newEnemies }
        }
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
        if (category === 'combat') {
          s = applyCombatHitEnchantments(s, targetIndex, killed)
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
        if (category === 'combat') {
          s = applyCombatHitEnchantments(s, targetIndex, killed)
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
        if (category === 'combat') {
          s = applyCombatHitEnchantments(s, targetIndex, killed)
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
          if (category === 'combat') {
            s = applyCombatHitEnchantments(s, targetIndex, killed)
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
        dmg = applyCombatDmgBonus(dmg, s)
        if (s.player.buffNextCombatDouble) {
          dmg = dmg * 2
          s = { ...s, player: { ...s.player, buffNextCombatDouble: false } }
        }
        let armorPenetration = 0
        ;({ dmg, s, armorPenetration } = applyDmgMods(dmg, s, targetIndex, category))
        const beforeTarget = s.enemies[targetIndex]
        s = dealDamageToEnemy(s, targetIndex, dmg, armorPenetration)
        s = { ...s, player: { ...s.player, armor: s.player.armor + effect.armor } }
        s = applyPoisonOnAttack(s, targetIndex, category)
        const afterTarget = s.enemies[targetIndex]
        const killed = !!beforeTarget && beforeTarget.hp > 0 && !!afterTarget && afterTarget.hp <= 0
        if (category === 'combat') {
          s = applyCombatHitEnchantments(s, targetIndex, killed)
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
          if (category === 'combat') {
            s = applyCombatHitEnchantments(s, i, killed)
          }
        }
        break
      }
      case 'aoe_burn': {
        const newEnemies = s.enemies.map(e =>
          e.hp > 0 ? { ...e, burn: e.burn + effect.value } : e
        )
        s = { ...s, enemies: newEnemies }
        break
      }
      case 'lifesteal': {
        let dmg = effect.value
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
        if (category === 'combat') {
          s = applyCombatHitEnchantments(s, targetIndex, killed)
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
    }
  }
  return s
}
