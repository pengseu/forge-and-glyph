import { describe, expect, it } from 'vitest'
import type { RunState } from '../types'
import { EMPTY_MATERIAL_BAG } from '../materials'
import {
  advanceToNextAct,
  applyIntermissionChoice,
  getIntermissionChoices,
} from '../act'

function makeRunState(overrides: Partial<RunState> = {}): RunState {
  return {
    act: 1,
    cycleTier: 0,
    currentNodeId: 'l1_start',
    visitedNodes: new Set(),
    deck: [],
    mapNodes: [],
    turn: 0,
    equippedWeapon: null,
    weaponInventory: [],
    playerHp: 30,
    playerMaxHp: 60,
    gold: 10,
    bonusStrength: 0,
    bonusWisdom: 0,
    bonusMaxMana: 0,
    nextBattleEnemyStrengthBonus: 0,
    materials: { ...EMPTY_MATERIAL_BAG },
    secretState: { hiddenRouteEntered: false, pendingStage: 'none' },
    ...overrides,
  }
}

describe('act progression', () => {
  it('advanceToNextAct should move act1 -> act2 and refresh map', () => {
    const run = makeRunState({ act: 1 })
    const next = advanceToNextAct(run)
    expect(next.act).toBe(2)
    expect(next.currentNodeId).toBe('l1_combat')
    expect(next.mapNodes.length).toBeGreaterThan(0)
  })

  it('advanceToNextAct should move act2 -> act3', () => {
    const run = makeRunState({ act: 2 })
    const next = advanceToNextAct(run)
    expect(next.act).toBe(3)
    expect(next.currentNodeId).toBe('l1_combat')
  })

  it('advanceToNextAct should keep act3 unchanged', () => {
    const run = makeRunState({ act: 3, currentNodeId: 'a3_l6_a' })
    const next = advanceToNextAct(run)
    expect(next).toEqual(run)
  })
})

describe('intermission choices', () => {
  it('getIntermissionChoices should offer exactly three choices for act1/2', () => {
    expect(getIntermissionChoices(1)).toHaveLength(3)
    expect(getIntermissionChoices(2)).toHaveLength(3)
  })

  it('war_loot_reserve should grant gold and full heal', () => {
    const run = makeRunState({ playerHp: 20, playerMaxHp: 60, gold: 9 })
    const next = applyIntermissionChoice(run, 'war_loot_reserve')
    expect(next.playerHp).toBe(60)
    expect(next.gold).toBe(49)
  })

  it('elite_armament should upgrade equipped weapon', () => {
    const run = makeRunState({
      equippedWeapon: { uid: 'w1', defId: 'iron_longsword', enchantments: [] },
      weaponInventory: [{ uid: 'w1', defId: 'iron_longsword', enchantments: [] }],
    })
    const next = applyIntermissionChoice(run, 'elite_armament')
    expect(next.equippedWeapon?.defId).toBe('steel_longsword')
  })

  it('knowledge_accumulation should add one rare and remove one card', () => {
    const run = makeRunState({
      deck: [
        { uid: 'c1', defId: 'slash' },
        { uid: 'c2', defId: 'block' },
      ],
    })
    const next = applyIntermissionChoice(run, 'knowledge_accumulation', () => 0)
    expect(next.deck.length).toBe(run.deck.length)
    expect(next.deck.some(card => card.defId !== 'slash' && card.defId !== 'block')).toBe(true)
  })
})
