import { describe, expect, it } from 'vitest'
import { simulateRuns, simulateSingleRun } from '../simulate'

describe('simulate', () => {
  it('single run should be deterministic for fixed seed', () => {
    const a = simulateSingleRun(20260301, 30)
    const b = simulateSingleRun(20260301, 30)
    expect(a).toEqual(b)
  })

  it('batch simulation should return aggregate stats', () => {
    const summary = simulateRuns({ runs: 5, baseSeed: 42, maxBattleTurns: 25 })
    expect(summary.runs).toBe(5)
    expect(summary.results).toHaveLength(5)
    expect(summary.winRate).toBeGreaterThanOrEqual(0)
    expect(summary.winRate).toBeLessThanOrEqual(1)
    expect(summary.avgTurns).toBeGreaterThan(0)
  })
})
