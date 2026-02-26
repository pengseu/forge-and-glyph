import type { CardDef, NodeType } from './types'
import { ALL_CARDS } from './cards'

const RARITY_WEIGHTS: Record<string, number> = {
  basic: 0,
  common: 50,
  rare: 30,
  epic: 10,
}

function weightedRandomCards(
  pool: CardDef[],
  count: number,
  minRarity?: string,
): CardDef[] {
  // Filter pool to exclude basic cards (not offered as rewards)
  let filtered = pool.filter(c => c.rarity !== 'basic')

  const result: CardDef[] = []

  // Guarantee minimum rarity if specified
  if (minRarity) {
    const rarityOrder = ['common', 'rare', 'epic']
    const minIdx = rarityOrder.indexOf(minRarity)
    const guaranteePool = filtered.filter(c => rarityOrder.indexOf(c.rarity) >= minIdx)
    if (guaranteePool.length > 0) {
      const pick = guaranteePool[Math.floor(Math.random() * guaranteePool.length)]
      result.push(pick)
      filtered = filtered.filter(c => c.id !== pick.id)
    }
  }

  // Fill remaining slots with weighted random
  while (result.length < count && filtered.length > 0) {
    const totalWeight = filtered.reduce((sum, c) => sum + (RARITY_WEIGHTS[c.rarity] || 0), 0)
    if (totalWeight <= 0) break

    let roll = Math.random() * totalWeight
    let picked: CardDef | null = null
    for (const card of filtered) {
      roll -= RARITY_WEIGHTS[card.rarity] || 0
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
  if (nodeType === 'campfire') return []

  if (nodeType === 'boss_battle') {
    return weightedRandomCards(ALL_CARDS, 3, 'epic')
  }
  if (nodeType === 'elite_battle') {
    return weightedRandomCards(ALL_CARDS, 3, 'rare')
  }
  // normal battle: guarantee at least common
  return weightedRandomCards(ALL_CARDS, 3, 'common')
}
