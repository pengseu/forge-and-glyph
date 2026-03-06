let randomSource: (() => number) | null = null

export function setRandomSource(source: () => number): void {
  randomSource = source
}

export function random(): number {
  if (randomSource) return randomSource()
  return Math.random()
}

export function randomInt(min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1))
}

export function randomChance(p: number): boolean {
  return random() < p
}
