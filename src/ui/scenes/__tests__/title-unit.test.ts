import { describe, expect, it } from 'vitest'
import { buildTitleHtml } from '../title'

describe('buildTitleHtml', () => {
  it('renders sealed cycle panel before first hidden clear', () => {
    const html = buildTitleHtml({
      hasAutoSave: false,
      hasSecretCycleUnlocked: false,
      highestUnlockedTier: 0,
      selectedCycleTier: 0,
    })
    expect(html).toContain('不要进来')
    expect(html).toContain('门还没有为你打开')
    expect(html).not.toContain('第二轮回·侵影')
  })

  it('renders cycle tier list with lock reasons after unlock', () => {
    const html = buildTitleHtml({
      hasAutoSave: true,
      hasSecretCycleUnlocked: true,
      highestUnlockedTier: 1,
      selectedCycleTier: 0,
    })
    expect(html).toContain('第一轮回')
    expect(html).toContain('第二轮回·侵影')
    expect(html).toContain('深渊回响·1')
    expect(html).toContain('击败第二轮回·侵影')
  })
})
