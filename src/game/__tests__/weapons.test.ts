import { describe, it, expect } from 'vitest'
import { ALL_WEAPONS, describeWeaponEffect, getWeaponDef } from '../weapons'

describe('weapons', () => {
  it('should include forge weapon definitions', () => {
    expect(ALL_WEAPONS.length).toBeGreaterThanOrEqual(10)
  })

  it('should find iron_longsword by id', () => {
    const sword = getWeaponDef('iron_longsword')
    expect(sword.name).toBe('铁制长剑')
    expect(sword.rarity).toBe('basic')
    expect(sword.effect.type).toBe('next_combat_discount')
  })

  it('should find steel_longsword by id', () => {
    const sword = getWeaponDef('steel_longsword')
    expect(sword.name).toContain('精钢长剑')
    expect(sword.rarity).toBe('upgraded')
    expect(sword.effect.type).toBe('next_combat_discount')
  })

  it('should throw when weapon not found', () => {
    expect(() => getWeaponDef('nonexistent')).toThrow('Weapon not found: nonexistent')
  })

  it('should describe structured weapon effect text', () => {
    const bow = getWeaponDef('iron_bow')
    expect(describeWeaponEffect(bow.effect)).toContain('首个攻击伤害+30%')
  })

  it('should include legendary and replica weapon definitions', () => {
    expect(getWeaponDef('mythic_ant_swarm_dagger').rarity).toBe('legendary')
    expect(getWeaponDef('replica_ant_swarm_dagger').rarity).toBe('replica')
  })
})
