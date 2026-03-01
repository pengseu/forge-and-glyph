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
  enchantWeapon,
} from './game/run'
import { getRewardCards } from './game/reward'
import { generateShopOffers } from './game/shop'
import { rollMaterialReward } from './game/materials'
import { restoreHp } from './game/campfire'
import { rollEvent, resolveEventOption } from './game/events'
import { getEnemyDef } from './game/enemies'
import { getEffectiveCardDef } from './game/campfire'
import { render } from './ui/renderer'

const app = document.getElementById('app')!

let prevBattle: BattleState | null = null

let gameState: GameState = {
  scene: 'title',
  run: null,
  battle: null,
  currentEvent: null,
  rewardCards: [],
  rewardMaterials: {},
  shopOffers: [],
  droppedWeaponId: null,
  lastResult: null,
  stats: { turns: 0, remainingHp: 0, runReport: null, finalSnapshot: null },
}

function initRunReport(): NonNullable<GameState['stats']['runReport']> {
  return {
    startedAt: Date.now(),
    path: [],
    battles: [],
    logs: [],
  }
}

function pushGlobalLog(message: string): void {
  if (!gameState.stats.runReport) return
  gameState.stats.runReport.logs.push(`${new Date().toLocaleTimeString()} ${message}`)
}

function pushPath(nodeId: string, nodeType: import('./game/types').NodeType): void {
  if (!gameState.stats.runReport) return
  gameState.stats.runReport.path.push({ nodeId, nodeType, at: Date.now() })
}

function beginBattleReport(nodeId: string, nodeType: import('./game/types').NodeType, enemyIds: string[]): void {
  if (!gameState.stats.runReport) return
  gameState.stats.runReport.battles.push({
    nodeId,
    nodeType,
    enemyIds: [...enemyIds],
    startedAt: Date.now(),
    turns: 0,
    logs: [{ at: Date.now(), turn: 0, actor: 'system', message: `遭遇敌人：${enemyIds.map(id => getEnemyDef(id).name).join('、')}` }],
  })
}

function activeBattleReport(): NonNullable<GameState['stats']['runReport']>['battles'][number] | null {
  const report = gameState.stats.runReport
  if (!report || report.battles.length === 0) return null
  return report.battles[report.battles.length - 1]
}

function pushBattleLog(actor: 'player' | 'enemy' | 'system', turn: number, message: string): void {
  const report = activeBattleReport()
  if (!report) return
  report.logs.push({ at: Date.now(), turn, actor, message })
}

function closeBattleReport(result: 'victory' | 'defeat', turns: number): void {
  const report = activeBattleReport()
  if (!report) return
  report.result = result
  report.turns = turns
  report.endedAt = Date.now()
}

function finalizeRun(result: 'victory' | 'defeat', runLike: import('./game/types').RunState | null, remainingHp: number): void {
  if (!gameState.stats.runReport) return
  gameState.stats.runReport.endedAt = Date.now()
  gameState.stats.runReport.durationSec = Math.max(1, Math.floor((gameState.stats.runReport.endedAt - gameState.stats.runReport.startedAt) / 1000))
  if (runLike) {
    gameState.stats.finalSnapshot = {
      gold: runLike.gold,
      playerHp: remainingHp,
      playerMaxHp: runLike.playerMaxHp,
      deckSize: runLike.deck.length,
      materials: { ...runLike.materials },
      weapons: runLike.weaponInventory.map(w => ({ defId: w.defId, enchantments: [...w.enchantments] })),
    }
  } else {
    gameState.stats.finalSnapshot = null
  }
  pushGlobalLog(`本局结束：${result === 'victory' ? '胜利' : '失败'}`)
}

