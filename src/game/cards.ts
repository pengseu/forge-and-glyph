import type { CardDef, CardInstance } from './types'

export const ALL_CARDS: CardDef[] = [
  // === TEST MODE ===
  {
    id: 'test_instakill', name: '【测试】秒杀', cost: 0, costType: 'free',
    category: 'spell', rarity: 'basic',
    description: '对所有敌人造成9999伤害',
    effects: [{ type: 'aoe_damage', value: 9999 }],
  },
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
    id: 'spark', name: '火花', cost: 1, costType: 'mana',
    category: 'spell', rarity: 'basic',
    description: '造成4伤害，施加1灼烧',
    effects: [{ type: 'damage', value: 4 }, { type: 'burn', value: 1 }],
  },
  {
    id: 'meditate', name: '冥想', cost: 1, costType: 'mana',
    category: 'technique', rarity: 'common',
    description: '获得1体力，抽1张牌',
    effects: [{ type: 'gain_stamina', value: 1 }, { type: 'draw_cards', value: 1 }],
  },
  {
    id: 'light_stab', name: '轻刺', cost: 0, costType: 'stamina',
    category: 'combat', rarity: 'common',
    description: '造成3伤害；若目标有易伤则改为7伤害',
    effects: [{ type: 'conditional_damage_vs_vulnerable', base: 3, vulnerableDamage: 7 }],
  },

  // === CURSE (enemy-generated deck pollution) ===
  {
    id: 'curse_doubt', name: '藤蔓缠绕', cost: 0, costType: 'free',
    category: 'technique', rarity: 'basic',
    description: '诅咒牌。不可打出，占据手牌位。',
    effects: [],
    unplayable: true,
  },
  {
    id: 'curse_pain', name: '灵魂侵蚀', cost: 0, costType: 'free',
    category: 'technique', rarity: 'basic',
    description: '诅咒牌。抽到时自动受到2伤害并消耗。',
    effects: [],
    unplayable: true,
    onDrawSelfDamage: 2,
    onDrawExhaust: true,
  },

  // === ACT 1 reward pool ===
  {
    id: 'heavy_slash', name: '重斩', cost: 2, costType: 'stamina',
    category: 'combat', rarity: 'common',
    description: '造成12伤害',
    effects: [{ type: 'damage', value: 12 }],
  },
  {
    id: 'ice_arrow', name: '寒冰箭', cost: 1, costType: 'mana',
    category: 'spell', rarity: 'common',
    description: '造成5伤害，获得2护甲',
    effects: [{ type: 'damage', value: 5 }, { type: 'armor', value: 2 }],
  },
  {
    id: 'war_cry', name: '战吼', cost: 0, costType: 'free',
    category: 'technique', rarity: 'common',
    description: '消耗所有魔力转为体力，本回合战技伤害+3',
    effects: [{ type: 'convert_mana_to_stamina', value: 1 }, { type: 'combat_damage_bonus', value: 3 }],
  },
  {
    id: 'quick_attack', name: '快攻', cost: 0, costType: 'stamina',
    category: 'combat', rarity: 'common',
    description: '造成2伤害，抽1张牌',
    effects: [{ type: 'damage', value: 2 }, { type: 'draw_cards', value: 1 }],
  },
  {
    id: 'execute', name: '处决', cost: 1, costType: 'stamina',
    category: 'combat', rarity: 'common',
    description: '造成6伤害；敌人HP≤30%时造成18伤害',
    effects: [{ type: 'execute', threshold: 30, damage: 18, baseDamage: 6 }],
  },
  {
    id: 'vulnerability_hex', name: '易伤诅咒', cost: 1, costType: 'mana',
    category: 'spell', rarity: 'common',
    description: '施加2层易伤',
    effects: [{ type: 'vulnerable', value: 2 }],
  },
  {
    id: 'thorn_armor', name: '荆棘甲', cost: 1, costType: 'stamina',
    category: 'combat', rarity: 'common',
    description: '获得4护甲，受攻击反弹3伤害',
    effects: [{ type: 'armor', value: 4 }, { type: 'gain_thorns', value: 3 }],
  },
  {
    id: 'whirlwind', name: '旋风斩', cost: 2, costType: 'stamina',
    category: 'combat', rarity: 'common',
    description: '对所有敌人造成5伤害',
    effects: [{ type: 'aoe_damage', value: 5 }],
  },
  {
    id: 'ignite', name: '引燃', cost: 1, costType: 'mana',
    category: 'spell', rarity: 'common',
    description: '每层灼烧造成3伤害',
    effects: [{ type: 'burn_burst', perStack: 3 }],
  },
  {
    id: 'adrenaline', name: '肾上腺素', cost: 1, costType: 'stamina',
    category: 'technique', rarity: 'common',
    description: '抽2张牌',
    effects: [{ type: 'draw_cards', value: 2 }],
  },
  {
    id: 'charge_up', name: '蓄力', cost: 1, costType: 'stamina',
    category: 'technique', rarity: 'rare',
    description: '下一张战技卡伤害翻倍',
    effects: [{ type: 'buff_next_combat_double' }],
  },
  {
    id: 'mighty_strike', name: '猛击', cost: 2, costType: 'stamina',
    category: 'combat', rarity: 'rare',
    description: '造成15伤害',
    effects: [{ type: 'damage', value: 15 }],
  },
  {
    id: 'iron_wall', name: '铁壁', cost: 2, costType: 'stamina',
    category: 'combat', rarity: 'rare',
    description: '获得12护甲，获得2层屏障',
    effects: [{ type: 'armor', value: 12 }, { type: 'gain_barrier', value: 2 }],
  },
  {
    id: 'frozen_arrow', name: '冻结箭', cost: 1, costType: 'mana',
    category: 'spell', rarity: 'rare',
    description: '造成5伤害，冻结敌人',
    effects: [{ type: 'damage', value: 5 }, { type: 'freeze', value: 1 }],
  },
  {
    id: 'poison_spray', name: '毒液喷射', cost: 1, costType: 'stamina',
    category: 'combat', rarity: 'rare',
    description: '造成3伤害，施加3中毒',
    effects: [{ type: 'damage', value: 3 }, { type: 'poison', value: 3 }],
  },
  {
    id: 'soul_siphon', name: '灵魂虹吸', cost: 2, costType: 'mana',
    category: 'spell', rarity: 'rare',
    description: '造成8伤害并吸血8',
    effects: [{ type: 'lifesteal', value: 8 }],
  },
  {
    id: 'sharpen', name: '磨剑', cost: 1, costType: 'stamina',
    category: 'technique', rarity: 'rare',
    description: '获得2力量',
    effects: [{ type: 'gain_strength', value: 2 }],
  },
  {
    id: 'meteor_spell', name: '陨石术', cost: 3, costType: 'mana',
    category: 'spell', rarity: 'epic',
    description: '造成20伤害，施加3灼烧',
    effects: [{ type: 'damage', value: 20 }, { type: 'burn', value: 3 }],
  },

  // === ACT 2 added ===
  {
    id: 'envenom', name: '淬毒', cost: 1, costType: 'stamina',
    category: 'technique', rarity: 'common',
    description: '永久：每次攻击附加2中毒',
    effects: [{ type: 'permanent_poison_on_attack', value: 2 }],
  },
  {
    id: 'overdraft', name: '透支', cost: 0, costType: 'free',
    category: 'technique', rarity: 'common',
    description: '获得2体力，下回合-1体力',
    effects: [{ type: 'gain_stamina', value: 2 }, { type: 'set_next_turn_stamina_penalty', value: 1 }],
  },
  {
    id: 'deep_thought', name: '冥思', cost: 1, costType: 'mana',
    category: 'spell', rarity: 'common',
    description: '本场战斗智慧+2',
    effects: [{ type: 'gain_wisdom', value: 2 }],
  },
  {
    id: 'focus_energy', name: '聚能', cost: 1, costType: 'mana',
    category: 'spell', rarity: 'common',
    description: '获得3层蓄能',
    effects: [{ type: 'gain_charge', value: 3 }],
  },
  {
    id: 'bone_poison', name: '蚀骨毒', cost: 2, costType: 'stamina',
    category: 'combat', rarity: 'rare',
    description: '造成3伤害+目标中毒层数伤害',
    effects: [{ type: 'poison_burst', base: 3, perPoison: 1 }],
  },
  {
    id: 'mana_surge', name: '魔力涌流', cost: 0, costType: 'free',
    category: 'technique', rarity: 'rare',
    description: '获得3魔力，回合末受3伤',
    effects: [{ type: 'gain_mana', value: 3 }, { type: 'set_end_turn_self_damage', value: 3 }],
  },
  {
    id: 'double_strike', name: '双重打击', cost: 2, costType: 'stamina',
    category: 'combat', rarity: 'rare',
    description: '造成5伤害×2',
    effects: [{ type: 'multi_damage', value: 5, hits: 2 }],
  },
  {
    id: 'magic_absorb', name: '魔法吸收', cost: 1, costType: 'mana',
    category: 'spell', rarity: 'rare',
    description: '获得6护甲，若回合末护甲未破，下回合+1魔力',
    effects: [{ type: 'armor', value: 6 }, { type: 'set_magic_absorb', bonusMana: 1 }],
  },
  {
    id: 'weakness_curse', name: '虚弱诅咒', cost: 1, costType: 'mana',
    category: 'spell', rarity: 'rare',
    description: '施加2层虚弱',
    effects: [{ type: 'weaken_enemy', value: 2 }],
  },
  {
    id: 'berserk', name: '狂暴', cost: 0, costType: 'free',
    category: 'technique', rarity: 'epic',
    description: '消耗所有魔力转为体力，获得2力量',
    effects: [{ type: 'convert_mana_to_stamina', value: 1 }, { type: 'gain_strength', value: 2 }],
  },
  {
    id: 'purify', name: '净化', cost: 1, costType: 'mana',
    category: 'spell', rarity: 'rare',
    description: '移除手牌中所有诅咒牌，每移除1张抽1张',
    effects: [{ type: 'purge_curse_in_hand_draw' }],
  },
  {
    id: 'armor_breaker', name: '破甲击', cost: 1, costType: 'stamina',
    category: 'combat', rarity: 'rare',
    description: '造成8伤害，击碎目标全部护甲',
    effects: [{ type: 'damage_shred_armor', damage: 8, shred: 999 }],
  },
  {
    id: 'blade_arcane_unity', name: '剑魔合一', cost: 1, costType: 'hybrid',
    category: 'technique', rarity: 'epic',
    description: '本回合所有卡费-1，抽2张牌',
    effects: [{ type: 'global_cost_reduction', value: 1 }, { type: 'draw_cards', value: 2 }],
  },
  {
    id: 'blood_frenzy', name: '血之狂怒', cost: 0, costType: 'free',
    category: 'technique', rarity: 'epic',
    description: '失去25%当前HP，获得5力量',
    effects: [{ type: 'current_hp_percent_for_strength', hpPercent: 25, strength: 5 }],
  },

  // === ACT 3 added ===
  {
    id: 'final_judgment', name: '终末审判', cost: 3, costType: 'stamina',
    category: 'combat', rarity: 'epic',
    description: '造成30伤害；敌人HP≤30%时即死',
    effects: [{ type: 'execute', threshold: 30, damage: 999, baseDamage: 30 }],
  },
  {
    id: 'annihilation_flame', name: '湮灭之焰', cost: 3, costType: 'mana',
    category: 'spell', rarity: 'epic',
    description: '对所有敌人造成15伤害并施加5灼烧，自身受8伤',
    effects: [{ type: 'aoe_damage', value: 15 }, { type: 'aoe_burn', value: 5 }, { type: 'self_damage', value: 8 }],
  },
  {
    id: 'eternal_shield', name: '永恒之盾', cost: 2, costType: 'stamina',
    category: 'combat', rarity: 'epic',
    description: '获得20护甲与5层屏障，本回合受伤减半',
    effects: [{ type: 'armor', value: 20 }, { type: 'gain_barrier', value: 5 }, { type: 'set_damage_taken_multiplier', value: 0.5 }],
  },
  {
    id: 'time_rewind', name: '时间倒流', cost: 2, costType: 'mana',
    category: 'spell', rarity: 'legendary',
    description: '弃掉当前手牌，重抽5张',
    effects: [{ type: 'redraw_hand', value: 5 }],
  },
  {
    id: 'soul_sacrifice', name: '灵魂献祭', cost: 0, costType: 'free',
    category: 'technique', rarity: 'legendary',
    description: '失去20HP，本回合所有伤害值和护甲值翻倍',
    effects: [{ type: 'self_damage', value: 20 }, { type: 'set_double_damage_armor_this_turn' }],
  },
  {
    id: 'destiny_rewrite', name: '命运改写', cost: 1, costType: 'hybrid',
    category: 'technique', rarity: 'legendary',
    description: '消耗。选择1个敌人，跳过它下一次行动',
    effects: [{ type: 'freeze', value: 1 }],
    exhaust: true,
  },
]

