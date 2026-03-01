import { describe, expect, it } from 'vitest'
import { resolveBossAutoDropHint } from '../renderer'

describe('resolveBossAutoDropHint', () => {
  it('should show crown fragment hint for act 1 boss reward', () => {
    expect(resolveBossAutoDropHint('boss_battle', 1)).toBe('已自动获得：👑 地精王冠碎片 ×1')
  })

  it('should show generic boss material hint for non-act1 boss reward', () => {
    expect(resolveBossAutoDropHint('boss_battle', 2)).toBe('已自动获得：Boss 专属材料')
    expect(resolveBossAutoDropHint('boss_battle', 3)).toBe('已自动获得：Boss 专属材料')
  })

  it('should return null for non-boss nodes', () => {
    expect(resolveBossAutoDropHint('normal_battle', 1)).toBeNull()
    expect(resolveBossAutoDropHint('event', 2)).toBeNull()
  })
})
