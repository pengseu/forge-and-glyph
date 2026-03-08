import { describe, expect, it } from 'vitest'
import { buildMapCompletedStampHtml, buildMapCurrentNodeAccentHtml, buildMapNodeHitAreaStyle, buildMapNodeInfoSummary, buildMapNodeLabelClass, buildMapRewardHintHtml, buildMapSideArtStyle, buildMapSideContentStyle, buildMapSideMetaVisibility, buildMapSideShellRect, buildMapStageShellRect, buildMapTopStatHtml, buildMapViewportOverlayStyle, buildMapViewportRect, buildMapWeaponStatHtml, buildMapWeaponStatTitle, canMapNodeBeSelected, computeMapBoardRect, computeMapScrollTarget, fitMapNodeCenterX, fitRectContain, resolveMapNodeBadgeSrc, resolveMapWeaponIconSrc, shouldActivateMapNodeKey } from '../map'
import type { MapNode } from '../../../game/types'

function makeNode(type: MapNode['type']): MapNode {
  return {
    id: 'n1',
    type,
    completed: false,
    x: 0,
    y: 0,
    connections: [],
  }
}

describe('map scene helpers', () => {
  it('should resolve map badge assets to webp files', () => {
    expect(resolveMapNodeBadgeSrc('battle')).toBe('/assets/ui/map/map-node-battle.webp')
    expect(resolveMapNodeBadgeSrc('boss')).toBe('/assets/ui/map/map-node-boss.webp')
    expect(resolveMapNodeBadgeSrc('shop')).toBe('/assets/ui/map/map-node-shop.webp')
  })

  it('should build readable summary for forge node', () => {
    const summary = buildMapNodeInfoSummary(makeNode('forge'), 2)
    expect(summary.title).toContain('铁匠')
    expect(summary.detail).toContain('锻造')
    expect(summary.stateHint).toContain('选择')
  })

  it('should build boss summary with act-specific pressure hint', () => {
    const summary = buildMapNodeInfoSummary(makeNode('boss_battle'), 3)
    expect(summary.title).toContain('Boss')
    expect(summary.detail).toContain('幕终战')
    expect(summary.rewardHint).toContain('Boss')
  })

  it('should render completed node stamp html for finished nodes', () => {
    expect(buildMapCompletedStampHtml(true)).toContain('map-node-stamp')
    expect(buildMapCompletedStampHtml(true)).toContain('已达成')
    expect(buildMapCompletedStampHtml(false)).toBe('')
  })

  it('should emphasize reward body after prefix for faster scanning', () => {
    expect(buildMapRewardHintHtml('主要收益：金币、材料与卡牌奖励。')).toContain('map-side-block-emphasis')
    expect(buildMapRewardHintHtml('主要收益：金币、材料与卡牌奖励。')).toContain('主要收益')
  })

  it('should render a paper accent for current node without using glow effects', () => {
    expect(buildMapCurrentNodeAccentHtml(true)).toContain('map-node-current-accent')
    expect(buildMapCurrentNodeAccentHtml(true)).toContain('当前')
    expect(buildMapCurrentNodeAccentHtml(false)).toBe('')
  })

  it('should not show current accent on completed nodes', () => {
    expect(buildMapCurrentNodeAccentHtml(true, true)).toBe('')
    expect(buildMapCurrentNodeAccentHtml(true, false)).toContain('当前')
  })

  it('should expose enlarged map node hit area for easier pointer targeting', () => {
    expect(buildMapNodeHitAreaStyle()).toBe('--map-node-hit-width:104px;--map-node-hit-height:112px;')
  })

  it('should keep only current and available nodes keyboard-selectable', () => {
    expect(canMapNodeBeSelected('available')).toBe(true)
    expect(canMapNodeBeSelected('current')).toBe(true)
    expect(canMapNodeBeSelected('completed')).toBe(false)
    expect(canMapNodeBeSelected('locked')).toBe(false)
  })

  it('should only activate node selection on Enter and Space keys', () => {
    expect(shouldActivateMapNodeKey('Enter')).toBe(true)
    expect(shouldActivateMapNodeKey(' ')).toBe(true)
    expect(shouldActivateMapNodeKey('Escape')).toBe(false)
  })

  it('should only show compact paper labels for current and available nodes', () => {
    expect(buildMapNodeLabelClass('current')).toBe('map-node-label map-node-label--visible')
    expect(buildMapNodeLabelClass('available')).toBe('map-node-label map-node-label--visible')
    expect(buildMapNodeLabelClass('completed')).toBe('map-node-label map-node-label--hidden')
    expect(buildMapNodeLabelClass('locked')).toBe('map-node-label map-node-label--hidden')
  })

  it('should render top stats with title hints for readability', () => {
    const html = buildMapTopStatHtml('金币', 128, '金币：用于商店、事件与部分锻造消耗')
    expect(html).toContain('title="金币：用于商店、事件与部分锻造消耗"')
    expect(html).toContain('金币')
    expect(html).toContain('128')
  })

  it('should render equipped weapon with icon when artwork exists', () => {
    expect(resolveMapWeaponIconSrc('iron_longsword')).toBe('/assets/weapons/iron_longsword.webp')
    const html = buildMapWeaponStatHtml('iron_longsword')
    expect(html).toContain('已装备武器：铁制长剑')
    expect(html).toContain('<img')
    expect(html).toContain('/assets/weapons/iron_longsword.webp')
  })

  it('should include weapon effect in top bar title for quick inspection', () => {
    const title = buildMapWeaponStatTitle('iron_longsword')
    expect(title).toContain('已装备武器：铁制长剑')
    expect(title).toContain('下一张战技卡费用-1')
  })

  it('should gracefully fall back to short text when weapon artwork is unavailable', () => {
    expect(resolveMapWeaponIconSrc('steel_dagger')).toBe(null)
    const html = buildMapWeaponStatHtml('steel_dagger')
    expect(html).toContain('已装备武器：精钢匕首')
    expect(html).toContain('匕')
  })

  it('should return empty html when no weapon is equipped', () => {
    expect(buildMapWeaponStatHtml(undefined)).toBe('')
  })

  it('should fit board art into container without changing aspect ratio', () => {
    expect(fitRectContain(800, 600, 1600, 1100)).toEqual({ width: 800, height: 550, left: 0, top: 25 })
  })

  it('should fit tall side art into panel without stretching', () => {
    expect(fitRectContain(308, 620, 720, 960)).toEqual({ width: 308, height: 410.67, left: 0, top: 104.67 })
  })

  it('should place map board around node cluster instead of centering in whole canvas', () => {
    const rect = computeMapBoardRect(876, 752, { minX: 110, maxX: 438, minY: 92, maxY: 518 })
    expect(rect.top).toBeLessThan(70)
    expect(rect.left).toBeLessThanOrEqual(40)
    expect(rect.left + rect.width).toBeGreaterThanOrEqual(538)
    expect(rect.top + rect.height).toBeGreaterThanOrEqual(618)
  })

  it('should place side panel text at 100 top and 40 horizontal padding', () => {
    expect(buildMapSideContentStyle()).toBe('padding:100px 40px 24px;')
  })

  it('should use exact side art frame params from design', () => {
    expect(buildMapSideArtStyle()).toBe('left:0px;top:0px;width:300px;height:572px;')
  })

  it('should hide side legend and footer in narrow panel mode', () => {
    expect(buildMapSideMetaVisibility()).toEqual({ legend: false, footer: false })
  })

  it('should expose fixed left stage shell size for art panel', () => {
    expect(buildMapStageShellRect()).toEqual({ width: 800, height: 550 })
  })

  it('should expose centered map viewport size inside left art panel', () => {
    expect(buildMapViewportRect()).toEqual({ width: 582, height: 345, left: 109, top: 103 })
  })

  it('should expose fixed right side shell size for art panel', () => {
    expect(buildMapSideShellRect()).toEqual({ width: 300, height: 572 })
  })

  it('should center scroll target using only vertical scrolling', () => {
    expect(computeMapScrollTarget(518, 98, 345)).toEqual({ left: 0, top: 394.5 })
  })

  it('should fit node x positions into viewport width without horizontal scroll', () => {
    expect(fitMapNodeCenterX(0, 0, 4, 582)).toBe(72)
    expect(fitMapNodeCenterX(2, 0, 4, 582)).toBe(291)
    expect(fitMapNodeCenterX(4, 0, 4, 582)).toBe(510)
  })

  it('should keep viewport overlay fixed to viewport bounds', () => {
    expect(buildMapViewportOverlayStyle()).toBe('left:0px;top:0px;width:582px;height:345px;')
  })

})
