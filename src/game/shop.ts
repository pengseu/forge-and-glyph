import { ALL_CARDS } from './cards'
import type { CardDef, ShopOffer } from './types'

function rollInt(min: number, max: number, rng: () => number): number {
  return min + Math.floor(rng() * (max - min + 1))
}

function pickOne(pool: CardDef[], rng: () => number): CardDef {
  const idx = Math.floor(rng() * pool.length)
  return pool[idx]
}

export function generateShopOffers(rng: () => number = Math.random): ShopOffer[] {
  const commons = ALL_CARDS.filter(c => c.rarity === 'common')
  const rares = ALL_CARDS.filter(c => c.rarity === 'rare')
  const epics = ALL_CARDS.filter(c => c.rarity === 'epic')

  const chosen = new Set<string>()
  function uniquePick(pool: CardDef[]): CardDef {
    let pick = pickOne(pool, rng)
    let guard = 0
    while (chosen.has(pick.id) && guard < 20) {
      pick = pickOne(pool, rng)
      guard++
    }
    chosen.add(pick.id)
    return pick
  }

  const offer1 = uniquePick(commons)
  const offer2 = uniquePick(rares)
  const tier3Pool = rng() < 0.7 ? rares : epics
  const offer3 = uniquePick(tier3Pool)

  return [
    { cardId: offer1.id, price: rollInt(35, 50, rng), sold: false },
    { cardId: offer2.id, price: rollInt(70, 90, rng), sold: false },
    { cardId: offer3.id, price: rollInt(90, 130, rng), sold: false },
  ]
}
