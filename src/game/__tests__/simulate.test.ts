import { describe, expect, it } from 'vitest'
import { simulateRuns, simulateSingleRun } from '../simulate'

describe('simulate', () => {
  it('single run should be deterministic for fixed seed', () => {
    const a = simulateSingleRun(20260301, 60, 'skilled')
    const b = simulateSingleRun(20260301, 60, 'skilled')
    expect(a).toEqual(b)
  })

  it('batch simulation should return aggregate stats', () => {
    const summary = simulateRuns({ runs: 5, baseSeed: 42, maxBattleTurns: 60, skillTier: 'skilled' })
    expect(summary.runs).toBe(5)
    expect(summary.results).toHaveLength(5)
    expect(summary.winRate).toBeGreaterThanOrEqual(0)
    expect(summary.winRate).toBeLessThanOrEqual(1)
    expect(summary.avgTurns).toBeGreaterThan(0)
    expect(summary.avgDurationSec).toBeGreaterThan(0)
    expect(summary.avgVictoryDurationSec === null || summary.avgVictoryDurationSec > 0).toBe(true)
  })

  it('expert strategy should not underperform novice under same seed batch', () => {
    const novice = simulateRuns({ runs: 120, baseSeed: 20260302, maxBattleTurns: 80, skillTier: 'novice' })
    const expert = simulateRuns({ runs: 120, baseSeed: 20260302, maxBattleTurns: 120, skillTier: 'expert' })
    expect(expert.wins).toBeGreaterThanOrEqual(novice.wins)
  })
})
