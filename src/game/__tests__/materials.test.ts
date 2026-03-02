import { describe, expect, it } from 'vitest'
import { isBattleUsableMaterial, rollMaterialRewardByAct } from '../materials'

describe('material drops by act', () => {
  it('act1 elite should drop elemental essence only', () => {
    const drop = rollMaterialRewardByAct('elite_battle', 1, () => 0.9)
    expect(drop).toEqual({ elemental_essence: 1 })
  })

  it('act1 normal should drop iron ingot', () => {
    const drop = rollMaterialRewardByAct('normal_battle', 1, () => 0.2)
    expect(drop).toEqual({ iron_ingot: 1 })
  })
})

describe('battle material availability', () => {
  it('should mark boss key materials as non-battle-usable', () => {
    expect(isBattleUsableMaterial('goblin_crown_fragment')).toBe(false)
    expect(isBattleUsableMaterial('shadow_crystal')).toBe(false)
    expect(isBattleUsableMaterial('abyss_heart')).toBe(false)
  })

  it('should keep combat utility materials battle-usable', () => {
    expect(isBattleUsableMaterial('iron_ingot')).toBe(true)
    expect(isBattleUsableMaterial('elemental_essence')).toBe(true)
    expect(isBattleUsableMaterial('meteor_iron_ingot')).toBe(true)
  })
})
