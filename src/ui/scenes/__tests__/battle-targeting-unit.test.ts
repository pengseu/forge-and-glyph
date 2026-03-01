import { describe, it, expect } from 'vitest'
import { resolveGoblinKingPhase2Preview, resolveNormalAttackMode, resolveSummonIntentPreview } from '../battle'

describe('battle targeting helpers', () => {
  it('normal attack should require target selection when multiple enemies alive', () => {
    expect(resolveNormalAttackMode(2)).toBe('target')
  })

  it('normal attack should auto target when only one enemy alive', () => {
    expect(resolveNormalAttackMode(1)).toBe('auto')
  })

  it('summon intent should be shown as heavy attack when summon slots are full', () => {
    const preview = resolveSummonIntentPreview(2, 1, 2)
    expect(preview.intentText).toBe('🗡️ 18')
    expect(preview.intentClass).toBe('intent-attack')
  })

  it('summon intent should keep summon preview when slots remain', () => {
    const preview = resolveSummonIntentPreview(1, 2, 0)
    expect(preview.intentText).toBe('👥 召唤')
    expect(preview.intentClass).toBe('intent-buff')
  })

  it('goblin king phase2 preview should show scaled double strike', () => {
    const preview = resolveGoblinKingPhase2Preview(1, 0)
    expect(preview.intentText).toBe('🗡️ 20')
    expect(preview.intentClass).toBe('intent-attack')
  })
})
