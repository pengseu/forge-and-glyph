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
  forest_wolf: {
    id: 'forest_wolf',
    name: '森林狼',
    maxHp: 15,
    intents: [
      { type: 'buff', buffType: 'strength', value: 2 },
      { type: 'attack', value: 8 },
      { type: 'attack', value: 8 },
    ],
  },
  mushroom_creature: {
    id: 'mushroom_creature',
    name: '蘑菇怪',
    maxHp: 25,
    intents: [
      { type: 'attack', value: 5 },
      { type: 'attack', value: 5 },
    ],
  },
  goblin_king: {
    id: 'goblin_king',
    name: '地精王',
    maxHp: 100,
    intents: [
      { type: 'attack', value: 12 },
      { type: 'buff', buffType: 'strength', value: 2 },
      { type: 'attack', value: 12 },
    ],
  },
}

export function getEnemyDef(id: string): EnemyDef {
  const enemy = ENEMIES[id]
  if (!enemy) throw new Error(`Enemy not found: ${id}`)
  return enemy
}
