import type { EnchantmentId, GameState, MaterialId } from '../game/types'
import { renderTitle } from './scenes/title'
import { renderMap } from './scenes/map'
import { renderBattle } from './scenes/battle'
import { renderReward } from './scenes/reward'
import { renderResult } from './scenes/result'
import { renderCampfire } from './scenes/campfire'
import { renderShop } from './scenes/shop'
import { renderInventory } from './scenes/inventory'
import { renderForge } from './scenes/forge'
import { renderEnchant } from './scenes/enchant'

export interface GameCallbacks {
  onStartGame: () => void
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
  onShopHeal: () => void
  onShopRemoveCard: (cardUid: string) => void
  onShopLeave: () => void
  onOpenInventory: () => void
  onCloseInventory: () => void
  onInventoryEquip: (weaponUid: string) => void
  onForgeCraft: (recipeId: string) => void
  onForgeLeave: () => void
  onEnchantApply: (enchantmentId: EnchantmentId, replaceIndex?: number) => void
  onEnchantLeave: () => void
}

export function render(
  container: HTMLElement,
  state: GameState,
  callbacks: GameCallbacks,
  prevBattle?: import('../game/types').BattleState | null,
): void {
  switch (state.scene) {
    case 'title':
      renderTitle(container, callbacks.onStartGame)
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
      renderReward(container, state.rewardCards, state.rewardMaterials, state.droppedWeaponId, callbacks)
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
        renderShop(container, state.run, state.shopOffers, callbacks)
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
  }
}
