import { describe, it, expect } from 'vitest'
import { ALL_CARDS, getCardDef, STARTER_DECK_RECIPE } from '../cards'

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

describe('cards', () => {
  it('should have card definitions', () => {
    expect(ALL_CARDS.length).toBeGreaterThan(0)
  })

  it('should find card by id', () => {
    const slash = getCardDef('slash')
    expect(slash.name).toBe('挥砍')
    expect(slash.cost).toBe(1)
    expect(slash.costType).toBe('stamina')
  })

  it('starter deck should have 10 cards', () => {
    const total = STARTER_DECK_RECIPE.reduce((sum, r) => sum + r.count, 0)
    expect(total).toBe(10)
  })

  it('all starter deck cards should exist', () => {
    for (const recipe of STARTER_DECK_RECIPE) {
      expect(() => getCardDef(recipe.cardId)).not.toThrow()
    }
  })

  it('should have proper rarity distribution', () => {
    const rarities = ALL_CARDS.map(c => c.rarity)
    expect(rarities.filter(r => r === 'basic').length).toBeGreaterThan(0)
    expect(rarities.filter(r => r === 'common').length).toBeGreaterThan(0)
    expect(rarities.filter(r => r === 'rare').length).toBeGreaterThan(0)
    expect(rarities.filter(r => r === 'epic').length).toBeGreaterThan(0)
  })

  it('should reach 40 cards after step6 card pool expansion', () => {
    expect(ALL_CARDS.length).toBe(40)
  })

  it('should include all newly added step6 cards', () => {
    for (const id of STEP6_ADDED_CARD_IDS) {
      expect(() => getCardDef(id)).not.toThrow()
    }
  })
})
