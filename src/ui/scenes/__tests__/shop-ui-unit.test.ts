import { describe, expect, it } from 'vitest'
import { normalizeShopTab } from '../shop'

describe('shop ui helpers', () => {
  it('should normalize invalid tab to cards', () => {
    expect(normalizeShopTab('unknown')).toBe('cards')
    expect(normalizeShopTab('')).toBe('cards')
  })

  it('should keep supported tab values', () => {
    expect(normalizeShopTab('cards')).toBe('cards')
    expect(normalizeShopTab('materials')).toBe('materials')
    expect(normalizeShopTab('services')).toBe('services')
  })
})
