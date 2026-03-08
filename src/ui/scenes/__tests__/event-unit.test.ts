import { describe, expect, it } from 'vitest'
import { buildEventBodyHtml, buildEventNameHint, resolveEventTextureKind } from '../event'

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


describe('buildEventBodyHtml', () => {
  it('should render multiline abyss event body blocks', () => {
    const html = buildEventBodyHtml({
      id: 'secret_thanks_first',
      title: '被侵染的鸣谢',
      description: 'fallback',
      presentation: 'abyss',
      body: [
        { text: '感谢你玩到这里。' },
        { text: '门已经记住你了。', tone: 'corrupt' },
      ],
      options: [],
    })
    expect(html).toContain('event-desc-block')
    expect(html).toContain('感谢你玩到这里。')
    expect(html).toContain('门已经记住你了。')
  })
})

describe('resolveEventTextureKind secret cycle', () => {
  it('should map secret cycle events to dark texture variants', () => {
    expect(resolveEventTextureKind('secret_thanks_first')).toBe('dark')
  })
})
