import { describe, expect, it } from 'vitest'
import { getTitleActionButtons } from '../title'

describe('title scene actions', () => {
  it('should expose start and style-lab actions', () => {
    expect(getTitleActionButtons()).toEqual([
      { id: 'btn-start', label: '开始冒险' },
      { id: 'btn-style-lab', label: '样式测试' },
    ])
  })
})
