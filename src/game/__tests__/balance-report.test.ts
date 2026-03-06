import { describe, expect, it } from 'vitest'
import { generateBalanceReport } from '../balance-report'

describe('balance report', () => {
  it('should generate deterministic report for fixed seed', () => {
    const a = generateBalanceReport({ baseSeed: 20260302, runsPerTier: 20, generatedAt: '2026-03-02T00:00:00' })
    const b = generateBalanceReport({ baseSeed: 20260302, runsPerTier: 20, generatedAt: '2026-03-02T00:00:00' })
    expect(a).toEqual(b)
  })

  it('should evaluate three skill tiers with target checks', () => {
    const report = generateBalanceReport({ baseSeed: 20260302, runsPerTier: 20, generatedAt: '2026-03-02T00:00:00' })
    expect(report.tiers).toHaveLength(3)
    expect(report.tiers.map((tier) => tier.tier)).toEqual(['novice', 'skilled', 'expert'])
    for (const tier of report.tiers) {
      expect(['novice', 'skilled', 'expert']).toContain(tier.skillTier)
      expect(tier.summary.winRate).toBeGreaterThanOrEqual(0)
      expect(tier.summary.winRate).toBeLessThanOrEqual(1)
      expect(tier.summary.avgDurationSec).toBeGreaterThan(0)
      expect(tier.confidence.winRate95.lower).toBeGreaterThanOrEqual(0)
      expect(tier.confidence.winRate95.upper).toBeLessThanOrEqual(1)
      expect(tier.confidence.winRate95.lower).toBeLessThanOrEqual(tier.summary.winRate)
      expect(tier.summary.winRate).toBeLessThanOrEqual(tier.confidence.winRate95.upper)
      expect(typeof tier.passed.winRateEstimate).toBe('boolean')
      expect(typeof tier.passed.winRateCIOverlap).toBe('boolean')
      expect(typeof tier.passed.duration).toBe('boolean')
    }
  })

  it('should optionally write latest json report for manual audit', () => {
    const report = generateBalanceReport({ baseSeed: 20260302, runsPerTier: 20, generatedAt: '2026-03-02T00:00:00' })
    const shouldPrint =
      (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.FG_WRITE_BALANCE_REPORT === '1'
    if (!shouldPrint) {
      expect(report.generatedAt).toMatch(/\d{4}-\d{2}-\d{2}/)
      return
    }

    console.log('[balance-report]')
    console.log(JSON.stringify(report, null, 2))
    expect(report.version).toBe(2)
  })
})
