import './style.css'
import './ui/styles/tokens.css'
import './ui/styles/global.css'
import './ui/styles/components/button.css'
import './ui/styles/components/panel.css'
import './ui/styles/components/card.css'
import './ui/styles/batch1-bridge.css'
import './ui/styles/batch2-core.css'
import './ui/styles/batch3-core.css'
import './ui/styles/batch5-polish.css'
import type { GameState, BattleState } from './game/types'
import { createBattleState, startTurn, playCard, endPlayerTurn, useBattleMaterial, useNormalAttack } from './game/combat'
import {
  createRunState,
  moveToNode,
  completeNode,
  addCardToDeck,
  addWeaponToInventory,
  equipWeapon,
  upgradeEquippedWeapon,
  canAccessNode,
  isBossNode,
  applyBattleVictoryRewards,
  generateBattleGold,
  addBattleGoldReward,
  healInShop,
  removeCardFromDeck,
  transformCardInShop,
  addMaterialReward,
  craftWeapon,
  enchantWeapon,
} from './game/run'
import { getRewardCardsByAct } from './game/reward'
import { getRewardPoolByAct } from './game/cards'
import { generateShopMaterialOffersByAct, generateShopOffersByAct } from './game/shop'
import { rollMaterialRewardByAct } from './game/materials'
import { restoreHp } from './game/campfire'
import { createTempleEvent, createTrialChoiceEvent, rollEventByAct, resolveEventOption } from './game/events'
import { getEnemyDef } from './game/enemies'
import { getEffectiveCardDef } from './game/campfire'
import { getNodeHpScale, scaleEnemyHp } from './game/difficulty'
import { advanceToNextAct, applyIntermissionChoice } from './game/act'
import {
  applyRunResultToMeta,
  createLegacyWeaponEvent,
  getBossLegendaryWeaponByAct,
  loadMetaProfile,
  saveMetaProfile,
} from './game/meta'
import { createSeededRng, hashSeed } from './game/rng'
import { setRandomSource } from './game/random'
import { deserializeGameState, serializeGameState } from './game/state-codec'
import { clearAuto, listSlotSummaries, loadAuto, loadSlot, saveAuto, saveSlot, type SavePayload } from './game/save'
import { createDefaultSettings, loadSettings, saveSettings } from './game/settings'
import { applyAudioSettings, playSfx, startBgmForScene, stopBgm } from './game/audio'
import { ACT1_TUTORIAL_GUIDES, applyGuideQueue } from './game/guides'
import { render } from './ui/renderer'

const app = document.getElementById('app')!

let prevBattle: BattleState | null = null
const seedParam = new URLSearchParams(window.location.search).get('seed')
const initialSeedText = seedParam ?? String(Date.now())
const runtimeRng = createSeededRng(hashSeed(initialSeedText))
setRandomSource(runtimeRng.next)
let metaProfile = loadMetaProfile()
let settings = loadSettings()
applyAudioSettings(settings.audio)