function logBattleDiff(prev: BattleState, next: BattleState): void {
  if (prev.player.hp !== next.player.hp) {
    pushBattleLog('system', next.turn, `玩家HP ${prev.player.hp} -> ${next.player.hp}`)
  }
  if (prev.player.armor !== next.player.armor) {
    pushBattleLog('system', next.turn, `玩家护甲 ${prev.player.armor} -> ${next.player.armor}`)
  }
  for (let i = 0; i < next.enemies.length; i++) {
    const before = prev.enemies[i]
    const after = next.enemies[i]
    if (!before || !after) continue
    const name = getEnemyDef(after.defId).name
    if (before.hp !== after.hp) {
      pushBattleLog('system', next.turn, `${name} HP ${before.hp} -> ${after.hp}`)
    }
    if (before.armor !== after.armor) {
      pushBattleLog('system', next.turn, `${name} 护甲 ${before.armor} -> ${after.armor}`)
    }
    if (before.burn !== after.burn) {
      pushBattleLog('system', next.turn, `${name} 灼烧 ${before.burn} -> ${after.burn}`)
    }
    if (before.poison !== after.poison) {
      pushBattleLog('system', next.turn, `${name} 中毒 ${before.poison} -> ${after.poison}`)
    }
    if (before.freeze !== after.freeze) {
      pushBattleLog('system', next.turn, `${name} 冻结 ${before.freeze} -> ${after.freeze}`)
    }
  }
}

