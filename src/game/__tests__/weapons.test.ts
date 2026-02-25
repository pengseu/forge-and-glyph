import { describe, it, expect } from 'vitest'
import { ALL_WEAPONS, getWeaponDef } from '../weapons'

describe('weapons', () => {
  it('should have 2 weapon definitions', () => {
    expect(ALL_WEAPONS).toHaveLength(2)
  })

  it('should find longsword by id', () => {
    const sword = getWeaponDef('longsword')
    expect(sword.name).toBe('长剑')
    expect(sword.rarity).toBe('basic')
  })

  it('should find longsword_upgraded by id', () => {
    const sword = getWeaponDef('longsword_upgraded')
    expect(sword.name).toBe('精钢长剑')
    expect(sword.rarity).toBe('upgraded')
  })

  it('should throw when weapon not found', () => {
    expect(() => getWeaponDef('nonexistent')).toThrow('Weapon not found: nonexistent')
  })
})
