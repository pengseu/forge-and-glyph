import { describe, it, expect } from 'vitest'
import { createBattleState, startTurn, playCard, endPlayerTurn, canPlayCard } from '../combat'
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

  describe('weapon effects', () => {
    function makeWeaponState(weaponDefId: string) {
      const deck = [
        { uid: 'c1', defId: 'slash' },
        { uid: 'c2', defId: 'slash' },
        { uid: 'c3', defId: 'heavy_slash' },
        { uid: 'c4', defId: 'spark' },
        { uid: 'c5', defId: 'meditate' },
      ]
      let state = createBattleState(deck, weaponDefId)
      // Manually set hand to control test
      state = {
        ...state,
        player: {
          ...state.player,
          stamina: 3,
          mana: 2,
          hand: [...deck],
          drawPile: [],
        },
      }
      return state
    }

    it('longsword: playing combat card sets weaponDiscount to 1', () => {
      let state = makeWeaponState('longsword')
      expect(state.player.weaponDiscount).toBe(0)
      state = playCard(state, 'c1') // slash, combat card
      expect(state.player.weaponDiscount).toBe(1)
    })

    it('longsword_upgraded: playing combat card sets weaponDiscount to 2', () => {
      let state = makeWeaponState('longsword_upgraded')
      state = playCard(state, 'c1') // slash, combat card
      expect(state.player.weaponDiscount).toBe(2)
    })

    it('weaponDiscount reduces stamina cost of next stamina card', () => {
      let state = makeWeaponState('longsword')
      state = playCard(state, 'c1') // slash costs 1, stamina 3->2, sets discount=1
      expect(state.player.stamina).toBe(2)
      expect(state.player.weaponDiscount).toBe(1)
      state = playCard(state, 'c2') // slash costs 1, discount 1 -> actual 0, stamina stays 2
      expect(state.player.stamina).toBe(2)
      expect(state.player.weaponDiscount).toBe(1) // re-triggered by combat card
    })

    it('weaponDiscount clears after being used on stamina card', () => {
      let state = makeWeaponState('longsword')
      // Manually set discount
      state = { ...state, player: { ...state.player, weaponDiscount: 1, equippedWeaponId: null } }
      state = playCard(state, 'c1') // slash costs 1, discount -> actual 0
      expect(state.player.stamina).toBe(3) // no cost deducted
      expect(state.player.weaponDiscount).toBe(0) // cleared, no weapon to re-trigger
    })

    it('non-combat card does not trigger weapon effect', () => {
      let state = makeWeaponState('longsword')
      state = playCard(state, 'c4') // spark, spell card (mana)
      expect(state.player.weaponDiscount).toBe(0) // not triggered
    })

    it('canPlayCard considers weaponDiscount', () => {
      let state = makeWeaponState('longsword')
      // heavy_slash costs 2, set stamina to 1 with discount 1
      state = { ...state, player: { ...state.player, stamina: 1, weaponDiscount: 1 } }
      expect(canPlayCard(state, 'c3')).toBe(true) // 2 - 1 = 1, stamina 1 >= 1
    })

    it('canPlayCard rejects when discount is not enough', () => {
      let state = makeWeaponState('longsword')
      // heavy_slash costs 2, set stamina to 0 with discount 1
      state = { ...state, player: { ...state.player, stamina: 0, weaponDiscount: 1 } }
      expect(canPlayCard(state, 'c3')).toBe(false) // 2 - 1 = 1, stamina 0 < 1
    })
  })
})
