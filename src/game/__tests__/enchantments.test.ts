import { describe, expect, it } from 'vitest'
import { getTriggeredResonances } from '../enchantments'

describe('enchantments', () => {
  it('should detect all five resonance combinations', () => {
    const ids = getTriggeredResonances(['flame', 'frost', 'thunder', 'soul', 'void', 'bless']).map(r => r.id)
    expect(ids).toEqual(['magma', 'thunderflame', 'storm', 'reaper', 'holyflame'])
  })
})
