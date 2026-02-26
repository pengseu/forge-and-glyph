import type { CardDef } from './types'

export const ALL_CARDS: CardDef[] = [
  // === BASIC (starter) ===
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
    category: 'spell', rarity: 'basic',
    description: '造成10伤害，施加2灼烧',
    effects: [{ type: 'damage', value: 10 }, { type: 'burn', value: 2 }],
  },
  // === COMMON ===
  {
    id: 'meditate', name: '冥想', cost: 1, costType: 'mana',
    category: 'technique', rarity: 'common',
    description: '获得1体力，抽1张牌',
    effects: [{ type: 'gain_stamina', value: 1 }, { type: 'draw_cards', value: 1 }],
  },
  {
    id: 'war_cry', name: '战吼', cost: 0, costType: 'free',
    category: 'technique', rarity: 'common',
    description: '消耗所有魔力转为体力，本回合战技伤害+3',
    effects: [{ type: 'convert_mana_to_stamina', value: 1 }, { type: 'combat_damage_bonus', value: 3 }],
  },
  {
    id: 'execute', name: '处决', cost: 1, costType: 'stamina',
    category: 'combat', rarity: 'common',
    description: '造成6伤害；敌人HP≤30%时造成18伤害',
    effects: [{ type: 'execute', threshold: 30, damage: 18, baseDamage: 6 }],
  },
  {
    id: 'bloodthirst', name: '嗜血', cost: 1, costType: 'stamina',
    category: 'combat', rarity: 'common',
    description: '造成4伤害；本回合已伤害该敌人则额外+6',
    effects: [{ type: 'conditional_damage', base: 4, value: 6, condition: 'enemy_damaged' }],
  },
  {
    id: 'charge_up', name: '蓄力', cost: 1, costType: 'stamina',
    category: 'technique', rarity: 'common',
    description: '下一张战技卡伤害翻倍',
    effects: [{ type: 'buff_next_combat_double' }],
  },
  {
    id: 'arcane_amplify', name: '奥术增幅', cost: 1, costType: 'mana',
    category: 'technique', rarity: 'common',
    description: '下一张法术+5伤害，+1魔力',
    effects: [{ type: 'buff_next_spell', bonusDamage: 5, bonusMana: 1 }],
  },
  {
    id: 'sacrifice', name: '献祭', cost: 0, costType: 'free',
    category: 'technique', rarity: 'common',
    description: '消耗5HP获得3魔力',
    effects: [{ type: 'self_damage_gain_mana', damage: 5, mana: 3 }],
  },
  {
    id: 'sword_dance', name: '剑舞', cost: 2, costType: 'stamina',
    category: 'combat', rarity: 'common',
    description: '造成3×3伤害',
    effects: [{ type: 'multi_damage', value: 3, hits: 3 }],
  },
  {
    id: 'chain_lightning', name: '连锁闪电', cost: 2, costType: 'mana',
    category: 'spell', rarity: 'common',
    description: '造成4伤害，弹射3次',
    effects: [{ type: 'chain_damage', value: 4, bounces: 3 }],
  },
  {
    id: 'envenom', name: '淬毒', cost: 1, costType: 'stamina',
    category: 'technique', rarity: 'common',
    description: '永久：每次攻击附加2中毒',
    effects: [{ type: 'permanent_poison_on_attack', value: 2 }],
  },
  {
    id: 'sharpen', name: '磨剑', cost: 1, costType: 'stamina',
    category: 'technique', rarity: 'common',
    description: '获得2力量',
    effects: [{ type: 'gain_strength', value: 2 }],
  },
  {
    id: 'attack_defend', name: '以攻代守', cost: 1, costType: 'stamina',
    category: 'combat', rarity: 'common',
    description: '造成5伤害，获得5护甲',
    effects: [{ type: 'damage_gain_armor', damage: 5, armor: 5 }],
  },
  {
    id: 'magic_shield', name: '魔法盾', cost: 1, costType: 'mana',
    category: 'spell', rarity: 'common',
    description: '获得8护甲；本回合受过伤则额外+6',
    effects: [{ type: 'conditional_armor', value: 6, condition: 'damage_taken' }, { type: 'armor', value: 8 }],
  },
  // New common cards
  {
    id: 'whirlwind', name: '旋风斩', cost: 2, costType: 'stamina',
    category: 'combat', rarity: 'common',
    description: '对所有敌人造成5伤害',
    effects: [{ type: 'aoe_damage', value: 5 }],
  },
  {
    id: 'light_stab', name: '轻刺', cost: 0, costType: 'stamina',
    category: 'combat', rarity: 'common',
    description: '造成3伤害',
    effects: [{ type: 'damage', value: 3 }],
  },
  {
    id: 'adrenaline', name: '肾上腺素', cost: 1, costType: 'stamina',
    category: 'technique', rarity: 'common',
    description: '抽2张牌',
    effects: [{ type: 'draw_cards', value: 2 }],
  },
  {
    id: 'deep_thought', name: '冥思', cost: 1, costType: 'mana',
    category: 'spell', rarity: 'common',
    description: '本场战斗智慧+2（智慧增加所有法术伤害）',
    effects: [{ type: 'gain_wisdom', value: 2 }],
  },
  {
    id: 'focus_energy', name: '聚能', cost: 1, costType: 'mana',
    category: 'spell', rarity: 'common',
    description: '获得3层蓄能（每层增加下一个法术10%伤害，使用后清零）',
    effects: [{ type: 'gain_charge', value: 3 }],
  },
  // === RARE ===
  {
    id: 'soul_siphon', name: '灵魂虹吸', cost: 2, costType: 'mana',
    category: 'spell', rarity: 'rare',
    description: '造成8伤害，回复等量HP',
    effects: [{ type: 'lifesteal', value: 8 }],
  },
  {
    id: 'frozen_arrow', name: '冻结箭', cost: 1, costType: 'mana',
    category: 'spell', rarity: 'rare',
    description: '5伤害，冻结敌人',
    effects: [{ type: 'damage', value: 5 }, { type: 'freeze', value: 1 }],
  },
  {
    id: 'poison_spray', name: '毒液喷射', cost: 1, costType: 'stamina',
    category: 'combat', rarity: 'rare',
    description: '3伤害，施加3中毒',
    effects: [{ type: 'damage', value: 3 }, { type: 'poison', value: 3 }],
  },
  {
    id: 'mighty_strike', name: '猛击', cost: 2, costType: 'stamina',
    category: 'combat', rarity: 'rare',
    description: '15伤害',
    effects: [{ type: 'damage', value: 15 }],
  },
  {
    id: 'iron_wall', name: '铁壁', cost: 2, costType: 'stamina',
    category: 'combat', rarity: 'rare',
    description: '获得12护甲，获得2层屏障',
    effects: [{ type: 'armor', value: 12 }, { type: 'gain_barrier', value: 2 }],
  },
  {
    id: 'fortify', name: '坚守', cost: 2, costType: 'stamina',
    category: 'combat', rarity: 'rare',
    description: '获得8护甲，获得3层屏障',
    effects: [{ type: 'armor', value: 8 }, { type: 'gain_barrier', value: 3 }],
  },
  {
    id: 'weakness_curse', name: '虚弱诅咒', cost: 1, costType: 'mana',
    category: 'spell', rarity: 'rare',
    description: '施加2层虚弱（造成伤害-25%）',
    effects: [{ type: 'weaken_enemy', value: 2 }],
  },
  {
    id: 'strength_spell', name: '力量咒文', cost: 2, costType: 'mana',
    category: 'spell', rarity: 'rare',
    description: '本场战斗力量+3（力量增加所有战技伤害）',
    effects: [{ type: 'gain_strength', value: 3 }],
  },
  // === EPIC ===
  {
    id: 'meteor_spell', name: '陨石术', cost: 3, costType: 'mana',
    category: 'spell', rarity: 'epic',
    description: '20伤害，施加3灼烧',
    effects: [{ type: 'damage', value: 20 }, { type: 'burn', value: 3 }],
  },
  {
    id: 'berserk', name: '狂暴', cost: 0, costType: 'free',
    category: 'technique', rarity: 'epic',
    description: '消耗所有魔力转为体力，获得2力量',
    effects: [{ type: 'convert_mana_to_stamina', value: 1 }, { type: 'gain_strength', value: 2 }],
  },
  {
    id: 'temp_forge', name: '临时锻造', cost: 1, costType: 'mana',
    category: 'technique', rarity: 'epic',
    description: '获得8护甲，抽1张牌',
    effects: [{ type: 'armor', value: 8 }, { type: 'draw_cards', value: 1 }],
  },
]

export function getCardDef(id: string): CardDef {
  const card = ALL_CARDS.find(c => c.id === id)
  if (!card) throw new Error(`Card not found: ${id}`)
  return card
}

export const STARTER_DECK_RECIPE: { cardId: string; count: number }[] = [
  { cardId: 'slash', count: 3 },
  { cardId: 'block', count: 2 },
  { cardId: 'heavy_slash', count: 1 },
  { cardId: 'spark', count: 2 },
  { cardId: 'ice_arrow', count: 1 },
  { cardId: 'fireball', count: 1 },
]
