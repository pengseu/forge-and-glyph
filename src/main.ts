import './style.css'
import type { GameState } from './game/types'
import { createBattleState, startTurn, playCard, endPlayerTurn } from './game/combat'
import { createRunState, moveToNode, completeNode, addCardToDeck } from './game/run'
import { getRewardCards } from './game/reward'
import { getEnemyDef } from './game/enemies'
import { render } from './ui/renderer'

const app = document.getElementById('app')!

let gameState: GameState = {
  scene: 'title',
  run: null,
  battle: null,
  rewardCards: [],
  lastResult: null,
  stats: { turns: 0, remainingHp: 0 },
}

function update() {
  render(app, gameState, {
    onStartGame: () => {
      const run = createRunState()
      gameState = { ...gameState, scene: 'map', run }
      update()
    },
    onSelectNode: (nodeId: string) => {
      if (!gameState.run) return
      const node = gameState.run.mapNodes.find(n => n.id === nodeId)
      if (!node) return

      // Move to node
      let newRun = moveToNode(gameState.run, nodeId)

      // Enter battle
      let battle = createBattleState()
      const enemyDef = getEnemyDef(node.enemyId)
      battle = {
        ...battle,
        enemy: {
          ...battle.enemy,
          defId: node.enemyId,
          hp: enemyDef.maxHp,
          maxHp: enemyDef.maxHp,
        },
      }
      battle = startTurn(battle)

      gameState = { ...gameState, run: newRun, scene: 'battle', battle }
      update()
    },
    onPlayCard: (cardUid: string) => {
      if (!gameState.battle) return
      const newBattle = playCard(gameState.battle, cardUid)
      if (newBattle.phase === 'victory') {
        // Battle victory, show reward selection
        if (!gameState.run) return
        const currentNode = gameState.run.mapNodes.find(n => n.id === gameState.run!.currentNodeId)
        if (!currentNode) return

        const rewardCards = getRewardCards(currentNode.type)
        gameState = {
          ...gameState,
          battle: null,
          scene: 'reward',
          rewardCards,
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
          run: null,
          battle: null,
          rewardCards: [],
          lastResult: 'defeat',
          stats: { turns: newBattle.turn, remainingHp: 0 },
        }
      } else {
        gameState = { ...gameState, battle: newBattle }
      }
      update()
    },
    onSelectCard: (cardId: string) => {
      if (!gameState.run) return
      let newRun = addCardToDeck(gameState.run, cardId)
      newRun = completeNode(newRun, newRun.currentNodeId)
      gameState = { ...gameState, run: newRun, scene: 'map', rewardCards: [] }
      update()
    },
    onSkipReward: () => {
      if (!gameState.run) return
      let newRun = completeNode(gameState.run, gameState.run.currentNodeId)
      gameState = { ...gameState, run: newRun, scene: 'map', rewardCards: [] }
      update()
    },
    onRestart: () => {
      gameState = {
        scene: 'title',
        run: null,
        battle: null,
        rewardCards: [],
        lastResult: null,
        stats: { turns: 0, remainingHp: 0 },
      }
      update()
    },
  })
}

update()
