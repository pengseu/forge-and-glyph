import { describe, it, expect } from 'vitest'
import {
  resolveEnemyPassiveText,
  resolveGoblinKingPhase2Preview,
  resolveNormalAttackMode,
  resolveSummonIntentPreview,
  resolveSupportIntentPreview,
} from '../battle'

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

  it('support intent should render heal ally preview', () => {
    const preview = resolveSupportIntentPreview({ type: 'heal_ally_lowest', value: 10 })
    expect(preview.intentText).toBe('❤️+10')
    expect(preview.intentClass).toBe('intent-defend')
  })

  it('support intent should render buff ally preview', () => {
    const preview = resolveSupportIntentPreview({ type: 'buff_ally_highest_hp', value: 2 })
    expect(preview.intentText).toBe('💪 全队+2')
    expect(preview.intentClass).toBe('intent-buff')
  })

  it('thorn vine should expose passive retaliation reminder', () => {
    expect(resolveEnemyPassiveText('thorn_vine')).toContain('反伤3')
  })
})
