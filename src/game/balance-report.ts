import { simulateRuns, type SimulationSkillTier } from './simulate'

export type BalanceTier = 'novice' | 'skilled' | 'expert'

export interface TierTarget {
  winRate: { min: number; max: number }
  durationSec: { min: number; max: number }
}

export interface ConfidenceInterval {
  lower: number
  upper: number
}

export interface BalanceTierReport {
  tier: BalanceTier
  skillTier: SimulationSkillTier
  maxBattleTurns: number
  target: TierTarget
  confidence: {
    winRate95: ConfidenceInterval
  }
  summary: {
    runs: number
    wins: number
    winRate: number
    avgDurationSec: number
    avgVictoryDurationSec: number | null
    avgTurns: number
  }
  passed: {
    winRateEstimate: boolean
    winRateCIOverlap: boolean
    duration: boolean
  }
}

export interface BalanceReport {
  version: 2
  generatedAt: string
  baseSeed: number
  runsPerTier: number
  tiers: BalanceTierReport[]
  overallPassed: boolean
}

const TIER_SPECS: Array<{
  tier: BalanceTier
  skillTier: SimulationSkillTier
  seedOffset: number
  maxBattleTurns: number
  target: TierTarget
}> = [
  {
    tier: 'novice',
    skillTier: 'novice',
    seedOffset: 0,
    maxBattleTurns: 60,
    target: {
      winRate: { min: 0.3, max: 0.5 },
      durationSec: { min: 2400, max: 3300 },
    },
  },
  {
    tier: 'skilled',
    skillTier: 'skilled',
    seedOffset: 10_000,
    maxBattleTurns: 80,
    target: {
      winRate: { min: 0.6, max: 0.8 },
      durationSec: { min: 1800, max: 2700 },
    },
  },
  {
    tier: 'expert',
    skillTier: 'expert',
    seedOffset: 20_000,
    maxBattleTurns: 120,
    target: {
      winRate: { min: 0.85, max: 1 },
      durationSec: { min: 1320, max: 2100 },
    },
  },
]

function inRange(value: number, range: { min: number; max: number }): boolean {
  return value >= range.min && value <= range.max
}

function calcWilsonInterval(wins: number, runs: number, z: number = 1.96): ConfidenceInterval {
  if (runs <= 0) return { lower: 0, upper: 0 }
  const p = wins / runs
  const z2 = z * z
  const denom = 1 + z2 / runs
  const center = (p + z2 / (2 * runs)) / denom
  const margin = (z * Math.sqrt((p * (1 - p) + z2 / (4 * runs)) / runs)) / denom
  return {
    lower: Math.max(0, center - margin),
    upper: Math.min(1, center + margin),
  }
}

export function generateBalanceReport(options?: {
  baseSeed?: number
  runsPerTier?: number
  generatedAt?: string
}): BalanceReport {
  const baseSeed = options?.baseSeed ?? 20260302
  const runsPerTier = Math.max(10, Math.floor(options?.runsPerTier ?? 200))
  const generatedAt = options?.generatedAt ?? new Date().toISOString().slice(0, 19)

  const tiers: BalanceTierReport[] = TIER_SPECS.map((spec) => {
    const summary = simulateRuns({
      runs: runsPerTier,
      baseSeed: baseSeed + spec.seedOffset,
      maxBattleTurns: spec.maxBattleTurns,
      skillTier: spec.skillTier,
    })

    const ci = calcWilsonInterval(summary.wins, summary.runs)
    const durationSource = summary.avgVictoryDurationSec

    const passed = {
      winRateEstimate: inRange(summary.winRate, spec.target.winRate),
      winRateCIOverlap: ci.upper >= spec.target.winRate.min && ci.lower <= spec.target.winRate.max,
      duration: durationSource !== null && inRange(durationSource, spec.target.durationSec),
    }

    return {
      tier: spec.tier,
      skillTier: spec.skillTier,
      maxBattleTurns: spec.maxBattleTurns,
      target: spec.target,
      confidence: {
        winRate95: ci,
      },
      summary: {
        runs: summary.runs,
        wins: summary.wins,
        winRate: summary.winRate,
        avgDurationSec: summary.avgDurationSec,
        avgVictoryDurationSec: summary.avgVictoryDurationSec,
        avgTurns: summary.avgTurns,
      },
      passed,
    }
  })

  return {
    version: 2,
    generatedAt,
    baseSeed,
    runsPerTier,
    tiers,
    overallPassed: tiers.every((tier) => tier.passed.winRateEstimate && tier.passed.duration),
  }
}
