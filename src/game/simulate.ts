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
import { applyIntermissionChoice, advanceToNextAct, type IntermissionChoiceId } from './act'
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
import type { BattleState, CardDef, MapNode, RunState } from './types'

export type SimulationSkillTier = 'novice' | 'skilled' | 'expert'

export interface SimulationOptions {
  runs: number
  baseSeed?: number
  maxBattleTurns?: number
  skillTier?: SimulationSkillTier
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
  avgVictoryDurationSec: number | null
  avgDeckSize: number
  avgGold: number
  results: SimulationRunResult[]
}

function aliveEnemyIndices(battle: BattleState): number[] {
  const alive: number[] = []
  for (let i = 0; i < battle.enemies.length; i++) {
    if (battle.enemies[i].hp > 0) alive.push(i)
  }
  return alive
}

function chooseTargetIndex(battle: BattleState, tier: SimulationSkillTier, rng: () => number): number {
  const alive = aliveEnemyIndices(battle)
  if (alive.length === 0) return 0
  if (tier === 'novice') return alive[Math.floor(rng() * alive.length)]
  if (tier === 'skilled') return alive[0]

  let picked = alive[0]
  let best = Number.POSITIVE_INFINITY
  for (const idx of alive) {
    const enemy = battle.enemies[idx]
    const effectiveHp = enemy.hp + enemy.armor * 1.2
    if (effectiveHp < best) {
      best = effectiveHp
      picked = idx
    }
  }
  return picked
}

function scoreCardInBattle(def: CardDef, battle: BattleState, targetIndex: number): number {
  const aliveCount = aliveEnemyIndices(battle).length
  const hpRatio = battle.player.maxHp > 0 ? battle.player.hp / battle.player.maxHp : 1
  let score = 0

  for (const effect of def.effects) {
    if (effect.type === 'damage') score += effect.value * 1.2
    else if (effect.type === 'damage_shred_armor') score += effect.damage * 1.2 + effect.shred * 0.6
    else if (effect.type === 'multi_damage') score += effect.value * effect.hits * 1.1
    else if (effect.type === 'aoe_damage') score += effect.value * Math.max(1, aliveCount)
    else if (effect.type === 'aoe_burn') score += effect.value * Math.max(1, aliveCount) * 0.8
    else if (effect.type === 'poison') score += effect.value * 1.1
    else if (effect.type === 'burn') score += effect.value * 0.9
    else if (effect.type === 'freeze') score += effect.value * 3
    else if (effect.type === 'draw_cards') score += effect.value * 1.6
    else if (effect.type === 'gain_mana') score += effect.value * 1.1
    else if (effect.type === 'gain_stamina') score += effect.value * 1.1
    else if (effect.type === 'armor') score += hpRatio < 0.55 ? effect.value * 1.2 : effect.value * 0.5
    else if (effect.type === 'heal') score += hpRatio < 0.6 ? effect.value * 1.5 : effect.value * 0.5
    else if (effect.type === 'lifesteal') score += hpRatio < 0.65 ? effect.value * 1.8 : effect.value * 1.1
    else if (effect.type === 'weaken_enemy') score += effect.value * 2.2
    else if (effect.type === 'vulnerable') score += effect.value * 1.8
    else if (effect.type === 'execute') {
      const enemy = battle.enemies[targetIndex]
      const executeBonus = enemy && enemy.hp <= effect.threshold ? 8 : 0
      score += effect.damage + executeBonus
    } else {
      score += 0.6
    }
  }

  if (def.category === 'combat') score += 0.8
  if (def.category === 'spell') score += 1
  if (def.exhaust) score -= 0.3
  score -= def.cost * 0.2

  return score
}

