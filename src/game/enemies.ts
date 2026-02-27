import type { EnemyDef } from './types'

export const ENEMIES: Record<string, EnemyDef> = {
  goblin_scout: {
    id: 'goblin_scout',
    name: '地精散兵',
    maxHp: 28,
    intents: [
      { type: 'attack', value: 8 },
      { type: 'attack', value: 8 },
      { type: 'buff', buffType: 'strength', value: 2 },
      { type: 'attack', value: 8 },
    ],
  },
  forest_wolf: {
    id: 'forest_wolf',
    name: '森林狼',
    maxHp: 30,
    intents: [
      { type: 'buff', buffType: 'strength', value: 3 },
      { type: 'attack', value: 10 },
      { type: 'attack', value: 10 },
    ],
  },
  mushroom_creature: {
    id: 'mushroom_creature',
    name: '蘑菇怪',
    maxHp: 38,
    intents: [
      { type: 'poison', value: 2 },
      { type: 'attack', value: 9 },
      { type: 'attack', value: 9 },
      { type: 'poison', value: 2 },
    ],
  },
  shadow_assassin: {
    id: 'shadow_assassin',
    name: '暗影刺客',
    maxHp: 55,
    intents: [
      { type: 'defend', value: 8 },
      { type: 'attack', value: 22 },
      { type: 'poison', value: 4 },
      { type: 'attack', value: 12 },
    ],
  },
  stone_gargoyle: {
    id: 'stone_gargoyle',
    name: '石像鬼',
    maxHp: 75,
    intents: [
      { type: 'attack', value: 15 },
      { type: 'weaken', value: 2 },
      { type: 'attack', value: 15 },
      { type: 'defend', value: 15 },
    ],
  },
  goblin_king: {
    id: 'goblin_king',
    name: '地精王',
    maxHp: 140,
    intents: [
      { type: 'summon_multi', enemyId: 'goblin_minion', count: 2 },
      { type: 'attack', value: 14 },
      { type: 'buff', buffType: 'strength', value: 3 },
      { type: 'defend_attack', defendValue: 20, attackValue: 10 },
    ],
  },
  goblin_minion: {
    id: 'goblin_minion',
    name: '地精小兵',
    maxHp: 22,
    intents: [
      { type: 'attack', value: 6 },
      { type: 'attack', value: 6 },
      { type: 'defend_attack', defendValue: 5, attackValue: 6 },
    ],
  },
}

export function getEnemyDef(id: string): EnemyDef {
  const enemy = ENEMIES[id]
  if (!enemy) throw new Error(`Enemy not found: ${id}`)
  return enemy
}
