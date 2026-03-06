import { describe, expect, it } from 'vitest'
import { buildHandCardStyleVars, resolveHandFanStyle } from '../battle'
import { buildMapCurvePath } from '../map'

describe('layout helpers', () => {
  it('should keep single hand card centered with no rotation', () => {
    expect(resolveHandFanStyle(0, 1)).toEqual({
      rotateDeg: 0,
      offsetY: 0,
      marginLeft: 0,
    })
  })

  it('should spread multiple hand cards into a fan', () => {
    const left = resolveHandFanStyle(0, 5)
    const middle = resolveHandFanStyle(2, 5)
    const right = resolveHandFanStyle(4, 5)
    expect(left.rotateDeg).toBeLessThan(0)
    expect(right.rotateDeg).toBeGreaterThan(0)
    expect(middle.rotateDeg).toBe(0)
    expect(left.offsetY).toBeGreaterThan(middle.offsetY)
    expect(right.offsetY).toBeGreaterThan(middle.offsetY)
    expect(left.marginLeft).toBe(0)
    expect(right.marginLeft).toBe(-20)
  })

  it('should output css variable style for hand fan cards', () => {
    const style = buildHandCardStyleVars(1, resolveHandFanStyle(1, 5))
    expect(style).toContain('--fan-rotate:')
    expect(style).toContain('--fan-offset-y:')
    expect(style).toContain('--fan-margin-left:')
    expect(style).toContain('--fan-z:')
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
