import { describe, expect, it } from 'vitest'
import { buildCardCostBadgeHtml } from '../card-cost'

describe('card cost badge helpers', () => {
  it('should render stamina cost with readable label and class', () => {
    const html = buildCardCostBadgeHtml({ costType: 'stamina', costLabel: '体1' })
    expect(html).toContain('card-cost')
    expect(html).toContain('card-cost--stamina')
    expect(html).toContain('体1')
  })

  it('should render mana and hybrid costs with distinct classes', () => {
    expect(buildCardCostBadgeHtml({ costType: 'mana', costLabel: '法2' })).toContain('card-cost--mana')
    expect(buildCardCostBadgeHtml({ costType: 'hybrid', costLabel: '体1/法1' })).toContain('card-cost--hybrid')
  })

  it('should render free cost without resource confusion', () => {
    const html = buildCardCostBadgeHtml({ costType: 'free', costLabel: '免' })
    expect(html).toContain('card-cost--free')
    expect(html).toContain('免')
  })
})
