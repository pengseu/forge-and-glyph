import { describe, expect, it } from 'vitest'
import { buildSceneRewardNoticeHtml, resolveBossAutoDropHint, shouldAnimateSceneTransition } from '../renderer'

describe('resolveBossAutoDropHint', () => {
  it('should show crown fragment hint for act 1 boss reward', () => {
    expect(resolveBossAutoDropHint('boss_battle', 1)).toBe('已自动获得：地精王冠碎片 ×1')
  })

  it('should show act-specific boss material hints for later acts', () => {
    expect(resolveBossAutoDropHint('boss_battle', 2)).toBe('已自动获得：暗影水晶 ×1')
    expect(resolveBossAutoDropHint('boss_battle', 3)).toBe('已自动获得：深渊之心 ×1')
  })

  it('should return null for non-boss nodes', () => {
    expect(resolveBossAutoDropHint('normal_battle', 1)).toBeNull()
    expect(resolveBossAutoDropHint('event', 2)).toBeNull()
  })
})


describe('shouldAnimateSceneTransition', () => {
  it('should skip generic transition when entering weapon select from title', () => {
    expect(shouldAnimateSceneTransition('title', 'weapon_select')).toBe(false)
  })

  it('should keep generic transitions for normal scene changes', () => {
    expect(shouldAnimateSceneTransition('map', 'battle')).toBe(true)
    expect(shouldAnimateSceneTransition('weapon_select', 'map')).toBe(true)
  })

  it('should not animate when previous scene is unavailable', () => {
    expect(shouldAnimateSceneTransition(null, 'title')).toBe(false)
  })
})

describe('buildSceneRewardNoticeHtml', () => {
  it('should build a generic reward overlay for non-event scenes', () => {
    const html = buildSceneRewardNoticeHtml('已获得 60 金币、精钢锭×1、元素精华×1')
    expect(html).toContain('scene-reward-notice')
    expect(html).toContain('event-reward-notice')
    expect(html).toContain('元素精华×1')
  })
})
