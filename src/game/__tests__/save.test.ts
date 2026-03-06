import { describe, expect, it } from 'vitest'
import {
  clearAuto,
  listSlotSummaries,
  loadAuto,
  loadSlot,
  saveAuto,
  saveSlot,
  type SavePayload,
} from '../save'

function createMemoryStorage() {
  const m = new Map<string, string>()
  return {
    getItem: (key: string) => m.get(key) ?? null,
    setItem: (key: string, value: string) => {
      m.set(key, value)
    },
  }
}

function makePayload(seedText: string, act: 1 | 2 | 3): SavePayload {
  return {
    version: 1,
    savedAt: 202603020001,
    seedText,
    rngState: 111,
    gameState: {
      seedText,
      rngState: 111,
      hasAutoSave: true,
      saveSlots: [],
      challengeUnlocked: false,
      challengeModeEnabled: false,
      skipTutorial: false,
      tutorialStep: 0,
      workshopGuideSeen: false,
      guideFlags: { resonance: false, curse: false, materialEmergency: false, temple: false },
      activeGuide: null,
      audio: { muted: false, master: 0.8, sfx: 0.9, bgm: 0.5 },
      scene: 'map',
      run: {
        act,
        currentNodeId: 'x',
        visitedNodes: ['x'],
        deck: [],
        mapNodes: [],
        turn: 0,
        equippedWeapon: null,
        weaponInventory: [],
        playerHp: 55,
        playerMaxHp: 80,
        gold: 66,
        bonusStrength: 0,
        bonusWisdom: 0,
        bonusMaxMana: 0,
        nextBattleEnemyStrengthBonus: 0,
        materials: {
          iron_ingot: 0,
          steel_ingot: 0,
          mythril_ingot: 0,
          meteor_iron_ingot: 0,
          elemental_essence: 0,
          war_essence: 0,
          guard_essence: 0,
          goblin_crown_fragment: 0,
          shadow_crystal: 0,
          abyss_heart: 0,
        },
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
    },
    metaProfile: {
      version: 1,
      adventureTokens: 0,
      totalRuns: 0,
      totalVictories: 0,
      unlockedBlueprints: [],
      blueprintMastery: {},
      blueprintProgress: {},
      legacyWeaponDefId: null,
      legacyWeaponEnchantments: [],
      unlockedMetaCards: [],
      unlockedMetaWeapons: [],
      unlockedMetaEnchantments: [],
      unlockedStarters: [],
      milestones: {},
      unlockFlags: {
        challengeMode: false,
        extraStarters: false,
        firstDeathBonusClaimed: false,
      },
      lastRunAt: null,
    },
  }
}

describe('save system', () => {
  it('should round-trip auto save payload', () => {
    const storage = createMemoryStorage()
    const payload = makePayload('seed-auto', 1)
    saveAuto(payload, storage)
    expect(loadAuto(storage)).toEqual(payload)

    clearAuto(storage)
    expect(loadAuto(storage)).toBeNull()
  })

  it('should save and load manual slots with summary fields', () => {
    const storage = createMemoryStorage()
    saveSlot(2, makePayload('seed-slot', 3), storage)
    const loaded = loadSlot(2, storage)
    expect(loaded?.gameState.run?.act).toBe(3)
    expect(loaded?.gameState.run?.playerHp).toBe(55)

    const summaries = listSlotSummaries(storage)
    const slot2 = summaries.find((slot) => slot.slot === 2)
    expect(slot2?.act).toBe(3)
    expect(slot2?.hp).toBe(55)
    expect(slot2?.gold).toBe(66)
  })
})
