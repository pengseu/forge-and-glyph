import { describe, it, expect } from 'vitest'
import { createBattleState } from '../combat'
import { getNodeHpScale, scaleEnemyHp } from '../difficulty'

describe('difficulty scaling', () => {
  it('normal battle hp scale should grow by layer', () => {
    expect(getNodeHpScale(1, 'normal_battle', 1)).toBe(1)
    expect(getNodeHpScale(6, 'normal_battle', 1)).toBe(1.2)
    expect(getNodeHpScale(6, 'normal_battle', 2)).toBe(1.32)
    expect(getNodeHpScale(6, 'normal_battle', 3)).toBe(1.4)
  })

  it('elite battle should have extra hp scale bonus', () => {
    expect(getNodeHpScale(4, 'elite_battle', 1)).toBe(1.15)
    expect(getNodeHpScale(4, 'elite_battle', 2)).toBe(1.24)
    expect(getNodeHpScale(4, 'elite_battle', 3)).toBe(1.3)
  })

  it('boss battle should keep baseline hp scale', () => {
    expect(getNodeHpScale(8, 'boss_battle', 3)).toBe(1)
  })

  it('scaleEnemyHp should increase enemy hp and maxHp', () => {
    const state = createBattleState(['goblin_scout'])
    const scaled = scaleEnemyHp(state.enemies, 1.2)
    expect(scaled[0].maxHp).toBe(Math.floor(28 * 1.2))
    expect(scaled[0].hp).toBe(Math.floor(28 * 1.2))
  })
})
