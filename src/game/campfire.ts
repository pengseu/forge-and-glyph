import type { CardDef, CardInstance, RunState } from './types'
import { getCardDef } from './cards'

/** Unique upgrade effect per card */
export const UPGRADE_TABLE: Record<string, (def: CardDef) => CardDef> = {
  slash: (def) => ({
    ...def, name: '挥砍+', description: '造成9伤害',
    effects: [{ type: 'damage', value: 9 }],
  }),
  block: (def) => ({
    ...def, name: '格挡+', description: '获得8护甲',
    effects: [{ type: 'armor', value: 8 }],
  }),
  heavy_slash: (def) => ({
    ...def, name: '重斩+', description: '造成16伤害',
    effects: [{ type: 'damage', value: 16 }],
  }),
  spark: (def) => ({
    ...def, name: '火花+', description: '造成6伤害，施加2灼烧',
    effects: [{ type: 'damage', value: 6 }, { type: 'burn', value: 2 }],
  }),
  ice_arrow: (def) => ({
    ...def, name: '寒冰箭+', description: '造成7伤害，获得4护甲',
    effects: [{ type: 'damage', value: 7 }, { type: 'armor', value: 4 }],
  }),
  fireball: (def) => ({
    ...def, name: '火球术+',
    description: '对所有敌人造成10伤害，施加2灼烧',
    effects: [{ type: 'aoe_damage', value: 10 }, { type: 'aoe_burn', value: 2 }],
  }),
  meditate: (def) => ({
    ...def, name: '冥想+',
    description: '获得1体力，抽2张牌',
    effects: [{ type: 'gain_stamina', value: 1 }, { type: 'draw_cards', value: 2 }],
  }),
  war_cry: (def) => ({
    ...def, name: '战吼+',
    description: '消耗所有魔力转为体力，本回合战技伤害+5',
    effects: [{ type: 'convert_mana_to_stamina', value: 1 }, { type: 'combat_damage_bonus', value: 5 }],
  }),
  execute: (def) => ({
    ...def, name: '处决+', description: '造成8伤害；敌人HP≤30%时造成24伤害',
    effects: [{ type: 'execute', threshold: 30, damage: 24, baseDamage: 8 }],
  }),
  bone_poison: (def) => ({
    ...def, name: '蚀骨毒+', description: '造成5伤害+目标中毒层数伤害',
    effects: [{ type: 'poison_burst', base: 5, perPoison: 1 }],
  }),
  charge_up: (def) => ({
    ...def, name: '蓄力+', cost: 0,
    description: '下一张战技卡伤害翻倍',
    effects: [{ type: 'buff_next_combat_double' }],
  }),
  vulnerability_hex: (def) => ({
    ...def, name: '易伤诅咒+',
    description: '施加3层易伤',
    effects: [{ type: 'vulnerable', value: 3 }],
  }),
  overdraft: (def) => ({
    ...def, name: '透支+',
    description: '获得2体力，下回合-1体力并获得3护甲',
    effects: [{ type: 'gain_stamina', value: 2 }, { type: 'armor', value: 3 }, { type: 'set_next_turn_stamina_penalty', value: 1 }],
  }),
  mana_surge: (def) => ({
    ...def, name: '魔力涌流+',
    description: '获得3魔力，回合末受3伤',
    effects: [{ type: 'gain_mana', value: 3 }, { type: 'set_end_turn_self_damage', value: 3 }],
  }),
  thorn_armor: (def) => ({
    ...def, name: '荆棘甲+',
    description: '获得6护甲，受攻击反弹5伤害',
    effects: [{ type: 'armor', value: 6 }, { type: 'gain_thorns', value: 5 }],
  }),
  envenom: (def) => ({
    ...def, name: '淬毒+',
    description: '永久：每次攻击附加3中毒',
    effects: [{ type: 'permanent_poison_on_attack', value: 3 }],
  }),
  sharpen: (def) => ({
    ...def, name: '磨剑+',
    description: '获得3力量',
    effects: [{ type: 'gain_strength', value: 3 }],
  }),
  magic_absorb: (def) => ({
    ...def, name: '魔法吸收+',
    description: '获得9护甲，若回合末护甲未破，下回合+1魔力',
    effects: [{ type: 'armor', value: 9 }, { type: 'set_magic_absorb', bonusMana: 1 }],
  }),
  blade_arcane_unity: (def) => ({
    ...def, name: '剑魔合一+',
    description: '本回合所有卡费-1，抽2张牌',
    effects: [{ type: 'global_cost_reduction', value: 1 }, { type: 'draw_cards_if_affordable', value: 2 }],
  }),
  frozen_arrow: (def) => ({
    ...def, name: '冻结箭+',
    description: '造成7伤害，冻结敌人',
    effects: [{ type: 'damage', value: 7 }, { type: 'freeze', value: 1 }],
  }),
  poison_spray: (def) => ({
    ...def, name: '毒液喷射+',
    description: '造成5伤害，施加5中毒',
    effects: [{ type: 'damage', value: 5 }, { type: 'poison', value: 5 }],
  }),
  mighty_strike: (def) => ({
    ...def, name: '猛击+',
    description: '造成20伤害',
    effects: [{ type: 'damage', value: 20 }],
  }),
  iron_wall: (def) => ({
    ...def, name: '铁壁+',
    description: '获得16护甲，获得3层屏障',
    effects: [{ type: 'armor', value: 16 }, { type: 'gain_barrier', value: 3 }],
  }),
  weakness_curse: (def) => ({
    ...def, name: '虚弱诅咒+',
    description: '施加3层虚弱（造成伤害-25%）',
    effects: [{ type: 'weaken_enemy', value: 3 }],
  }),
  strength_spell: (def) => ({
    ...def, name: '力量咒文+', cost: 2,
    description: '获得4力量',
    effects: [{ type: 'gain_strength', value: 4 }],
  }),
  meteor_spell: (def) => ({
    ...def, name: '陨石术+',
    description: '对所有敌人造成20伤害，施加3灼烧',
    effects: [{ type: 'aoe_damage', value: 20 }, { type: 'aoe_burn', value: 3 }],
  }),
  berserk: (def) => ({
    ...def, name: '狂暴+',
    description: '消耗所有魔力转为体力，获得3力量',
    effects: [{ type: 'convert_mana_to_stamina', value: 1 }, { type: 'gain_strength', value: 3 }],
  }),
  blood_frenzy: (def) => ({
    ...def, name: '血之狂怒+',
    description: '失去25%最大HP，获得6力量',
    effects: [{ type: 'hp_percent_for_strength', hpPercent: 25, strength: 6 }],
  }),
  // New card upgrades
  whirlwind: (def) => ({
    ...def, name: '旋风斩+',
    description: '对所有敌人造成8伤害',
    effects: [{ type: 'aoe_damage', value: 8 }],
  }),
  quick_attack: (def) => ({
    ...def, name: '快攻+',
    description: '造成4伤害',
    effects: [{ type: 'damage', value: 4 }],
  }),
  light_stab: (def) => ({
    ...def, name: '轻刺+',
    description: '造成4伤害，抽1张牌',
    effects: [{ type: 'damage', value: 4 }, { type: 'draw_cards', value: 1 }],
  }),
  adrenaline: (def) => ({
    ...def, name: '肾上腺素+', cost: 0,
    description: '抽2张牌',
    effects: [{ type: 'draw_cards', value: 2 }],
  }),
  soul_siphon: (def) => ({
    ...def, name: '灵魂虹吸+',
    description: '造成12伤害，回复等量HP',
    effects: [{ type: 'lifesteal', value: 12 }],
  }),
  deep_thought: (def) => ({
    ...def, name: '冥思+',
    description: '本场战斗智慧+3（智慧增加所有法术伤害）',
    effects: [{ type: 'gain_wisdom', value: 3 }],
  }),
  focus_energy: (def) => ({
    ...def, name: '聚能+',
    description: '获得4层蓄能，抽1张牌',
    effects: [{ type: 'gain_charge', value: 4 }, { type: 'draw_cards', value: 1 }],
  }),
  ignite: (def) => ({
    ...def, name: '引燃+',
    description: '每层灼烧造成5伤害',
    effects: [{ type: 'burn_burst', perStack: 5 }],
  }),
  balance: (def) => ({
    ...def, name: '平衡+', cost: 0,
    description: '获得1魔力',
    effects: [{ type: 'gain_mana', value: 1 }],
  }),
  fortify: (def) => ({
    ...def, name: '坚守+',
    description: '获得10护甲，获得5层屏障',
    effects: [{ type: 'armor', value: 10 }, { type: 'gain_barrier', value: 5 }],
  }),
  double_strike: (def) => ({
    ...def, name: '双重打击+',
    description: '造成7伤害×2',
    effects: [{ type: 'multi_damage', value: 7, hits: 2 }],
  }),
  frost_nova: (def) => ({
    ...def, name: '寒霜新星+',
    description: '冻结所有敌人并造成4伤害',
    effects: [{ type: 'aoe_freeze', value: 1 }, { type: 'aoe_damage', value: 4 }],
  }),
}

/** Restore HP to max */
export function restoreHp(_run: RunState, _currentHp: number, maxHp: number): { hp: number } {
  return { hp: maxHp }
}

/** Check if a card can be upgraded */
export function canUpgrade(cardDef: CardDef): boolean {
  return cardDef.id in UPGRADE_TABLE
}

/** Return a new CardDef with the unique upgrade applied */
export function upgradeCard(cardDef: CardDef): CardDef {
  const upgradeFn = UPGRADE_TABLE[cardDef.id]
  if (!upgradeFn) return cardDef
  return upgradeFn(cardDef)
}

/** Resolve the effective CardDef for a CardInstance, applying upgrades */
export function getEffectiveCardDef(card: CardInstance): CardDef {
  const baseDef = getCardDef(card.defId)
  if (!card.upgraded) return baseDef
  return upgradeCard(baseDef)
}
