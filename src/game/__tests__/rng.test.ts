import { describe, expect, it } from 'vitest'
import { createSeededRng, hashSeed } from '../rng'

describe('rng', () => {
  it('creates deterministic sequence for same seed', () => {
    const a = createSeededRng(12345)
    const b = createSeededRng(12345)
    const seqA = [a.next(), a.next(), a.next(), a.next()]
    const seqB = [b.next(), b.next(), b.next(), b.next()]
    expect(seqA).toEqual(seqB)
  })

  it('hashSeed should generate stable unsigned seed', () => {
    const s1 = hashSeed('abc')
    const s2 = hashSeed('abc')
    expect(s1).toBe(s2)
    expect(s1).toBeGreaterThan(0)
  })
})
