import {
  canPlayCard,
  canUseNormalAttack,
  createBattleState,
  endPlayerTurn,
  playCard,
  startTurn,
  useNormalAttack,
} from './combat'
import { getCardDef } from './cards'
import { applyIntermissionChoice, advanceToNextAct } from './act'
import { createSeededRng } from './rng'
import {
  addBattleGoldReward,
  addCardToDeck,
  addMaterialReward,
  addWeaponToInventory,
  applyBattleVictoryRewards,
  canAccessNode,
  completeNode,
  createRunState,
  equipWeapon,
  generateBattleGold,
  moveToNode,
} from './run'
import { getRewardCardsByAct } from './reward'
import { rollMaterialRewardByAct } from './materials'
import type { BattleState, MapNode, RunState } from './types'

export interface SimulationOptions {
  runs: number
  baseSeed?: number
  maxBattleTurns?: number
}

export interface SimulationRunResult {
  seed: number
  victory: boolean
  turns: number
  durationSec: number
  endingAct: 1 | 2 | 3
  finalHp: number
  deckSize: number
  gold: number
}

export interface SimulationSummary {
  runs: number
  wins: number
  winRate: number
  avgTurns: number
  avgDurationSec: number
  avgDeckSize: number
  avgGold: number
  results: SimulationRunResult[]
}

function firstAliveEnemyIndex(battle: BattleState): number {
  return battle.enemies.findIndex((e) => e.hp > 0)
}

function autoPlayBattle(
  run: RunState,
  enemyIds: string[],
  rng: () => number,
  maxBattleTurns: number,
): { victory: boolean; turns: number; run: RunState } {
  const weaponDefId = run.equippedWeapon?.defId
  const weaponEnchantments = run.equippedWeapon?.enchantments ?? []
  let battle = createBattleState(enemyIds, run.deck, weaponDefId, run.materials, weaponEnchantments)
  battle = {
    ...battle,
    player: {
      ...battle.player,
      hp: run.playerHp,
      maxHp: run.playerMaxHp,
    },
  }
  battle = startTurn(battle)

  while (battle.phase !== 'victory' && battle.phase !== 'defeat' && battle.turn <= maxBattleTurns) {
    if (battle.phase !== 'player_turn') {
      battle = endPlayerTurn(battle)
      continue
    }

    let actionTaken = false
    while (battle.phase === 'player_turn') {
      const target = firstAliveEnemyIndex(battle)
      if (target < 0) break
      const playable = battle.player.hand
        .filter((c) => canPlayCard(battle, c.uid))
        .sort((a, b) => getCardDef(b.defId).cost - getCardDef(a.defId).cost)
      if (playable.length > 0) {
        const pickIdx = Math.min(playable.length - 1, Math.floor(rng() * playable.length))
        battle = playCard(battle, playable[pickIdx].uid, target)
        actionTaken = true
        continue
      }
      if (canUseNormalAttack(battle)) {
        battle = useNormalAttack(battle, target)
        actionTaken = true
        continue
      }
      break
    }

    if (battle.phase === 'player_turn') {
      battle = endPlayerTurn(battle)
      actionTaken = true
    }
    if (!actionTaken) break
  }

  const nextRun = {
    ...run,
    playerHp: Math.max(0, battle.player.hp),
    materials: { ...battle.availableMaterials },
  }
  return { victory: battle.phase === 'victory', turns: battle.turn, run: nextRun }
}

function chooseNextNode(run: RunState, current: MapNode, rng: () => number): string | null {
  const candidates = current.connections
    .filter((id) => canAccessNode({ ...run, mapNodes: run.mapNodes.map((n) => (n.id === current.id ? { ...n, completed: true } : n)) }, id))
    .map((id) => run.mapNodes.find((n) => n.id === id))
    .filter((n): n is MapNode => !!n)
  if (candidates.length === 0) return null
  const weighted = candidates.sort((a, b) => {
    const score = (node: MapNode) =>
      node.type === 'boss_battle' ? 100
        : node.type === 'elite_battle' ? 80
          : node.type === 'normal_battle' ? 60
            : node.type === 'trial' ? 55
              : node.type === 'campfire' ? 50
                : 40
    return score(b) - score(a)
  })
  const idx = Math.min(weighted.length - 1, Math.floor(rng() * Math.min(2, weighted.length)))
  return weighted[idx].id
}

