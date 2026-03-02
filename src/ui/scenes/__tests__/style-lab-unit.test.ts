import { describe, expect, it } from 'vitest'
import {
  STYLE_LAB_PREVIEW_MODES,
  STYLE_LAB_CARD_SKINS,
  clampCardLayoutElement,
  createDefaultCardLayout,
  resolveStyleLabPreviewTitle,
  serializeCardLayoutConfig,
} from '../style-lab'

describe('style lab preview config', () => {
  it('should include key scene previews and card-layout mode', () => {
    expect(STYLE_LAB_PREVIEW_MODES).toEqual(['battle', 'map', 'shop', 'reward', 'event', 'weapon_select', 'inventory', 'card_layout'])
  })

  it('should resolve readable scene titles', () => {
    expect(resolveStyleLabPreviewTitle('battle')).toContain('战斗')
    expect(resolveStyleLabPreviewTitle('map')).toContain('地图')
    expect(resolveStyleLabPreviewTitle('shop')).toContain('商店')
    expect(resolveStyleLabPreviewTitle('reward')).toContain('奖励')
    expect(resolveStyleLabPreviewTitle('event')).toContain('事件')
    expect(resolveStyleLabPreviewTitle('weapon_select')).toContain('武器选择')
    expect(resolveStyleLabPreviewTitle('inventory')).toContain('背包')
    expect(resolveStyleLabPreviewTitle('card_layout')).toContain('卡牌')
  })

  it('should bind style-lab-only card skins from local assets', () => {
    expect(STYLE_LAB_CARD_SKINS.weapon).toContain('stylelab_weapon_card_bg')
    expect(STYLE_LAB_CARD_SKINS.hand).toContain('stylelab_hand_card_bg')
  })

  it('should clamp card element positions into card canvas bounds', () => {
    const result = clampCardLayoutElement(
      { x: -30, y: -20, width: 500, height: 600, fontSize: 99 },
      { width: 320, height: 480 },
    )
    expect(result).toEqual({ x: 0, y: 0, width: 320, height: 480, fontSize: 48 })
  })

  it('should serialize layout config into readable json', () => {
    const layout = createDefaultCardLayout('weapon')
    const json = serializeCardLayoutConfig('weapon', layout)
    const parsed = JSON.parse(json)
    expect(parsed.template).toBe('weapon')
    expect(parsed.elements.name).toBeDefined()
    expect(parsed.elements.description).toBeDefined()
    expect(parsed.elements.type).toBeDefined()
    expect(parsed.elements.enchant_1).toBeDefined()
    expect(parsed.elements.enchant_2).toBeDefined()
    expect(parsed.elements.enchant_3).toBeDefined()
  })

  it('should apply latest hand-card default positions from provided percentages', () => {
    const layout = createDefaultCardLayout('hand')
    expect(layout.elements.name).toEqual({ x: 47, y: 14, width: 258, height: 40, fontSize: 22 })
    expect(layout.elements.cost).toEqual({ x: 32, y: 69, width: 40, height: 40, fontSize: 30 })
    expect(layout.elements.art).toEqual({ x: 49, y: 73, width: 240, height: 215, fontSize: 12 })
    expect(layout.elements.description).toEqual({ x: 38, y: 343, width: 267, height: 105, fontSize: 14 })
    expect(layout.elements.type).toEqual({ x: 145, y: 273, width: 49, height: 49, fontSize: 23 })
  })

  it('should apply latest weapon-card default positions from provided percentages', () => {
    const layout = createDefaultCardLayout('weapon')
    expect(layout.elements.name).toEqual({ x: 34, y: 43, width: 225, height: 20, fontSize: 18 })
    expect(layout.elements.art).toEqual({ x: 54, y: 80, width: 230, height: 200, fontSize: 12 })
    expect(layout.elements.enchant_1).toEqual({ x: 37, y: 300, width: 30, height: 30, fontSize: 16 })
    expect(layout.elements.enchant_2).toEqual({ x: 89, y: 300, width: 30, height: 30, fontSize: 16 })
    expect(layout.elements.enchant_3).toEqual({ x: 142, y: 300, width: 30, height: 30, fontSize: 16 })
    expect(layout.elements.type).toEqual({ x: 190, y: 305, width: 80, height: 30, fontSize: 18 })
    expect(layout.elements.description).toEqual({ x: 38, y: 359, width: 260, height: 85, fontSize: 13 })
  })
})
