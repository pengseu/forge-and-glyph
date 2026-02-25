import { describe, it, expect, beforeEach } from 'vitest'
import { applyCardEffects } from '../effects'
import type { BattleState } from '../types'
import { createBattleState } from '../combat'

describe('effects', () => {
  let state: BattleState

  beforeEach(() => {
    state = createBattleState()
  })

  it('damage should reduce enemy hp (armor first)', () => {
    state.enemy.armor = 3
    state = applyCardEffects(state, [{ type: 'damage', value: 10 }])
    expect(state.enemy.armor).toBe(0)
    expect(state.enemy.hp).toBe(state.enemy.maxHp - 7)
  })

  it('multi_damage should hit multiple times', () => {
    state = applyCardEffects(state, [{ type: 'multi_damage', value: 3, hits: 2 }])
    expect(state.enemy.hp).toBe(state.enemy.maxHp - 6)
  })

  it('armor should add to player armor', () => {
    state = applyCardEffects(state, [{ type: 'armor', value: 5 }])
    expect(state.player.armor).toBe(5)
  })

  it('burn should add to enemy burn stacks', () => {
    state = applyCardEffects(state, [{ type: 'burn', value: 2 }])
    expect(state.enemy.burn).toBe(2)
  })

  it('gain_mana should add mana', () => {
    state.player.mana = 1
    state = applyCardEffects(state, [{ type: 'gain_mana', value: 2 }])
    expect(state.player.mana).toBe(3)
  })
})
