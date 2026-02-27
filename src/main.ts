import './style.css'
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
  addMaterialReward,
  craftWeapon,
} from './game/run'
import { getRewardCards } from './game/reward'
import { generateShopOffers } from './game/shop'
import { rollMaterialReward } from './game/materials'
import { restoreHp } from './game/campfire'
import { render } from './ui/renderer'

const app = document.getElementById('app')!

let prevBattle: BattleState | null = null

let gameState: GameState = {
  scene: 'title',
  run: null,
  battle: null,
  rewardCards: [],
  rewardMaterials: {},
  shopOffers: [],
  droppedWeaponId: null,
  lastResult: null,
  stats: { turns: 0, remainingHp: 0 },
}

function update() {
  render(app, gameState, {
    onStartGame: () => {
      const run = createRunState()
      prevBattle = null
      gameState = { ...gameState, scene: 'map', run, rewardMaterials: {}, shopOffers: [], stats: { turns: 0, remainingHp: 0 } }
      update()
    },
    onSelectNode: (nodeId: string) => {
      if (!gameState.run) return
      const node = gameState.run.mapNodes.find(n => n.id === nodeId)
      if (!node) return
      if (!canAccessNode(gameState.run, nodeId)) return

      let newRun = moveToNode(gameState.run, nodeId)

      if (node.type === 'campfire') {
        gameState = { ...gameState, run: newRun, scene: 'campfire' }
        update()
        return
      }
      if (node.type === 'shop') {
        gameState = { ...gameState, run: newRun, scene: 'shop', shopOffers: generateShopOffers() }
        update()
        return
      }
      if (node.type === 'forge') {
        gameState = { ...gameState, run: newRun, scene: 'forge' }
        update()
        return
      }

      if (!node.enemyIds || node.enemyIds.length === 0) return

      // Pass weapon info to battle
      const weaponDefId = newRun.equippedWeapon?.defId ?? undefined
      let battle = createBattleState(node.enemyIds, newRun.deck, weaponDefId, newRun.materials)
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
        let newRun = { ...gameState.run, playerHp: newBattle.player.hp, materials: { ...newBattle.availableMaterials } }
        const currentNode = newRun.mapNodes.find(n => n.id === newRun.currentNodeId)
        if (!currentNode) return
        const goldReward = generateBattleGold(currentNode.type)
        newRun = addBattleGoldReward(newRun, goldReward)
        newRun = applyBattleVictoryRewards(newRun, currentNode.type)

        const rewardCards = getRewardCards(currentNode.type)
        const rewardMaterials = currentNode.type === 'boss_battle' ? {} : rollMaterialReward(currentNode.type)
        if (currentNode.type === 'boss_battle') {
          newRun = addMaterialReward(newRun, rollMaterialReward('boss_battle'))
        }

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
          rewardMaterials,
          droppedWeaponId,
          stats: { turns: newBattle.turn, remainingHp: newBattle.player.hp },
        }
      } else {
        gameState = { ...gameState, battle: newBattle, run: { ...gameState.run!, materials: { ...newBattle.availableMaterials } } }
      }
      update()
    },
    onNormalAttack: (targetIndex?: number) => {
      if (!gameState.battle) return
      prevBattle = gameState.battle
      const newBattle = useNormalAttack(gameState.battle, targetIndex ?? 0)
      if (newBattle.phase === 'victory') {
        if (!gameState.run) return
        let newRun = { ...gameState.run, playerHp: newBattle.player.hp, materials: { ...newBattle.availableMaterials } }
        const currentNode = newRun.mapNodes.find(n => n.id === newRun.currentNodeId)
        if (!currentNode) return
        const goldReward = generateBattleGold(currentNode.type)
        newRun = addBattleGoldReward(newRun, goldReward)
        newRun = applyBattleVictoryRewards(newRun, currentNode.type)

        const rewardCards = getRewardCards(currentNode.type)
        const rewardMaterials = currentNode.type === 'boss_battle' ? {} : rollMaterialReward(currentNode.type)
        if (currentNode.type === 'boss_battle') {
          newRun = addMaterialReward(newRun, rollMaterialReward('boss_battle'))
        }

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
          rewardMaterials,
          droppedWeaponId,
          stats: { turns: newBattle.turn, remainingHp: newBattle.player.hp },
        }
      } else {
        gameState = { ...gameState, battle: newBattle, run: { ...gameState.run!, materials: { ...newBattle.availableMaterials } } }
      }
      update()
    },
    onUseBattleMaterial: (materialId) => {
      if (!gameState.battle || !gameState.run) return
      const nextBattle = useBattleMaterial(gameState.battle, materialId)
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
      const newBattle = endPlayerTurn(gameState.battle)
      if (newBattle.phase === 'defeat') {
        gameState = {
          scene: 'result',
          run: null,
          battle: null,
          rewardCards: [],
          rewardMaterials: {},
          shopOffers: [],
          droppedWeaponId: null,
          lastResult: 'defeat',
          stats: { turns: newBattle.turn, remainingHp: 0 },
        }
      } else if (newBattle.phase === 'victory') {
        if (!gameState.run) return
        let newRun = { ...gameState.run, playerHp: newBattle.player.hp, materials: { ...newBattle.availableMaterials } }
        const currentNode = newRun.mapNodes.find(n => n.id === newRun.currentNodeId)
        if (!currentNode) return
        const goldReward = generateBattleGold(currentNode.type)
        newRun = addBattleGoldReward(newRun, goldReward)
        newRun = applyBattleVictoryRewards(newRun, currentNode.type)

        const rewardCards = getRewardCards(currentNode.type)
        const rewardMaterials = currentNode.type === 'boss_battle' ? {} : rollMaterialReward(currentNode.type)
        if (currentNode.type === 'boss_battle') {
          newRun = addMaterialReward(newRun, rollMaterialReward('boss_battle'))
        }

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
          rewardMaterials,
          droppedWeaponId,
          stats: { turns: newBattle.turn, remainingHp: newBattle.player.hp },
        }
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
      let newRun = addCardToDeck(gameState.run, cardId)
      newRun = completeNode(newRun, newRun.currentNodeId)
      if (isBossNode(newRun)) {
        gameState = {
          scene: 'result',
          run: null,
          battle: null,
          rewardCards: [],
          rewardMaterials: {},
          shopOffers: [],
          droppedWeaponId: null,
          lastResult: 'victory',
          stats: gameState.stats,
        }
      } else {
        gameState = { ...gameState, run: newRun, scene: 'map', rewardCards: [], rewardMaterials: {}, shopOffers: [], droppedWeaponId: null }
      }
      update()
    },
    onSkipReward: () => {
      if (!gameState.run) return
      let newRun = completeNode(gameState.run, gameState.run.currentNodeId)
      if (isBossNode(newRun)) {
        gameState = {
          scene: 'result',
          run: null,
          battle: null,
          rewardCards: [],
          rewardMaterials: {},
          shopOffers: [],
          droppedWeaponId: null,
          lastResult: 'victory',
          stats: gameState.stats,
        }
      } else {
        gameState = { ...gameState, run: newRun, scene: 'map', rewardCards: [], rewardMaterials: {}, shopOffers: [], droppedWeaponId: null }
      }
      update()
    },
    onSelectMaterialReward: () => {
      if (!gameState.run) return
      let newRun = addMaterialReward(gameState.run, gameState.rewardMaterials)
      newRun = completeNode(newRun, newRun.currentNodeId)
      if (isBossNode(newRun)) {
        gameState = {
          scene: 'result',
          run: null,
          battle: null,
          rewardCards: [],
          rewardMaterials: {},
          shopOffers: [],
          droppedWeaponId: null,
          lastResult: 'victory',
          stats: gameState.stats,
        }
      } else {
        gameState = { ...gameState, run: newRun, scene: 'map', rewardCards: [], rewardMaterials: {}, shopOffers: [], droppedWeaponId: null }
      }
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
        rewardMaterials: {},
        shopOffers: [],
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
    onShopBuyCard: (index: number) => {
      if (!gameState.run) return
      const offer = gameState.shopOffers[index]
      if (!offer || offer.sold || gameState.run.gold < offer.price) return
      let newRun = { ...gameState.run, gold: gameState.run.gold - offer.price }
      newRun = addCardToDeck(newRun, offer.cardId)
      const nextOffers = gameState.shopOffers.map((o, i) => (i === index ? { ...o, sold: true } : o))
      gameState = { ...gameState, run: newRun, shopOffers: nextOffers }
      update()
    },
    onShopHeal: () => {
      if (!gameState.run) return
      const newRun = healInShop(gameState.run)
      gameState = { ...gameState, run: newRun }
      update()
    },
    onShopRemoveCard: (cardUid: string) => {
      if (!gameState.run) return
      const newRun = removeCardFromDeck(gameState.run, cardUid)
      gameState = { ...gameState, run: newRun }
      update()
    },
    onShopLeave: () => {
      if (!gameState.run) return
      let newRun = completeNode(gameState.run, gameState.run.currentNodeId)
      gameState = { ...gameState, run: newRun, scene: 'map', shopOffers: [] }
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
      const newRun = equipWeapon(gameState.run, weaponUid)
      gameState = { ...gameState, run: newRun }
      update()
    },
    onForgeCraft: (recipeId: string) => {
      if (!gameState.run) return
      const newRun = craftWeapon(gameState.run, recipeId)
      gameState = { ...gameState, run: newRun }
      update()
    },
    onForgeLeave: () => {
      if (!gameState.run) return
      const newRun = completeNode(gameState.run, gameState.run.currentNodeId)
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
