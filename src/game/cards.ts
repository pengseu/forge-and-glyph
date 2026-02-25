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
