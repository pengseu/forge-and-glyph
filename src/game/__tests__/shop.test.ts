import { describe, expect, it } from 'vitest'
import {
  generateShopMaterialOffersByAct,
  generateShopOffersByAct,
  getShopServicePricingByAct,
} from '../shop'

describe('shop by act', () => {
  it('generates three card offers with stage-aware price ranges', () => {
    const act1 = generateShopOffersByAct(1, () => 0)
    const act2 = generateShopOffersByAct(2, () => 0)
    const act3 = generateShopOffersByAct(3, () => 0)

    expect(act1).toHaveLength(3)
    expect(act2).toHaveLength(3)
    expect(act3).toHaveLength(3)

    expect(act1[0].price).toBeGreaterThanOrEqual(30)
    expect(act1[0].price).toBeLessThanOrEqual(45)
    expect(act2[0].price).toBeGreaterThanOrEqual(35)
    expect(act2[0].price).toBeLessThanOrEqual(50)
    expect(act3[0].price).toBeGreaterThanOrEqual(60)
    expect(act3[0].price).toBeLessThanOrEqual(80)
  })

  it('exposes stage-specific material shelves', () => {
    const act1 = generateShopMaterialOffersByAct(1, () => 0)
    const act2 = generateShopMaterialOffersByAct(2, () => 0)
    const act3 = generateShopMaterialOffersByAct(3, () => 0)

    expect(act1).toEqual([])
    expect(act2[0]).toMatchObject({ materialId: 'steel_ingot', quantity: 1, price: 35 })
    expect(act2[1].price).toBe(40)
    expect(['elemental_essence', 'war_essence', 'guard_essence']).toContain(act2[1].materialId)
    expect(act3[0]).toMatchObject({ materialId: 'steel_ingot', quantity: 2, price: 60 })
    expect(act3[1].price).toBe(45)
    expect(['elemental_essence', 'war_essence', 'guard_essence']).toContain(act3[1].materialId)
  })

  it('returns stage-specific service pricing', () => {
    expect(getShopServicePricingByAct(1)).toEqual({
      healPrice: 25,
      removePrice: 40,
      healPercent: 0.3,
    })
    expect(getShopServicePricingByAct(2)).toEqual({
      healPrice: 25,
      removePrice: 50,
      healPercent: 0.3,
    })
    expect(getShopServicePricingByAct(3)).toEqual({
      healPrice: 30,
      removePrice: 60,
      healPercent: 0.5,
      transformPrice: 35,
    })
  })
})
