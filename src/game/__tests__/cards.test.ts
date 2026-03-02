import { describe, it, expect } from 'vitest'
import { ALL_CARDS, createStarterDeck, getCardDef, getRewardPoolByAct, STARTER_DECK_RECIPE } from '../cards'

const SETTING_ADDED_CARD_IDS = [
  'quick_attack',
  'double_strike',
  'ignite',
  'bone_poison',
  'vulnerability_hex',
  'overdraft',
  'mana_surge',
  'thorn_armor',
  'magic_absorb',
  'blade_arcane_unity',
  'blood_frenzy',
  'purify',
  'final_judgment',
  'annihilation_flame',
  'eternal_shield',
  'time_rewind',
  'soul_sacrifice',
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

  it('starter deck should have 8 cards', () => {
    const total = STARTER_DECK_RECIPE.reduce((sum, r) => sum + r.count, 0)
    expect(total).toBe(8)
  })

  it('createStarterDeck should build an 8-card starter deck from recipe', () => {
    const deck = createStarterDeck()
    expect(deck).toHaveLength(8)
    expect(deck.every(c => c.uid.startsWith('card_'))).toBe(true)
  })

  it('starter deck should include exactly slash2 block2 spark2 meditate1 light_stab1', () => {
    const byId = createStarterDeck().reduce<Record<string, number>>((acc, c) => {
      acc[c.defId] = (acc[c.defId] ?? 0) + 1
      return acc
    }, {})
    expect(byId).toEqual({
      slash: 2,
      block: 2,
      spark: 2,
      meditate: 1,
      light_stab: 1,
    })
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
    expect(rarities.filter(r => r === 'legendary').length).toBeGreaterThan(0)
  })

  it('should keep expanded card pool (>=40)', () => {
    expect(ALL_CARDS.length).toBeGreaterThanOrEqual(40)
  })

  it('should include all setting-aligned added cards', () => {
    for (const id of SETTING_ADDED_CARD_IDS) {
      expect(() => getCardDef(id)).not.toThrow()
    }
  })

  it('act1 reward pool should exclude starter cards meditate/light_stab', () => {
    const act1Pool = getRewardPoolByAct(1)
    expect(act1Pool).toHaveLength(18)
    expect(act1Pool.some(c => c.id === 'meditate')).toBe(false)
    expect(act1Pool.some(c => c.id === 'light_stab')).toBe(false)
  })
})
