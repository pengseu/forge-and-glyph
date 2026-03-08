import { describe, expect, it } from 'vitest'
import { resolveStartingWeaponPreview } from '../weapon-select'

describe('weapon-select helpers', () => {
  it('should resolve sword preview metadata', () => {
    const sword = resolveStartingWeaponPreview('iron_longsword')
    expect(sword.archClass).toBe('sword')
    expect(sword.buttonId).toBe('btn-pick-longsword')
    expect(sword.sprite).toBe('/assets/weapons/iron_longsword.webp')
  })

  it('should resolve staff preview metadata', () => {
    const staff = resolveStartingWeaponPreview('iron_staff')
    expect(staff.archClass).toBe('staff')
    expect(staff.buttonId).toBe('btn-pick-staff')
    expect(staff.sprite).toBe('/assets/weapons/iron_staff.webp')
  })


  it('should keep preview metadata free of text emoji markers', () => {
    expect(resolveStartingWeaponPreview('iron_longsword').icon).toBe('')
    expect(resolveStartingWeaponPreview('iron_staff').icon).toBe('')
  })
})
