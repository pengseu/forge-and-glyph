import { describe, expect, it } from 'vitest'
import type { CardInstance } from '../../../game/types'
import { buildInventoryCardItemHtml, buildInventoryCardStacks, buildInventoryMaterialItemHtml, buildInventoryTabsHtml, normalizeInventoryTab, resolveInventoryMaterialName } from '../inventory'

describe('inventory ui helpers', () => {
  it('should normalize invalid tab to weapons', () => {
    expect(normalizeInventoryTab('unknown')).toBe('weapons')
    expect(normalizeInventoryTab('')).toBe('weapons')
  })

  it('should keep supported tab values', () => {
    expect(normalizeInventoryTab('weapons')).toBe('weapons')
    expect(normalizeInventoryTab('cards')).toBe('cards')
    expect(normalizeInventoryTab('materials')).toBe('materials')
  })
  it('should resolve material names without emoji prefixes', () => {
    expect(resolveInventoryMaterialName('iron_ingot')).toBe('铁锭')
    expect(resolveInventoryMaterialName('war_essence')).toBe('战魂精华')
  })

  it('should render material items with real artwork instead of box emoji', () => {
    const html = buildInventoryMaterialItemHtml('iron_ingot', 2)
    expect(html).toContain('/assets/ui/materials/iron_ingot.webp')
    expect(html).toContain('loading="lazy"')
    expect(html).toContain('铁锭')
    expect(html).toContain('×2')
    expect(html).not.toContain('📦')
  })
  it('should group duplicate cards while keeping upgraded copies separate', () => {
    const deck: CardInstance[] = [
      { uid: 'c1', defId: 'slash' },
      { uid: 'c2', defId: 'slash' },
      { uid: 'c3', defId: 'slash', upgraded: true },
      { uid: 'c4', defId: 'block' },
    ]
    const stacks = buildInventoryCardStacks(deck)
    expect(stacks).toEqual([
      { defId: 'slash', upgraded: false, count: 2 },
      { defId: 'slash', upgraded: true, count: 1 },
      { defId: 'block', upgraded: false, count: 1 },
    ])
  })

  it('should render inventory cards with description and stack count', () => {
    const html = buildInventoryCardItemHtml({ defId: 'slash', upgraded: false, count: 2 })
    expect(html).toContain('挥砍')
    expect(html).toContain('造成6伤害')
    expect(html).toContain('×2')
    expect(html).toContain('攻击')
    expect(html).toContain('card-desc')
  })

  it('should render plain-text inventory tabs without emoji prefixes', () => {
    const html = buildInventoryTabsHtml('cards')

    expect(html).toContain('>武器</button>')
    expect(html).toContain('>卡组</button>')
    expect(html).toContain('>材料</button>')
    expect(html).not.toContain('⚔️')
    expect(html).not.toContain('🃏')
    expect(html).not.toContain('📦')
  })
})
