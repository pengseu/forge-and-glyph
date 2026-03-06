import { describe, expect, it } from 'vitest'
import { STYLE_LAB_SCENE_OPTIONS, normalizeStyleLabScenePreset } from '../style-lab'

describe('style-lab helpers', () => {
  it('should normalize invalid scene preset to title', () => {
    expect(normalizeStyleLabScenePreset('unknown')).toBe('title')
    expect(normalizeStyleLabScenePreset('')).toBe('title')
  })

  it('should keep supported scene preset values', () => {
    expect(normalizeStyleLabScenePreset('title')).toBe('title')
    expect(normalizeStyleLabScenePreset('battle')).toBe('battle')
    expect(normalizeStyleLabScenePreset('campfire')).toBe('campfire')
  })

  it('should include all major scene presets for visual testing', () => {
    expect(STYLE_LAB_SCENE_OPTIONS).toEqual(expect.arrayContaining([
      { id: 'title', label: '标题' },
      { id: 'battle', label: '战斗' },
      { id: 'map', label: '地图' },
      { id: 'reward', label: '奖励' },
      { id: 'campfire', label: '篝火' },
      { id: 'shop', label: '商店' },
      { id: 'inventory', label: '背包' },
      { id: 'forge', label: '锻造' },
      { id: 'enchant', label: '附魔' },
      { id: 'event', label: '事件' },
      { id: 'act_transition', label: '幕间' },
      { id: 'result', label: '结算' },
    ]))
  })
})
