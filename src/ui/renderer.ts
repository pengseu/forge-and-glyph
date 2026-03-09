import type { EnchantmentId, GameState, MaterialId, NodeType } from '../game/types'
import { renderTitle } from './scenes/title'
import { renderStyleLab } from './scenes/style-lab'
import { renderWeaponSelect } from './scenes/weapon-select'
import { renderMap } from './scenes/map'
import { renderBattle } from './scenes/battle'
import { renderReward } from './scenes/reward'
import { renderResult } from './scenes/result'
import { renderCampfire } from './scenes/campfire'
import { renderShop } from './scenes/shop'
import { renderInventory } from './scenes/inventory'
import { renderForge } from './scenes/forge'
import { renderEnchant } from './scenes/enchant'
import { renderEvent } from './scenes/event'
import { getNodeById } from '../game/map'
import { renderActTransition } from './scenes/act-transition'
import type { IntermissionChoiceId } from '../game/act'

let lastRenderedScene: GameState['scene'] | null = null

export function shouldAnimateSceneTransition(previousScene: GameState['scene'] | null, nextScene: GameState['scene']): boolean {
  if (previousScene === null) return false
  if (previousScene === 'title' && nextScene === 'weapon_select') return false
  return previousScene !== nextScene
}

export function resolveBossAutoDropHint(nodeType: NodeType | null | undefined, act: 1 | 2 | 3): string | null {
  if (nodeType !== 'boss_battle') return null
  if (act === 1) return '已自动获得：地精王冠碎片 ×1'
  if (act === 2) return '已自动获得：暗影水晶 ×1'
  return '已自动获得：深渊之心 ×1'
}

export interface GameCallbacks {
  onStartGame: () => void
  onSelectCycleTier: (tier: number) => void
  onContinueGame: () => void
  onOpenStyleLab: () => void
  onCloseStyleLab: () => void
  onLoadSlot: (slot: 1 | 2 | 3) => void
  onSaveSlot: (slot: 1 | 2 | 3) => void
  onToggleChallengeMode: () => void
  onToggleSkipTutorial: () => void
  onToggleMute: () => void
  onSetAudioVolume: (channel: 'master' | 'sfx' | 'bgm', value: number) => void
  onResetGuides: () => void
  onDismissGuide: () => void
  onSelectStartingWeapon: (weaponDefId: 'iron_longsword' | 'iron_staff') => void
  onSelectNode: (nodeId: string) => void
  onPlayCard: (cardUid: string, targetIndex?: number) => void
  onNormalAttack: (targetIndex?: number) => void
  onUseBattleMaterial: (materialId: MaterialId) => void
  onEndTurn: () => void
  onSelectCard: (cardId: string) => void
  onSkipReward: () => void
  onSelectMaterialReward: () => void
  onEquipWeapon: (weaponDefId: string) => void
  onRestart: () => void
  onCampfireHeal: () => void
  onCampfireUpgradeCard: (cardUid: string) => void
  onCampfireUpgradeWeapon: () => void
  onCampfireContinue: () => void
  onShopBuyCard: (index: number) => void
  onShopBuyMaterial: (index: number) => void
  onShopHeal: () => void
  onShopRemoveCard: (cardUid: string) => void
  onShopTransformCard: (cardUid: string) => void
  onShopLeave: () => void
  onOpenInventory: () => void
  onCloseInventory: () => void
  onInventoryEquip: (weaponUid: string) => void
  onForgeCraft: (recipeId: string) => void
  onForgeEnchant: (enchantmentId: EnchantmentId, replaceIndex?: number) => void
  onForgeUpgradeCard: (cardUid: string) => void
  onForgeRemoveCard: (cardUid: string) => void
  onForgeLeave: () => void
  onEnchantApply: (enchantmentId: EnchantmentId, replaceIndex?: number) => void
  onEnchantLeave: () => void
  onEventChoose: (optionId: import('../game/types').EventOptionId) => void
  onChooseIntermission: (choiceId: IntermissionChoiceId) => void
  onChooseIntermissionCard: (cardId: string) => void
  onRemoveIntermissionCard: (cardUid: string) => void
  onConfirmIntermission: () => void
}

