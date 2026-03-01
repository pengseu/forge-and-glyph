import { describe, it, expect } from 'vitest'
import { restoreHp, canUpgrade, upgradeCard, getEffectiveCardDef, UPGRADE_TABLE } from '../campfire'
import { getCardDef } from '../cards'
import type { RunState, CardInstance } from '../types'

const dummyRun = {} as RunState
const STEP6_ADDED_CARD_IDS = [
  'quick_attack',
  'double_strike',
  'ignite',
  'frost_nova',
  'bone_poison',
  'vulnerability_hex',
  'overdraft',
  'mana_surge',
  'balance',
  'thorn_armor',
  'magic_absorb',
  'blade_arcane_unity',
  'blood_frenzy',
]

describe('campfire', () => {
  describe('restoreHp', () => {
    it('restores HP to max', () => {
      expect(restoreHp(dummyRun, 30, 80).hp).toBe(80)
    })

    it('returns maxHp even when already full', () => {
      expect(restoreHp(dummyRun, 80, 80).hp).toBe(80)
    })
  })

  describe('canUpgrade', () => {
    it('returns true for cards in UPGRADE_TABLE', () => {
      const slash = getCardDef('slash')
      expect(canUpgrade(slash)).toBe(true)
    })

    it('returns true for all defined cards with upgrades', () => {
      for (const id of Object.keys(UPGRADE_TABLE)) {
        const def = getCardDef(id)
        expect(canUpgrade(def)).toBe(true)
      }
    })
  })

  describe('upgradeCard', () => {
    it('slash upgrade increases damage to 9', () => {
      const slash = getCardDef('slash')
      const upgraded = upgradeCard(slash)
      const dmg = upgraded.effects.find(e => e.type === 'damage')
      expect(dmg).toBeDefined()
      expect(dmg!.value).toBe(9)
    })

    it('spark upgrade increases damage and burn', () => {
      const spark = getCardDef('spark')
      const upgraded = upgradeCard(spark)
      const dmg = upgraded.effects.find(e => e.type === 'damage')
      const burn = upgraded.effects.find(e => e.type === 'burn')
      expect(dmg!.value).toBe(6)
      expect(burn!.value).toBe(2)
    })

    it('does not mutate the original CardDef', () => {
      const slash = getCardDef('slash')
      const origCost = slash.cost
      upgradeCard(slash)
      expect(slash.cost).toBe(origCost)
    })

    it('charge_up upgrade reduces cost to 0', () => {
      const card = getCardDef('charge_up')
      const upgraded = upgradeCard(card)
      expect(upgraded.cost).toBe(0)
    })
  })

  describe('getEffectiveCardDef', () => {
    it('returns base def for non-upgraded card', () => {
      const card: CardInstance = { uid: '1', defId: 'slash' }
      const def = getEffectiveCardDef(card)
      expect(def).toEqual(getCardDef('slash'))
    })

    it('returns upgraded def for upgraded card', () => {
      const card: CardInstance = { uid: '2', defId: 'slash', upgraded: true }
      const def = getEffectiveCardDef(card)
      const dmg = def.effects.find(e => e.type === 'damage')
      expect(dmg!.value).toBe(9)
      expect(def.name).toBe('挥砍+')
    })

    it('returns upgraded def for execute', () => {
      const card: CardInstance = { uid: '3', defId: 'execute', upgraded: true }
      const def = getEffectiveCardDef(card)
      const exec = def.effects.find(e => e.type === 'execute')
      expect(exec).toBeDefined()
      if (exec && exec.type === 'execute') {
        expect(exec.damage).toBe(24)
      }
    })

    it('should have upgrade mappings for newly added step6 cards', () => {
      for (const id of STEP6_ADDED_CARD_IDS) {
        const base = getCardDef(id)
        expect(canUpgrade(base)).toBe(true)
        const upgraded = upgradeCard(base)
        expect(upgraded.name.endsWith('+')).toBe(true)
      }
    })
  })
})
