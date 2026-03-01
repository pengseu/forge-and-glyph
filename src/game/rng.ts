export interface SeededRng {
  readonly seed: number
  next: () => number
  nextInt: (min: number, max: number) => number
  chance: (p: number) => boolean
}

function normalizeSeed(seed: number): number {
  let value = Math.floor(seed) >>> 0
  if (value === 0) value = 0x6d2b79f5
  return value
}

export function createSeededRng(seed: number): SeededRng {
  let state = normalizeSeed(seed)
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    seed: state,
    next,
    nextInt: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    chance: (p: number) => next() < p,
  }
}

export function hashSeed(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return normalizeSeed(h)
}
