import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { generateBalanceReport } from '../src/game/balance-report'

const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {}
const runsPerTier = Math.max(20, Number(env.FG_RUNS_PER_TIER ?? 300))
const baseSeed = Number(env.FG_BASE_SEED ?? 20260302)

const report = generateBalanceReport({
  baseSeed,
  runsPerTier,
})

const outPath = resolve(process.cwd(), '试玩记录/balance-report-latest.json')
mkdirSync(resolve(process.cwd(), '试玩记录'), { recursive: true })
writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf-8')

console.log('[balance-report]')
console.log(`saved: ${outPath}`)
console.log(`runsPerTier: ${report.runsPerTier}, baseSeed: ${report.baseSeed}, overallPassed: ${report.overallPassed}`)
for (const tier of report.tiers) {
  const duration = tier.summary.avgVictoryDurationSec ?? -1
  console.log(
    `${tier.tier}: wins=${tier.summary.wins}/${tier.summary.runs} ` +
      `wr=${tier.summary.winRate.toFixed(3)} ` +
      `wr95=[${tier.confidence.winRate95.lower.toFixed(3)},${tier.confidence.winRate95.upper.toFixed(3)}] ` +
      `victoryDur=${duration >= 0 ? duration.toFixed(1) : 'NA'} ` +
      `pass(wrEstimate=${tier.passed.winRateEstimate},wrCI=${tier.passed.winRateCIOverlap},dur=${tier.passed.duration})`,
  )
}
