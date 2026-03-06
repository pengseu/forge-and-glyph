import type { EnemyDef } from './types'

export const ENEMIES: Record<string, EnemyDef> = {
  goblin_scout: {
    id: 'goblin_scout',
    name: '地精散兵',
    sprite: '/assets/characters/enemies/goblin_scout.png',
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
    sprite: '/assets/characters/enemies/forest_wolf.png',
    maxHp: 30,
    intents: [
      { type: 'buff', buffType: 'strength', value: 2 },
      { type: 'attack', value: 10 },
      { type: 'attack', value: 10 },
      { type: 'buff', buffType: 'strength', value: 2 },
    ],
  },
  mushroom_creature: {
    id: 'mushroom_creature',
    name: '蘑菇怪',
    sprite: '/assets/characters/enemies/mushroom_creature.png',
    maxHp: 32,
    intents: [
      { type: 'poison', value: 2 },
      { type: 'attack', value: 9 },
      { type: 'attack', value: 9 },
      { type: 'poison', value: 2 },
    ],
  },
  goblin_brute: {
    id: 'goblin_brute',
    name: '地精勇士',
    sprite: '/assets/characters/enemies/goblin_brute.png',
    maxHp: 44,
    intents: [
      { type: 'attack', value: 11 },
      { type: 'defend_attack', defendValue: 6, attackValue: 10 },
      { type: 'attack', value: 11 },
      { type: 'buff', buffType: 'strength', value: 2 },
    ],
  },
  goblin_shaman: {
    id: 'goblin_shaman',
    name: '地精术士',
    sprite: '/assets/characters/enemies/goblin_shaman.png',
    maxHp: 24,
    intents: [
      { type: 'heal_ally_lowest', value: 10 },
      { type: 'attack', value: 6 },
      { type: 'buff_ally_highest_hp', value: 2 },
      { type: 'attack', value: 6 },
    ],
  },
  shadow_assassin: {
    id: 'shadow_assassin',
    name: '暗影刺客',
    sprite: '/assets/characters/enemies/shadow_assassin.png',
    maxHp: 55,
    intents: [
      { type: 'defend', value: 6 },
      { type: 'attack', value: 18 },
      { type: 'poison', value: 3 },
      { type: 'attack', value: 12 },
    ],
  },
  stone_gargoyle: {
    id: 'stone_gargoyle',
    name: '石像鬼',
    sprite: '/assets/characters/enemies/stone_gargoyle.png',
    maxHp: 65,
    intents: [
      { type: 'attack', value: 12 },
      { type: 'weaken', value: 2 },
      { type: 'attack', value: 12 },
      { type: 'defend', value: 10 },
    ],
  },
  goblin_king: {
    id: 'goblin_king',
    name: '地精王',
    sprite: '/assets/characters/enemies/goblin_king.png',
    maxHp: 110,
    intents: [
      { type: 'summon', enemyId: 'goblin_minion' },
      { type: 'attack', value: 14 },
      { type: 'buff', buffType: 'strength', value: 2 },
      { type: 'defend_attack', defendValue: 6, attackValue: 14 },
    ],
  },
  goblin_minion: {
    id: 'goblin_minion',
    name: '地精小兵',
    sprite: '/assets/characters/enemies/goblin_minion.png',
    maxHp: 22,
    intents: [
      { type: 'attack', value: 7 },
      { type: 'attack', value: 7 },
      { type: 'defend_attack', defendValue: 6, attackValue: 7 },
    ],
  },

  thorn_vine: {
    id: 'thorn_vine',
    name: '荆棘藤蔓',
    sprite: '/assets/characters/enemies/thorn_vine.png',
    maxHp: 40,
    intents: [
      { type: 'defend_attack', defendValue: 0, attackValue: 8 },
      { type: 'attack', value: 10 },
      { type: 'defend', value: 4 },
      { type: 'attack', value: 10 },
    ],
  },
  shadow_walker: {
    id: 'shadow_walker',
    name: '暗影行者',
    sprite: '/assets/characters/enemies/shadow_walker.png',
    maxHp: 35,
    intents: [
      { type: 'defend', value: 6 },
      { type: 'attack', value: 16 },
      { type: 'attack', value: 10 },
      { type: 'defend', value: 6 },
    ],
  },
  berserker: {
    id: 'berserker',
    name: '狂战士',
    sprite: '/assets/characters/enemies/berserker.png',
    maxHp: 50,
    intents: [
      { type: 'attack', value: 12 },
      { type: 'attack', value: 12 },
      { type: 'defend', value: 8 },
      { type: 'attack', value: 14 },
    ],
  },
  lich: {
    id: 'lich',
    name: '巫妖',
    sprite: '/assets/characters/enemies/lich.png',
    maxHp: 80,
    intents: [
      { type: 'curse', cardId: 'curse_doubt', count: 2 },
      { type: 'attack', value: 14 },
      { type: 'weaken', value: 2 },
      { type: 'attack', value: 22 },
    ],
  },
  iron_golem: {
    id: 'iron_golem',
    name: '铁甲傀儡',
    sprite: '/assets/characters/enemies/iron_golem.png',
    maxHp: 70,
    intents: [
      { type: 'attack', value: 18 },
      { type: 'defend', value: 15 },
      { type: 'attack', value: 12 },
      { type: 'attack', value: 18 },
    ],
  },
  dark_witch: {
    id: 'dark_witch',
    name: '黑暗女巫',
    sprite: '/assets/characters/enemies/dark_witch.png',
    maxHp: 150,
    intents: [
      { type: 'curse', cardId: 'curse_pain', count: 2 },
      { type: 'attack', value: 16 },
      { type: 'attack', value: 12 },
      { type: 'attack', value: 16 },
    ],
  },
  shadow_eye: {
    id: 'shadow_eye',
    name: '暗影之眼',
    sprite: '/assets/characters/enemies/shadow_eye.png',
    maxHp: 18,
    intents: [
      { type: 'attack', value: 8 },
      { type: 'defend', value: 6 },
      { type: 'attack', value: 8 },
    ],
  },

  void_messenger: {
    id: 'void_messenger',
    name: '虚空使者',
    sprite: '/assets/characters/enemies/void_messenger.png',
    maxHp: 55,
    intents: [
      { type: 'attack', value: 14 },
      { type: 'weaken', value: 1 },
      { type: 'attack', value: 18 },
      { type: 'defend_attack', defendValue: 0, attackValue: 10 },
    ],
  },
  soul_weaver: {
    id: 'soul_weaver',
    name: '灵魂编织者',
    sprite: '/assets/characters/enemies/soul_weaver.png',
    maxHp: 45,
    intents: [
      { type: 'defend', value: 5 },
      { type: 'attack', value: 10 },
      { type: 'defend', value: 5 },
      { type: 'attack', value: 8 },
    ],
  },
  elemental_symbiote: {
    id: 'elemental_symbiote',
    name: '元素共生体',
    sprite: '/assets/characters/enemies/elemental_symbiote.png',
    maxHp: 40,
    intents: [
      { type: 'defend_attack', defendValue: 0, attackValue: 12 },
      { type: 'defend', value: 6 },
      { type: 'attack', value: 14 },
      { type: 'poison', value: 1 },
    ],
  },
  abyss_knight: {
    id: 'abyss_knight',
    name: '深渊骑士',
    sprite: '/assets/characters/enemies/abyss_knight.png',
    maxHp: 100,
    intents: [
      { type: 'attack', value: 16 },
      { type: 'defend_attack', defendValue: 14, attackValue: 0 },
      { type: 'attack', value: 24 },
      { type: 'defend_attack', defendValue: 8, attackValue: 0 },
    ],
  },
  fate_weaver: {
    id: 'fate_weaver',
    name: '命运织者',
    sprite: '/assets/characters/enemies/fate_weaver.png',
    maxHp: 85,
    intents: [
      { type: 'attack', value: 10 },
      { type: 'curse', cardId: 'curse_doubt', count: 1 },
      { type: 'attack', value: 16 },
      { type: 'curse', cardId: 'curse_pain', count: 1 },
    ],
  },
  abyss_lord: {
    id: 'abyss_lord',
    name: '深渊领主',
    sprite: '/assets/characters/enemies/abyss_lord.png',
    maxHp: 200,
    intents: [
      { type: 'attack', value: 18 },
      { type: 'defend_attack', defendValue: 12, attackValue: 0 },
      { type: 'attack', value: 22 },
    ],
  },
}

export function getEnemyDef(id: string): EnemyDef {
  const enemy = ENEMIES[id]
  if (!enemy) throw new Error(`Enemy not found: ${id}`)
  return enemy
}
