import { describe, expect, it } from 'vitest'
import { buildRewardMaterialChoiceHtml, buildRewardMaterialListHtml, buildRewardBossAutoDropHtml, buildRewardChoiceStripHtml, buildRewardSkipText, buildRewardSupplementRowHtml, buildRewardTitleText, buildRewardWeaponDropHtml } from '../reward'

describe('reward ui helpers', () => {
  it('should build reward material list with artwork cards instead of emoji text', () => {
    const html = buildRewardMaterialListHtml({ iron_ingot: 1, elemental_essence: 2 })

    expect(html).toContain('/assets/ui/materials/iron_ingot.webp')
    expect(html).toContain('/assets/ui/materials/elemental_essence.webp')
    expect(html).toContain('铁锭')
    expect(html).toContain('元素精华')
    expect(html).not.toContain('📦')
  })

  it('should build boss auto drop block with material artwork', () => {
    const html = buildRewardBossAutoDropHtml(2, '已自动获得：暗影水晶 ×1')

    expect(html).toContain('reward-boss-drop-hint')
    expect(html).toContain('/assets/ui/materials/shadow_crystal.webp')
    expect(html).toContain('暗影水晶')
    expect(html).not.toContain('🏆')
  })

  it('should place boss auto drop and weapon drop in the same supplement row', () => {
    const html = buildRewardSupplementRowHtml('<div class="reward-drop-item reward-drop-item--auto"></div>', '<div class="reward-drop-item reward-drop-item--weapon"></div>')

    expect(html).toContain('reward-supplement-row')
    expect(html).toContain('reward-drop-item--auto')
    expect(html).toContain('reward-drop-item--weapon')
    expect(html).toContain('reward-supplement-col reward-supplement-col--auto')
    expect(html).toContain('reward-supplement-col reward-supplement-col--weapon')
  })


  it('should place card choices and material choice in the same strip', () => {
    const html = buildRewardChoiceStripHtml('<div class="reward-card"></div><div class="reward-card"></div>', '<div class="reward-choice-material"></div>')

    expect(html).toContain('reward-choice-strip')
    expect(html).toContain('reward-card')
    expect(html).toContain('reward-choice-material')
  })

  it('should build selectable material choice bundle instead of separate lower section', () => {
    const html = buildRewardMaterialChoiceHtml({ iron_ingot: 1, elemental_essence: 2 })

    expect(html).toContain('reward-choice reward-choice--materials')
    expect(html).toContain('reward-choice-option reward-choice-material')
    expect(html).toContain('/assets/ui/materials/iron_ingot.webp')
    expect(html).toContain('/assets/ui/materials/elemental_essence.webp')
    expect(html).not.toContain('btn-take-material')
  })



  it('should build weapon drop block as already collected with equip action copy', () => {
    const html = buildRewardWeaponDropHtml('iron_staff')

    expect(html).toContain('reward-drop-item--weapon')
    expect(html).toContain('已收入背包')
    expect(html).toContain('立即装备')
    expect(html).not.toContain('武器掉落')
  })

  it('should expose plain-text reward title and skip copy without emoji', () => {
    expect(buildRewardTitleText()).toBe('战斗胜利')
    expect(buildRewardSkipText(25)).toBe('跳过，获得 25 金币')
  })
})