export function getCardDef(id: string): CardDef {
  const card = ALL_CARDS.find(c => c.id === id)
  if (!card) throw new Error(`Card not found: ${id}`)
  return card
}

export const STARTER_DECK_RECIPE: { cardId: string; count: number }[] = [
  { cardId: 'slash', count: 2 },
  { cardId: 'block', count: 2 },
  { cardId: 'spark', count: 2 },
  { cardId: 'meditate', count: 1 },
  { cardId: 'light_stab', count: 1 },
]

export const ACT1_REWARD_CARD_IDS: string[] = [
  'heavy_slash',
  'ice_arrow',
  'meditate',
  'war_cry',
  'quick_attack',
  'light_stab',
  'execute',
  'vulnerability_hex',
  'thorn_armor',
  'whirlwind',
  'ignite',
  'adrenaline',
  'charge_up',
  'mighty_strike',
  'iron_wall',
  'frozen_arrow',
  'poison_spray',
  'soul_siphon',
  'sharpen',
  'meteor_spell',
]

export const ACT2_ADDED_CARD_IDS: string[] = [
  'envenom',
  'overdraft',
  'deep_thought',
  'focus_energy',
  'bone_poison',
  'mana_surge',
  'double_strike',
  'magic_absorb',
  'weakness_curse',
  'berserk',
  'purify',
  'armor_breaker',
  'blade_arcane_unity',
  'blood_frenzy',
]

