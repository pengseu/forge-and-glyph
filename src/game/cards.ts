import type { CardDef } from './types'

export const ALL_CARDS: CardDef[] = [
  {
    id: 'slash', name: '挥砍', cost: 1, costType: 'stamina',
    category: 'combat', rarity: 'basic',
    description: '造成6伤害',
    effects: [{ type: 'damage', value: 6 }],
  },
  {
    id: 'block', name: '格挡', cost: 1, costType: 'stamina',
    category: 'combat', rarity: 'basic',
    description: '获得5护甲',
    effects: [{ type: 'armor', value: 5 }],
  },
  {
    id: 'heavy_slash', name: '重斩', cost: 2, costType: 'stamina',
    category: 'combat', rarity: 'basic',
    description: '造成12伤害',
    effects: [{ type: 'damage', value: 12 }],
  },
  {
    id: 'combo', name: '连击', cost: 1, costType: 'stamina',
    category: 'combat', rarity: 'basic',
    description: '造成3×2伤害',
    effects: [{ type: 'multi_damage', value: 3, hits: 2 }],
  },
  {
    id: 'spark', name: '火花', cost: 1, costType: 'mana',
    category: 'spell', rarity: 'basic',
    description: '造成4伤害，施加1灼烧',
    effects: [{ type: 'damage', value: 4 }, { type: 'burn', value: 1 }],
  },
  {
    id: 'ice_arrow', name: '寒冰箭', cost: 1, costType: 'mana',
    category: 'spell', rarity: 'basic',
    description: '造成5伤害，获得2护甲',
    effects: [{ type: 'damage', value: 5 }, { type: 'armor', value: 2 }],
  },
  {
    id: 'fireball', name: '火球术', cost: 2, costType: 'mana',
    category: 'spell', rarity: 'common',
    description: '造成10伤害，施加2灼烧',
    effects: [{ type: 'damage', value: 10 }, { type: 'burn', value: 2 }],
  },
  {
    id: 'meditate', name: '冥想', cost: 0, costType: 'free',
    category: 'technique', rarity: 'basic',
    description: '获得1魔力',
    effects: [{ type: 'gain_mana', value: 1 }],
  },
  {
    id: 'war_cry', name: '战吼', cost: 1, costType: 'stamina',
    category: 'technique', rarity: 'basic',
    description: '获得2魔力',
    effects: [{ type: 'gain_mana', value: 2 }],
  },
  {
    id: 'temp_forge', name: '临时锻造', cost: 1, costType: 'mana',
    category: 'technique', rarity: 'basic',
    description: '获得8护甲',
    effects: [{ type: 'armor', value: 8 }],
  },
  {
    id: 'frozen_arrow', name: '冻结箭', cost: 1, costType: 'mana',
    category: 'spell', rarity: 'common',
    description: '5伤害，冻结敌人',
    effects: [{ type: 'damage', value: 5 }, { type: 'freeze', value: 1 }],
  },
  {
    id: 'poison_spray', name: '毒液喷射', cost: 1, costType: 'stamina',
    category: 'combat', rarity: 'common',
    description: '3伤害，施加3中毒',
    effects: [{ type: 'damage', value: 3 }, { type: 'poison', value: 3 }],
  },
  {
    id: 'strength_spell', name: '力量咒文', cost: 2, costType: 'mana',
    category: 'spell', rarity: 'common',
    description: '获得3力量',
    effects: [{ type: 'gain_strength', value: 3 }],
  },
  {
    id: 'weakness_curse', name: '虚弱诅咒', cost: 1, costType: 'mana',
    category: 'spell', rarity: 'common',
    description: '敌人伤害-25%',
    effects: [{ type: 'weaken_enemy', value: 1 }],
  },
  {
    id: 'mighty_strike', name: '猛击', cost: 2, costType: 'stamina',
    category: 'combat', rarity: 'common',
    description: '15伤害',
    effects: [{ type: 'damage', value: 15 }],
  },
  {
    id: 'iron_wall', name: '铁壁', cost: 2, costType: 'stamina',
    category: 'combat', rarity: 'common',
    description: '12护甲',
    effects: [{ type: 'armor', value: 12 }],
  },
  {
    id: 'meteor_spell', name: '陨石术', cost: 3, costType: 'mana',
    category: 'spell', rarity: 'rare',
    description: '20伤害，施加3灼烧',
    effects: [{ type: 'damage', value: 20 }, { type: 'burn', value: 3 }],
  },
  {
    id: 'blood_magic', name: '血魔法', cost: 0, costType: 'free',
    category: 'technique', rarity: 'common',
    description: '消耗3HP获得2魔力',
    effects: [{ type: 'damage', value: 3 }, { type: 'gain_mana', value: 2 }],
  },
  {
    id: 'berserk', name: '狂暴', cost: 0, costType: 'free',
    category: 'technique', rarity: 'common',
    description: '消耗所有魔力转为体力',
    effects: [{ type: 'convert_mana_to_stamina', value: 1 }],
  },
  {
    id: 'arcane_infusion', name: '奥术灌注', cost: 1, costType: 'mana',
    category: 'technique', rarity: 'common',
    description: '下一张战技卡伤害+50%',
    effects: [{ type: 'buff_next_combat', value: 50 }],
  },
]

export function getCardDef(id: string): CardDef {
  const card = ALL_CARDS.find(c => c.id === id)
  if (!card) throw new Error(`Card not found: ${id}`)
  return card
}

export const STARTER_DECK_RECIPE: { cardId: string; count: number }[] = [
  { cardId: 'slash', count: 4 },
  { cardId: 'block', count: 3 },
  { cardId: 'spark', count: 2 },
  { cardId: 'ice_arrow', count: 1 },
  { cardId: 'meditate', count: 2 },
  { cardId: 'heavy_slash', count: 1 },
  { cardId: 'combo', count: 1 },
  { cardId: 'war_cry', count: 1 },
]
