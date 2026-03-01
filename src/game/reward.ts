import type { CardDef, NodeType } from './types'
import { getRewardPoolByAct } from './cards'

const RARITY_WEIGHTS_BY_ACT: Record<1 | 2 | 3, Record<string, number>> = {
  1: { basic: 0, common: 50, rare: 30, epic: 10, legendary: 0 },
  2: { basic: 0, common: 40, rare: 35, epic: 15, legendary: 0 },
  3: { basic: 0, common: 0, rare: 40, epic: 35, legendary: 10 },
}

function weightedRandomCards(
  pool: CardDef[],
  count: number,
  minRarity?: string,
  rng: () => number = Math.random,
  weights: Record<string, number> = RARITY_WEIGHTS_BY_ACT[1],
): CardDef[] {
  // Filter pool to exclude basic cards (not offered as rewards)
  let filtered = pool.filter(c => c.rarity !== 'basic')

  const result: CardDef[] = []

  // Guarantee minimum rarity if specified
  if (minRarity) {
    const rarityOrder = ['common', 'rare', 'epic', 'legendary']
    const minIdx = rarityOrder.indexOf(minRarity)
    const guaranteePool = filtered.filter(c => rarityOrder.indexOf(c.rarity) >= minIdx)
    if (guaranteePool.length > 0) {
      const pick = guaranteePool[Math.floor(rng() * guaranteePool.length)]
      result.push(pick)
      filtered = filtered.filter(c => c.id !== pick.id)
    }
  }

  // Fill remaining slots with weighted random
  while (result.length < count && filtered.length > 0) {
    const totalWeight = filtered.reduce((sum, c) => sum + (weights[c.rarity] || 0), 0)
    if (totalWeight <= 0) break

    let roll = rng() * totalWeight
    let picked: CardDef | null = null
    for (const card of filtered) {
      roll -= weights[card.rarity] || 0
      if (roll <= 0) {
        picked = card
        break
      }
    }
    if (!picked) picked = filtered[0]

    result.push(picked)
    // Dedup: remove picked card from pool
    filtered = filtered.filter(c => c.id !== picked!.id)
  }

  return result
}

export function getRewardCards(nodeType: NodeType): CardDef[] {
  return getRewardCardsByAct(nodeType, 1, Math.random)
}

export function getRewardCardsByAct(nodeType: NodeType, act: 1 | 2 | 3, rng: () => number = Math.random): CardDef[] {
  if (nodeType === 'campfire') return []
  const pool = getRewardPoolByAct(act)
  const weights = RARITY_WEIGHTS_BY_ACT[act]

  if (act === 1) {
    if (nodeType === 'boss_battle') return weightedRandomCards(pool, 3, 'epic', rng, weights)
    if (nodeType === 'elite_battle' || nodeType === 'trial') return weightedRandomCards(pool, 3, 'rare', rng, weights)
    return weightedRandomCards(pool, 3, 'common', rng, weights)
  }

  if (act === 2) {
    if (nodeType === 'boss_battle') return weightedRandomCards(pool, 3, 'epic', rng, weights)
    if (nodeType === 'elite_battle' || nodeType === 'trial') return weightedRandomCards(pool, 3, 'rare', rng, weights)
    return weightedRandomCards(pool, 3, 'common', rng, weights)
  }

  if (nodeType === 'boss_battle') return weightedRandomCards(pool, 3, 'legendary', rng, weights)
  if (nodeType === 'elite_battle' || nodeType === 'trial') return weightedRandomCards(pool, 3, 'epic', rng, weights)
  return weightedRandomCards(pool, 3, 'rare', rng, weights)
}
