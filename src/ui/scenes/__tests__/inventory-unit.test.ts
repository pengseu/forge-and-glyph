import { describe, expect, it } from 'vitest'
import {
  buildInventoryWeaponEnchantGlyphs,
  resolveInventoryWeaponRarityTag,
  resolveInventoryWeaponTypeLabel,
} from '../inventory'

describe('inventory weapon card helpers', () => {
  it('should resolve weapon category label by def id', () => {
    expect(resolveInventoryWeaponTypeLabel('iron_longsword')).toBe('长剑·武器')
    expect(resolveInventoryWeaponTypeLabel('iron_staff')).toBe('法杖·武器')
    expect(resolveInventoryWeaponTypeLabel('iron_bow')).toBe('弓·武器')
  })

  it('should resolve rarity tag text', () => {
    expect(resolveInventoryWeaponRarityTag('basic')).toBe('基础')
    expect(resolveInventoryWeaponRarityTag('upgraded')).toBe('进阶')
    expect(resolveInventoryWeaponRarityTag('legendary')).toBe('传说')
    expect(resolveInventoryWeaponRarityTag('replica')).toBe('仿品')
  })

  it('should render at most three enchant glyphs', () => {
    expect(buildInventoryWeaponEnchantGlyphs(['flame', 'thunder', 'frost', 'void'])).toEqual(['火', '雷', '冰'])
  })
})
