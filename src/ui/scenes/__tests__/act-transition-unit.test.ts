import { describe, expect, it } from 'vitest'
import { resolveActTransitionModeMeta } from '../act-transition'

describe('act-transition helpers', () => {
  it('should resolve pick mode metadata', () => {
    const meta = resolveActTransitionModeMeta('knowledge_pick')
    expect(meta.kind).toBe('pick')
    expect(meta.title).toContain('知识积累')
  })

  it('should resolve remove mode metadata', () => {
    const meta = resolveActTransitionModeMeta('deep_purify')
    expect(meta.kind).toBe('remove')
    expect(meta.allowConfirm).toBe(true)
  })
})
