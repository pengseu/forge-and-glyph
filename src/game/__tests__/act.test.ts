import { describe, expect, it } from 'vitest'
import type { RunState } from '../types'
import { EMPTY_MATERIAL_BAG } from '../materials'
import {
  advanceToNextAct,
  applyIntermissionChoice,
  buildIntermissionRewardNotice,
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

  it('buildIntermissionRewardNotice should describe war loot reserve rewards', () => {
    const run = makeRunState({ playerHp: 20, playerMaxHp: 60, gold: 9 })
    const next = applyIntermissionChoice(run, 'war_loot_reserve')
    expect(buildIntermissionRewardNotice(run, next, 'war_loot_reserve')).toBe('已获得 40 金币、恢复至满血')
  })

  it('buildIntermissionRewardNotice should describe legend forge fallback strength gain', () => {
    const run = makeRunState({
      act: 2,
      bonusStrength: 1,
      equippedWeapon: { uid: 'w1', defId: 'iron_longsword', enchantments: [] },
      weaponInventory: [{ uid: 'w1', defId: 'iron_longsword', enchantments: [] }],
    })
    const next = applyIntermissionChoice(run, 'legend_forge')
    expect(buildIntermissionRewardNotice(run, next, 'legend_forge')).toBe('已获得 +3 力量')
  })

  it('buildIntermissionRewardNotice should describe foresight eye card and gold rewards', () => {
    const run = makeRunState({ act: 2, gold: 20, deck: [{ uid: 'c1', defId: 'slash' }] })
    const next = {
      ...run,
      gold: 70,
      deck: [...run.deck, { uid: 'new', defId: 'meteor_spell' }],
    }
    expect(buildIntermissionRewardNotice(run, next, 'foresight_eye')).toBe('已获得史诗卡【陨石术】、50 金币')
  })
})
