import { describe, it, expect } from 'vitest'
import { resolveNormalAttackMode } from '../battle'

describe('battle targeting helpers', () => {
  it('normal attack should require target selection when multiple enemies alive', () => {
    expect(resolveNormalAttackMode(2)).toBe('target')
  })

  it('normal attack should auto target when only one enemy alive', () => {
    expect(resolveNormalAttackMode(1)).toBe('auto')
  })
})
