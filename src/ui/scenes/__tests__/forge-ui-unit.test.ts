import { describe, expect, it } from 'vitest'
import { buildForgeActionTitle, buildForgeEnchantButtonLabel, buildForgeEnchantDetailHtml, buildForgeMaterialTagHtml, buildForgeTitleText } from '../forge'

describe('forge ui helpers', () => {
  it('should render forge material tag with artwork instead of emoji text', () => {
    const html = buildForgeMaterialTagHtml('iron_ingot', 2)
    expect(html).toContain('forge-material-tag')
    expect(html).toContain('/assets/ui/materials/iron_ingot.webp')
    expect(html).toContain('铁锭')
    expect(html).not.toContain('🪨')
  })

  it('should return forge headings and enchant labels without emoji prefixes', () => {
    expect(buildForgeTitleText()).toBe('铁匠工坊')
    expect(buildForgeActionTitle('craft')).toBe('锻造')
    expect(buildForgeActionTitle('enchant')).toBe('附魔')
    expect(buildForgeActionTitle('upgrade')).toBe('升级卡牌')
    expect(buildForgeActionTitle('remove')).toBe('精简卡组')
    expect(buildForgeEnchantButtonLabel('烈焰')).toBe('烈焰')
    expect(buildForgeEnchantButtonLabel('烈焰', 0)).toBe('烈焰→槽1')
  })

  it('renders forge enchant detail panel content', () => {
    const html = buildForgeEnchantDetailHtml('烈焰', '攻击命中施加1灼烧', '可形成共鸣：圣火')
    expect(html).toContain('forge-enchant-detail')
    expect(html).toContain('烈焰')
    expect(html).toContain('攻击命中施加1灼烧')
    expect(html).toContain('可形成共鸣：圣火')
  })
})