function pickCardUid(
  battle: BattleState,
  playableUids: string[],
  targetIndex: number,
  tier: SimulationSkillTier,
  rng: () => number,
): string {
  const scored = playableUids
    .map((uid) => {
      const card = battle.player.hand.find((c) => c.uid === uid)
      const def = card ? getCardDef(card.defId) : null
      return {
        uid,
        score: def ? scoreCardInBattle(def, battle, targetIndex) : 0,
      }
    })
    .sort((a, b) => b.score - a.score)

  if (scored.length === 1) return scored[0].uid

  if (tier === 'novice') {
    if (rng() < 0.6) return scored[Math.floor(rng() * scored.length)].uid
    return scored[scored.length - 1].uid
  }

  if (tier === 'skilled') {
    const topN = Math.min(2, scored.length)
    return scored[Math.floor(rng() * topN)].uid
  }

  return scored[0].uid
}

function shouldEndTurnEarly(tier: SimulationSkillTier, rng: () => number): boolean {
  if (tier === 'novice') return rng() < 0.14
  if (tier === 'skilled') return rng() < 0.03
  return false
}

function autoPlayBattle(
  run: RunState,
  enemyIds: string[],
  rng: () => number,
  maxBattleTurns: number,
  tier: SimulationSkillTier,
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
      if (shouldEndTurnEarly(tier, rng)) break

      const target = chooseTargetIndex(battle, tier, rng)
      const playable = battle.player.hand
        .filter((c) => canPlayCard(battle, c.uid))
        .map((c) => c.uid)

      if (playable.length > 0) {
        const pickedUid = pickCardUid(battle, playable, target, tier, rng)
        battle = playCard(battle, pickedUid, target)
        actionTaken = true
        continue
      }

      if (canUseNormalAttack(battle)) {
        if (tier !== 'novice' || rng() > 0.35) {
          battle = useNormalAttack(battle, target)
          actionTaken = true
          continue
        }
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

function scoreNode(node: MapNode, hpRatio: number, tier: SimulationSkillTier): number {
  if (node.type === 'boss_battle') return 300

  if (tier === 'novice') {
    if (node.type === 'elite_battle') return 120
    if (node.type === 'trial') return 90
    if (node.type === 'normal_battle') return 80
    if (node.type === 'event' || node.type === 'temple' || node.type === 'treasure') return 70
    if (node.type === 'campfire') return hpRatio < 0.35 ? 95 : 60
    if (node.type === 'shop') return 55
    return 50
  }

  if (tier === 'skilled') {
    if (node.type === 'campfire') return hpRatio < 0.45 ? 140 : 50
    if (node.type === 'shop') return hpRatio < 0.55 ? 110 : 70
    if (node.type === 'normal_battle') return 95
    if (node.type === 'elite_battle') return hpRatio > 0.65 ? 100 : 60
    if (node.type === 'trial') return hpRatio > 0.7 ? 85 : 55
    if (node.type === 'event' || node.type === 'temple' || node.type === 'treasure') return 65
    return 40
  }

  if (node.type === 'campfire') return hpRatio < 0.5 ? 160 : 55
  if (node.type === 'shop') return hpRatio < 0.6 ? 120 : 80
  if (node.type === 'elite_battle') return hpRatio > 0.55 ? 140 : 65
  if (node.type === 'trial') return hpRatio > 0.65 ? 120 : 70
  if (node.type === 'normal_battle') return 100
  if (node.type === 'event' || node.type === 'temple' || node.type === 'treasure') return 75
  return 45
}

function chooseNextNode(run: RunState, current: MapNode, rng: () => number, tier: SimulationSkillTier): string | null {
  const candidates = current.connections
    .filter((id) => canAccessNode({ ...run, mapNodes: run.mapNodes.map((n) => (n.id === current.id ? { ...n, completed: true } : n)) }, id))
    .map((id) => run.mapNodes.find((n) => n.id === id))
    .filter((n): n is MapNode => !!n)

  if (candidates.length === 0) return null

  const hpRatio = run.playerMaxHp > 0 ? run.playerHp / run.playerMaxHp : 1
  const ranked = candidates
    .map((node) => ({ node, score: scoreNode(node, hpRatio, tier) + rng() * 0.01 }))
    .sort((a, b) => b.score - a.score)

  if (tier === 'expert') return ranked[0].node.id
  if (tier === 'skilled') return ranked[Math.floor(rng() * Math.min(2, ranked.length))].node.id

  return ranked[Math.floor(rng() * Math.min(3, ranked.length))].node.id
}

function chooseIntermissionChoice(run: RunState, tier: SimulationSkillTier, rng: () => number): IntermissionChoiceId {
  const hpRatio = run.playerMaxHp > 0 ? run.playerHp / run.playerMaxHp : 1
  if (run.act === 1) {
    if (tier === 'novice') {
      const picks: IntermissionChoiceId[] = ['knowledge_accumulation', 'war_loot_reserve', 'elite_armament']
      return picks[Math.floor(rng() * picks.length)]
    }
    if (tier === 'skilled') return hpRatio < 0.5 ? 'war_loot_reserve' : 'elite_armament'
    return 'elite_armament'
  }

  if (tier === 'novice') {
    const picks: IntermissionChoiceId[] = ['foresight_eye', 'deep_purify', 'legend_forge']
    return picks[Math.floor(rng() * picks.length)]
  }

  if (tier === 'skilled') return hpRatio < 0.45 ? 'deep_purify' : 'foresight_eye'

  const canLegend = run.materials.goblin_crown_fragment >= 1 && run.materials.steel_ingot >= 2
  if (canLegend) return 'legend_forge'
  if (hpRatio < 0.3) return 'deep_purify'
  return 'foresight_eye'
}

function scoreRewardCard(def: CardDef, run: RunState): number {
  const rarityScore: Record<CardDef['rarity'], number> = {
    basic: 0.5,
    common: 1,
    rare: 2,
    epic: 3,
    legendary: 4,
  }
  let score = rarityScore[def.rarity]

  const weapon = run.equippedWeapon?.defId ?? ''
  const hpRatio = run.playerMaxHp > 0 ? run.playerHp / run.playerMaxHp : 1
  if (weapon.includes('staff') && def.category === 'spell') score += 1.2
  if ((weapon.includes('sword') || weapon.includes('hammer') || weapon.includes('dagger')) && def.category === 'combat') score += 0.9

  if (hpRatio < 0.45 && (def.description.includes('护甲') || def.description.includes('回复') || def.description.includes('治疗'))) {
    score += 1.4
  }
  if (def.description.includes('抽')) score += 0.4
  if (def.description.includes('中毒') || def.description.includes('灼烧')) score += 0.3
  return score
}

function pickRewardCardId(rewards: CardDef[], run: RunState, tier: SimulationSkillTier, rng: () => number): string | null {
  if (rewards.length === 0) return null

  if (tier === 'novice') {
    if (rng() < 0.3) return null
    return rewards[Math.floor(rng() * rewards.length)].id
  }

  const ranked = rewards
    .map((def) => ({ def, score: scoreRewardCard(def, run) + rng() * 0.001 }))
    .sort((a, b) => b.score - a.score)

  if (tier === 'skilled') {
    const idx = rng() < 0.25 && ranked.length > 1 ? 1 : 0
    return ranked[idx].def.id
  }

  return ranked[0].def.id
}

export function simulateSingleRun(
  seed: number,
  maxBattleTurns: number = 40,
  skillTier: SimulationSkillTier = 'skilled',
): SimulationRunResult {
  const seeded = createSeededRng(seed)
  const prevRandom = Math.random
  Math.random = seeded.next
  try {
    let run = createRunState({ unlockedBlueprints: [], blueprintMastery: {}, legacyWeaponDefId: null }, seeded.next)
    const starter = skillTier === 'expert' ? 'iron_staff' : seeded.chance(0.5) ? 'iron_longsword' : 'iron_staff'
    run = addWeaponToInventory(run, starter)
    run = equipWeapon(run, run.weaponInventory[0].uid)

    let totalTurns = 0
    let nodesCleared = 0
    let victory = false
    let guard = 0

    while (guard++ < 400) {
      const current = run.mapNodes.find((n) => n.id === run.currentNodeId)
      if (!current) break

      if (current.enemyIds && current.enemyIds.length > 0) {
        const battleResult = autoPlayBattle(run, current.enemyIds, seeded.next, maxBattleTurns, skillTier)
        run = battleResult.run
        totalTurns += battleResult.turns
        if (!battleResult.victory) {
          victory = false
          break
        }
        run = addBattleGoldReward(run, generateBattleGold(current.type, seeded.next))
        run = applyBattleVictoryRewards(run, current.type)
        const rewards = getRewardCardsByAct(current.type, run.act, seeded.next)
        const rewardId = pickRewardCardId(rewards, run, skillTier, seeded.next)
        if (rewardId) run = addCardToDeck(run, rewardId, seeded.next)

        if (current.type === 'boss_battle') {
          run = addMaterialReward(run, rollMaterialRewardByAct('boss_battle', run.act, seeded.next))
        } else {
          run = addMaterialReward(run, rollMaterialRewardByAct(current.type, run.act, seeded.next))
        }
      } else if (current.type === 'campfire') {
        const healRatio = skillTier === 'expert' ? 0.35 : 0.25
        run = { ...run, playerHp: Math.min(run.playerMaxHp, run.playerHp + Math.floor(run.playerMaxHp * healRatio)) }
      } else if (current.type === 'shop') {
        const shouldHeal = run.playerHp < run.playerMaxHp * (skillTier === 'expert' ? 0.8 : 0.65)
        const healGain = skillTier === 'expert' ? 12 : 8
        if (shouldHeal && run.gold >= 25) {
          run = { ...run, gold: Math.max(0, run.gold - 25), playerHp: Math.min(run.playerMaxHp, run.playerHp + healGain) }
        }
      } else if (current.type === 'event' || current.type === 'temple' || current.type === 'treasure') {
        run = { ...run, gold: run.gold + 10 }
      }

      run = completeNode(run, current.id)
      nodesCleared += 1

      if (current.type === 'boss_battle') {
        if (run.act >= 3) {
          victory = true
          break
        }
        const choice = chooseIntermissionChoice(run, skillTier, seeded.next)
        run = applyIntermissionChoice(run, choice, seeded.next)
        run = advanceToNextAct(run, seeded.next)
        continue
      }

      const nextNodeId = chooseNextNode(run, current, seeded.next, skillTier)
      if (!nextNodeId) break
      run = moveToNode(run, nextNodeId)
    }

    const durationSec = Math.max(60, totalTurns * 14 + nodesCleared * 18)

    return {
      seed,
      victory,
      turns: totalTurns,
      durationSec,
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
  const skillTier = options.skillTier ?? 'skilled'
  const results: SimulationRunResult[] = []

  for (let i = 0; i < runs; i++) {
    results.push(simulateSingleRun(baseSeed + i, maxBattleTurns, skillTier))
  }

  const wins = results.filter((r) => r.victory).length
  const victoryResults = results.filter((r) => r.victory)
  const sumTurns = results.reduce((sum, r) => sum + r.turns, 0)
  const sumDuration = results.reduce((sum, r) => sum + r.durationSec, 0)
  const sumDeck = results.reduce((sum, r) => sum + r.deckSize, 0)
  const sumGold = results.reduce((sum, r) => sum + r.gold, 0)
  const sumVictoryDuration = victoryResults.reduce((sum, r) => sum + r.durationSec, 0)

  return {
    runs,
    wins,
    winRate: wins / runs,
    avgTurns: sumTurns / runs,
    avgDurationSec: sumDuration / runs,
    avgVictoryDurationSec: victoryResults.length > 0 ? sumVictoryDuration / victoryResults.length : null,
    avgDeckSize: sumDeck / runs,
    avgGold: sumGold / runs,
    results,
  }
}
