import { describe, expect, it } from 'vitest'
import { EMPTY_MATERIAL_BAG } from '../materials'
import type { BattleState, GameState, RunState } from '../types'
import { ACT1_TUTORIAL_GUIDES, applyGuideQueue } from '../guides'

function makeRun(overrides?: Partial<RunState>): RunState {
  return {
    act: 1,
    cycleTier: 0,
    currentNodeId: 'l1_start',
    visitedNodes: new Set(['l1_start']),
    deck: [],
    mapNodes: [],
    turn: 0,
    equippedWeapon: null,
    weaponInventory: [],
    playerHp: 80,
    playerMaxHp: 80,
    gold: 0,
    bonusStrength: 0,
    bonusWisdom: 0,
    bonusMaxMana: 0,
    nextBattleEnemyStrengthBonus: 0,
    materials: { ...EMPTY_MATERIAL_BAG },
    secretState: { hiddenRouteEntered: false, pendingStage: 'none' },
    ...overrides,
  }
}

function makeBattle(curseInHand: boolean): BattleState {
  return {
    player: {
      hp: 50,
      maxHp: 80,
      stamina: 3,
      maxStamina: 3,
      mana: 2,
      maxMana: 2,
      armor: 0,
      strength: 0,
      weaponDiscount: 0,
      equippedWeaponId: null,
      buffNextCombat: 0,
      poisonOnAttack: 0,
      buffNextCombatDouble: false,
      buffNextSpellDamage: 0,
      buffNextSpellMana: 0,
      poison: 0,
      wisdom: 0,
      barrier: 0,
      charge: 0,
      weakened: 0,
      guardArmorPerTurn: 0,
      tempCostReduction: 0,
      nextTurnStaminaPenalty: 0,
      pendingEndTurnSelfDamage: 0,
      thorns: 0,
      magicAbsorbBonusMana: 0,
      damageTakenMultiplier: 1,
      doubleDamageArmorThisTurn: false,
      attackDamageMultiplierThisTurn: 1,
      firstSpellDiscountUsed: false,
      spellDiscountUsedCountThisTurn: 0,
      weaponPerTurnUsed: false,
      attackCounterThisBattle: 0,
      spellCounterThisBattle: 0,
      costIncreasedCardDefIds: [],
      normalAttackUsedThisTurn: false,
      equippedEnchantments: [],
      frostCounter: 0,
      hand: curseInHand ? [{ uid: 'c1', defId: 'curse_vine_bind' }] : [],
      drawPile: [],
      discardPile: [],
    },
    enemies: [],
    availableMaterials: { ...EMPTY_MATERIAL_BAG },
    usedMaterials: {},
    turn: 1,
    phase: 'player_turn',
    turnTracking: {
      combatCardsPlayedThisTurn: 0,
      damageTakenThisTurn: 0,
      damageDealtThisTurn: 0,
      bonusManaNextTurn: 0,
      combatDamageBonus: 0,
      enchantEvents: [],
    },
  }
}

function makeState(overrides?: Partial<GameState>): GameState {
  return {
    seedText: 'seed',
    rngState: 1,
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
    tutorialStep: 0,
    workshopGuideSeen: false,
    guideFlags: {
      resonance: false,
      curse: false,
      materialEmergency: false,
      temple: false,
    },
    activeGuide: null,
    audio: { muted: false, master: 0.8, sfx: 0.9, bgm: 0.5 },
    scene: 'map',
    run: makeRun(),
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
    stats: {
      turns: 0,
      remainingHp: 0,
      runReport: null,
      finalSnapshot: null,
    },
    ...overrides,
  }
}

describe('guide queue', () => {
  it('should queue tutorial step 1 in act1 l1 battle', () => {
    const state = makeState({ scene: 'battle', run: makeRun({ act: 1, currentNodeId: 'l1_start' }), battle: makeBattle(false) })
    const next = applyGuideQueue(state)
    expect(next.activeGuide?.id).toBe('tutorial_act1_1')
    expect(next.activeGuide?.title).toBe(ACT1_TUTORIAL_GUIDES[0].title)
  })

  it('should not queue any guide when tutorial is skipped', () => {
    const state = makeState({
      skipTutorial: true,
      scene: 'battle',
      run: makeRun({ act: 1, currentNodeId: 'l1_start' }),
      battle: makeBattle(false),
    })
    const next = applyGuideQueue(state)
    expect(next.activeGuide).toBeNull()
  })

  it('should queue workshop guide once and mark seen', () => {
    const state = makeState({ scene: 'forge', workshopGuideSeen: false })
    const first = applyGuideQueue(state)
    expect(first.activeGuide?.id).toBe('tutorial_workshop_first')
    expect(first.workshopGuideSeen).toBe(true)

    const second = applyGuideQueue({ ...first, activeGuide: null })
    expect(second.activeGuide).toBeNull()
  })

  it('should queue curse hint once after first curse appears', () => {
    const state = makeState({
      scene: 'battle',
      run: makeRun({ act: 2, currentNodeId: 'a2_battle' }),
      tutorialStep: ACT1_TUTORIAL_GUIDES.length,
      battle: makeBattle(true),
      guideFlags: { resonance: false, curse: false, materialEmergency: false, temple: false },
    })
    const first = applyGuideQueue(state)
    expect(first.activeGuide?.id).toBe('hint_curse_first')
    expect(first.guideFlags.curse).toBe(true)

    const second = applyGuideQueue({ ...first, activeGuide: null })
    expect(second.activeGuide).toBeNull()
  })
})
