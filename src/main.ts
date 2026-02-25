import './style.css'
import type { GameState } from './game/types'
import { createBattleState, startTurn, playCard, endPlayerTurn } from './game/combat'
import { createRunState, moveToNode, completeNode, addCardToDeck, upgradeEquippedWeapon } from './game/run'
import { getRewardCards } from './game/reward'
import { getEnemyDef } from './game/enemies'
import { restoreHp } from './game/campfire'
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

      let newRun = moveToNode(gameState.run, nodeId)

      if (node.type === 'campfire') {
        gameState = { ...gameState, run: newRun, scene: 'campfire' }
        update()
        return
      }

      if (!node.enemyId) return

      // Pass weapon info to battle
      const weaponDefId = newRun.equippedWeapon?.defId ?? undefined
      let battle = createBattleState(newRun.deck, weaponDefId)
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
        if (!gameState.run) return
        // Sync HP to RunState
        let newRun = { ...gameState.run, playerHp: newBattle.player.hp }
        const currentNode = newRun.mapNodes.find(n => n.id === newRun.currentNodeId)
        if (!currentNode) return

        const rewardCards = getRewardCards(currentNode.type)
        gameState = {
          ...gameState,
          run: newRun,
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
        gameState = { ...gameState, battle: newBattle, run: { ...gameState.run!, playerHp: newBattle.player.hp } }
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
    onCampfireHeal: () => {
      if (!gameState.run) return
      const { hp } = restoreHp(gameState.run, gameState.run.playerHp, gameState.run.playerMaxHp)
      const newRun = { ...gameState.run, playerHp: hp }
      gameState = { ...gameState, run: newRun }
      update()
    },
    onCampfireUpgradeCard: (cardUid: string, upgradeType: 'damage' | 'cost') => {
      if (!gameState.run) return
      const newDeck = gameState.run.deck.map(c =>
        c.uid === cardUid ? { ...c, upgraded: upgradeType } : c
      )
      const newRun = { ...gameState.run, deck: newDeck }
      gameState = { ...gameState, run: newRun }
      update()
    },
    onCampfireUpgradeWeapon: () => {
      if (!gameState.run) return
      const newRun = upgradeEquippedWeapon(gameState.run)
      gameState = { ...gameState, run: newRun }
      update()
    },
    onCampfireContinue: () => {
      if (!gameState.run) return
      let newRun = completeNode(gameState.run, gameState.run.currentNodeId)
      gameState = { ...gameState, run: newRun, scene: 'map' }
      update()
    },
  })
}

update()
