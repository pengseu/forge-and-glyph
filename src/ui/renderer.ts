import type { GameState } from '../game/types'
import { renderTitle } from './scenes/title'
import { renderResult } from './scenes/result'
import { renderBattle } from './scenes/battle'

export interface GameCallbacks {
  onStartGame: () => void
  onPlayCard: (cardUid: string) => void
  onEndTurn: () => void
  onRestart: () => void
  onSelectNode: (nodeId: string) => void
}

export function render(
  container: HTMLElement,
  state: GameState,
  callbacks: GameCallbacks,
): void {
  switch (state.scene) {
    case 'title':
      renderTitle(container, callbacks.onStartGame)
      break
    case 'battle':
      if (state.battle) {
        renderBattle(container, state.battle, callbacks)
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
  }
}
