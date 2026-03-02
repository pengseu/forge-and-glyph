import { describe, it, expect } from 'vitest'
import { createBattleState, startTurn, playCard, endPlayerTurn, canPlayCard, useBattleMaterial, canUseNormalAttack, useNormalAttack, drawCards, cardNeedsTarget } from '../combat'
import { EMPTY_MATERIAL_BAG } from '../materials'
import { getCardDef } from '../cards'

describe('combat', () => {
  it('createBattleState should set up initial state', () => {
    const state = createBattleState(['goblin_scout'])
    expect(state.player.maxHp).toBe(60)
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

  it('vine curse should be unplayable and occupy hand slot', () => {
    const deck = [{ uid: 'c1', defId: 'curse_doubt' }]
    let state = createBattleState(['goblin_scout'], deck)
    state = {
      ...state,
      player: { ...state.player, hand: [...deck], drawPile: [] },
    }
    expect(canPlayCard(state, 'c1')).toBe(false)
    expect(state.player.hand).toHaveLength(1)
  })

  it('soul erosion curse should deal damage on draw then exhaust', () => {
    const deck = [{ uid: 'c1', defId: 'curse_pain' }]
    let state = createBattleState(['goblin_scout'], deck)
    state = {
      ...state,
      player: { ...state.player, hp: 20, hand: [], drawPile: [...deck], discardPile: [] },
    }
    state = drawCards(state, 1)
    expect(state.player.hp).toBe(18)
    expect(state.player.hand).toHaveLength(0)
    expect(state.player.drawPile).toHaveLength(0)
    expect(state.player.discardPile).toHaveLength(0)
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

  it('conditional_damage_vs_vulnerable effects should require explicit target selection', () => {
    expect(
      cardNeedsTarget([{ type: 'conditional_damage_vs_vulnerable', base: 4, vulnerableDamage: 9 }]),
    ).toBe(true)
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

    it('iron_longsword: playing combat card sets weaponDiscount to 1', () => {
      let state = makeWeaponState('iron_longsword')
      expect(state.player.weaponDiscount).toBe(0)
      state = playCard(state, 'c1', 0)
      expect(state.player.weaponDiscount).toBe(1)
    })

    it('steel_longsword: playing combat card sets weaponDiscount to 2', () => {
      let state = makeWeaponState('steel_longsword')
      state = playCard(state, 'c1', 0)
      expect(state.player.weaponDiscount).toBe(2)
    })

    it('weaponDiscount reduces stamina cost of next stamina card', () => {
      let state = makeWeaponState('iron_longsword')
      state = playCard(state, 'c1', 0)
      expect(state.player.stamina).toBe(2)
      expect(state.player.weaponDiscount).toBe(1)
      state = playCard(state, 'c2', 0)
      expect(state.player.stamina).toBe(2)
      expect(state.player.weaponDiscount).toBe(1)
    })

    it('weaponDiscount clears after being used on stamina card', () => {
      let state = makeWeaponState('iron_longsword')
      state = { ...state, player: { ...state.player, weaponDiscount: 1, equippedWeaponId: null } }
      state = playCard(state, 'c1', 0)
      expect(state.player.stamina).toBe(3)
      expect(state.player.weaponDiscount).toBe(0)
    })

    it('non-combat card does not trigger weapon effect', () => {
      let state = makeWeaponState('iron_longsword')
      state = playCard(state, 'c4', 0)
      expect(state.player.weaponDiscount).toBe(0)
    })

    it('canPlayCard considers weaponDiscount', () => {
      let state = makeWeaponState('iron_longsword')
      state = { ...state, player: { ...state.player, stamina: 1, weaponDiscount: 1 } }
      expect(canPlayCard(state, 'c3')).toBe(true)
    })

    it('canPlayCard rejects when discount is not enough', () => {
      let state = makeWeaponState('iron_longsword')
      state = { ...state, player: { ...state.player, stamina: 0, weaponDiscount: 1 } }
      expect(canPlayCard(state, 'c3')).toBe(false)
    })

    it('normal attack should be available only when weapon is equipped and once per turn', () => {
      let noWeaponState = makeWeaponState('iron_longsword')
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

    it('iron_bow: first combat card each turn gains 30% damage', () => {
      let state = makeWeaponState('iron_bow')
      state = playCard(state, 'c1', 0)
      expect(state.enemies[0].hp).toBe(21)
    })

    it('iron_bow: second combat card in same turn should not gain 30% damage', () => {
      let state = makeWeaponState('iron_bow')
      state = playCard(state, 'c1', 0)
      state = playCard(state, 'c2', 0)
      expect(state.enemies[0].hp).toBe(15)
    })

    it('steel_bow: first combat card each turn gains 30% and +3 when undamaged this turn', () => {
      let state = makeWeaponState('steel_bow')
      state = playCard(state, 'c1', 0)
      expect(state.enemies[0].hp).toBe(18)
    })

    it('iron_bow: killing target should draw 1 card', () => {
      let state = makeWeaponState('iron_bow')
      state = {
        ...state,
        enemies: [{ ...state.enemies[0], hp: 6 }],
        player: {
          ...state.player,
          drawPile: [{ uid: 'draw1', defId: 'block' }],
        },
      }
      state = playCard(state, 'c1', 0)
      expect(state.player.hand).toHaveLength(5)
    })

    it('iron_staff: spell damage increased and gains charge on cast', () => {
      const deck = [{ uid: 'c1', defId: 'meteor_spell' }]
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
      expect(state.enemies[0].hp).toBe(4)
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
      expect(state.enemies[0].armor).toBe(6)
    })

    it('goblin king phase2 should stop summoning and use phase2 pattern (20 attack)', () => {
      let state = createBattleState(['goblin_king'])
      state = startTurn(state)
      const phase2Hp = Math.floor(state.enemies[0].maxHp * 0.4)
      state = {
        ...state,
        player: { ...state.player, hp: 60, armor: 0 },
        enemies: [{ ...state.enemies[0], hp: phase2Hp, intentIndex: 0 }],
      }
      state = endPlayerTurn(state)
      expect(state.enemies).toHaveLength(1)
      expect(state.player.hp).toBe(40)
    })

    it('goblin king phase2 second intent should be defend+attack (10 armor + 12 attack)', () => {
      let state = createBattleState(['goblin_king', 'goblin_minion', 'goblin_minion'])
      state = startTurn(state)
      const phase2Hp = Math.floor(state.enemies[0].maxHp * 0.4)
      state = {
        ...state,
        player: { ...state.player, hp: 60, armor: 0 },
        enemies: [
          { ...state.enemies[0], hp: phase2Hp, intentIndex: 1, armor: 0 },
          { ...state.enemies[1], freeze: 1, hp: 0 },
          { ...state.enemies[2], freeze: 1, hp: 0 },
        ],
      }
      state = endPlayerTurn(state)
      expect(state.enemies).toHaveLength(3)
      expect(state.player.hp).toBe(48)
      expect(state.enemies[0].armor).toBe(10)
    })

    it('curse intent should add curse cards into player discard pile', () => {
      let state = createBattleState(['lich'])
      state = startTurn(state)
      state = {
        ...state,
        enemies: [{ ...state.enemies[0], intentIndex: 0 }],
      }
      state = endPlayerTurn(state)
      const curseCards = [
        ...state.player.hand,
        ...state.player.drawPile,
        ...state.player.discardPile,
      ].filter(c => c.defId.startsWith('curse_'))
      expect(curseCards.length).toBeGreaterThan(0)
    })

    it('dark witch ritual should add strength and inject curse pain into draw pile', () => {
      let state = createBattleState(['dark_witch'])
      state = startTurn(state)
      state = {
        ...state,
        enemies: [{ ...state.enemies[0], intentIndex: 0, strength: 0 }],
      }
      state = endPlayerTurn(state)
      expect(state.enemies[0].strength).toBe(3)
      expect(state.player.hp).toBe(56)
    })

    it('abyss lord should gain phase2 passive armor and execute first action pattern', () => {
      let state = createBattleState(['abyss_lord'])
      state = startTurn(state)
      state = {
        ...state,
        enemies: [
          {
            ...state.enemies[0],
            hp: Math.floor(state.enemies[0].maxHp * 0.5),
            intentIndex: 0,
          },
        ],
      }
      state = endPlayerTurn(state)
      expect(state.enemies[0].armor).toBe(5)
      expect(state.player.hp).toBe(40)
    })

    it('abyss lord phase3 should apply weaken attack and end-turn unavoidable damage', () => {
      let state = createBattleState(['abyss_lord'])
      state = startTurn(state)
      state = {
        ...state,
        player: { ...state.player, hp: 60, armor: 0 },
        enemies: [
          {
            ...state.enemies[0],
            hp: Math.floor(state.enemies[0].maxHp * 0.3),
            intentIndex: 1,
            armor: 0,
          },
        ],
      }
      state = endPlayerTurn(state)
      expect(state.player.hp).toBe(35)
      expect(state.player.weakened).toBe(2)
    })
  })

  describe('elite enemies', () => {
    it('stone gargoyle should gain 6 armor at startTurn', () => {
      let state = createBattleState(['stone_gargoyle'])
      expect(state.enemies[0].armor).toBe(0)
      state = startTurn(state)
      expect(state.enemies[0].armor).toBe(6)
      expect(state.enemies[0].turnStartArmorGain).toBe(6)
    })

    it('stone gaze intent should apply weakened to player', () => {
      let state = createBattleState(['stone_gargoyle'])
      state = startTurn(state)
      state = { ...state, enemies: [{ ...state.enemies[0], intentIndex: 1 }] }
      state = endPlayerTurn(state)
      expect(state.player.weakened).toBe(1)
    })

    it('shadow assassin evade should trigger on single-hit damage <= 4', () => {
      let state = createBattleState(['shadow_assassin'], undefined, 'iron_staff')
      const hpBefore = state.enemies[0].hp
      state = useNormalAttack(state, 0)
      expect(state.enemies[0].hp).toBe(hpBefore)
      expect(state.enemies[0].evadedThisAction).toBe(true)
    })
  })

  describe('battle materials', () => {
    it('iron ingot should grant armor and be limited to once per battle', () => {
      let state = createBattleState(['goblin_scout'], undefined, undefined, { ...EMPTY_MATERIAL_BAG, iron_ingot: 2 })
      state = startTurn(state)
      state = useBattleMaterial(state, 'iron_ingot')
      expect(state.player.armor).toBe(10)
      expect(state.availableMaterials.iron_ingot).toBe(1)
      state = useBattleMaterial(state, 'iron_ingot')
      expect(state.player.armor).toBe(10)
      expect(state.availableMaterials.iron_ingot).toBe(1)
    })

    it('elemental essence should add burn to all living enemies', () => {
      let state = createBattleState(['goblin_scout', 'forest_wolf'], undefined, undefined, { ...EMPTY_MATERIAL_BAG, elemental_essence: 1 })
      state = startTurn(state)
      state = useBattleMaterial(state, 'elemental_essence')
      expect(state.enemies[0].burn).toBe(3)
      expect(state.enemies[1].burn).toBe(3)
    })

    it('guard essence should grant armor each startTurn', () => {
      let state = createBattleState(['goblin_scout'], undefined, undefined, { ...EMPTY_MATERIAL_BAG, guard_essence: 1 })
      state = startTurn(state)
      state = useBattleMaterial(state, 'guard_essence')
      expect(state.player.guardArmorPerTurn).toBe(5)
      state = endPlayerTurn(state)
      expect(state.player.armor).toBeGreaterThanOrEqual(3)
    })

    it('boss-only materials should not be consumed as battle materials', () => {
      let state = createBattleState(['goblin_scout'])
      state = {
        ...state,
        availableMaterials: { ...state.availableMaterials, goblin_crown_fragment: 1 },
      }
      const next = useBattleMaterial(state, 'goblin_crown_fragment')
      expect(next).toEqual(state)
    })
  })

  describe('step6 card mechanics', () => {
    it('quick_attack should draw 1 card after dealing damage', () => {
      const deck = [
        { uid: 'c1', defId: 'quick_attack' },
        { uid: 'd1', defId: 'block' },
      ]
      let state = createBattleState(['goblin_scout'], deck)
      state = {
        ...state,
        player: { ...state.player, stamina: 3, hand: [{ uid: 'c1', defId: 'quick_attack' }], drawPile: [{ uid: 'd1', defId: 'block' }] },
      }
      state = playCard(state, 'c1', 0)
      expect(state.player.hand).toHaveLength(1)
      expect(state.player.hand[0].uid).toBe('d1')
    })

    it('overdraft should grant stamina now and reduce next turn stamina by 1', () => {
      const deck = [{ uid: 'c1', defId: 'overdraft' }]
      let state = createBattleState(['goblin_scout'], deck)
      state = {
        ...state,
        player: { ...state.player, stamina: 1, hand: [...deck], drawPile: [] },
      }
      state = playCard(state, 'c1', 0)
      expect(state.player.stamina).toBe(3)
      state = endPlayerTurn(state)
      expect(state.player.stamina).toBe(2)
    })

    it('mana_surge should deal self damage at end of turn', () => {
      const deck = [{ uid: 'c1', defId: 'mana_surge' }]
      let state = createBattleState(['goblin_scout'], deck)
      state = {
        ...state,
        player: { ...state.player, hp: 40, hand: [...deck], drawPile: [] },
      }
      state = playCard(state, 'c1', 0)
      state = endPlayerTurn(state)
      expect(state.player.hp).toBeLessThanOrEqual(35)
    })

    it('mana_surge base should deal exactly 3 self damage at end of turn', () => {
      const deck = [{ uid: 'c1', defId: 'mana_surge' }]
      let state = createBattleState(['goblin_scout'], deck)
      state = {
        ...state,
        player: { ...state.player, hp: 40, hand: [...deck], drawPile: [] },
        enemies: [{ ...state.enemies[0], freeze: 1 }],
      }
      state = playCard(state, 'c1', 0)
      state = endPlayerTurn(state)
      expect(state.player.hp).toBe(37)
    })

    it('thorn_armor should retaliate when enemy attacks', () => {
      const deck = [{ uid: 'c1', defId: 'thorn_armor' }]
      let state = createBattleState(['goblin_scout'], deck)
      state = {
        ...state,
        player: { ...state.player, hand: [...deck], drawPile: [], stamina: 3 },
      }
      const enemyHp = state.enemies[0].hp
      state = playCard(state, 'c1', 0)
      state = endPlayerTurn(state)
      expect(state.enemies[0].hp).toBeLessThan(enemyHp)
    })

    it('magic_absorb should grant bonus mana next turn if armor survives', () => {
      const deck = [{ uid: 'c1', defId: 'magic_absorb' }]
      let state = createBattleState(['forest_wolf'], deck)
      state = {
        ...state,
        player: { ...state.player, hand: [...deck], drawPile: [], mana: 2 },
      }
      state = playCard(state, 'c1', 0)
      state = endPlayerTurn(state)
      expect(state.player.mana).toBeGreaterThanOrEqual(3)
    })

    it('blade_arcane_unity should reduce hybrid card costs this turn', () => {
      const deck = [
        { uid: 'c1', defId: 'blade_arcane_unity' },
        { uid: 'c2', defId: 'destiny_rewrite' },
      ]
      let state = createBattleState(['goblin_scout'], deck)
      state = {
        ...state,
        player: { ...state.player, hand: [...deck], drawPile: [], stamina: 1, mana: 1 },
      }
      state = playCard(state, 'c1', 0)
      expect(canPlayCard(state, 'c2')).toBe(true)
    })

    it('blood_frenzy should lose percent hp and gain strength', () => {
      const deck = [{ uid: 'c1', defId: 'blood_frenzy' }]
      let state = createBattleState(['goblin_scout'], deck)
      state = {
        ...state,
        player: { ...state.player, hp: 50, hand: [...deck], drawPile: [] },
      }
      state = playCard(state, 'c1', 0)
      expect(state.player.hp).toBe(38)
      expect(state.player.strength).toBe(5)
    })
  })

  describe('enchantments and resonance', () => {
    it('bless should add +3 combat damage', () => {
      let state = createBattleState(['goblin_scout'], undefined, 'iron_longsword', EMPTY_MATERIAL_BAG, ['bless'])
      const hpBefore = state.enemies[0].hp
      state = useNormalAttack(state, 0)
      expect(state.enemies[0].hp).toBe(hpBefore - 9)
    })

    it('void should ignore 4 armor for attack hit', () => {
      let state = createBattleState(['goblin_scout'], undefined, 'iron_longsword', EMPTY_MATERIAL_BAG, ['void'])
      state = { ...state, enemies: [{ ...state.enemies[0], armor: 5 }] }
      state = useNormalAttack(state, 0)
      expect(state.enemies[0].armor).toBe(0)
      expect(state.enemies[0].hp).toBe(23)
    })

    it('flame should apply 1 burn on combat hit', () => {
      let state = createBattleState(['goblin_scout'], undefined, 'iron_longsword', EMPTY_MATERIAL_BAG, ['flame'])
      state = useNormalAttack(state, 0)
      expect(state.enemies[0].burn).toBe(1)
    })

    it('frost should freeze on every 3rd hit', () => {
      let state = createBattleState(['goblin_scout'], undefined, 'iron_longsword', EMPTY_MATERIAL_BAG, ['frost'])
      state = useNormalAttack(state, 0)
      expect(state.enemies[0].freeze).toBe(0)
      state = endPlayerTurn(state)
      state = useNormalAttack(state, 0)
      expect(state.enemies[0].freeze).toBe(0)
      state = endPlayerTurn(state)
      state = useNormalAttack(state, 0)
      expect(state.enemies[0].freeze).toBe(1)
    })

    it('thunder should chain 4 damage to another enemy', () => {
      let state = createBattleState(['goblin_scout', 'forest_wolf'], undefined, 'iron_longsword', EMPTY_MATERIAL_BAG, ['thunder'])
      const hp2 = state.enemies[1].hp
      state = useNormalAttack(state, 0)
      expect(state.enemies[1].hp).toBe(hp2 - 4)
    })

    it('soul should heal 5 on kill', () => {
      let state = createBattleState(['goblin_scout'], undefined, 'iron_longsword', EMPTY_MATERIAL_BAG, ['soul'])
      state = {
        ...state,
        player: { ...state.player, hp: 20 },
        enemies: [{ ...state.enemies[0], hp: 6 }],
      }
      state = useNormalAttack(state, 0)
      expect(state.player.hp).toBe(25)
    })

    it('flame+thunder resonance should add 1 burn on chained target', () => {
      let state = createBattleState(['goblin_scout', 'forest_wolf'], undefined, 'iron_longsword', EMPTY_MATERIAL_BAG, ['flame', 'thunder'])
      state = useNormalAttack(state, 0)
      expect(state.enemies[1].burn).toBe(1)
    })

    it('flame+bless resonance should deal +50% damage to burning target', () => {
      let state = createBattleState(['goblin_scout'], undefined, 'iron_longsword', EMPTY_MATERIAL_BAG, ['flame', 'bless'])
      state = { ...state, enemies: [{ ...state.enemies[0], burn: 1 }] }
      const hpBefore = state.enemies[0].hp
      state = useNormalAttack(state, 0)
      expect(state.enemies[0].hp).toBe(hpBefore - 13)
    })

    it('thunder should choose a random other enemy when multiple candidates exist', () => {
      const oldRand = Math.random
      Math.random = () => 0.99
      try {
        let state = createBattleState(['goblin_scout', 'forest_wolf', 'mushroom_creature'], undefined, 'iron_longsword', EMPTY_MATERIAL_BAG, ['thunder'])
        const hp1 = state.enemies[1].hp
        const hp2 = state.enemies[2].hp
        state = useNormalAttack(state, 0)
        expect(state.enemies[1].hp).toBe(hp1)
        expect(state.enemies[2].hp).toBe(hp2 - 4)
      } finally {
        Math.random = oldRand
      }
    })

    it('flame+frost resonance should double burn settlement damage', () => {
      let state = createBattleState(['goblin_scout'], undefined, 'iron_longsword', EMPTY_MATERIAL_BAG, ['flame', 'frost'])
      state = startTurn(state)
      state = { ...state, enemies: [{ ...state.enemies[0], burn: 2 }] }
      const hpBefore = state.enemies[0].hp
      state = endPlayerTurn(state)
      expect(state.enemies[0].hp).toBe(hpBefore - 4)
    })

    it('frost+thunder resonance should deal 15 damage when freeze is removed', () => {
      let state = createBattleState(['goblin_scout'], undefined, 'iron_longsword', EMPTY_MATERIAL_BAG, ['frost', 'thunder'])
      state = startTurn(state)
      state = { ...state, enemies: [{ ...state.enemies[0], freeze: 1 }] }
      const hpBefore = state.enemies[0].hp
      state = endPlayerTurn(state)
      expect(state.enemies[0].hp).toBe(hpBefore - 15)
    })

    it('soul+void resonance should heal player to full on kill', () => {
      let state = createBattleState(['goblin_scout'], undefined, 'iron_longsword', EMPTY_MATERIAL_BAG, ['soul', 'void'])
      state = {
        ...state,
        player: { ...state.player, hp: 20 },
        enemies: [{ ...state.enemies[0], hp: 6 }],
      }
      state = useNormalAttack(state, 0)
      expect(state.player.hp).toBe(state.player.maxHp)
    })
  })
})
    it('flame should trigger on spell hit as well', () => {
      const deck = [{ uid: 'sp1', defId: 'spark' }]
      let state = createBattleState(['goblin_scout'], deck, 'iron_staff', EMPTY_MATERIAL_BAG, ['flame'])
      state = {
        ...state,
        player: { ...state.player, mana: 2, hand: [...deck], drawPile: [] },
      }
      state = playCard(state, 'sp1', 0)
      expect(state.enemies[0].burn).toBeGreaterThanOrEqual(2)
    })

    it('trial flame should add burn to all enemies and player each turn', () => {
      let state = createBattleState(['goblin_scout'])
      state = { ...state, trialModifier: 'flame' }
      state = startTurn(state)
      expect(state.enemies[0].burn).toBe(1)
      expect(state.player.pendingEndTurnSelfDamage).toBe(1)
    })

    it('trial speed should fail once turn limit is exceeded', () => {
      let state = createBattleState(['goblin_scout'])
      state = { ...state, trialModifier: 'speed', trialTurnLimit: 1 }
      state = startTurn(state)
      state = endPlayerTurn(state)
      expect(state.phase).toBe('defeat')
    })

    it('trial endure should halve enemy damage', () => {
      let state = createBattleState(['goblin_scout'])
      state = { ...state, enemyDamageMultiplier: 0.5 }
      state = startTurn(state)
      const hpBefore = state.player.hp
      state = endPlayerTurn(state)
      expect(hpBefore - state.player.hp).toBe(4)
    })
