import { describe, it, expect } from 'vitest'
import { restoreHp, getUpgradeOptions, upgradeCard, getEffectiveCardDef } from '../campfire'
import { getCardDef } from '../cards'
import type { RunState, CardInstance } from '../types'

const dummyRun = {} as RunState

describe('campfire', () => {
  describe('restoreHp', () => {
    it('restores HP to max', () => {
      expect(restoreHp(dummyRun, 30, 80).hp).toBe(80)
    })

    it('returns maxHp even when already full', () => {
      expect(restoreHp(dummyRun, 80, 80).hp).toBe(80)
    })
  })

  describe('getUpgradeOptions', () => {
    it('returns [damage, cost] for a card with damage and cost >= 1', () => {
      const slash = getCardDef('slash') // cost 1, has damage
      expect(getUpgradeOptions(slash)).toEqual(['damage', 'cost'])
    })

    it('returns [damage] for a free card with damage', () => {
      const bloodMagic = getCardDef('blood_magic') // cost 0, has damage
      expect(getUpgradeOptions(bloodMagic)).toEqual(['damage'])
    })

    it('returns [cost] for a card without damage but cost >= 1', () => {
      const block = getCardDef('block') // cost 1, no damage effect
      expect(getUpgradeOptions(block)).toEqual(['cost'])
    })

    it('returns [] for a free card without damage', () => {
      const berserk = getCardDef('berserk') // cost 0, no damage
      expect(getUpgradeOptions(berserk)).toEqual([])
    })
  })

  describe('upgradeCard', () => {
    it('damage upgrade increases all damage effects by 2', () => {
      const spark = getCardDef('spark') // damage 4 + burn 1
      const upgraded = upgradeCard(spark, 'damage')
      const dmg = upgraded.effects.find(e => e.type === 'damage')
      expect(dmg).toBeDefined()
      expect(dmg!.value).toBe(6) // 4 + 2
      // burn unchanged
      const burn = upgraded.effects.find(e => e.type === 'burn')
      expect(burn!.value).toBe(1)
    })

    it('cost upgrade decreases cost by 1', () => {
      const slash = getCardDef('slash') // cost 1
      const upgraded = upgradeCard(slash, 'cost')
      expect(upgraded.cost).toBe(0)
    })

    it('does not mutate the original CardDef', () => {
      const slash = getCardDef('slash')
      const origCost = slash.cost
      upgradeCard(slash, 'cost')
      expect(slash.cost).toBe(origCost)
    })
  })

  describe('getEffectiveCardDef', () => {
    it('returns base def for non-upgraded card', () => {
      const card: CardInstance = { uid: '1', defId: 'slash' }
      const def = getEffectiveCardDef(card)
      expect(def).toEqual(getCardDef('slash'))
    })

    it('returns upgraded def for damage-upgraded card', () => {
      const card: CardInstance = { uid: '2', defId: 'slash', upgraded: 'damage' }
      const def = getEffectiveCardDef(card)
      const dmg = def.effects.find(e => e.type === 'damage')
      expect(dmg!.value).toBe(8) // 6 + 2
    })

    it('returns upgraded def for cost-upgraded card', () => {
      const card: CardInstance = { uid: '3', defId: 'heavy_slash', upgraded: 'cost' }
      const def = getEffectiveCardDef(card)
      expect(def.cost).toBe(1) // 2 - 1
    })
  })
})
