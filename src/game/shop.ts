import { getRewardPoolByAct } from './cards'
import type { CardDef, ShopMaterialOffer, ShopOffer } from './types'
import { SHOP_SERVICE_BY_ACT } from './config'
import { random } from './random'

export interface ShopServicePricing {
  healPrice: number
  removePrice: number
  healPercent: number
  transformPrice?: number
}

function rollInt(min: number, max: number, rng: () => number): number {
  return min + Math.floor(rng() * (max - min + 1))
}

function pickOne(pool: CardDef[], rng: () => number): CardDef {
  const idx = Math.floor(rng() * pool.length)
  return pool[idx]
}

export function generateShopOffers(rng: () => number = random): ShopOffer[] {
  return generateShopOffersByAct(1, rng)
}

export function generateShopOffersByAct(
  act: 1 | 2 | 3,
  rng: () => number = random,
): ShopOffer[] {
  const source = getRewardPoolByAct(act)
  const commons = source.filter(c => c.rarity === 'common')
  const rares = source.filter(c => c.rarity === 'rare')
  const epics = source.filter(c => c.rarity === 'epic')
  const legendaries = source.filter(c => c.rarity === 'legendary')

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
  const tier3Pool = act === 3
    ? (rng() < 0.2 && legendaries.length > 0 ? legendaries : (rng() < 0.6 ? epics : rares))
    : (rng() < 0.7 ? rares : epics)
  const offer3 = uniquePick(tier3Pool)

  const price1 = act === 1 ? rollInt(30, 45, rng) : act === 2 ? rollInt(35, 50, rng) : rollInt(60, 80, rng)
  const price2 = act === 3 ? rollInt(100, 130, rng) : rollInt(70, 90, rng)
  const price3 = act === 3 ? rollInt(130, 180, rng) : rollInt(90, 130, rng)

  return [
    { cardId: offer1.id, price: price1, sold: false },
    { cardId: offer2.id, price: price2, sold: false },
    { cardId: offer3.id, price: price3, sold: false },
  ]
}

export function generateShopMaterialOffersByAct(
  act: 1 | 2 | 3,
  rng: () => number = random,
): ShopMaterialOffer[] {
  const essenceIds: Array<ShopMaterialOffer['materialId']> = ['elemental_essence', 'war_essence', 'guard_essence']
  const randomEssence = essenceIds[Math.floor(rng() * essenceIds.length)]
  if (act === 1) {
    return []
  }
  if (act === 2) {
    return [
      { materialId: 'steel_ingot', quantity: 1, price: 35, sold: false },
      { materialId: randomEssence, quantity: 1, price: 40, sold: false },
    ]
  }
  return [
    { materialId: 'steel_ingot', quantity: 2, price: 60, sold: false },
    { materialId: randomEssence, quantity: 2, price: 45, sold: false },
  ]
}

export function getShopServicePricingByAct(act: 1 | 2 | 3): ShopServicePricing {
  return SHOP_SERVICE_BY_ACT[act]
}
