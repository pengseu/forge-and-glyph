import { describe, expect, it } from 'vitest'
import { buildCardCostBadgeHtml } from '../card-cost'

describe('card cost badge helpers', () => {
  it('renders stamina cost as resource chip plus numeric value', () => {
    const html = buildCardCostBadgeHtml({ costType: 'stamina', costLabel: '体1' })
    expect(html).toContain('card-cost')
    expect(html).toContain('card-cost--stamina')
    expect(html).toContain('card-cost__resource')
    expect(html).toContain('card-cost__resource--paper')
    expect(html).toContain('card-cost__value-current')
    expect(html).toContain('>体<')
    expect(html).toContain('>1<')
  })

  it('renders mana discount with old and current values', () => {
    const html = buildCardCostBadgeHtml({ costType: 'mana', costLabel: '法4→2' })
    expect(html).toContain('card-cost--mana')
    expect(html).toContain('card-cost__value-old')
    expect(html).toContain('card-cost__arrow')
    expect(html).toContain('card-cost__value-current')
    expect(html).toContain('>法<')
    expect(html).toContain('>4<')
    expect(html).toContain('>2<')
  })

  it('renders hybrid cost as two resource-number pairs', () => {
    const html = buildCardCostBadgeHtml({ costType: 'hybrid', costLabel: '体1/法2' })
    expect(html).toContain('card-cost--hybrid')
    expect(html.match(/card-cost__pair/g)?.length).toBe(2)
    expect(html).toContain('>体<')
    expect(html).toContain('>法<')
    expect(html).toContain('>1<')
    expect(html).toContain('>2<')
  })

  it('renders free cost without resource chip', () => {
    const html = buildCardCostBadgeHtml({ costType: 'free', costLabel: '免' })
    expect(html).toContain('card-cost--free')
    expect(html).toContain('card-cost__value-free')
    expect(html).toContain('card-cost__value--paper')
    expect(html).toContain('>免<')
    expect(html).not.toContain('card-cost__resource')
  })

  it('falls back safely for neutral numeric labels', () => {
    const html = buildCardCostBadgeHtml({ costType: 'mystery', costLabel: '3' })
    expect(html).toContain('card-cost--neutral')
    expect(html).toContain('card-cost__value-current')
    expect(html).toContain('>3<')
  })
})
