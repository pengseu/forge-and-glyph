import { describe, expect, it } from 'vitest'
import { buildEventNameHint, resolveEventTextureKind } from '../event'

describe('buildEventNameHint', () => {
  it('should include explicit random event prefix and title', () => {
    expect(buildEventNameHint('遗弃营地')).toBe('当前随机事件：遗弃营地')
  })
})

describe('resolveEventTextureKind', () => {
  it('should map event groups to texture variants', () => {
    expect(resolveEventTextureKind('shadow_altar')).toBe('dark')
    expect(resolveEventTextureKind('traveler')).toBe('warm')
    expect(resolveEventTextureKind('trial_choice')).toBe('cool')
  })
})
