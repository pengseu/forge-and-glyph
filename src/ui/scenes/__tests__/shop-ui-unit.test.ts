import { describe, expect, it } from 'vitest'
import { buildShopGoldText, buildShopLeaveText, buildShopMaterialOfferHtml, buildShopPriceText, buildShopServiceTitle, buildShopTabsHtml, buildShopTitleText, normalizeShopTab } from '../shop'

describe('shop ui helpers', () => {
  it('should normalize invalid tab to cards', () => {
    expect(normalizeShopTab('unknown')).toBe('cards')
    expect(normalizeShopTab('')).toBe('cards')
  })

  it('should keep supported tab values', () => {
    expect(normalizeShopTab('cards')).toBe('cards')
    expect(normalizeShopTab('materials')).toBe('materials')
    expect(normalizeShopTab('services')).toBe('services')
  })

  it('should build material offers with inventory-style artwork block', () => {
    const html = buildShopMaterialOfferHtml({ materialId: 'iron_ingot', price: 25, quantity: 2, sold: false }, 0, 99)

    expect(html).toContain('shop-material-item')
    expect(html).toContain('shop-material-art')
    expect(html).toContain('/assets/ui/materials/iron_ingot.webp')
    expect(html).not.toContain('📦')
    expect(html).toContain('铁锭')
  })

  it('should render plain-text tabs without emoji prefixes', () => {
    const html = buildShopTabsHtml('materials')

    expect(html).toContain('>卡牌</button>')
    expect(html).toContain('>材料</button>')
    expect(html).toContain('>服务</button>')
    expect(html).not.toContain('🃏')
    expect(html).not.toContain('📦')
    expect(html).not.toContain('🔧')
  })


  it('should output plain text shop labels without title service or price emoji', () => {
    expect(buildShopTitleText()).toBe('旅途商店')
    expect(buildShopGoldText(188)).toBe('余额：188')
    expect(buildShopServiceTitle('heal')).toBe('治疗')
    expect(buildShopServiceTitle('remove')).toBe('删卡')
    expect(buildShopServiceTitle('transform')).toBe('变卡')
    expect(buildShopPriceText(25)).toBe('25 金币')
    expect(buildShopLeaveText()).toBe('离开商店')
  })

})
