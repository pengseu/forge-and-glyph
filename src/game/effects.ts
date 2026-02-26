import type { BattleState, CardCategory, CardEffect } from './types'

function dealDamageToEnemy(state: BattleState, targetIndex: number, damage: number): BattleState {
  const enemy = state.enemies[targetIndex]
  if (!enemy || enemy.hp <= 0) return state
  let remaining = damage
  let armor = enemy.armor
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
): { dmg: number; s: BattleState } {
  // Strength (combat only)
  if (category === 'combat') {
    dmg += s.player.strength
  }
  // Wisdom (spell only)
  if (category === 'spell' && s.player.wisdom > 0) {
    dmg += s.player.wisdom
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
  return { dmg, s }
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
        ;({ dmg, s } = applyDmgMods(dmg, s, targetIndex, category))
        s = dealDamageToEnemy(s, targetIndex, dmg)
        s = applyPoisonOnAttack(s, targetIndex, category)
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
          ;({ dmg, s } = applyDmgMods(dmg, s, targetIndex, category))
          s = dealDamageToEnemy(s, targetIndex, dmg)
          s = applyPoisonOnAttack(s, targetIndex, category)
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
        ;({ dmg, s } = applyDmgMods(dmg, s, targetIndex, category))
        s = dealDamageToEnemy(s, targetIndex, dmg)
        s = applyPoisonOnAttack(s, targetIndex, category)
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
        ;({ dmg, s } = applyDmgMods(dmg, s, targetIndex, category))
        s = dealDamageToEnemy(s, targetIndex, dmg)
        s = applyPoisonOnAttack(s, targetIndex, category)
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
        ;({ dmg, s } = applyDmgMods(dmg, s, targetIndex, category))
        s = dealDamageToEnemy(s, targetIndex, dmg)
        s = applyPoisonOnAttack(s, targetIndex, category)
        break
      }
      case 'chain_damage': {
        for (let i = 0; i < effect.bounces; i++) {
          let dmg = effect.value
          ;({ dmg, s } = applyDmgMods(dmg, s, targetIndex, category))
          s = dealDamageToEnemy(s, targetIndex, dmg)
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
        ;({ dmg, s } = applyDmgMods(dmg, s, targetIndex, category))
        s = dealDamageToEnemy(s, targetIndex, dmg)
        s = { ...s, player: { ...s.player, armor: s.player.armor + effect.armor } }
        s = applyPoisonOnAttack(s, targetIndex, category)
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
          ;({ dmg, s } = applyDmgMods(dmg, s, i, category))
          s = dealDamageToEnemy(s, i, dmg)
          s = applyPoisonOnAttack(s, i, category)
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
        ;({ dmg, s } = applyDmgMods(dmg, s, targetIndex, category))
        s = dealDamageToEnemy(s, targetIndex, dmg)
        s = { ...s, player: { ...s.player, hp: Math.min(s.player.maxHp, s.player.hp + dmg) } }
        s = applyPoisonOnAttack(s, targetIndex, category)
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
