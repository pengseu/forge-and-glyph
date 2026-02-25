import type { EnemyDef } from './types'

export const ENEMIES: Record<string, EnemyDef> = {
  goblin_scout: {
    id: 'goblin_scout',
    name: '地精散兵',
    maxHp: 20,
    intents: [
      { type: 'attack', value: 6 },
      { type: 'attack', value: 6 },
      { type: 'buff', buffType: 'strength', value: 2 },
    ],
  },
}

export function getEnemyDef(id: string): EnemyDef {
  const enemy = ENEMIES[id]
  if (!enemy) throw new Error(`Enemy not found: ${id}`)
  return enemy
}
