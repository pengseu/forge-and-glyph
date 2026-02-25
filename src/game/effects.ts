import type { BattleState, CardEffect } from './types'

function dealDamageToEnemy(state: BattleState, damage: number): BattleState {
  let remaining = damage
  let armor = state.enemy.armor
  let hp = state.enemy.hp

  if (armor > 0) {
    const absorbed = Math.min(armor, remaining)
    armor -= absorbed
    remaining -= absorbed
  }
  hp = Math.max(0, hp - remaining)

  return {
    ...state,
    enemy: { ...state.enemy, armor, hp },
  }
}

export function applyCardEffects(state: BattleState, effects: CardEffect[]): BattleState {
  let s = state
  for (const effect of effects) {
    switch (effect.type) {
      case 'damage': {
        let dmg = effect.value + s.player.strength
        // Apply buffNextCombat bonus
        if (s.player.buffNextCombat > 0) {
          dmg = Math.floor(dmg * (1 + s.player.buffNextCombat / 100))
          s = { ...s, player: { ...s.player, buffNextCombat: 0 } }
        }
        s = dealDamageToEnemy(s, dmg)
        break
      }
      case 'multi_damage':
        for (let i = 0; i < effect.hits; i++) {
          s = dealDamageToEnemy(s, effect.value + s.player.strength)
        }
        break
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
      case 'burn':
        s = { ...s, enemy: { ...s.enemy, burn: s.enemy.burn + effect.value } }
        break
      case 'freeze':
        s = { ...s, enemy: { ...s.enemy, freeze: s.enemy.freeze + effect.value } }
        break
      case 'poison':
        s = { ...s, enemy: { ...s.enemy, poison: s.enemy.poison + effect.value } }
        break
      case 'gain_strength':
        s = { ...s, player: { ...s.player, strength: s.player.strength + effect.value } }
        break
      case 'weaken_enemy':
        s = { ...s, enemy: { ...s.enemy, weakened: s.enemy.weakened + effect.value } }
        break
      case 'convert_mana_to_stamina': {
        const mana = s.player.mana
        s = { ...s, player: { ...s.player, mana: 0, stamina: s.player.stamina + mana } }
        break
      }
      case 'buff_next_combat':
        s = { ...s, player: { ...s.player, buffNextCombat: effect.value } }
        break
    }
  }
  return s
}
