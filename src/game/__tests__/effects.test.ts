import { describe, it, expect, beforeEach } from 'vitest'
import { applyCardEffects } from '../effects'
import type { BattleState } from '../types'
import { createBattleState } from '../combat'

describe('effects', () => {
  let state: BattleState

  beforeEach(() => {
    state = createBattleState(['goblin_scout'])
  })

  it('damage should reduce enemy hp (armor first)', () => {
    const enemies = state.enemies.map((e, i) => i === 0 ? { ...e, armor: 3 } : e)
    state = { ...state, enemies }
    state = applyCardEffects(state, [{ type: 'damage', value: 10 }], 0)
    expect(state.enemies[0].armor).toBe(0)
    expect(state.enemies[0].hp).toBe(state.enemies[0].maxHp - 7)
  })

  it('multi_damage should hit multiple times', () => {
    state = applyCardEffects(state, [{ type: 'multi_damage', value: 3, hits: 2 }], 0)
    expect(state.enemies[0].hp).toBe(state.enemies[0].maxHp - 6)
  })

  it('armor should add to player armor', () => {
    state = applyCardEffects(state, [{ type: 'armor', value: 5 }], 0)
    expect(state.player.armor).toBe(5)
  })

  it('burn should add to enemy burn stacks', () => {
    state = applyCardEffects(state, [{ type: 'burn', value: 2 }], 0)
    expect(state.enemies[0].burn).toBe(2)
  })

  it('gain_mana should add mana', () => {
    state = { ...state, player: { ...state.player, mana: 1 } }
    state = applyCardEffects(state, [{ type: 'gain_mana', value: 2 }], 0)
    expect(state.player.mana).toBe(3)
  })

  it('execute should deal bonus damage when enemy below threshold', () => {
    const enemies = state.enemies.map((e, i) => i === 0 ? { ...e, hp: 5, maxHp: 20 } : e)
    state = { ...state, enemies }
    state = applyCardEffects(state, [{ type: 'execute', threshold: 30, damage: 18, baseDamage: 6 }], 0)
    expect(state.enemies[0].hp).toBe(0)
  })

  it('execute should deal base damage when enemy above threshold', () => {
    const enemies = state.enemies.map((e, i) => i === 0 ? { ...e, hp: 20, maxHp: 20 } : e)
    state = { ...state, enemies }
    state = applyCardEffects(state, [{ type: 'execute', threshold: 30, damage: 18, baseDamage: 6 }], 0)
    expect(state.enemies[0].hp).toBe(14)
  })

  it('conditional_damage should add bonus when enemy damaged this turn', () => {
    const enemies = state.enemies.map((e, i) => i === 0 ? { ...e, damagedThisTurn: true } : e)
    state = { ...state, enemies }
    const hpBefore = state.enemies[0].hp
    state = applyCardEffects(state, [{ type: 'conditional_damage', base: 4, value: 6, condition: 'enemy_damaged' }], 0)
    expect(state.enemies[0].hp).toBe(hpBefore - 10)
  })

  it('conditional_damage should deal only base when condition not met', () => {
    const hpBefore = state.enemies[0].hp
    state = applyCardEffects(state, [{ type: 'conditional_damage', base: 4, value: 6, condition: 'enemy_damaged' }], 0)
    expect(state.enemies[0].hp).toBe(hpBefore - 4)
  })

  it('buff_next_combat_double should double next damage', () => {
    state = applyCardEffects(state, [{ type: 'buff_next_combat_double' }], 0)
    expect(state.player.buffNextCombatDouble).toBe(true)
    const hpBefore = state.enemies[0].hp
    state = applyCardEffects(state, [{ type: 'damage', value: 6 }], 0)
    expect(state.enemies[0].hp).toBe(hpBefore - 12)
    expect(state.player.buffNextCombatDouble).toBe(false)
  })

  it('self_damage_gain_mana should cost hp and gain mana', () => {
    state = { ...state, player: { ...state.player, hp: 50, mana: 0 } }
    state = applyCardEffects(state, [{ type: 'self_damage_gain_mana', damage: 5, mana: 3 }], 0)
    expect(state.player.hp).toBe(45)
    expect(state.player.mana).toBe(3)
  })

  it('permanent_poison_on_attack should set poisonOnAttack', () => {
    state = applyCardEffects(state, [{ type: 'permanent_poison_on_attack', value: 2 }], 0)
    expect(state.player.poisonOnAttack).toBe(2)
  })

  it('damage_gain_armor should deal damage and gain armor', () => {
    const hpBefore = state.enemies[0].hp
    state = applyCardEffects(state, [{ type: 'damage_gain_armor', damage: 5, armor: 5 }], 0)
    expect(state.enemies[0].hp).toBe(hpBefore - 5)
    expect(state.player.armor).toBe(5)
  })

  it('chain_damage should hit multiple times', () => {
    const hpBefore = state.enemies[0].hp
    state = applyCardEffects(state, [{ type: 'chain_damage', value: 4, bounces: 3 }], 0)
    expect(state.enemies[0].hp).toBe(hpBefore - 12)
  })

  it('poisonOnAttack should apply poison on combat damage', () => {
    state = { ...state, player: { ...state.player, poisonOnAttack: 2 } }
    state = applyCardEffects(state, [{ type: 'damage', value: 5 }], 0, 'combat')
    expect(state.enemies[0].poison).toBe(2)
  })

  it('poisonOnAttack should NOT apply on spell damage', () => {
    state = { ...state, player: { ...state.player, poisonOnAttack: 2 } }
    state = applyCardEffects(state, [{ type: 'damage', value: 5 }], 0, 'spell')
    expect(state.enemies[0].poison).toBe(0)
  })

  it('poison should cap at 20 and overflow should convert to immediate damage', () => {
    const hpBefore = state.enemies[0].hp
    state = {
      ...state,
      enemies: state.enemies.map((e, i) => (i === 0 ? { ...e, poison: 19 } : e)),
    }
    state = applyCardEffects(state, [{ type: 'poison', value: 5 }], 0)
    expect(state.enemies[0].poison).toBe(20)
    expect(state.enemies[0].hp).toBe(hpBefore - 4)
  })

  it('thorn vine retaliation should be mitigated by player armor', () => {
    state = createBattleState(['thorn_vine'])
    state = { ...state, player: { ...state.player, hp: 40, armor: 3 } }
    state = applyCardEffects(state, [{ type: 'damage', value: 6 }], 0, 'combat')
    expect(state.player.armor).toBe(0)
    expect(state.player.hp).toBe(40)
  })

  it('thorn vine retaliation should set phase to defeat when player hp reaches 0', () => {
    state = createBattleState(['thorn_vine'])
    state = { ...state, player: { ...state.player, hp: 2, armor: 0 } }
    state = applyCardEffects(state, [{ type: 'damage', value: 6 }], 0, 'combat')
    expect(state.player.hp).toBe(0)
    expect(state.phase).toBe('defeat')
  })

  it('strength should boost combat damage', () => {
    state = { ...state, player: { ...state.player, strength: 3 } }
    const hpBefore = state.enemies[0].hp
    state = applyCardEffects(state, [{ type: 'damage', value: 5 }], 0, 'combat')
    expect(state.enemies[0].hp).toBe(hpBefore - 8) // 5 + 3 strength
  })

  it('strength should NOT boost spell damage', () => {
    state = { ...state, player: { ...state.player, strength: 3 } }
    const hpBefore = state.enemies[0].hp
    state = applyCardEffects(state, [{ type: 'damage', value: 5 }], 0, 'spell')
    expect(state.enemies[0].hp).toBe(hpBefore - 5)
  })

  // --- New status effect tests ---

  it('wisdom should boost spell damage but not combat damage', () => {
    state = { ...state, player: { ...state.player, wisdom: 3 } }
    const hpBefore = state.enemies[0].hp
    state = applyCardEffects(state, [{ type: 'damage', value: 5 }], 0, 'spell')
    expect(state.enemies[0].hp).toBe(hpBefore - 8) // 5 + 3 wisdom
  })

  it('wisdom should not boost combat damage', () => {
    state = { ...state, player: { ...state.player, wisdom: 3 } }
    const hpBefore = state.enemies[0].hp
    state = applyCardEffects(state, [{ type: 'damage', value: 5 }], 0, 'combat')
    expect(state.enemies[0].hp).toBe(hpBefore - 5)
  })

  it('charge should multiply spell damage then clear', () => {
    state = { ...state, player: { ...state.player, charge: 2 } }
    const hpBefore = state.enemies[0].hp
    // 5 base, charge 2 => floor(5 * 1.2) = 6
    state = applyCardEffects(state, [{ type: 'damage', value: 5 }], 0, 'spell')
    expect(state.enemies[0].hp).toBe(hpBefore - 6)
    expect(state.player.charge).toBe(0)
  })

  it('charge should not affect combat damage', () => {
    state = { ...state, player: { ...state.player, charge: 2 } }
    const hpBefore = state.enemies[0].hp
    state = applyCardEffects(state, [{ type: 'damage', value: 5 }], 0, 'combat')
    expect(state.enemies[0].hp).toBe(hpBefore - 5)
    expect(state.player.charge).toBe(2) // not consumed
  })

  it('vulnerable should increase damage taken by 50%', () => {
    const enemies = state.enemies.map((e, i) => i === 0 ? { ...e, vulnerable: 2 } : e)
    state = { ...state, enemies }
    const hpBefore = state.enemies[0].hp
    // 10 base => floor(10 * 1.5) = 15
    state = applyCardEffects(state, [{ type: 'damage', value: 10 }], 0)
    expect(state.enemies[0].hp).toBe(hpBefore - 15)
  })

  it('player weakened should reduce damage by 25%', () => {
    state = { ...state, player: { ...state.player, weakened: 2 } }
    const hpBefore = state.enemies[0].hp
    // 10 base => floor(10 * 0.75) = 7
    state = applyCardEffects(state, [{ type: 'damage', value: 10 }], 0)
    expect(state.enemies[0].hp).toBe(hpBefore - 7)
  })

  it('freeze should not apply to freezeImmune enemy', () => {
    const enemies = state.enemies.map((e, i) => i === 0 ? { ...e, freezeImmune: true } : e)
    state = { ...state, enemies }
    state = applyCardEffects(state, [{ type: 'freeze', value: 1 }], 0)
    expect(state.enemies[0].freeze).toBe(0)
  })

  it('freeze should apply to non-immune enemy as 1 (no stack)', () => {
    state = applyCardEffects(state, [{ type: 'freeze', value: 1 }], 0)
    expect(state.enemies[0].freeze).toBe(1)
    // Applying again should still be 1
    state = applyCardEffects(state, [{ type: 'freeze', value: 1 }], 0)
    expect(state.enemies[0].freeze).toBe(1)
  })

  it('gain_wisdom should increase player wisdom', () => {
    state = applyCardEffects(state, [{ type: 'gain_wisdom', value: 2 }], 0)
    expect(state.player.wisdom).toBe(2)
  })

  it('gain_barrier should increase player barrier', () => {
    state = applyCardEffects(state, [{ type: 'gain_barrier', value: 5 }], 0)
    expect(state.player.barrier).toBe(5)
  })

  it('gain_charge should increase player charge', () => {
    state = applyCardEffects(state, [{ type: 'gain_charge', value: 3 }], 0)
    expect(state.player.charge).toBe(3)
  })

  it('vulnerable effect should add vulnerable stacks to enemy', () => {
    state = applyCardEffects(state, [{ type: 'vulnerable', value: 2 }], 0)
    expect(state.enemies[0].vulnerable).toBe(2)
  })

  it('burn_burst should deal damage based on current burn stacks', () => {
    state = { ...state, enemies: state.enemies.map((e, i) => (i === 0 ? { ...e, burn: 4 } : e)) }
    const hpBefore = state.enemies[0].hp
    state = applyCardEffects(state, [{ type: 'burn_burst', perStack: 3 }], 0, 'spell')
    expect(state.enemies[0].hp).toBe(hpBefore - 12)
    expect(state.enemies[0].burn).toBe(4)
  })

  it('aoe_freeze should freeze all alive non-immune enemies', () => {
    state = createBattleState(['goblin_scout', 'forest_wolf'])
    state = {
      ...state,
      enemies: state.enemies.map((e, i) => (i === 1 ? { ...e, freezeImmune: true } : e)),
    }
    state = applyCardEffects(state, [{ type: 'aoe_freeze', value: 1 }], 0, 'spell')
    expect(state.enemies[0].freeze).toBe(1)
    expect(state.enemies[1].freeze).toBe(0)
  })

  it('poison_burst should deal base + poison stacks damage', () => {
    state = { ...state, enemies: state.enemies.map((e, i) => (i === 0 ? { ...e, poison: 4 } : e)) }
    const hpBefore = state.enemies[0].hp
    state = applyCardEffects(state, [{ type: 'poison_burst', base: 3, perPoison: 1 }], 0, 'combat')
    expect(state.enemies[0].hp).toBe(hpBefore - 7)
  })

  it('global_cost_reduction should accumulate this turn', () => {
    state = applyCardEffects(state, [{ type: 'global_cost_reduction', value: 1 }], 0)
    state = applyCardEffects(state, [{ type: 'global_cost_reduction', value: 1 }], 0)
    expect(state.player.tempCostReduction).toBe(2)
  })

  it('set_next_turn_stamina_penalty and set_end_turn_self_damage should set pending values', () => {
    state = applyCardEffects(state, [{ type: 'set_next_turn_stamina_penalty', value: 1 }], 0)
    state = applyCardEffects(state, [{ type: 'set_end_turn_self_damage', value: 5 }], 0)
    expect(state.player.nextTurnStaminaPenalty).toBe(1)
    expect(state.player.pendingEndTurnSelfDamage).toBe(5)
  })

  it('self_damage should reduce hp but not below 1', () => {
    state = { ...state, player: { ...state.player, hp: 6 } }
    state = applyCardEffects(state, [{ type: 'self_damage', value: 5 }], 0)
    expect(state.player.hp).toBe(1)
  })

  it('set_double_damage_armor_this_turn should double following damage and armor effects', () => {
    const hpBefore = state.enemies[0].hp
    state = applyCardEffects(state, [{ type: 'set_double_damage_armor_this_turn' }], 0)
    state = applyCardEffects(state, [{ type: 'damage', value: 6 }], 0)
    state = applyCardEffects(state, [{ type: 'armor', value: 5 }], 0)
    expect(state.enemies[0].hp).toBe(hpBefore - 12)
    expect(state.player.armor).toBe(10)
  })

  it('set_damage_armor_multiplier_this_turn should scale damage/armor by multiplier', () => {
    const hpBefore = state.enemies[0].hp
    state = applyCardEffects(state, [{ type: 'set_damage_armor_multiplier_this_turn', value: 1.75 }], 0)
    state = applyCardEffects(state, [{ type: 'damage', value: 6 }], 0)
    state = applyCardEffects(state, [{ type: 'armor', value: 5 }], 0)
    expect(state.enemies[0].hp).toBe(hpBefore - 10)
    expect(state.player.armor).toBe(8)
  })

  it('set_damage_taken_multiplier should set player damage multiplier', () => {
    state = applyCardEffects(state, [{ type: 'set_damage_taken_multiplier', value: 0.5 }], 0)
    expect(state.player.damageTakenMultiplier).toBe(0.5)
  })

  describe('elite passives', () => {
    it('shadow assassin should evade single-hit damage <= 4', () => {
      state = createBattleState(['shadow_assassin'])
      const hpBefore = state.enemies[0].hp
      state = applyCardEffects(state, [{ type: 'damage', value: 4 }], 0, 'combat')
      expect(state.enemies[0].hp).toBe(hpBefore)
    })

    it('shadow assassin should take damage when single-hit damage > 4', () => {
      state = createBattleState(['shadow_assassin'])
      const hpBefore = state.enemies[0].hp
      state = applyCardEffects(state, [{ type: 'damage', value: 5 }], 0, 'combat')
      expect(state.enemies[0].hp).toBe(hpBefore - 5)
    })

    it('shadow assassin evade threshold should use final damage after modifiers', () => {
      state = createBattleState(['shadow_assassin'])
      state = { ...state, player: { ...state.player, strength: 3 } }
      const hpBefore = state.enemies[0].hp
      state = applyCardEffects(state, [{ type: 'damage', value: 3 }], 0, 'combat')
      expect(state.enemies[0].hp).toBe(hpBefore - 6)
    })
  })
})
