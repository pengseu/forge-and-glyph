import { describe, expect, it } from 'vitest'
import { normalizeInventoryTab } from '../inventory'

describe('inventory ui helpers', () => {
  it('should normalize invalid tab to weapons', () => {
    expect(normalizeInventoryTab('unknown')).toBe('weapons')
    expect(normalizeInventoryTab('')).toBe('weapons')
  })

  it('should keep supported tab values', () => {
    expect(normalizeInventoryTab('weapons')).toBe('weapons')
    expect(normalizeInventoryTab('cards')).toBe('cards')
    expect(normalizeInventoryTab('materials')).toBe('materials')
  })
})
