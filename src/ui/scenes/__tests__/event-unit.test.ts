import { describe, expect, it } from 'vitest'
import { buildEventNameHint } from '../event'

describe('buildEventNameHint', () => {
  it('should include explicit random event prefix and title', () => {
    expect(buildEventNameHint('遗弃营地')).toBe('当前随机事件：遗弃营地')
  })
})
