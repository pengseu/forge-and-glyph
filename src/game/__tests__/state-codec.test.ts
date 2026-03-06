import { describe, expect, it } from 'vitest'
import { deserializeGameState, serializeGameState } from '../state-codec'
import { EMPTY_MATERIAL_BAG } from '../materials'
import type { GameState } from '../types'

function makeGameState(): GameState {
  return {
    seedText: 'test-seed',
    rngState: 123,
    hasAutoSave: false,
    saveSlots: [
      { slot: 1, savedAt: null, scene: null, act: null, hp: null, gold: null },
      { slot: 2, savedAt: null, scene: null, act: null, hp: null, gold: null },
      { slot: 3, savedAt: null, scene: null, act: null, hp: null, gold: null },
    ],
    challengeUnlocked: false,
    challengeModeEnabled: false,
    skipTutorial: false,
    tutorialStep: 2,
    workshopGuideSeen: false,
    guideFlags: { resonance: false, curse: false, materialEmergency: false, temple: false },
    activeGuide: null,
    audio: { muted: false, master: 0.8, sfx: 0.9, bgm: 0.5 },
    scene: 'map',
    run: {
      act: 1,
      currentNodeId: 'l1_start',
      visitedNodes: new Set(['l1_start', 'l2_1']),
      deck: [{ uid: 'c1', defId: 'slash' }],
      mapNodes: [],
      turn: 1,
      equippedWeapon: null,
      weaponInventory: [],
      playerHp: 60,
      playerMaxHp: 80,
      gold: 30,
      bonusStrength: 0,
      bonusWisdom: 0,
      bonusMaxMana: 0,
      nextBattleEnemyStrengthBonus: 0,
      materials: { ...EMPTY_MATERIAL_BAG },
    },
    battle: null,
    currentEvent: null,
    activeTrialModifier: null,
    intermissionMode: 'none',
    intermissionCardOptions: [],
    intermissionRemoveRemaining: 0,
    rewardCards: [],
    rewardMaterials: {},
    shopOffers: [],
    shopMaterialOffers: [],
    droppedWeaponId: null,
    lastResult: null,
    stats: { turns: 0, remainingHp: 0, runReport: null, finalSnapshot: null },
  }
}

describe('state codec', () => {
  it('should round-trip run visitedNodes through JSON-safe payload', () => {
    const state = makeGameState()
    const encoded = serializeGameState(state)
    const decoded = deserializeGameState(encoded)
    expect(Array.from(decoded.run?.visitedNodes ?? [])).toEqual(['l1_start', 'l2_1'])
  })

  it('should keep essential seed fields for deterministic restore', () => {
    const state = makeGameState()
    const encoded = serializeGameState(state)
    const decoded = deserializeGameState(encoded)
    expect(decoded.seedText).toBe('test-seed')
    expect(decoded.rngState).toBe(123)
  })
})
