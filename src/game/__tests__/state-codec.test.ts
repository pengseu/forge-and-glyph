import { describe, expect, it } from 'vitest'
import { deserializeGameState, serializeGameState } from '../state-codec'
import { createRunState } from '../run'
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
    selectedCycleTier: 0,
    highestUnlockedCycleTier: 0,
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
      cycleTier: 0,
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
      secretState: { hiddenRouteEntered: false, pendingStage: 'none' },
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


it('restores selected cycle tier and run cycle data', () => {
  const payload = serializeGameState({
    seedText: 'seed',
    rngState: 1,
    hasAutoSave: false,
    saveSlots: [],
    selectedCycleTier: 2,
    highestUnlockedCycleTier: 0,
    challengeUnlocked: false,
    challengeModeEnabled: false,
    skipTutorial: false,
    tutorialStep: 0,
    workshopGuideSeen: false,
    guideFlags: { resonance: false, curse: false, materialEmergency: false, temple: false },
    activeGuide: null,
    audio: { muted: false, master: 1, sfx: 1, bgm: 1 },
    scene: 'map',
    run: {
      ...createRunState(),
      cycleTier: 2,
      secretState: { hiddenRouteEntered: false, pendingStage: 'none' },
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
  })

  const restored = deserializeGameState(payload)
  expect(restored.selectedCycleTier).toBe(2)
  expect(restored.run?.cycleTier).toBe(2)
  expect(restored.run?.secretState).toEqual({ hiddenRouteEntered: false, pendingStage: 'none' })
})
