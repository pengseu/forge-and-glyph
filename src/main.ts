import './style.css'
import type { GameState } from './game/types'
import { createBattleState, startTurn, playCard, endPlayerTurn } from './game/combat'
import { render } from './ui/renderer'

const app = document.getElementById('app')!

let gameState: GameState = {
  scene: 'title',
  battle: null,
  lastResult: null,
  stats: { turns: 0, remainingHp: 0 },
}

function update() {
  render(app, gameState, {
    onStartGame: () => {
      const battle = startTurn(createBattleState())
      gameState = { ...gameState, scene: 'battle', battle }
      update()
    },
    onPlayCard: (cardUid: string) => {
      if (!gameState.battle) return
      const newBattle = playCard(gameState.battle, cardUid)
      if (newBattle.phase === 'victory') {
        gameState = {
          scene: 'result',
          battle: null,
          lastResult: 'victory',
          stats: { turns: newBattle.turn, remainingHp: newBattle.player.hp },
        }
      } else {
        gameState = { ...gameState, battle: newBattle }
      }
      update()
    },
    onEndTurn: () => {
      if (!gameState.battle) return
      const newBattle = endPlayerTurn(gameState.battle)
      if (newBattle.phase === 'defeat') {
        gameState = {
          scene: 'result',
          battle: null,
          lastResult: 'defeat',
          stats: { turns: newBattle.turn, remainingHp: 0 },
        }
      } else {
        gameState = { ...gameState, battle: newBattle }
      }
      update()
    },
    onRestart: () => {
      gameState = {
        scene: 'title',
        battle: null,
        lastResult: null,
        stats: { turns: 0, remainingHp: 0 },
      }
      update()
    },
    onSelectNode: (nodeId: string) => {
      // TODO: Implement node selection logic
      console.log('Node selected:', nodeId)
    },
  })
}

update()
