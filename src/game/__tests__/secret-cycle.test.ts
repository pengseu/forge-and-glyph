import { describe, expect, it } from 'vitest'
import { createDefaultMetaProfile } from '../meta'
import {
  applyFirstSecretClearRewards,
  createSecretEpilogueEvent,
  createSecretThanksEvent,
  resolvePostAct3BossSecretFlow,
} from '../secret-cycle'

describe('secret cycle stage2', () => {
  it('first hidden entry skips ordinary recognition', () => {
    const flow = resolvePostAct3BossSecretFlow({ hiddenBossClearCount: 0, cycleTier: 0 })
    expect(flow.map((step) => step.id)).toEqual(['secret_thanks_first', 'secret_boss_final', 'secret_epilogue'])
  })

  it('builds corrupted thanks and epilogue events', () => {
    const thanks = createSecretThanksEvent()
    expect(thanks.title).toBe('被侵染的鸣谢')
    expect(thanks.presentation).toBe('abyss')
    expect(thanks.body?.length).toBeGreaterThan(1)
    expect(thanks.options[0]?.label).toBe('把手放上去')

    const epilogue = createSecretEpilogueEvent()
    expect(epilogue.title).toBe('门后之言')
    expect(epilogue.options[0]?.label).toBe('接受回响')
  })

  it('awards first hidden clear meta rewards', () => {
    const next = applyFirstSecretClearRewards(createDefaultMetaProfile())
    expect(next.secretCycle.highestUnlockedTier).toBe(1)
    expect(next.secretCycle.highestClearedTier).toBe(0)
    expect(next.secretCycle.hiddenBossClearCount).toBe(1)
    expect(next.secretCycle.unlockedTitles).toContain('超越者')
    expect(next.secretCycle.unlockedStarterWeapons).toContain('rift_blade')
  })
})