function update() {
  render(app, gameState, {
    onStartGame: () => {
      const run = createRunState()
      prevBattle = null
      gameState = {
        ...gameState,
        scene: 'map',
        run,
        currentEvent: null,
        rewardMaterials: {},
        shopOffers: [],
        stats: { turns: 0, remainingHp: 0, runReport: initRunReport(), finalSnapshot: null },
      }
      pushGlobalLog('开始新的一局冒险')
      update()
    },
    onSelectNode: (nodeId: string) => {
      if (!gameState.run) return
      const node = gameState.run.mapNodes.find(n => n.id === nodeId)
      if (!node) return
      if (!canAccessNode(gameState.run, nodeId)) return

      let newRun = moveToNode(gameState.run, nodeId)
      pushPath(node.id, node.type)
      pushGlobalLog(`进入节点 ${node.id} (${node.type})`)

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
      if (node.type === 'enchant') {
        gameState = { ...gameState, run: newRun, scene: 'enchant' }
        update()
        return
      }
      if (node.type === 'event') {
        gameState = { ...gameState, run: newRun, scene: 'event', currentEvent: rollEvent() }
        update()
        return
      }

      if (!node.enemyIds || node.enemyIds.length === 0) return

      // Pass weapon info to battle
      const weaponDefId = newRun.equippedWeapon?.defId ?? undefined
      const weaponEnchantments = newRun.equippedWeapon?.enchantments ?? []
      let battle = createBattleState(node.enemyIds, newRun.deck, weaponDefId, newRun.materials, weaponEnchantments)
      battle = {
        ...battle,
        player: {
          ...battle.player,
          hp: newRun.playerHp,
          maxHp: newRun.playerMaxHp,
        },
      }
      battle = startTurn(battle)
      beginBattleReport(node.id, node.type, node.enemyIds)
      pushBattleLog('system', battle.turn, `战斗开始，玩家 HP ${battle.player.hp}/${battle.player.maxHp}`)

      gameState = { ...gameState, run: newRun, scene: 'battle', battle }
      update()
    },
    onPlayCard: (cardUid: string, targetIndex?: number) => {
      if (!gameState.battle) return
      prevBattle = gameState.battle
      const playedCard = gameState.battle.player.hand.find(c => c.uid === cardUid)
      if (playedCard) {
        const def = getEffectiveCardDef(playedCard)
        pushBattleLog('player', gameState.battle.turn, `打出卡牌【${def.name}】目标#${targetIndex ?? 0}`)
      }
      const newBattle = playCard(gameState.battle, cardUid, targetIndex ?? 0)
      logBattleDiff(gameState.battle, newBattle)
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
        closeBattleReport('victory', newBattle.turn)
        pushGlobalLog(`战斗胜利：${currentNode.id}，${newBattle.turn} 回合`)

        gameState = {
          ...gameState,
          run: newRun,
          battle: null,
          currentEvent: null,
          scene: 'reward',
          rewardCards,
          rewardMaterials,
          droppedWeaponId,
          stats: { ...gameState.stats, turns: newBattle.turn, remainingHp: newBattle.player.hp },
        }
      } else {
        gameState = { ...gameState, battle: newBattle, run: { ...gameState.run!, materials: { ...newBattle.availableMaterials } } }
      }
      update()
    },
    onNormalAttack: (targetIndex?: number) => {
      if (!gameState.battle) return
      prevBattle = gameState.battle
      pushBattleLog('player', gameState.battle.turn, `使用普攻，目标#${targetIndex ?? 0}`)
      const newBattle = useNormalAttack(gameState.battle, targetIndex ?? 0)
      logBattleDiff(gameState.battle, newBattle)
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
        closeBattleReport('victory', newBattle.turn)
        pushGlobalLog(`战斗胜利：${currentNode.id}，${newBattle.turn} 回合`)

        gameState = {
          ...gameState,
          run: newRun,
          battle: null,
          currentEvent: null,
          scene: 'reward',
          rewardCards,
          rewardMaterials,
          droppedWeaponId,
          stats: { ...gameState.stats, turns: newBattle.turn, remainingHp: newBattle.player.hp },
        }
      } else {
        gameState = { ...gameState, battle: newBattle, run: { ...gameState.run!, materials: { ...newBattle.availableMaterials } } }
      }
      update()
    },
    onUseBattleMaterial: (materialId) => {
      if (!gameState.battle || !gameState.run) return
      pushBattleLog('player', gameState.battle.turn, `使用材料【${materialId}】`)
      const nextBattle = useBattleMaterial(gameState.battle, materialId)
      logBattleDiff(gameState.battle, nextBattle)
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
      pushBattleLog('player', gameState.battle.turn, '结束回合')
      const newBattle = endPlayerTurn(gameState.battle)
      logBattleDiff(gameState.battle, newBattle)
      if (newBattle.phase === 'defeat') {
        closeBattleReport('defeat', newBattle.turn)
        pushGlobalLog(`战斗失败：${gameState.run?.currentNodeId ?? 'unknown'}，${newBattle.turn} 回合`)
        finalizeRun('defeat', gameState.run, 0)
        gameState = {
          scene: 'result',
          run: null,
          battle: null,
          currentEvent: null,
          rewardCards: [],
          rewardMaterials: {},
          shopOffers: [],
          droppedWeaponId: null,
          lastResult: 'defeat',
          stats: { ...gameState.stats, turns: newBattle.turn, remainingHp: 0 },
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
        closeBattleReport('victory', newBattle.turn)
        pushGlobalLog(`战斗胜利：${currentNode.id}，${newBattle.turn} 回合`)

        gameState = {
          ...gameState,
          run: newRun,
          battle: null,
          currentEvent: null,
          scene: 'reward',
          rewardCards,
          rewardMaterials,
          droppedWeaponId,
          stats: { ...gameState.stats, turns: newBattle.turn, remainingHp: newBattle.player.hp },
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
      const picked = cardId
      let newRun = addCardToDeck(gameState.run, cardId)
      pushGlobalLog(`奖励选卡：${picked}`)
      newRun = completeNode(newRun, newRun.currentNodeId)
      if (isBossNode(newRun)) {
        finalizeRun('victory', newRun, gameState.stats.remainingHp)
        gameState = {
          scene: 'result',
          run: null,
          battle: null,
          currentEvent: null,
          rewardCards: [],
          rewardMaterials: {},
          shopOffers: [],
          droppedWeaponId: null,
          lastResult: 'victory',
          stats: { ...gameState.stats },
        }
      } else {
        gameState = { ...gameState, run: newRun, scene: 'map', rewardCards: [], rewardMaterials: {}, shopOffers: [], droppedWeaponId: null }
      }
      update()
    },
    onSkipReward: () => {
      if (!gameState.run) return
      pushGlobalLog('跳过奖励')
      let newRun = completeNode(gameState.run, gameState.run.currentNodeId)
      if (isBossNode(newRun)) {
        finalizeRun('victory', newRun, gameState.stats.remainingHp)
        gameState = {
          scene: 'result',
          run: null,
          battle: null,
          currentEvent: null,
          rewardCards: [],
          rewardMaterials: {},
          shopOffers: [],
          droppedWeaponId: null,
          lastResult: 'victory',
          stats: { ...gameState.stats },
        }
      } else {
        gameState = { ...gameState, run: newRun, scene: 'map', rewardCards: [], rewardMaterials: {}, shopOffers: [], droppedWeaponId: null }
      }
      update()
    },
    onSelectMaterialReward: () => {
      if (!gameState.run) return
      pushGlobalLog('选择材料奖励')
      let newRun = addMaterialReward(gameState.run, gameState.rewardMaterials)
      newRun = completeNode(newRun, newRun.currentNodeId)
      if (isBossNode(newRun)) {
        finalizeRun('victory', newRun, gameState.stats.remainingHp)
        gameState = {
          scene: 'result',
          run: null,
          battle: null,
          currentEvent: null,
          rewardCards: [],
          rewardMaterials: {},
          shopOffers: [],
          droppedWeaponId: null,
          lastResult: 'victory',
          stats: { ...gameState.stats },
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
        currentEvent: null,
        rewardCards: [],
        rewardMaterials: {},
        shopOffers: [],
        droppedWeaponId: null,
        lastResult: null,
        stats: { turns: 0, remainingHp: 0, runReport: null, finalSnapshot: null },
      }
      update()
    },
    onCampfireHeal: () => {
      if (!gameState.run) return
      pushGlobalLog('篝火：回血')
      const { hp } = restoreHp(gameState.run, gameState.run.playerHp, gameState.run.playerMaxHp)
      let newRun = { ...gameState.run, playerHp: hp }
      newRun = completeNode(newRun, newRun.currentNodeId)
      gameState = { ...gameState, run: newRun, scene: 'map' }
      update()
    },
    onCampfireUpgradeCard: (cardUid: string) => {
      if (!gameState.run) return
      pushGlobalLog(`篝火：升级卡牌 ${cardUid}`)
      const newDeck = gameState.run.deck.map(c =>
        c.uid === cardUid ? { ...c, upgraded: true } : c
      )
      let newRun = { ...gameState.run, deck: newDeck }
      newRun = completeNode(newRun, newRun.currentNodeId)
      gameState = { ...gameState, run: newRun, scene: 'map' }
      update()
    },
    onCampfireUpgradeWeapon: () => {
      if (!gameState.run) return
      pushGlobalLog('篝火：升级武器')
      let newRun = upgradeEquippedWeapon(gameState.run)
      newRun = completeNode(newRun, newRun.currentNodeId)
      gameState = { ...gameState, run: newRun, scene: 'map' }
      update()
    },
    onCampfireContinue: () => {
      if (!gameState.run) return
      pushGlobalLog('篝火：继续旅程')
      let newRun = completeNode(gameState.run, gameState.run.currentNodeId)
      gameState = { ...gameState, run: newRun, scene: 'map' }
      update()
    },
    onShopBuyCard: (index: number) => {
      if (!gameState.run) return
      const offer = gameState.shopOffers[index]
      if (!offer || offer.sold || gameState.run.gold < offer.price) return
      pushGlobalLog(`商店：购买卡牌 ${offer.cardId} (${offer.price}G)`)
      let newRun = { ...gameState.run, gold: gameState.run.gold - offer.price }
      newRun = addCardToDeck(newRun, offer.cardId)
      const nextOffers = gameState.shopOffers.map((o, i) => (i === index ? { ...o, sold: true } : o))
      gameState = { ...gameState, run: newRun, shopOffers: nextOffers }
      update()
    },
    onShopHeal: () => {
      if (!gameState.run) return
      pushGlobalLog('商店：购买治疗')
      const newRun = healInShop(gameState.run)
      gameState = { ...gameState, run: newRun }
      update()
    },
    onShopRemoveCard: (cardUid: string) => {
      if (!gameState.run) return
      pushGlobalLog(`商店：移除卡牌 ${cardUid}`)
      const newRun = removeCardFromDeck(gameState.run, cardUid)
      gameState = { ...gameState, run: newRun }
      update()
    },
    onShopLeave: () => {
      if (!gameState.run) return
      pushGlobalLog('离开商店')
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
      pushGlobalLog(`背包：装备武器 ${weaponUid}`)
      const newRun = equipWeapon(gameState.run, weaponUid)
      gameState = { ...gameState, run: newRun }
      update()
    },
    onForgeCraft: (recipeId: string) => {
      if (!gameState.run) return
      pushGlobalLog(`铁匠：锻造 ${recipeId}`)
      const newRun = craftWeapon(gameState.run, recipeId)
      gameState = { ...gameState, run: newRun }
      update()
    },
    onForgeLeave: () => {
      if (!gameState.run) return
      pushGlobalLog('离开铁匠')
      const newRun = completeNode(gameState.run, gameState.run.currentNodeId)
      gameState = { ...gameState, run: newRun, scene: 'map' }
      update()
    },
    onEnchantApply: (enchantmentId, replaceIndex) => {
      if (!gameState.run) return
      pushGlobalLog(`附魔：${enchantmentId}${replaceIndex !== undefined ? ` (覆盖槽位 ${replaceIndex + 1})` : ''}`)
      const newRun = enchantWeapon(gameState.run, enchantmentId, replaceIndex)
      gameState = { ...gameState, run: newRun }
      update()
    },
    onEnchantLeave: () => {
      if (!gameState.run) return
      pushGlobalLog('离开附魔台')
      const newRun = completeNode(gameState.run, gameState.run.currentNodeId)
      gameState = { ...gameState, run: newRun, scene: 'map' }
      update()
    },
    onEventChoose: (optionId) => {
      if (!gameState.run || !gameState.currentEvent) return
      pushGlobalLog(`事件【${gameState.currentEvent.title}】选择：${optionId}`)
      const resolved = resolveEventOption(gameState.run, gameState.currentEvent, optionId)
      let nextRun = resolved.run
      if (resolved.triggerBattleEnemyIds && resolved.triggerBattleEnemyIds.length > 0) {
        const weaponDefId = nextRun.equippedWeapon?.defId ?? undefined
        const weaponEnchantments = nextRun.equippedWeapon?.enchantments ?? []
        let battle = createBattleState(
          resolved.triggerBattleEnemyIds,
          nextRun.deck,
          weaponDefId,
          nextRun.materials,
          weaponEnchantments,
        )
        battle = {
          ...battle,
          player: {
            ...battle.player,
            hp: nextRun.playerHp,
            maxHp: nextRun.playerMaxHp,
          },
        }
        battle = startTurn(battle)
        beginBattleReport(nextRun.currentNodeId, 'event', resolved.triggerBattleEnemyIds)
        pushBattleLog('system', battle.turn, `事件战斗开始，玩家 HP ${battle.player.hp}/${battle.player.maxHp}`)
        gameState = { ...gameState, run: nextRun, battle, currentEvent: null, scene: 'battle' }
        update()
        return
      }

      nextRun = completeNode(nextRun, nextRun.currentNodeId)
      gameState = { ...gameState, run: nextRun, currentEvent: null, scene: 'map' }
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
