import { describe, expect, it } from 'vitest'
import { buildHandCardStyleVars, resolveFlatHandLayout } from '../battle'
import { buildMapCurvePath } from '../map'

describe('layout helpers', () => {
  it('should keep a single hand card at the starting edge with full step width', () => {
    expect(resolveFlatHandLayout(1)).toEqual({
      maxWidth: 600,
      cardWidth: 120,
      step: 120,
      cards: [{ left: 0, z: 100 }],
    })
  })

  it('should compress step only when the hand would overflow 600px', () => {
    const roomy = resolveFlatHandLayout(4)
    const crowded = resolveFlatHandLayout(8)

    expect(roomy.step).toBe(120)
    expect(crowded.step).toBeLessThan(roomy.step)
    expect(crowded.cards.at(-1)?.left).toBeLessThanOrEqual(600 - crowded.cardWidth)
  })

  it('should output css variable style for flat hand cards', () => {
    const style = buildHandCardStyleVars(1, resolveFlatHandLayout(5))
    expect(style).toContain('--flat-left:')
    expect(style).toContain('--card-z:')
    expect(style).toContain('--flat-step:')
    expect(style).not.toContain('transform:')
  })

  it('should output quadratic curve path for map links', () => {
    const path = buildMapCurvePath(10, 20, 110, 220, 0)
    expect(path.startsWith('M 10,20 Q ')).toBe(true)
    expect(path.endsWith(' 110,220')).toBe(true)
  })

  it('should alternate curve direction for adjacent links', () => {
    const pathA = buildMapCurvePath(0, 0, 100, 100, 0)
    const pathB = buildMapCurvePath(0, 0, 100, 100, 1)
    expect(pathA).not.toBe(pathB)
  })
})
