import { describe, expect, it } from 'vitest'
import { resolveCampfireMenuOptions } from '../campfire'

describe('campfire ui helpers', () => {
  it('should disable rest option when hp is full', () => {
    const options = resolveCampfireMenuOptions(80, 80)
    const rest = options.find((option) => option.id === 'rest')
    expect(rest?.disabled).toBe(true)
  })

  it('should keep option order and enable rest when hp is not full', () => {
    const options = resolveCampfireMenuOptions(52, 80)
    expect(options.map((option) => option.id)).toEqual(['rest', 'upgrade', 'continue'])
    expect(options[0]?.disabled).toBe(false)
  })


  it('should use plain-text menu titles without emoji prefixes', () => {
    const options = resolveCampfireMenuOptions(52, 80)
    expect(options.map((option) => option.title)).toEqual(['休息', '升级卡牌', '继续旅程'])
  })
})
