import { describe, expect, it } from 'vitest'
import { rollMaterialRewardByAct } from '../materials'

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

