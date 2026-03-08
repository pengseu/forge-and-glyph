import { describe, expect, it } from 'vitest'
import { STYLE_LAB_SCENE_OPTIONS, STYLE_LAB_LIVE_STAGE_HEIGHT, STYLE_LAB_LIVE_STAGE_WIDTH, buildStyleLabLiveStageShellHtml, computeStyleLabLiveStageScale, normalizeStyleLabScenePreset, shouldRenderLiveStyleLabPreview } from '../style-lab'

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


  it('should expose live preview stage size matching the real game canvas', () => {
    expect(STYLE_LAB_LIVE_STAGE_WIDTH).toBe(1280)
    expect(STYLE_LAB_LIVE_STAGE_HEIGHT).toBe(720)
  })

  it('should scale live preview stage by fitting inside available preview space', () => {
    expect(computeStyleLabLiveStageScale(1280, 720)).toBe(1)
    expect(computeStyleLabLiveStageScale(640, 360)).toBe(0.5)
    expect(computeStyleLabLiveStageScale(900, 500)).toBeCloseTo(0.69, 2)
  })

  it('should build a dedicated live stage shell for real scene previews', () => {
    const html = buildStyleLabLiveStageShellHtml()
    expect(html).toContain('style-lab-live-shell')
    expect(html).toContain('style-lab-live-stage')
    expect(html).toContain('style="--live-stage-width:1280px;--live-stage-height:720px;"')
  })
  it('should mark major verification scenes as live previews', () => {
    expect(shouldRenderLiveStyleLabPreview('battle')).toBe(true)
    expect(shouldRenderLiveStyleLabPreview('shop')).toBe(true)
    expect(shouldRenderLiveStyleLabPreview('map')).toBe(true)
    expect(shouldRenderLiveStyleLabPreview('title')).toBe(false)
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
