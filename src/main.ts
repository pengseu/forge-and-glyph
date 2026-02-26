import './style.css'
import type { GameState, BattleState } from './game/types'
import { createBattleState, startTurn, playCard, endPlayerTurn } from './game/combat'
import { createRunState, moveToNode, completeNode, addCardToDeck, addWeaponToInventory, equipWeapon, upgradeEquippedWeapon } from './game/run'
import { getRewardCards } from './game/reward'
import { restoreHp } from './game/campfire'
import { render } from './ui/renderer'

const app = document.getElementById('app')!

let prevBattle: BattleState | null = null

let gameState: GameState = {
  scene: 'title',
  run: null,
  battle: null,
  rewardCards: [],
  droppedWeaponId: null,
  lastResult: null,
  stats: { turns: 0, remainingHp: 0 },
}

function update() {
  render(app, gameState, {
    onStartGame: () => {
      const run = createRunState()
      prevBattle = null
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

      if (!node.enemyIds || node.enemyIds.length === 0) return

      // Pass weapon info to battle
      const weaponDefId = newRun.equippedWeapon?.defId ?? undefined
      let battle = createBattleState(node.enemyIds, newRun.deck, weaponDefId)
      battle = {
        ...battle,
        player: {
          ...battle.player,
          hp: newRun.playerHp,
          maxHp: newRun.playerMaxHp,
        },
      }
      battle = startTurn(battle)

      gameState = { ...gameState, run: newRun, scene: 'battle', battle }
      update()
    },
    onPlayCard: (cardUid: string, targetIndex?: number) => {
      if (!gameState.battle) return
      prevBattle = gameState.battle
      const newBattle = playCard(gameState.battle, cardUid, targetIndex ?? 0)
      if (newBattle.phase === 'victory') {
        if (!gameState.run) return
        let newRun = { ...gameState.run, playerHp: newBattle.player.hp }
        const currentNode = newRun.mapNodes.find(n => n.id === newRun.currentNodeId)
        if (!currentNode) return

        const rewardCards = getRewardCards(currentNode.type)

        let droppedWeaponId: string | null = null
        const hasLongsword = newRun.weaponInventory.some(w => w.defId === 'longsword' || w.defId === 'longsword_upgraded')
        if (!hasLongsword && Math.random() < 0.3) {
          droppedWeaponId = 'longsword'
        }

        gameState = {
          ...gameState,
          run: newRun,
          battle: null,
          scene: 'reward',
          rewardCards,
          droppedWeaponId,
        }
      } else {
        gameState = { ...gameState, battle: newBattle }
      }
      update()
    },
    onEndTurn: () => {
      if (!gameState.battle) return
      prevBattle = gameState.battle
      const newBattle = endPlayerTurn(gameState.battle)
      if (newBattle.phase === 'defeat') {
        gameState = {
          scene: 'result',
          run: null,
          battle: null,
          rewardCards: [],
          droppedWeaponId: null,
          lastResult: 'defeat',
          stats: { turns: newBattle.turn, remainingHp: 0 },
        }
      } else if (newBattle.phase === 'victory') {
        if (!gameState.run) return
        let newRun = { ...gameState.run, playerHp: newBattle.player.hp }
        const currentNode = newRun.mapNodes.find(n => n.id === newRun.currentNodeId)
        if (!currentNode) return

        const rewardCards = getRewardCards(currentNode.type)

        let droppedWeaponId: string | null = null
        const hasLongsword = newRun.weaponInventory.some(w => w.defId === 'longsword' || w.defId === 'longsword_upgraded')
        if (!hasLongsword && Math.random() < 0.3) {
          droppedWeaponId = 'longsword'
        }

        gameState = {
          ...gameState,
          run: newRun,
          battle: null,
          scene: 'reward',
          rewardCards,
          droppedWeaponId,
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
      gameState = { ...gameState, run: newRun, scene: 'map', rewardCards: [], droppedWeaponId: null }
      update()
    },
    onSkipReward: () => {
      if (!gameState.run) return
      let newRun = completeNode(gameState.run, gameState.run.currentNodeId)
      gameState = { ...gameState, run: newRun, scene: 'map', rewardCards: [], droppedWeaponId: null }
      update()
    },
    onEquipWeapon: (weaponDefId: string) => {
      if (!gameState.run) return
      let newRun = addWeaponToInventory(gameState.run, weaponDefId)
      const newWeapon = newRun.weaponInventory[newRun.weaponInventory.length - 1]
      newRun = equipWeapon(newRun, newWeapon.uid)
      gameState = { ...gameState, run: newRun, droppedWeaponId: null }
      update()
    },
    onRestart: () => {
      gameState = {
        scene: 'title',
        run: null,
        battle: null,
        rewardCards: [],
        droppedWeaponId: null,
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
    onCampfireUpgradeCard: (cardUid: string) => {
      if (!gameState.run) return
      const newDeck = gameState.run.deck.map(c =>
        c.uid === cardUid ? { ...c, upgraded: true } : c
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
  }, prevBattle)
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
