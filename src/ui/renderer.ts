import type { EnchantmentId, GameState, MaterialId, NodeType, StyleLabPreviewMode } from '../game/types'
import { renderTitle } from './scenes/title'
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
import { renderStyleLab } from './scenes/style-lab'

export function resolveBossAutoDropHint(nodeType: NodeType | null | undefined, act: 1 | 2 | 3): string | null {
  if (nodeType !== 'boss_battle') return null
  if (act === 1) return '已自动获得：👑 地精王冠碎片 ×1'
  return '已自动获得：Boss 专属材料'
}

export interface GameCallbacks {
  onStartGame: () => void
  onOpenStyleLab: () => void
  onCloseStyleLab: () => void
  onSetStyleLabMode: (mode: StyleLabPreviewMode) => void
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
  switch (state.scene) {
    case 'title':
      renderTitle(container, callbacks.onStartGame, callbacks.onOpenStyleLab)
      break
    case 'style_lab':
      renderStyleLab(container, state.styleLabMode ?? 'battle', callbacks)
      break
    case 'weapon_select':
      renderWeaponSelect(container, callbacks.onSelectStartingWeapon)
      break
    case 'map':
      if (state.run) {
        renderMap(container, state.run, callbacks)
      }
      break
    case 'battle':
      if (state.battle) {
        renderBattle(container, state.battle, callbacks, prevBattle ?? undefined)
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
        renderEvent(container, state.currentEvent, callbacks.onEventChoose)
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
}