export const ACT3_ADDED_CARD_IDS: string[] = [
  'final_judgment',
  'annihilation_flame',
  'eternal_shield',
  'time_rewind',
  'soul_sacrifice',
  'destiny_rewrite',
]

export function getRewardPoolByAct(act: 1 | 2 | 3): CardDef[] {
  const act1 = new Set(ACT1_REWARD_CARD_IDS)
  const act2 = new Set([...ACT1_REWARD_CARD_IDS, ...ACT2_ADDED_CARD_IDS])
  const act3 = new Set([...ACT1_REWARD_CARD_IDS, ...ACT2_ADDED_CARD_IDS, ...ACT3_ADDED_CARD_IDS])

  if (act === 1) {
    return ALL_CARDS.filter((c) => act1.has(c.id))
  }
  if (act === 2) {
    return ALL_CARDS.filter((c) => act2.has(c.id))
  }
  return ALL_CARDS.filter((c) => act3.has(c.id))
}

export function createStarterDeck(): CardInstance[] {
  const cards: CardInstance[] = []
  let uid = 0
  for (const recipe of STARTER_DECK_RECIPE) {
    for (let i = 0; i < recipe.count; i++) {
      cards.push({ uid: `card_${uid++}`, defId: recipe.cardId })
    }
  }
  return cards
}