export function render(
  container: HTMLElement,
  state: GameState,
  callbacks: GameCallbacks,
  prevBattle?: import('../game/types').BattleState | null,
): void {
  const sceneChanged = shouldAnimateSceneTransition(lastRenderedScene, state.scene)
  const previousSceneClone = sceneChanged && container.firstElementChild
    ? (container.firstElementChild.cloneNode(true) as HTMLElement)
    : null

  switch (state.scene) {
    case 'title':
      renderTitle(
        container,
        callbacks.onStartGame,
        callbacks.onContinueGame,
        callbacks.onOpenStyleLab,
        callbacks.onLoadSlot,
        callbacks.onToggleChallengeMode,
        callbacks.onToggleSkipTutorial,
        callbacks.onToggleMute,
        callbacks.onSetAudioVolume,
        callbacks.onResetGuides,
        callbacks.onSelectCycleTier,
        state.hasAutoSave,
        state.saveSlots.map((slot) => ({
          slot: slot.slot,
          savedAt: slot.savedAt,
          act: slot.act,
          hp: slot.hp,
          gold: slot.gold,
        })),
        state.highestUnlockedCycleTier,
        state.highestUnlockedCycleTier > 0,
        state.challengeUnlocked,
        state.challengeModeEnabled,
        state.skipTutorial,
        state.audio.muted,
        state.audio.master,
        state.audio.sfx,
        state.audio.bgm,
        state.selectedCycleTier,
      )
      break
    case 'style_lab':
      renderStyleLab(container, callbacks.onCloseStyleLab)
      break
    case 'weapon_select':
      renderWeaponSelect(container, callbacks.onSelectStartingWeapon)
      break
    case 'map':
      if (state.run) {
        renderMap(
          container,
          state.run,
          state.saveSlots.map((slot) => ({ slot: slot.slot, savedAt: slot.savedAt })),
          callbacks,
        )
      }
      break
    case 'battle':
      if (state.battle) {
        renderBattle(container, state.battle, callbacks, prevBattle ?? undefined, state.run?.act ?? 1)
      }
      break
    case 'reward':
      {
        const currentNode = state.run ? getNodeById(state.run.mapNodes, state.run.currentNodeId) : null
        const bossHint = resolveBossAutoDropHint(currentNode?.type, state.run?.act ?? 1)
        renderReward(
          container,
          state.rewardCards,
          state.rewardMaterials,
          state.droppedWeaponId,
          callbacks,
          state.run?.act ?? 1,
          bossHint,
        )
      }
      break
    case 'result':
      renderResult(
        container,
        state.lastResult!,
        state.stats,
        callbacks.onRestart,
      )
      break
    case 'campfire':
      if (state.run) {
        renderCampfire(
          container,
          state.run,
          state.run.playerHp,
          state.run.playerMaxHp,
          callbacks,
        )
      }
      break
    case 'shop':
      if (state.run) {
        renderShop(container, state.run, state.shopOffers, state.shopMaterialOffers, callbacks)
      }
      break
    case 'inventory':
      if (state.run) {
        renderInventory(container, state.run, callbacks)
      }
      break
    case 'forge':
      if (state.run) {
        renderForge(container, state.run, callbacks)
      }
      break
    case 'enchant':
      if (state.run) {
        renderEnchant(container, state.run, callbacks)
      }
      break
    case 'event':
      if (state.currentEvent) {
        renderEvent(container, state.currentEvent, callbacks.onEventChoose, state.eventRewardNotice)
      }
      break
    case 'act_transition':
      if (state.run) {
        renderActTransition(
          container,
          state.run,
          state.intermissionMode,
          state.intermissionCardOptions,
          state.intermissionRemoveRemaining,
          callbacks.onChooseIntermission,
          callbacks.onChooseIntermissionCard,
          callbacks.onRemoveIntermissionCard,
          callbacks.onConfirmIntermission,
        )
      }
      break
  }

  const currentSceneEl = container.firstElementChild as HTMLElement | null
  if (sceneChanged && currentSceneEl) {
    currentSceneEl.classList.add('scene-transition-in')
    currentSceneEl.addEventListener('animationend', () => {
      currentSceneEl.classList.remove('scene-transition-in')
    }, { once: true })
  }
  if (sceneChanged && previousSceneClone) {
    previousSceneClone.classList.add('scene-transition-layer', 'scene-transition-out')
    previousSceneClone.setAttribute('aria-hidden', 'true')
    container.appendChild(previousSceneClone)
    previousSceneClone.addEventListener('animationend', () => {
      previousSceneClone.remove()
    }, { once: true })
  }
  lastRenderedScene = state.scene
}
