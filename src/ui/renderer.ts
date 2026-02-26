import type { GameState } from '../game/types'
import { renderTitle } from './scenes/title'
import { renderMap } from './scenes/map'
import { renderBattle } from './scenes/battle'
import { renderReward } from './scenes/reward'
import { renderResult } from './scenes/result'
import { renderCampfire } from './scenes/campfire'

export interface GameCallbacks {
  onStartGame: () => void
  onSelectNode: (nodeId: string) => void
  onPlayCard: (cardUid: string, targetIndex?: number) => void
  onEndTurn: () => void
  onSelectCard: (cardId: string) => void
  onSkipReward: () => void
  onEquipWeapon: (weaponDefId: string) => void
  onRestart: () => void
  onCampfireHeal: () => void
  onCampfireUpgradeCard: (cardUid: string) => void
  onCampfireUpgradeWeapon: () => void
  onCampfireContinue: () => void
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
      renderReward(container, state.rewardCards, state.droppedWeaponId, callbacks)
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
  }
}
