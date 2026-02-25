import { describe, it, expect } from 'vitest'
import { createBattleState, startTurn, playCard, endPlayerTurn } from '../combat'
import { getCardDef } from '../cards'

describe('combat', () => {
  it('createBattleState should set up initial state', () => {
    const state = createBattleState()
    expect(state.player.maxHp).toBe(50)
    expect(state.player.maxStamina).toBe(3)
    expect(state.player.maxMana).toBe(2)
    expect(state.enemy.maxHp).toBe(20)
    expect(state.turn).toBe(0)
  })

  it('startTurn should refresh resources, clear armor, draw 5, increment turn', () => {
    let state = createBattleState()
    state = startTurn(state)
    expect(state.player.stamina).toBe(3)
    expect(state.player.mana).toBe(2)
    expect(state.player.armor).toBe(0)
    expect(state.player.hand).toHaveLength(5)
    expect(state.turn).toBe(1)
    expect(state.phase).toBe('player_turn')
  })

  it('playCard should spend resource and apply effects', () => {
    let state = createBattleState()
    state = startTurn(state)
    const slashCard = state.player.hand.find(
      c => getCardDef(c.defId).id === 'slash'
    )
    if (!slashCard) {
      // If no slash in hand, manually add one for testing
      state = {
        ...state,
        player: {
          ...state.player,
          hand: [...state.player.hand, { uid: 'test_slash', defId: 'slash' }],
        },
      }
    }
    const slashUid = state.player.hand.find(
      c => getCardDef(c.defId).id === 'slash'
    )!.uid
    state = playCard(state, slashUid)
    expect(state.player.stamina).toBe(2)
    expect(state.enemy.hp).toBeLessThan(20)
  })

  it('playCard should reject if not enough resource', () => {
    let state = createBattleState()
    state = startTurn(state)
    state.player.stamina = 0
    const slashUid = state.player.hand.find(
      c => getCardDef(c.defId).id === 'slash'
    )?.uid
    if (slashUid) {
      const before = state.enemy.hp
      state = playCard(state, slashUid)
      expect(state.enemy.hp).toBe(before) // no change
    }
  })

  it('endPlayerTurn should execute enemy intent and discard hand', () => {
    let state = createBattleState()
    state = startTurn(state)
    const hpBefore = state.player.hp
    state = endPlayerTurn(state)
    expect(state.player.hp).toBeLessThan(hpBefore) // enemy attacks
    expect(state.player.hand).toHaveLength(5) // new hand drawn
    expect(state.phase).toBe('player_turn') // ready for next turn
  })
})
