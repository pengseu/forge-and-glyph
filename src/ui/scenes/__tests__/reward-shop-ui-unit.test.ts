import { describe, expect, it } from 'vitest'
import { buildRewardSkipLabel } from '../reward'
import { buildShopHpInfo } from '../shop'

describe('reward/shop ui helpers', () => {
  it('reward skip label should include compensation gold hint', () => {
    expect(buildRewardSkipLabel()).toBe('跳过（+25金币）')
  })

  it('shop hp info should show current hp and effective heal amount', () => {
    expect(buildShopHpInfo(20, 60, 0.3)).toBe('生命：20/60（本次治疗 +18）')
    expect(buildShopHpInfo(55, 60, 0.3)).toBe('生命：55/60（本次治疗 +5）')
  })
})
