import { describe, it, expect } from 'vitest'
import { ALL_CARDS, getCardDef, STARTER_DECK_RECIPE } from '../cards'

describe('cards', () => {
  it('should have 10 card definitions', () => {
    expect(ALL_CARDS).toHaveLength(10)
  })

  it('should find card by id', () => {
    const slash = getCardDef('slash')
    expect(slash.name).toBe('挥砍')
    expect(slash.cost).toBe(1)
    expect(slash.costType).toBe('stamina')
  })

  it('starter deck should have 15 cards', () => {
    const total = STARTER_DECK_RECIPE.reduce((sum, r) => sum + r.count, 0)
    expect(total).toBe(15)
  })
})