export function simulateSingleRun(seed: number, maxBattleTurns: number = 40): SimulationRunResult {
  const seeded = createSeededRng(seed)
  const prevRandom = Math.random
  Math.random = seeded.next
  try {
    let run = createRunState({ unlockedBlueprints: [], blueprintMastery: {}, legacyWeaponDefId: null }, seeded.next)
    run = addWeaponToInventory(run, seeded.chance(0.5) ? 'iron_longsword' : 'iron_staff')
    run = equipWeapon(run, run.weaponInventory[0].uid)
    let totalTurns = 0
    let victory = false
    let guard = 0

    while (guard++ < 300) {
      const current = run.mapNodes.find((n) => n.id === run.currentNodeId)
      if (!current) break

      if (current.enemyIds && current.enemyIds.length > 0) {
        const battleResult = autoPlayBattle(run, current.enemyIds, seeded.next, maxBattleTurns)
        run = battleResult.run
        totalTurns += battleResult.turns
        if (!battleResult.victory) {
          victory = false
          break
        }
        run = addBattleGoldReward(run, generateBattleGold(current.type, seeded.next))
        run = applyBattleVictoryRewards(run, current.type)
        const reward = getRewardCardsByAct(current.type, run.act, seeded.next)[0]
        if (reward) run = addCardToDeck(run, reward.id, seeded.next)
        if (current.type === 'boss_battle') {
          run = addMaterialReward(run, rollMaterialRewardByAct('boss_battle', run.act, seeded.next))
        } else {
          run = addMaterialReward(run, rollMaterialRewardByAct(current.type, run.act, seeded.next))
        }
      } else if (current.type === 'campfire') {
        run = { ...run, playerHp: Math.min(run.playerMaxHp, run.playerHp + Math.floor(run.playerMaxHp * 0.25)) }
      } else if (current.type === 'shop') {
        run = { ...run, gold: Math.max(0, run.gold - 25), playerHp: Math.min(run.playerMaxHp, run.playerHp + 8) }
      } else if (current.type === 'event' || current.type === 'temple' || current.type === 'treasure') {
        run = { ...run, gold: run.gold + 10 }
      }

      run = completeNode(run, current.id)
      if (current.type === 'boss_battle') {
        if (run.act >= 3) {
          victory = true
          break
        }
        run = applyIntermissionChoice(run, seeded.chance(0.5) ? 'elite_armament' : 'war_loot_reserve', seeded.next)
        run = advanceToNextAct(run, seeded.next)
        continue
      }

      const nextNodeId = chooseNextNode(run, current, seeded.next)
      if (!nextNodeId) break
      run = moveToNode(run, nextNodeId)
    }

    return {
      seed,
      victory,
      turns: totalTurns,
      durationSec: Math.max(1, totalTurns * 6),
      endingAct: run.act,
      finalHp: run.playerHp,
      deckSize: run.deck.length,
      gold: run.gold,
    }
  } finally {
    Math.random = prevRandom
  }
}

export function simulateRuns(options: SimulationOptions): SimulationSummary {
  const runs = Math.max(1, Math.floor(options.runs))
  const baseSeed = options.baseSeed ?? Date.now()
  const maxBattleTurns = options.maxBattleTurns ?? 40
  const results: SimulationRunResult[] = []
  for (let i = 0; i < runs; i++) {
    results.push(simulateSingleRun(baseSeed + i, maxBattleTurns))
  }
  const wins = results.filter((r) => r.victory).length
  const sumTurns = results.reduce((sum, r) => sum + r.turns, 0)
  const sumDuration = results.reduce((sum, r) => sum + r.durationSec, 0)
  const sumDeck = results.reduce((sum, r) => sum + r.deckSize, 0)
  const sumGold = results.reduce((sum, r) => sum + r.gold, 0)
  return {
    runs,
    wins,
    winRate: wins / runs,
    avgTurns: sumTurns / runs,
    avgDurationSec: sumDuration / runs,
    avgDeckSize: sumDeck / runs,
    avgGold: sumGold / runs,
    results,
  }
}
