import { describe, expect, it } from 'vitest'
import { resolveIntermissionRemoveCardView } from '../act-transition'

describe('act transition remove card view', () => {
  it('should use localized card name and description instead of defId', () => {
    const view = resolveIntermissionRemoveCardView({ uid: 'c1', defId: 'slash' }, true)
    expect(view.name).toContain('挥砍')
    expect(view.description).toContain('造成6伤害')
  })
})
