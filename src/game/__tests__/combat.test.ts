import { describe, it, expect } from 'vitest'
import { createBattleState, startTurn, playCard, endPlayerTurn, canPlayCard, useBattleMaterial, canUseNormalAttack, useNormalAttack } from '../combat'
import { EMPTY_MATERIAL_BAG } from '../materials'
import { getCardDef } from '../cards'

describe('combat', () => {
  it('createBattleState should set up initial state', () => {
    const state = createBattleState(['goblin_scout'])
    expect(state.player.maxHp).toBe(50)
    expect(state.player.maxStamina).toBe(3)
    expect(state.player.maxMana).toBe(2)
    expect(state.enemies[0].maxHp).toBe(28)
    expect(state.turn).toBe(0)
    expect(state.turnTracking).toBeDefined()
    expect(state.turnTracking.combatCardsPlayedThisTurn).toBe(0)
    expect(state.player.poisonOnAttack).toBe(0)
    expect(state.player.buffNextCombatDouble).toBe(false)
    expect(state.player.buffNextSpellDamage).toBe(0)
    expect(state.player.buffNextSpellMana).toBe(0)
    // New fields
    expect(state.player.wisdom).toBe(0)
    expect(state.player.barrier).toBe(0)
    expect(state.player.charge).toBe(0)
    expect(state.player.weakened).toBe(0)
    expect(state.player.guardArmorPerTurn).toBe(0)
    expect(state.enemies[0].vulnerable).toBe(0)
    expect(state.enemies[0].freezeImmune).toBe(false)
  })

  it('startTurn should refresh resources, clear armor, draw 5, increment turn', () => {
    let state = createBattleState(['goblin_scout'])
    state = startTurn(state)
    expect(state.player.stamina).toBe(3)
    expect(state.player.mana).toBe(2)
    expect(state.player.armor).toBe(0)
    expect(state.player.hand).toHaveLength(5)
    expect(state.turn).toBe(1)
    expect(state.phase).toBe('player_turn')
    expect(state.turnTracking.combatCardsPlayedThisTurn).toBe(0)
  })

  it('playCard should spend resource and apply effects', () => {
    let state = createBattleState(['goblin_scout'])
    state = startTurn(state)
    const slashCard = state.player.hand.find(
      c => getCardDef(c.defId).id === 'slash'
    )
    if (!slashCard) {
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
    state = playCard(state, slashUid, 0)
    expect(state.player.stamina).toBe(2)
    expect(state.enemies[0].hp).toBeLessThan(28)
  })

  it('playCard should reject if not enough resource', () => {
    let state = createBattleState(['goblin_scout'])
    state = startTurn(state)
    state = { ...state, player: { ...state.player, stamina: 0 } }
    const slashUid = state.player.hand.find(
      c => getCardDef(c.defId).id === 'slash'
    )?.uid
    if (slashUid) {
      const before = state.enemies[0].hp
      state = playCard(state, slashUid, 0)
      expect(state.enemies[0].hp).toBe(before)
    }
  })

  it('endPlayerTurn should execute enemy intent and discard hand', () => {
    let state = createBattleState(['goblin_scout'])
    state = startTurn(state)
    const hpBefore = state.player.hp
    state = endPlayerTurn(state)
    expect(state.player.hp).toBeLessThan(hpBefore)
    expect(state.player.hand).toHaveLength(5)
    expect(state.phase).toBe('player_turn')
  })

  it('playCard should track combatCardsPlayedThisTurn', () => {
    let state = createBattleState(['goblin_scout'])
    state = startTurn(state)
    state = {
      ...state,
      player: {
        ...state.player,
        hand: [
          { uid: 'c1', defId: 'slash' },
          { uid: 'c2', defId: 'slash' },
        ],
        stamina: 3,
      },
    }
    expect(state.turnTracking.combatCardsPlayedThisTurn).toBe(0)
    state = playCard(state, 'c1', 0)
    expect(state.turnTracking.combatCardsPlayedThisTurn).toBe(1)
    state = playCard(state, 'c2', 0)
    expect(state.turnTracking.combatCardsPlayedThisTurn).toBe(2)
  })

  describe('weapon effects', () => {
    function makeWeaponState(weaponDefId: string) {
      const deck = [
        { uid: 'c1', defId: 'slash' },
        { uid: 'c2', defId: 'slash' },
        { uid: 'c3', defId: 'heavy_slash' },
        { uid: 'c4', defId: 'spark' },
        { uid: 'c5', defId: 'block' },
      ]
      let state = createBattleState(['goblin_scout'], deck, weaponDefId)
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
      state = playCard(state, 'c1', 0)
      expect(state.player.weaponDiscount).toBe(1)
    })

    it('longsword_upgraded: playing combat card sets weaponDiscount to 2', () => {
      let state = makeWeaponState('longsword_upgraded')
      state = playCard(state, 'c1', 0)
      expect(state.player.weaponDiscount).toBe(2)
    })

    it('weaponDiscount reduces stamina cost of next stamina card', () => {
      let state = makeWeaponState('longsword')
      state = playCard(state, 'c1', 0)
      expect(state.player.stamina).toBe(2)
      expect(state.player.weaponDiscount).toBe(1)
      state = playCard(state, 'c2', 0)
      expect(state.player.stamina).toBe(2)
      expect(state.player.weaponDiscount).toBe(1)
    })

    it('weaponDiscount clears after being used on stamina card', () => {
      let state = makeWeaponState('longsword')
      state = { ...state, player: { ...state.player, weaponDiscount: 1, equippedWeaponId: null } }
      state = playCard(state, 'c1', 0)
      expect(state.player.stamina).toBe(3)
      expect(state.player.weaponDiscount).toBe(0)
    })

    it('non-combat card does not trigger weapon effect', () => {
      let state = makeWeaponState('longsword')
      state = playCard(state, 'c4', 0)
      expect(state.player.weaponDiscount).toBe(0)
    })

    it('canPlayCard considers weaponDiscount', () => {
      let state = makeWeaponState('longsword')
      state = { ...state, player: { ...state.player, stamina: 1, weaponDiscount: 1 } }
      expect(canPlayCard(state, 'c3')).toBe(true)
    })

    it('canPlayCard rejects when discount is not enough', () => {
      let state = makeWeaponState('longsword')
      state = { ...state, player: { ...state.player, stamina: 0, weaponDiscount: 1 } }
      expect(canPlayCard(state, 'c3')).toBe(false)
    })

    it('normal attack should be available only when weapon is equipped and once per turn', () => {
      let noWeaponState = makeWeaponState('longsword')
      noWeaponState = { ...noWeaponState, player: { ...noWeaponState.player, equippedWeaponId: null } }
      expect(canUseNormalAttack(noWeaponState)).toBe(false)

      let state = makeWeaponState('iron_longsword')
      expect(canUseNormalAttack(state)).toBe(true)
      state = useNormalAttack(state, 0)
      expect(canUseNormalAttack(state)).toBe(false)
      state = endPlayerTurn(state)
      expect(canUseNormalAttack(state)).toBe(true)
    })

    it('iron_longsword normal attack should deal 6 damage', () => {
      let state = makeWeaponState('iron_longsword')
      const hpBefore = state.enemies[0].hp
      state = useNormalAttack(state, 0)
      expect(state.enemies[0].hp).toBe(hpBefore - 6)
    })

    it('iron_dagger normal attack should hit twice', () => {
      const deck = [{ uid: 'c1', defId: 'slash' }]
      let state = createBattleState(['goblin_scout'], deck, 'iron_dagger')
      state = {
        ...state,
        player: {
          ...state.player,
          hand: [...deck],
          drawPile: [],
        },
      }
      const hpBefore = state.enemies[0].hp
      state = useNormalAttack(state, 0)
      expect(state.enemies[0].hp).toBe(hpBefore - 6)
    })

    it('iron_dagger: first low-cost combat card each turn should draw 1 card', () => {
      let state = makeWeaponState('iron_dagger')
      state = {
        ...state,
        player: {
          ...state.player,
          drawPile: [{ uid: 'd1', defId: 'block' }],
        },
      }
      state = playCard(state, 'c1', 0)
      expect(state.player.hand).toHaveLength(5)
      state = playCard(state, 'c2', 0)
      expect(state.player.hand).toHaveLength(4)
    })

    it('iron_hammer: heavy hit should shatter extra armor', () => {
      const deck = [
        { uid: 'c1', defId: 'heavy_slash' },
      ]
      let state = createBattleState(['stone_gargoyle'], deck, 'iron_hammer')
      state = {
        ...state,
        player: {
          ...state.player,
          strength: 3,
          stamina: 3,
          hand: [...deck],
          drawPile: [],
        },
        enemies: [{ ...state.enemies[0], armor: 20 }],
      }
      state = playCard(state, 'c1', 0)
      expect(state.enemies[0].armor).toBe(2)
    })

    it('iron_bow: combat cards gain 30% damage when unharmed this turn', () => {
      let state = makeWeaponState('iron_bow')
      state = playCard(state, 'c1', 0)
      expect(state.enemies[0].hp).toBe(21)
    })

    it('iron_staff: spell damage increased and gains charge on cast', () => {
      const deck = [{ uid: 'c1', defId: 'fireball' }]
      let state = createBattleState(['goblin_scout'], deck, 'iron_staff')
      state = {
        ...state,
        player: {
          ...state.player,
          mana: 3,
          hand: [...deck],
          drawPile: [],
        },
      }
      state = playCard(state, 'c1', 0)
      expect(state.enemies[0].hp).toBe(16)
      expect(state.player.charge).toBe(1)
    })
  })

  describe('barrier mechanic', () => {
    it('barrier should preserve armor up to barrier value on startTurn', () => {
      let state = createBattleState(['goblin_scout'])
      state = { ...state, player: { ...state.player, armor: 10, barrier: 5 } }
      state = startTurn(state)
      expect(state.player.armor).toBe(5)
    })

    it('barrier should preserve all armor if armor <= barrier', () => {
      let state = createBattleState(['goblin_scout'])
      state = { ...state, player: { ...state.player, armor: 3, barrier: 5 } }
      state = startTurn(state)
      expect(state.player.armor).toBe(3)
    })

    it('no barrier means armor clears to 0', () => {
      let state = createBattleState(['goblin_scout'])
      state = { ...state, player: { ...state.player, armor: 10, barrier: 0 } }
      state = startTurn(state)
      expect(state.player.armor).toBe(0)
    })
  })

  describe('freeze and freezeImmune', () => {
    it('frozen enemy should skip action and gain freezeImmune', () => {
      let state = createBattleState(['goblin_scout'])
      state = startTurn(state)
      // Set enemy frozen
      state = { ...state, enemies: state.enemies.map(e => ({ ...e, freeze: 1 })) }
      const hpBefore = state.player.hp
      state = endPlayerTurn(state)
      // Enemy was frozen, should not have attacked
      expect(state.player.hp).toBe(hpBefore)
    })

    it('freezeImmune should persist until enemy acts normally', () => {
      let state = createBattleState(['goblin_scout'])
      state = startTurn(state)
      // Set enemy frozen
      state = { ...state, enemies: state.enemies.map(e => ({ ...e, freeze: 1 })) }
      state = endPlayerTurn(state)
      // After endPlayerTurn→startTurn cycle, enemy should have freezeImmune=true
      // (startTurn no longer resets it, only normal action does)
      expect(state.enemies[0].freezeImmune).toBe(true)
      // Next endPlayerTurn: enemy acts normally → freezeImmune cleared
      state = endPlayerTurn(state)
      expect(state.enemies[0].freezeImmune).toBe(false)
    })
  })

  describe('end-of-turn settlement', () => {
    it('burn should settle at end of turn, not start', () => {
      let state = createBattleState(['goblin_scout'])
      state = startTurn(state)
      // Set burn on enemy
      state = { ...state, enemies: state.enemies.map(e => ({ ...e, burn: 3 })) }
      const hpAfterBurn = state.enemies[0].hp
      // startTurn should NOT resolve burn anymore
      state = startTurn(state)
      expect(state.enemies[0].hp).toBe(hpAfterBurn) // no burn damage on startTurn
    })

    it('poison should settle at end of turn, not start', () => {
      let state = createBattleState(['goblin_scout'])
      state = startTurn(state)
      // Set poison on enemy
      state = { ...state, enemies: state.enemies.map(e => ({ ...e, poison: 3 })) }
      const hpAfterPoison = state.enemies[0].hp
      // startTurn should NOT resolve poison anymore
      state = startTurn(state)
      expect(state.enemies[0].hp).toBe(hpAfterPoison) // no poison damage on startTurn
    })

    it('weakened and vulnerable should decay at end of turn', () => {
      let state = createBattleState(['goblin_scout'])
      state = startTurn(state)
      state = {
        ...state,
        enemies: state.enemies.map(e => ({ ...e, weakened: 2, vulnerable: 3 })),
      }
      state = endPlayerTurn(state)
      // After one endPlayerTurn cycle, weakened -1, vulnerable -1
      expect(state.enemies[0].weakened).toBe(1)
      expect(state.enemies[0].vulnerable).toBe(2)
    })

    it('boss defend+attack armor should persist into next player turn', () => {
      let state = createBattleState(['goblin_king'])
      state = startTurn(state)
      state = { ...state, enemies: [{ ...state.enemies[0], intentIndex: 3 }] }
      state = endPlayerTurn(state)
      expect(state.enemies[0].armor).toBe(20)
    })
  })

  describe('elite enemies', () => {
    it('stone gargoyle should gain 8 armor at startTurn', () => {
      let state = createBattleState(['stone_gargoyle'])
      expect(state.enemies[0].armor).toBe(0)
      state = startTurn(state)
      expect(state.enemies[0].armor).toBe(8)
    })

    it('stone gaze intent should apply weakened to player', () => {
      let state = createBattleState(['stone_gargoyle'])
      state = startTurn(state)
      state = { ...state, enemies: [{ ...state.enemies[0], intentIndex: 1 }] }
      state = endPlayerTurn(state)
      expect(state.player.weakened).toBe(1)
    })
  })

  describe('battle materials', () => {
    it('iron ingot should grant armor and be limited to once per battle', () => {
      let state = createBattleState(['goblin_scout'], undefined, undefined, { ...EMPTY_MATERIAL_BAG, iron_ingot: 2 })
      state = startTurn(state)
      state = useBattleMaterial(state, 'iron_ingot')
      expect(state.player.armor).toBe(8)
      expect(state.availableMaterials.iron_ingot).toBe(1)
      state = useBattleMaterial(state, 'iron_ingot')
      expect(state.player.armor).toBe(8)
      expect(state.availableMaterials.iron_ingot).toBe(1)
    })

    it('elemental essence should add burn to all living enemies', () => {
      let state = createBattleState(['goblin_scout', 'forest_wolf'], undefined, undefined, { ...EMPTY_MATERIAL_BAG, elemental_essence: 1 })
      state = startTurn(state)
      state = useBattleMaterial(state, 'elemental_essence')
      expect(state.enemies[0].burn).toBe(2)
      expect(state.enemies[1].burn).toBe(2)
    })

    it('guard essence should grant armor each startTurn', () => {
      let state = createBattleState(['goblin_scout'], undefined, undefined, { ...EMPTY_MATERIAL_BAG, guard_essence: 1 })
      state = startTurn(state)
      state = useBattleMaterial(state, 'guard_essence')
      expect(state.player.guardArmorPerTurn).toBe(3)
      state = endPlayerTurn(state)
      expect(state.player.armor).toBeGreaterThanOrEqual(3)
    })
  })
})