let gameState: GameState = {
  seedText: initialSeedText,
  rngState: runtimeRng.getState(),
  hasAutoSave: loadAuto() !== null,
  saveSlots: listSlotSummaries().map((slot) => ({
    slot: slot.slot,
    savedAt: slot.savedAt,
    scene: slot.scene,
    act: slot.act,
    hp: slot.hp,
    gold: slot.gold,
  })),
  challengeUnlocked: metaProfile.unlockFlags.challengeMode,
  challengeModeEnabled: settings.challengeModeEnabled && metaProfile.unlockFlags.challengeMode,
  skipTutorial: settings.skipTutorial,
  tutorialStep: settings.guides.act1TutorialCompleted ? ACT1_TUTORIAL_GUIDES.length : 0,
  workshopGuideSeen: settings.guides.workshop,
  guideFlags: {
    resonance: settings.guides.resonance,
    curse: settings.guides.curse,
    materialEmergency: settings.guides.materialEmergency,
    temple: settings.guides.temple,
  },
  activeGuide: null,
  audio: { ...settings.audio },
  scene: 'title',
  run: null,
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

function toStateSlotSummary(slot: ReturnType<typeof listSlotSummaries>[number]): GameState['saveSlots'][number] {
  return {
    slot: slot.slot,
    savedAt: slot.savedAt,
    scene: slot.scene,
    act: slot.act,
    hp: slot.hp,
    gold: slot.gold,
  }
}

function refreshSaveUiState(): void {
  gameState = {
    ...gameState,
    rngState: runtimeRng.getState(),
    hasAutoSave: loadAuto() !== null,
    saveSlots: listSlotSummaries().map(toStateSlotSummary),
    challengeUnlocked: metaProfile.unlockFlags.challengeMode,
  }
  if (!metaProfile.unlockFlags.challengeMode && gameState.challengeModeEnabled) {
    gameState = { ...gameState, challengeModeEnabled: false }
  }
}

function setRuntimeSeed(seedText: string): void {
  const hashed = hashSeed(seedText)
  runtimeRng.setState(hashed)
  setRandomSource(runtimeRng.next)
}

function saveGuideProgressFromState(state: GameState): void {
  settings = {
    ...settings,
    guides: {
      act1TutorialCompleted: state.tutorialStep >= ACT1_TUTORIAL_GUIDES.length,
      workshop: state.workshopGuideSeen,
      resonance: state.guideFlags.resonance,
      curse: state.guideFlags.curse,
      materialEmergency: state.guideFlags.materialEmergency,
      temple: state.guideFlags.temple,
    },
  }
  saveSettings(settings)
}

function hasGuideProgressChanged(prev: GameState, next: GameState): boolean {
  return (
    prev.tutorialStep !== next.tutorialStep ||
    prev.workshopGuideSeen !== next.workshopGuideSeen ||
    prev.guideFlags.resonance !== next.guideFlags.resonance ||
    prev.guideFlags.curse !== next.guideFlags.curse ||
    prev.guideFlags.materialEmergency !== next.guideFlags.materialEmergency ||
    prev.guideFlags.temple !== next.guideFlags.temple
  )
}

function buildSavePayload(): SavePayload | null {
  if (!gameState.run) return null
  return {
    version: 1,
    savedAt: Date.now(),
    seedText: gameState.seedText,
    rngState: runtimeRng.getState(),
    gameState: serializeGameState({
      ...gameState,
      rngState: runtimeRng.getState(),
    }),
    metaProfile,
  }
}

function applySavePayload(payload: SavePayload): void {
  setRuntimeSeed(payload.seedText)
  runtimeRng.setState(payload.rngState)
  setRandomSource(runtimeRng.next)
  metaProfile = payload.metaProfile
  saveMetaProfile(metaProfile)
  const restored = deserializeGameState(payload.gameState)
  settings = {
    ...createDefaultSettings(),
    skipTutorial: restored.skipTutorial,
    challengeModeEnabled: restored.challengeModeEnabled,
    guides: {
      act1TutorialCompleted: restored.tutorialStep >= ACT1_TUTORIAL_GUIDES.length,
      workshop: restored.workshopGuideSeen,
      resonance: restored.guideFlags.resonance,
      curse: restored.guideFlags.curse,
      materialEmergency: restored.guideFlags.materialEmergency,
      temple: restored.guideFlags.temple,
    },
    audio: { ...restored.audio },
  }
  saveSettings(settings)
  applyAudioSettings(settings.audio)
  gameState = {
    ...restored,
    seedText: payload.seedText,
    rngState: payload.rngState,
    hasAutoSave: loadAuto() !== null,
    saveSlots: listSlotSummaries().map(toStateSlotSummary),
    challengeUnlocked: metaProfile.unlockFlags.challengeMode,
    challengeModeEnabled: restored.challengeModeEnabled && metaProfile.unlockFlags.challengeMode,
    skipTutorial: restored.skipTutorial,
    audio: { ...restored.audio },
  }
  prevBattle = restored.battle
}

function persistAutoSave(): void {
  if (!gameState.run) return
  if (gameState.scene === 'title' || gameState.scene === 'result') return
  const payload = buildSavePayload()
  if (!payload) return
  saveAuto(payload)
}

function applyChallengeHpScale(baseScale: number): number {
  if (!gameState.challengeModeEnabled) return baseScale
  return baseScale + 0.2
}

function initRunReport(): NonNullable<GameState['stats']['runReport']> {
  return {
    startedAt: Date.now(),
    path: [],
    battles: [],
    logs: [],
  }
}

function pushGlobalLog(message: string): void {
  if (!gameState.stats.runReport) return
  gameState.stats.runReport.logs.push(`${new Date().toLocaleTimeString()} ${message}`)
}

function pushPath(nodeId: string, nodeType: import('./game/types').NodeType): void {
  if (!gameState.stats.runReport) return
  gameState.stats.runReport.path.push({ nodeId, nodeType, at: Date.now() })
}

function beginBattleReport(nodeId: string, nodeType: import('./game/types').NodeType, enemyIds: string[]): void {
  if (!gameState.stats.runReport) return
  gameState.stats.runReport.battles.push({
    nodeId,
    nodeType,
    enemyIds: [...enemyIds],
    startedAt: Date.now(),
    turns: 0,
    logs: [{ at: Date.now(), turn: 0, actor: 'system', message: `遭遇敌人：${enemyIds.map(id => getEnemyDef(id).name).join('、')}` }],
  })
}

function activeBattleReport(): NonNullable<GameState['stats']['runReport']>['battles'][number] | null {
  const report = gameState.stats.runReport
  if (!report || report.battles.length === 0) return null
  return report.battles[report.battles.length - 1]
}

function pickIntermissionCardsByRarity(
  act: 1 | 2 | 3,
  rarity: 'rare' | 'epic',
  count: number,
): import('./game/types').CardDef[] {
  const pool = getRewardPoolByAct(act).filter(card => card.rarity === rarity)
  const copy = [...pool]
  const picked: typeof pool = []
  while (picked.length < count && copy.length > 0) {
    const idx = Math.floor(runtimeRng.next() * copy.length)
    picked.push(copy[idx])
    copy.splice(idx, 1)
  }
  return picked
}

function pushBattleLog(actor: 'player' | 'enemy' | 'system', turn: number, message: string): void {
  const report = activeBattleReport()
  if (!report) return
  report.logs.push({ at: Date.now(), turn, actor, message })
}

function closeBattleReport(result: 'victory' | 'defeat', turns: number): void {
  const report = activeBattleReport()
  if (!report) return
  report.result = result
  report.turns = turns
  report.endedAt = Date.now()
}

function finalizeRun(result: 'victory' | 'defeat', runLike: import('./game/types').RunState | null, remainingHp: number): void {
  if (!gameState.stats.runReport) return
  gameState.stats.turns = gameState.stats.runReport.battles.reduce((sum, battle) => sum + battle.turns, 0)
  gameState.stats.runReport.endedAt = Date.now()
  gameState.stats.runReport.durationSec = Math.max(1, Math.floor((gameState.stats.runReport.endedAt - gameState.stats.runReport.startedAt) / 1000))
  if (runLike) {
    gameState.stats.finalSnapshot = {
      gold: runLike.gold,
      playerHp: remainingHp,
      playerMaxHp: runLike.playerMaxHp,
      deckSize: runLike.deck.length,
      materials: { ...runLike.materials },
      weapons: runLike.weaponInventory.map(w => ({ defId: w.defId, enchantments: [...w.enchantments] })),
    }
  } else {
    gameState.stats.finalSnapshot = null
  }
  const firstDeathBonusTriggered = result === 'defeat' && !metaProfile.unlockFlags.firstDeathBonusClaimed
  const challengeJustUnlocked = !metaProfile.unlockFlags.challengeMode && result === 'victory'
  metaProfile = applyRunResultToMeta(metaProfile, {
    result,
    act: runLike?.act ?? 1,
    equippedWeaponDefId: runLike?.equippedWeapon?.defId ?? null,
    equippedWeaponEnchantments: runLike?.equippedWeapon?.enchantments ?? [],
    unlockedBlueprints: runLike?.unlockedBlueprints ?? [],
    blueprintMastery: runLike?.blueprintMastery ?? {},
    replicaEliteKills: runLike?.replicaEliteKills ?? {},
    completedReplicaInheritanceBlueprints: runLike?.completedReplicaInheritanceBlueprints ?? [],
  })
  saveMetaProfile(metaProfile)
  if (firstDeathBonusTriggered) {
    gameState = {
      ...gameState,
      activeGuide: {
        id: 'first_death_bonus',
        title: '首次死亡奖励',
        body: '首次战败已额外获得 1 点冒险之证。死亡并非白费，继续锻铸你的构筑路线。',
      },
    }
  } else if (challengeJustUnlocked && metaProfile.unlockFlags.challengeMode) {
    gameState = {
      ...gameState,
      activeGuide: {
        id: 'challenge_unlocked',
        title: '挑战模式已解锁',
        body: '你已达成一次通关，可在标题页开启挑战模式。',
      },
    }
  }
  pushGlobalLog(`本局结束：${result === 'victory' ? '胜利' : '失败'}`)
}

function handleBattleVictory(newBattle: BattleState): void {
  if (!gameState.run) return
  let newRun = { ...gameState.run, playerHp: newBattle.player.hp, materials: { ...newBattle.availableMaterials } }
  const currentNode = newRun.mapNodes.find(n => n.id === newRun.currentNodeId)
  if (!currentNode) return

  if (currentNode.type === 'elite_battle' && newRun.equippedWeapon?.defId.startsWith('replica_')) {
    const defId = newRun.equippedWeapon.defId
    const prev = newRun.replicaEliteKills ?? {}
    newRun = {
      ...newRun,
      replicaEliteKills: {
        ...prev,
        [defId]: (prev[defId] ?? 0) + 1,
      },
    }
  }

  const goldReward = generateBattleGold(currentNode.type, runtimeRng.next)
  newRun = addBattleGoldReward(newRun, goldReward)
  newRun = applyBattleVictoryRewards(newRun, currentNode.type)

  let rewardCards = getRewardCardsByAct(currentNode.type, newRun.act, runtimeRng.next)
  let rewardMaterials = currentNode.type === 'boss_battle'
    ? {}
    : rollMaterialRewardByAct(currentNode.type, newRun.act, runtimeRng.next)

  if (currentNode.type === 'trial' && gameState.activeTrialModifier) {
    if (gameState.activeTrialModifier === 'flame') {
      rewardCards = []
      rewardMaterials = { elemental_essence: 2 }
    } else if (gameState.activeTrialModifier === 'speed') {
      const epics = getRewardPoolByAct(newRun.act).filter(card => card.rarity === 'epic')
      const pool = [...epics]
      const picks: typeof epics = []
      while (picks.length < 3 && pool.length > 0) {
        const idx = Math.floor(runtimeRng.next() * pool.length)
        picks.push(pool[idx])
        pool.splice(idx, 1)
      }
      rewardCards = picks
      rewardMaterials = {}
    } else if (gameState.activeTrialModifier === 'endure') {
      rewardCards = []
      rewardMaterials = { guard_essence: 1 }
      newRun = { ...newRun, playerHp: newRun.playerMaxHp }
    }
  }

  let droppedWeaponId: string | null = null
  if (currentNode.type === 'boss_battle') {
    newRun = addMaterialReward(newRun, rollMaterialRewardByAct('boss_battle', newRun.act, runtimeRng.next))
    droppedWeaponId = getBossLegendaryWeaponByAct(newRun.act)
    newRun = addWeaponToInventory(newRun, droppedWeaponId)
    if (!(newRun.unlockedBlueprints ?? []).includes(droppedWeaponId)) {
      newRun = { ...newRun, unlockedBlueprints: [...(newRun.unlockedBlueprints ?? []), droppedWeaponId] }
    }
  } else {
    const hasLongsword = newRun.weaponInventory.some(w => w.defId === 'iron_longsword' || w.defId === 'steel_longsword')
    if (!hasLongsword && runtimeRng.chance(0.3)) {
      droppedWeaponId = 'iron_longsword'
      newRun = addWeaponToInventory(newRun, droppedWeaponId)
    }
  }

  closeBattleReport('victory', newBattle.turn)
  pushGlobalLog(`战斗胜利：${currentNode.id}，${newBattle.turn} 回合`)
  playSfx('victory')

  gameState = {
    ...gameState,
    run: newRun,
    battle: null,
    currentEvent: null,
    activeTrialModifier: null,
    scene: 'reward',
    rewardCards,
    rewardMaterials,
    droppedWeaponId,
    stats: { ...gameState.stats, turns: newBattle.turn, remainingHp: newBattle.player.hp },
  }
}

function handleBattleDefeat(newBattle: BattleState): void {
  closeBattleReport('defeat', newBattle.turn)
  pushGlobalLog(`战斗失败：${gameState.run?.currentNodeId ?? 'unknown'}，${newBattle.turn} 回合`)
  finalizeRun('defeat', gameState.run, 0)
  playSfx('defeat')
  clearAuto()
  gameState = {
    ...gameState,
    scene: 'result',
    run: null,
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
    lastResult: 'defeat',
    stats: { ...gameState.stats, turns: newBattle.turn, remainingHp: 0 },
  }
}

function logBattleDiff(prev: BattleState, next: BattleState): void {
  if (prev.player.hp !== next.player.hp) {
    pushBattleLog('system', next.turn, `玩家HP ${prev.player.hp} -> ${next.player.hp}`)
  }
  if (prev.player.armor !== next.player.armor) {
    pushBattleLog('system', next.turn, `玩家护甲 ${prev.player.armor} -> ${next.player.armor}`)
  }
  for (let i = 0; i < next.enemies.length; i++) {
    const before = prev.enemies[i]
    const after = next.enemies[i]
    if (!before || !after) continue
    const name = getEnemyDef(after.defId).name
    if (before.hp !== after.hp) {
      pushBattleLog('system', next.turn, `${name} HP ${before.hp} -> ${after.hp}`)
    }
    if (before.armor !== after.armor) {
      pushBattleLog('system', next.turn, `${name} 护甲 ${before.armor} -> ${after.armor}`)
    }
    if (before.burn !== after.burn) {
      pushBattleLog('system', next.turn, `${name} 灼烧 ${before.burn} -> ${after.burn}`)
    }
    if (before.poison !== after.poison) {
      pushBattleLog('system', next.turn, `${name} 中毒 ${before.poison} -> ${after.poison}`)
    }
    if (before.freeze !== after.freeze) {
      pushBattleLog('system', next.turn, `${name} 冻结 ${before.freeze} -> ${after.freeze}`)
    }
    if (before.bossPhase !== after.bossPhase && after.bossPhase > before.bossPhase) {
      playSfx('boss_phase')
      pushBattleLog('system', next.turn, `${name} 进入阶段 ${after.bossPhase}`)
    }
  }
}

function syncBgmForCurrentScene(): void {
  if (gameState.audio.muted) {
    stopBgm()
    return
  }
  const bossBattle = gameState.scene === 'battle' && !!gameState.run && isBossNode(gameState.run)
  startBgmForScene(gameState.scene, {
    boss: bossBattle,
    result: gameState.scene === 'result' ? gameState.lastResult : null,
  })
}

function update() {
  refreshSaveUiState()
  const beforeGuideState = gameState
  gameState = applyGuideQueue(gameState)
  if (hasGuideProgressChanged(beforeGuideState, gameState)) {
    saveGuideProgressFromState(gameState)
  }
  syncBgmForCurrentScene()
  const clearIntermissionState = {
    intermissionMode: 'none' as const,
    intermissionCardOptions: [] as import('./game/types').CardDef[],
    intermissionRemoveRemaining: 0,
  }
  const advanceFromIntermission = (run: import('./game/types').RunState): void => {
    const nextRun = advanceToNextAct(run, runtimeRng.next)
    pushGlobalLog(`进入第 ${nextRun.act} 幕`)
    gameState = { ...gameState, run: nextRun, scene: 'map', ...clearIntermissionState }
    update()
  }

  render(app, gameState, {
    onStartGame: () => {
      const newSeedText = seedParam ?? String(Date.now())
      setRuntimeSeed(newSeedText)
      clearAuto()
      const run = createRunState({
        unlockedBlueprints: [...metaProfile.unlockedBlueprints],
        blueprintMastery: { ...metaProfile.blueprintMastery },
        legacyWeaponDefId: metaProfile.legacyWeaponDefId,
        legacyWeaponEnchantments: [...(metaProfile.legacyWeaponEnchantments ?? [])],
      }, runtimeRng.next)
      prevBattle = null
      gameState = {
        ...gameState,
        seedText: newSeedText,
        rngState: runtimeRng.getState(),
        challengeUnlocked: metaProfile.unlockFlags.challengeMode,
        challengeModeEnabled: settings.challengeModeEnabled && metaProfile.unlockFlags.challengeMode,
        skipTutorial: settings.skipTutorial,
        tutorialStep: settings.guides.act1TutorialCompleted ? ACT1_TUTORIAL_GUIDES.length : 0,
        workshopGuideSeen: settings.guides.workshop,
        guideFlags: {
          resonance: settings.guides.resonance,
          curse: settings.guides.curse,
          materialEmergency: settings.guides.materialEmergency,
          temple: settings.guides.temple,
        },
        activeGuide: null,
        audio: { ...settings.audio },
        scene: 'weapon_select',
        run,
        currentEvent: null,
        activeTrialModifier: null,
        intermissionMode: 'none',
        intermissionCardOptions: [],
        intermissionRemoveRemaining: 0,
        rewardMaterials: {},
        shopOffers: [],
        shopMaterialOffers: [],
        stats: { turns: 0, remainingHp: 0, runReport: initRunReport(), finalSnapshot: null },
      }
      pushGlobalLog('开始新的一局冒险')
      update()
    },
    onContinueGame: () => {
      const payload = loadAuto()
      if (!payload) return
      applySavePayload(payload)
      update()
    },
    onOpenStyleLab: () => {
      gameState = { ...gameState, scene: 'style_lab' }
      update()
    },
    onCloseStyleLab: () => {
      gameState = { ...gameState, scene: 'title' }
      update()
    },
    onLoadSlot: (slot) => {
      const payload = loadSlot(slot)
      if (!payload) return
      saveAuto(payload)
      applySavePayload(payload)
      update()
    },
    onSaveSlot: (slot) => {
      const payload = buildSavePayload()
      if (!payload) return
      saveSlot(slot, payload)
      refreshSaveUiState()
      update()
    },
    onToggleChallengeMode: () => {
      if (!metaProfile.unlockFlags.challengeMode) return
      const enabled = !gameState.challengeModeEnabled
      gameState = { ...gameState, challengeModeEnabled: enabled }
      settings = { ...settings, challengeModeEnabled: enabled }
      saveSettings(settings)
      update()
    },
    onToggleSkipTutorial: () => {
      const skip = !gameState.skipTutorial
      gameState = { ...gameState, skipTutorial: skip, activeGuide: skip ? null : gameState.activeGuide }
      settings = { ...settings, skipTutorial: skip }
      saveSettings(settings)
      update()
    },
    onToggleMute: () => {
      const muted = !gameState.audio.muted
      const nextAudio = { ...gameState.audio, muted }
      gameState = { ...gameState, audio: nextAudio }
      settings = { ...settings, audio: nextAudio }
      saveSettings(settings)
      applyAudioSettings(nextAudio)
      update()
    },
    onSetAudioVolume: (channel, value) => {
      const normalized = Math.max(0, Math.min(1, value))
      const nextAudio = { ...gameState.audio, [channel]: normalized }
      gameState = { ...gameState, audio: nextAudio }
      settings = { ...settings, audio: nextAudio }
      saveSettings(settings)
      applyAudioSettings(nextAudio)
      update()
    },
    onResetGuides: () => {
      settings = {
        ...settings,
        guides: {
          act1TutorialCompleted: false,
          workshop: false,
          resonance: false,
          curse: false,
          materialEmergency: false,
          temple: false,
        },
      }
      saveSettings(settings)
      gameState = {
        ...gameState,
        tutorialStep: 0,
        workshopGuideSeen: false,
        guideFlags: {
          resonance: false,
          curse: false,
          materialEmergency: false,
          temple: false,
        },
        activeGuide: null,
      }
      update()
    },
    onDismissGuide: () => {
      const current = gameState.activeGuide
      if (!current) return
      if (current.id.startsWith('tutorial_act1_')) {
        gameState = {
          ...gameState,
          tutorialStep: Math.min(ACT1_TUTORIAL_GUIDES.length, gameState.tutorialStep + 1),
          activeGuide: null,
        }
      } else {
        gameState = { ...gameState, activeGuide: null }
      }
      saveGuideProgressFromState(gameState)
      update()
    },
    onSelectStartingWeapon: (weaponDefId) => {
      if (!gameState.run) return
      let newRun = addWeaponToInventory(gameState.run, weaponDefId)
      const selected = newRun.weaponInventory[newRun.weaponInventory.length - 1]
      newRun = equipWeapon(newRun, selected.uid)
      gameState = { ...gameState, run: newRun, scene: 'map' }
      pushGlobalLog(`选择起始武器：${weaponDefId}`)
      update()
    },
    onSelectNode: (nodeId: string) => {
      if (!gameState.run) return
      const node = gameState.run.mapNodes.find(n => n.id === nodeId)
      if (!node) return
      if (!canAccessNode(gameState.run, nodeId)) return

      let newRun = moveToNode(gameState.run, nodeId)
      pushPath(node.id, node.type)
      pushGlobalLog(`进入节点 ${node.id} (${node.type})`)

      if (node.type === 'campfire') {
        gameState = { ...gameState, run: newRun, scene: 'campfire' }
        update()
        return
      }
      if (node.type === 'shop') {
        gameState = {
          ...gameState,
          run: newRun,
          scene: 'shop',
          shopOffers: generateShopOffersByAct(newRun.act, runtimeRng.next),
          shopMaterialOffers: generateShopMaterialOffersByAct(newRun.act),
        }
        update()
        return
      }
      if (node.type === 'forge') {
        gameState = { ...gameState, run: newRun, scene: 'forge' }
        update()
        return
      }
      if (node.type === 'enchant') {
        gameState = { ...gameState, run: newRun, scene: 'enchant' }
        update()
        return
      }
      if (node.type === 'event') {
        const eventDef = newRun.act === 2 && newRun.legacyWeaponDefId && !newRun.legacyEventSeen
          ? createLegacyWeaponEvent(newRun.legacyWeaponDefId)
          : rollEventByAct(newRun.act, runtimeRng.next)
        pushGlobalLog(`触发事件：${eventDef.title}`)
        gameState = { ...gameState, run: newRun, scene: 'event', currentEvent: eventDef }
        update()
        return
      }
      if (node.type === 'temple') {
        const eventDef = createTempleEvent()
        pushGlobalLog(`进入圣殿：${eventDef.title}`)
        gameState = { ...gameState, run: newRun, scene: 'event', currentEvent: eventDef }
        update()
        return
      }
      if (node.type === 'trial') {
        const eventDef = createTrialChoiceEvent()
        pushGlobalLog(`进入试炼：${eventDef.title}`)
        gameState = { ...gameState, run: newRun, scene: 'event', currentEvent: eventDef }
        update()
        return
      }
      if (node.type === 'treasure') {
        pushGlobalLog('发现隐藏宝库：获得金币与稀有材料')
        let rewardedRun = { ...newRun, gold: newRun.gold + 60 }
        rewardedRun = addMaterialReward(rewardedRun, { steel_ingot: 1, elemental_essence: 1 })
        rewardedRun = completeNode(rewardedRun, rewardedRun.currentNodeId)
        gameState = { ...gameState, run: rewardedRun, scene: 'map' }
        update()
        return
      }

      if (!node.enemyIds || node.enemyIds.length === 0) return

      // Pass weapon info to battle
      const weaponDefId = newRun.equippedWeapon?.defId ?? undefined
      const weaponEnchantments = newRun.equippedWeapon?.enchantments ?? []
      let battle = createBattleState(node.enemyIds, newRun.deck, weaponDefId, newRun.materials, weaponEnchantments)
      const hpScale = applyChallengeHpScale(getNodeHpScale(node.y, node.type, newRun.act))
      battle = { ...battle, enemies: scaleEnemyHp(battle.enemies, hpScale) }
      battle = {
        ...battle,
        player: {
          ...battle.player,
          hp: newRun.playerHp,
          maxHp: newRun.playerMaxHp,
          strength: battle.player.strength + newRun.bonusStrength,
          wisdom: battle.player.wisdom + newRun.bonusWisdom,
          maxMana: battle.player.maxMana + newRun.bonusMaxMana,
          mana: battle.player.mana + newRun.bonusMaxMana,
        },
        enemies: battle.enemies.map((enemy) => ({
          ...enemy,
          strength: enemy.strength + newRun.nextBattleEnemyStrengthBonus,
        })),
      }
      if (newRun.nextBattleEnemyStrengthBonus > 0) {
        newRun = { ...newRun, nextBattleEnemyStrengthBonus: 0 }
      }
      battle = startTurn(battle)
      beginBattleReport(node.id, node.type, node.enemyIds)
      pushBattleLog('system', battle.turn, `战斗开始，玩家 HP ${battle.player.hp}/${battle.player.maxHp}`)

      gameState = { ...gameState, run: newRun, scene: 'battle', battle }
      update()
    },
    onPlayCard: (cardUid: string, targetIndex?: number) => {
      if (!gameState.battle) return
      prevBattle = gameState.battle
      playSfx('card')
      const playedCard = gameState.battle.player.hand.find(c => c.uid === cardUid)
      if (playedCard) {
        const def = getEffectiveCardDef(playedCard)
        pushBattleLog('player', gameState.battle.turn, `打出卡牌【${def.name}】目标#${targetIndex ?? 0}`)
      }
      const newBattle = playCard(gameState.battle, cardUid, targetIndex ?? 0)
      logBattleDiff(gameState.battle, newBattle)
      if (newBattle.phase === 'victory') {
        handleBattleVictory(newBattle)
      } else {
        gameState = { ...gameState, battle: newBattle, run: { ...gameState.run!, materials: { ...newBattle.availableMaterials } } }
      }
      update()
    },
    onNormalAttack: (targetIndex?: number) => {
      if (!gameState.battle) return
      prevBattle = gameState.battle
      playSfx('hit')
      pushBattleLog('player', gameState.battle.turn, `使用普攻，目标#${targetIndex ?? 0}`)
      const newBattle = useNormalAttack(gameState.battle, targetIndex ?? 0)
      logBattleDiff(gameState.battle, newBattle)
      if (newBattle.phase === 'victory') {
        handleBattleVictory(newBattle)
      } else {
        gameState = { ...gameState, battle: newBattle, run: { ...gameState.run!, materials: { ...newBattle.availableMaterials } } }
      }
      update()
    },
    onUseBattleMaterial: (materialId) => {
      if (!gameState.battle || !gameState.run) return
      pushBattleLog('player', gameState.battle.turn, `使用材料【${materialId}】`)
      const nextBattle = useBattleMaterial(gameState.battle, materialId)
      logBattleDiff(gameState.battle, nextBattle)
      gameState = {
        ...gameState,
        battle: nextBattle,
        run: { ...gameState.run!, materials: { ...nextBattle.availableMaterials } },
      }
      update()
    },
    onEndTurn: () => {
      if (!gameState.battle) return
      prevBattle = gameState.battle
      pushBattleLog('player', gameState.battle.turn, '结束回合')
      const newBattle = endPlayerTurn(gameState.battle)
      logBattleDiff(gameState.battle, newBattle)
      if (newBattle.phase === 'defeat') {
        handleBattleDefeat(newBattle)
      } else if (newBattle.phase === 'victory') {
        handleBattleVictory(newBattle)
      } else {
        gameState = {
          ...gameState,
          battle: newBattle,
          run: { ...gameState.run!, playerHp: newBattle.player.hp, materials: { ...newBattle.availableMaterials } },
        }
      }
      update()
    },
    onSelectCard: (cardId: string) => {
      if (!gameState.run) return
      const picked = cardId
      let newRun = addCardToDeck(gameState.run, cardId, runtimeRng.next)
      pushGlobalLog(`奖励选卡：${picked}`)
      newRun = completeNode(newRun, newRun.currentNodeId)
      if (isBossNode(newRun)) {
        if (newRun.act < 3) {
          pushGlobalLog(`第 ${newRun.act} 幕完成，进入幕间`)
          gameState = {
            ...gameState,
            run: newRun,
            scene: 'act_transition',
            intermissionMode: 'none',
            intermissionCardOptions: [],
            intermissionRemoveRemaining: 0,
            rewardCards: [],
            rewardMaterials: {},
            shopOffers: [],
            shopMaterialOffers: [],
            droppedWeaponId: null,
          }
        } else {
          finalizeRun('victory', newRun, gameState.stats.remainingHp)
          clearAuto()
          gameState = {
            ...gameState,
            scene: 'result',
            run: null,
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
            lastResult: 'victory',
            stats: { ...gameState.stats },
          }
        }
      } else {
        gameState = {
          ...gameState,
          run: newRun,
          scene: 'map',
          rewardCards: [],
          rewardMaterials: {},
          shopOffers: [],
          shopMaterialOffers: [],
          droppedWeaponId: null,
        }
      }
      update()
    },
    onSkipReward: () => {
      if (!gameState.run) return
      pushGlobalLog('跳过奖励')
      let newRun = completeNode(gameState.run, gameState.run.currentNodeId)
      if (isBossNode(newRun)) {
        if (newRun.act < 3) {
          pushGlobalLog(`第 ${newRun.act} 幕完成，进入幕间`)
          gameState = {
            ...gameState,
            run: newRun,
            scene: 'act_transition',
            intermissionMode: 'none',
            intermissionCardOptions: [],
            intermissionRemoveRemaining: 0,
            rewardCards: [],
            rewardMaterials: {},
            shopOffers: [],
            shopMaterialOffers: [],
            droppedWeaponId: null,
          }
        } else {
          finalizeRun('victory', newRun, gameState.stats.remainingHp)
          clearAuto()
          gameState = {
            ...gameState,
            scene: 'result',
            run: null,
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
            lastResult: 'victory',
            stats: { ...gameState.stats },
          }
        }
      } else {
        gameState = {
          ...gameState,
          run: newRun,
          scene: 'map',
          rewardCards: [],
          rewardMaterials: {},
          shopOffers: [],
          shopMaterialOffers: [],
          droppedWeaponId: null,
        }
      }
      update()
    },
    onSelectMaterialReward: () => {
      if (!gameState.run) return
      pushGlobalLog('选择材料奖励')
      let newRun = addMaterialReward(gameState.run, gameState.rewardMaterials)
      newRun = completeNode(newRun, newRun.currentNodeId)
      if (isBossNode(newRun)) {
        if (newRun.act < 3) {
          pushGlobalLog(`第 ${newRun.act} 幕完成，进入幕间`)
          gameState = {
            ...gameState,
            run: newRun,
            scene: 'act_transition',
            intermissionMode: 'none',
            intermissionCardOptions: [],
            intermissionRemoveRemaining: 0,
            rewardCards: [],
            rewardMaterials: {},
            shopOffers: [],
            shopMaterialOffers: [],
            droppedWeaponId: null,
          }
        } else {
          finalizeRun('victory', newRun, gameState.stats.remainingHp)
          clearAuto()
          gameState = {
            ...gameState,
            scene: 'result',
            run: null,
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
            lastResult: 'victory',
            stats: { ...gameState.stats },
          }
        }
      } else {
        gameState = {
          ...gameState,
          run: newRun,
          scene: 'map',
          rewardCards: [],
          rewardMaterials: {},
          shopOffers: [],
          shopMaterialOffers: [],
          droppedWeaponId: null,
        }
      }
      update()
    },
    onEquipWeapon: (weaponDefId: string) => {
      if (!gameState.run) return
      let newRun = gameState.run
      const matchingWeapon = [...newRun.weaponInventory].reverse().find((weapon) => weapon.defId === weaponDefId)
      if (matchingWeapon) {
        newRun = equipWeapon(newRun, matchingWeapon.uid)
      } else {
        newRun = addWeaponToInventory(newRun, weaponDefId)
        const newWeapon = newRun.weaponInventory[newRun.weaponInventory.length - 1]
        if (newWeapon) newRun = equipWeapon(newRun, newWeapon.uid)
      }
      gameState = { ...gameState, run: newRun, droppedWeaponId: null }
      update()
    },
    onRestart: () => {
      clearAuto()
      stopBgm()
      gameState = {
        ...gameState,
        scene: 'title',
        run: null,
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
      update()
    },
    onCampfireHeal: () => {
      if (!gameState.run) return
      pushGlobalLog('篝火：回血')
      const { hp } = restoreHp(gameState.run, gameState.run.playerHp, gameState.run.playerMaxHp)
      let newRun = { ...gameState.run, playerHp: hp }
      newRun = completeNode(newRun, newRun.currentNodeId)
      gameState = { ...gameState, run: newRun, scene: 'map' }
      update()
    },
    onCampfireUpgradeCard: (cardUid: string) => {
      if (!gameState.run) return
      pushGlobalLog(`篝火：升级卡牌 ${cardUid}`)
      const newDeck = gameState.run.deck.map(c =>
        c.uid === cardUid ? { ...c, upgraded: true } : c
      )
      let newRun = { ...gameState.run, deck: newDeck }
      newRun = completeNode(newRun, newRun.currentNodeId)
      gameState = { ...gameState, run: newRun, scene: 'map' }
      update()
    },
    onCampfireUpgradeWeapon: () => {
      if (!gameState.run) return
      pushGlobalLog('篝火：升级武器')
      let newRun = upgradeEquippedWeapon(gameState.run)
      newRun = completeNode(newRun, newRun.currentNodeId)
      gameState = { ...gameState, run: newRun, scene: 'map' }
      update()
    },
    onCampfireContinue: () => {
      if (!gameState.run) return
      pushGlobalLog('篝火：继续旅程')
      let newRun = completeNode(gameState.run, gameState.run.currentNodeId)
      gameState = { ...gameState, run: newRun, scene: 'map' }
      update()
    },
    onShopBuyCard: (index: number) => {
      if (!gameState.run) return
      const offer = gameState.shopOffers[index]
      if (!offer || offer.sold || gameState.run.gold < offer.price) return
      pushGlobalLog(`商店：购买卡牌 ${offer.cardId} (${offer.price}G)`)
      let newRun = { ...gameState.run, gold: gameState.run.gold - offer.price }
      newRun = addCardToDeck(newRun, offer.cardId, runtimeRng.next)
      const nextOffers = gameState.shopOffers.map((o, i) => (i === index ? { ...o, sold: true } : o))
      gameState = { ...gameState, run: newRun, shopOffers: nextOffers }
      update()
    },
    onShopBuyMaterial: (index: number) => {
      if (!gameState.run) return
      const offer = gameState.shopMaterialOffers[index]
      if (!offer || offer.sold || gameState.run.gold < offer.price) return
      pushGlobalLog(`商店：购买材料 ${offer.materialId} (${offer.price}G)`)
      let newRun = { ...gameState.run, gold: gameState.run.gold - offer.price }
      newRun = addMaterialReward(newRun, { [offer.materialId]: offer.quantity ?? 1 })
      const nextOffers = gameState.shopMaterialOffers.map((o, i) => (i === index ? { ...o, sold: true } : o))
      gameState = { ...gameState, run: newRun, shopMaterialOffers: nextOffers }
      update()
    },
    onShopHeal: () => {
      if (!gameState.run) return
      pushGlobalLog('商店：购买治疗')
      const newRun = healInShop(gameState.run)
      gameState = { ...gameState, run: newRun }
      update()
    },
    onShopRemoveCard: (cardUid: string) => {
      if (!gameState.run) return
      pushGlobalLog(`商店：移除卡牌 ${cardUid}`)
      const newRun = removeCardFromDeck(gameState.run, cardUid)
      gameState = { ...gameState, run: newRun }
      update()
    },
    onShopTransformCard: (cardUid: string) => {
      if (!gameState.run) return
      pushGlobalLog(`商店：变换卡牌 ${cardUid}`)
      const newRun = transformCardInShop(gameState.run, cardUid, runtimeRng.next)
      gameState = { ...gameState, run: newRun }
      update()
    },
    onShopLeave: () => {
      if (!gameState.run) return
      pushGlobalLog('离开商店')
      let newRun = completeNode(gameState.run, gameState.run.currentNodeId)
      gameState = { ...gameState, run: newRun, scene: 'map', shopOffers: [], shopMaterialOffers: [] }
      update()
    },
    onOpenInventory: () => {
      if (!gameState.run) return
      gameState = { ...gameState, scene: 'inventory' }
      update()
    },
    onCloseInventory: () => {
      if (!gameState.run) return
      gameState = { ...gameState, scene: 'map' }
      update()
    },
    onInventoryEquip: (weaponUid: string) => {
      if (!gameState.run) return
      pushGlobalLog(`背包：装备武器 ${weaponUid}`)
      const newRun = equipWeapon(gameState.run, weaponUid)
      gameState = { ...gameState, run: newRun }
      update()
    },
    onForgeCraft: (recipeId: string) => {
      if (!gameState.run) return
      pushGlobalLog(`铁匠：锻造 ${recipeId}`)
      const before = gameState.run
      const crafted = craftWeapon(before, recipeId)
      const craftedOk = crafted.weaponInventory.length > before.weaponInventory.length
      const newRun = craftedOk ? completeNode(crafted, crafted.currentNodeId) : crafted
      gameState = { ...gameState, run: newRun, scene: craftedOk ? 'map' : 'forge' }
      update()
    },
    onForgeEnchant: (enchantmentId, replaceIndex) => {
      if (!gameState.run) return
      pushGlobalLog(`工坊附魔：${enchantmentId}`)
      const before = gameState.run
      const enchanted = enchantWeapon(before, enchantmentId, replaceIndex)
      const consumed = enchanted.materials.elemental_essence < before.materials.elemental_essence
      const newRun = consumed ? completeNode(enchanted, enchanted.currentNodeId) : enchanted
      gameState = { ...gameState, run: newRun, scene: consumed ? 'map' : 'forge' }
      update()
    },
    onForgeUpgradeCard: (cardUid) => {
      if (!gameState.run) return
      pushGlobalLog(`工坊升级卡牌：${cardUid}`)
      const upgraded = {
        ...gameState.run,
        deck: gameState.run.deck.map(c => (c.uid === cardUid ? { ...c, upgraded: true } : c)),
      }
      const newRun = completeNode(upgraded, upgraded.currentNodeId)
      gameState = { ...gameState, run: newRun, scene: 'map' }
      update()
    },
    onForgeRemoveCard: (cardUid) => {
      if (!gameState.run) return
      pushGlobalLog(`工坊移除卡牌：${cardUid}`)
      if (!gameState.run.deck.some(c => c.uid === cardUid)) return
      const removed = {
        ...gameState.run,
        deck: gameState.run.deck.filter(c => c.uid !== cardUid),
      }
      const newRun = completeNode(removed, removed.currentNodeId)
      gameState = { ...gameState, run: newRun, scene: 'map' }
      update()
    },
    onForgeLeave: () => {
      if (!gameState.run) return
      pushGlobalLog('离开铁匠')
      const newRun = completeNode(gameState.run, gameState.run.currentNodeId)
      gameState = { ...gameState, run: newRun, scene: 'map' }
      update()
    },
    onEnchantApply: (enchantmentId, replaceIndex) => {
      if (!gameState.run) return
      pushGlobalLog(`附魔：${enchantmentId}${replaceIndex !== undefined ? ` (覆盖槽位 ${replaceIndex + 1})` : ''}`)
      const newRun = enchantWeapon(gameState.run, enchantmentId, replaceIndex)
      gameState = { ...gameState, run: newRun }
      update()
    },
    onEnchantLeave: () => {
      if (!gameState.run) return
      pushGlobalLog('离开附魔台')
      const newRun = completeNode(gameState.run, gameState.run.currentNodeId)
      gameState = { ...gameState, run: newRun, scene: 'map' }
      update()
    },
    onEventChoose: (optionId) => {
      if (!gameState.run || !gameState.currentEvent) return
      pushGlobalLog(`事件【${gameState.currentEvent.title}】选择：${optionId}`)
      if (gameState.currentEvent.id === 'trial_choice') {
        const node = gameState.run.mapNodes.find(n => n.id === gameState.run!.currentNodeId)
        if (!node || node.type !== 'trial' || !node.enemyIds || node.enemyIds.length === 0) return
        if (optionId !== 'trial_flame' && optionId !== 'trial_speed' && optionId !== 'trial_endure') return

        let trialModifier: 'flame' | 'speed' | 'endure' = 'flame'
        if (optionId === 'trial_speed') trialModifier = 'speed'
        if (optionId === 'trial_endure') trialModifier = 'endure'

        let nextRun = gameState.run
        const weaponDefId = nextRun.equippedWeapon?.defId ?? undefined
        const weaponEnchantments = nextRun.equippedWeapon?.enchantments ?? []
        let battle = createBattleState(
          node.enemyIds,
          nextRun.deck,
          weaponDefId,
          nextRun.materials,
          weaponEnchantments,
        )
        const hpScale = applyChallengeHpScale(getNodeHpScale(node.y, node.type, nextRun.act))
        battle = { ...battle, enemies: scaleEnemyHp(battle.enemies, hpScale) }
        battle = {
          ...battle,
          player: {
            ...battle.player,
            hp: nextRun.playerHp,
            maxHp: nextRun.playerMaxHp,
            strength: battle.player.strength + nextRun.bonusStrength,
            wisdom: battle.player.wisdom + nextRun.bonusWisdom,
            maxMana: battle.player.maxMana + nextRun.bonusMaxMana,
            mana: battle.player.mana + nextRun.bonusMaxMana,
          },
          enemies: battle.enemies.map((enemy) => ({
            ...enemy,
            strength: enemy.strength + nextRun.nextBattleEnemyStrengthBonus,
          })),
          trialModifier,
        }
        if (trialModifier === 'speed') {
          battle = { ...battle, trialTurnLimit: 5 }
        }
        if (trialModifier === 'endure') {
          battle = {
            ...battle,
            enemyDamageMultiplier: 0.5,
            enemies: battle.enemies.map(enemy => ({
              ...enemy,
              hp: enemy.hp * 2,
              maxHp: enemy.maxHp * 2,
            })),
          }
        }
        if (nextRun.nextBattleEnemyStrengthBonus > 0) {
          nextRun = { ...nextRun, nextBattleEnemyStrengthBonus: 0 }
        }
        battle = startTurn(battle)
        beginBattleReport(node.id, node.type, node.enemyIds)
        pushBattleLog('system', battle.turn, `试炼战斗开始（${optionId}），玩家 HP ${battle.player.hp}/${battle.player.maxHp}`)
        gameState = {
          ...gameState,
          run: nextRun,
          battle,
          currentEvent: null,
          activeTrialModifier: trialModifier,
          scene: 'battle',
        }
        update()
        return
      }
      const resolved = resolveEventOption(gameState.run, gameState.currentEvent, optionId, runtimeRng.next)
      let nextRun = resolved.run
      if (resolved.triggerBattleEnemyIds && resolved.triggerBattleEnemyIds.length > 0) {
        const weaponDefId = nextRun.equippedWeapon?.defId ?? undefined
        const weaponEnchantments = nextRun.equippedWeapon?.enchantments ?? []
        let battle = createBattleState(
          resolved.triggerBattleEnemyIds,
          nextRun.deck,
          weaponDefId,
          nextRun.materials,
          weaponEnchantments,
        )
        if (gameState.challengeModeEnabled) {
          battle = { ...battle, enemies: scaleEnemyHp(battle.enemies, 1.2) }
        }
        battle = {
          ...battle,
          player: {
            ...battle.player,
            hp: nextRun.playerHp,
            maxHp: nextRun.playerMaxHp,
            strength: battle.player.strength + nextRun.bonusStrength,
            wisdom: battle.player.wisdom + nextRun.bonusWisdom,
            maxMana: battle.player.maxMana + nextRun.bonusMaxMana,
            mana: battle.player.mana + nextRun.bonusMaxMana,
          },
          enemies: battle.enemies.map((enemy) => ({
            ...enemy,
            strength: enemy.strength + nextRun.nextBattleEnemyStrengthBonus,
          })),
        }
        if (nextRun.nextBattleEnemyStrengthBonus > 0) {
          nextRun = { ...nextRun, nextBattleEnemyStrengthBonus: 0 }
        }
        battle = startTurn(battle)
        beginBattleReport(nextRun.currentNodeId, 'event', resolved.triggerBattleEnemyIds)
        pushBattleLog('system', battle.turn, `事件战斗开始，玩家 HP ${battle.player.hp}/${battle.player.maxHp}`)
        gameState = { ...gameState, run: nextRun, battle, currentEvent: null, scene: 'battle' }
        update()
        return
      }

      nextRun = completeNode(nextRun, nextRun.currentNodeId)
      gameState = { ...gameState, run: nextRun, currentEvent: null, scene: 'map' }
      update()
    },
    onChooseIntermission: (choiceId) => {
      if (!gameState.run) return
      const choiceNameMap: Record<string, string> = {
        elite_armament: '精锐武装',
        knowledge_accumulation: '知识积累',
        war_loot_reserve: '战利储备',
        legend_forge: '传说锻造',
        deep_purify: '深度净化',
        foresight_eye: '远见之眼',
      }
      const choiceName = choiceNameMap[choiceId] ?? choiceId
      pushGlobalLog(`幕间选择：${choiceName}`)
      if (choiceId === 'knowledge_accumulation') {
        const draftAct = gameState.run.act === 1 ? 2 : 3
        gameState = {
          ...gameState,
          intermissionMode: 'knowledge_pick',
          intermissionCardOptions: pickIntermissionCardsByRarity(draftAct, 'rare', 3),
          intermissionRemoveRemaining: 0,
        }
        update()
        return
      }
      if (choiceId === 'foresight_eye') {
        const draftAct = gameState.run.act === 1 ? 2 : 3
        gameState = {
          ...gameState,
          intermissionMode: 'foresight_pick',
          intermissionCardOptions: pickIntermissionCardsByRarity(draftAct, 'epic', 3),
          intermissionRemoveRemaining: 0,
        }
        update()
        return
      }
      if (choiceId === 'deep_purify') {
        gameState = {
          ...gameState,
          run: { ...gameState.run, playerHp: gameState.run.playerMaxHp },
          intermissionMode: 'deep_purify',
          intermissionCardOptions: [],
          intermissionRemoveRemaining: 3,
        }
        update()
        return
      }
      const nextRun = applyIntermissionChoice(gameState.run, choiceId, runtimeRng.next)
      advanceFromIntermission(nextRun)
    },
    onChooseIntermissionCard: (cardId) => {
      if (!gameState.run) return
      if (gameState.intermissionMode === 'knowledge_pick') {
        pushGlobalLog(`幕间：选择稀有卡 ${cardId}`)
        const withCard = addCardToDeck(gameState.run, cardId, runtimeRng.next)
        if (withCard.deck.length <= 1) {
          advanceFromIntermission(withCard)
          return
        }
        gameState = {
          ...gameState,
          run: withCard,
          intermissionMode: 'knowledge_remove',
          intermissionCardOptions: [],
          intermissionRemoveRemaining: 1,
        }
        update()
        return
      }
      if (gameState.intermissionMode === 'foresight_pick') {
        pushGlobalLog(`幕间：选择史诗卡 ${cardId}`)
        const withCard = addCardToDeck(gameState.run, cardId, runtimeRng.next)
        advanceFromIntermission({ ...withCard, gold: withCard.gold + 50 })
      }
    },
    onRemoveIntermissionCard: (cardUid) => {
      if (!gameState.run) return
      if (gameState.intermissionMode !== 'knowledge_remove' && gameState.intermissionMode !== 'deep_purify') return
      if (gameState.run.deck.length <= 1) return
      if (!gameState.run.deck.some(card => card.uid === cardUid)) return
      pushGlobalLog(`幕间：移除卡牌 ${cardUid}`)
      const nextRun = {
        ...gameState.run,
        deck: gameState.run.deck.filter(card => card.uid !== cardUid),
      }
      const remaining = Math.max(0, gameState.intermissionRemoveRemaining - 1)
      if (gameState.intermissionMode === 'knowledge_remove' || remaining === 0) {
        advanceFromIntermission(nextRun)
        return
      }
      gameState = { ...gameState, run: nextRun, intermissionRemoveRemaining: remaining }
      update()
    },
    onConfirmIntermission: () => {
      if (!gameState.run) return
      if (gameState.intermissionMode === 'deep_purify') {
        pushGlobalLog('幕间：完成深度净化')
        advanceFromIntermission(gameState.run)
        return
      }
      update()
    },
  }, prevBattle)
  persistAutoSave()
}

update()

// --- Debug Console API ---
// Usage in browser console: debug.setPlayer({wisdom: 3, charge: 2})
const debug = {
  getState: () => gameState,
  setPlayer: (overrides: Record<string, unknown>) => {
    if (!gameState.battle) { console.warn('Not in battle'); return }
    gameState = {
      ...gameState,
      battle: {
        ...gameState.battle,
        player: { ...gameState.battle.player, ...overrides },
      },
    }
    update()
  },
  setEnemy: (index: number, overrides: Record<string, unknown>) => {
    if (!gameState.battle) { console.warn('Not in battle'); return }
    gameState = {
      ...gameState,
      battle: {
        ...gameState.battle,
        enemies: gameState.battle.enemies.map((e, i) =>
          i === index ? { ...e, ...overrides } : e
        ),
      },
    }
    update()
  },
  addCard: (defId: string) => {
    if (!gameState.battle) { console.warn('Not in battle'); return }
    const uid = `debug_${Date.now()}`
    gameState = {
      ...gameState,
      battle: {
        ...gameState.battle,
        player: {
          ...gameState.battle.player,
          hand: [...gameState.battle.player.hand, { uid, defId }],
        },
      },
    }
    update()
    console.log(`Added ${defId} (uid: ${uid})`)
  },
  help: () => {
    console.log(`
debug.getState()                    - 查看当前游戏状态
debug.setPlayer({wisdom: 3})        - 修改玩家属性
debug.setEnemy(0, {vulnerable: 2})  - 修改敌人属性
debug.addCard('frozen_arrow')       - 添加卡牌到手牌
    `.trim())
  },
}
;(window as unknown as Record<string, unknown>).debug = debug
