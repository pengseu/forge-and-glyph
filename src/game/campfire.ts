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
  spark: (def) => ({
    ...def, name: '火花+', description: '造成6伤害，施加2灼烧',
    effects: [{ type: 'damage', value: 6 }, { type: 'burn', value: 2 }],
  }),
  meditate: (def) => ({
    ...def, name: '冥想+', description: '获得1体力，抽2张牌',
    effects: [{ type: 'gain_stamina', value: 1 }, { type: 'draw_cards', value: 2 }],
  }),
  light_stab: (def) => ({
    ...def, name: '轻刺+', description: '造成4伤害；若目标有易伤则改为9伤害',
    effects: [{ type: 'conditional_damage_vs_vulnerable', base: 4, vulnerableDamage: 9 }],
  }),

  heavy_slash: (def) => ({
    ...def, name: '重斩+', description: '造成16伤害',
    effects: [{ type: 'damage', value: 16 }],
  }),
  ice_arrow: (def) => ({
    ...def, name: '寒冰箭+', description: '造成7伤害，获得4护甲',
    effects: [{ type: 'damage', value: 7 }, { type: 'armor', value: 4 }],
  }),
  war_cry: (def) => ({
    ...def, name: '战吼+', description: '消耗所有魔力转为体力，本回合战技伤害+5',
    effects: [{ type: 'convert_mana_to_stamina', value: 1 }, { type: 'combat_damage_bonus', value: 5 }],
  }),
  quick_attack: (def) => ({
    ...def, name: '快攻+', description: '造成4伤害，抽1张牌',
    effects: [{ type: 'damage', value: 4 }, { type: 'draw_cards', value: 1 }],
  }),
  execute: (def) => ({
    ...def, name: '处决+', description: '造成8伤害；敌人HP≤30%时造成24伤害',
    effects: [{ type: 'execute', threshold: 30, damage: 24, baseDamage: 8 }],
  }),
  vulnerability_hex: (def) => ({
    ...def, name: '易伤诅咒+', description: '施加3层易伤',
    effects: [{ type: 'vulnerable', value: 3 }],
  }),
  thorn_armor: (def) => ({
    ...def, name: '荆棘甲+', description: '获得6护甲，受攻击反弹5伤害',
    effects: [{ type: 'armor', value: 6 }, { type: 'gain_thorns', value: 5 }],
  }),
  whirlwind: (def) => ({
    ...def, name: '旋风斩+', description: '对所有敌人造成8伤害',
    effects: [{ type: 'aoe_damage', value: 8 }],
  }),
  ignite: (def) => ({
    ...def, name: '引燃+', description: '每层灼烧造成5伤害',
    effects: [{ type: 'burn_burst', perStack: 5 }],
  }),
  adrenaline: (def) => ({
    ...def, name: '肾上腺素+', cost: 0, description: '抽2张牌',
    effects: [{ type: 'draw_cards', value: 2 }],
  }),
  charge_up: (def) => ({
    ...def, name: '蓄力+', cost: 0, description: '下一张战技卡伤害翻倍',
    effects: [{ type: 'buff_next_combat_double' }],
  }),
  mighty_strike: (def) => ({
    ...def, name: '猛击+', description: '造成20伤害',
    effects: [{ type: 'damage', value: 20 }],
  }),
  iron_wall: (def) => ({
    ...def, name: '铁壁+', description: '获得16护甲，获得3层屏障',
    effects: [{ type: 'armor', value: 16 }, { type: 'gain_barrier', value: 3 }],
  }),
  frozen_arrow: (def) => ({
    ...def, name: '冻结箭+', description: '造成7伤害，冻结敌人',
    effects: [{ type: 'damage', value: 7 }, { type: 'freeze', value: 1 }],
  }),
  poison_spray: (def) => ({
    ...def, name: '毒液喷射+', description: '造成5伤害，施加5中毒',
    effects: [{ type: 'damage', value: 5 }, { type: 'poison', value: 5 }],
  }),
  soul_siphon: (def) => ({
    ...def, name: '灵魂虹吸+', description: '造成12伤害并吸血12',
    effects: [{ type: 'lifesteal', value: 12 }],
  }),
  sharpen: (def) => ({
    ...def, name: '磨剑+', description: '获得3力量',
    effects: [{ type: 'gain_strength', value: 3 }],
  }),
  meteor_spell: (def) => ({
    ...def, name: '陨石术+', description: '对所有敌人造成20伤害并施加3灼烧',
    effects: [{ type: 'aoe_damage', value: 20 }, { type: 'aoe_burn', value: 3 }],
  }),

  envenom: (def) => ({
    ...def, name: '淬毒+', description: '永久：每次攻击附加3中毒',
    effects: [{ type: 'permanent_poison_on_attack', value: 3 }],
  }),
  overdraft: (def) => ({
    ...def, name: '透支+', description: '获得2体力，下回合-1体力并获得3护甲',
    effects: [{ type: 'gain_stamina', value: 2 }, { type: 'armor', value: 3 }, { type: 'set_next_turn_stamina_penalty', value: 1 }],
  }),
  deep_thought: (def) => ({
    ...def, name: '冥思+', description: '本场战斗智慧+3',
    effects: [{ type: 'gain_wisdom', value: 3 }],
  }),
  focus_energy: (def) => ({
    ...def, name: '聚能+', description: '获得4层蓄能并抽1张牌',
    effects: [{ type: 'gain_charge', value: 4 }, { type: 'draw_cards', value: 1 }],
  }),
  bone_poison: (def) => ({
    ...def, name: '蚀骨毒+', description: '造成5伤害+目标中毒层数伤害',
    effects: [{ type: 'poison_burst', base: 5, perPoison: 1 }],
  }),
  mana_surge: (def) => ({
    ...def, name: '魔力涌流+', description: '获得3魔力，回合末受2伤',
    effects: [{ type: 'gain_mana', value: 3 }, { type: 'set_end_turn_self_damage', value: 2 }],
  }),
  double_strike: (def) => ({
    ...def, name: '双重打击+', description: '造成7伤害×2',
    effects: [{ type: 'multi_damage', value: 7, hits: 2 }],
  }),
  magic_absorb: (def) => ({
    ...def, name: '魔法吸收+', description: '获得9护甲，若回合末护甲未破，下回合+1魔力',
    effects: [{ type: 'armor', value: 9 }, { type: 'set_magic_absorb', bonusMana: 1 }],
  }),
  weakness_curse: (def) => ({
    ...def, name: '虚弱诅咒+', description: '施加3层虚弱',
    effects: [{ type: 'weaken_enemy', value: 3 }],
  }),
  berserk: (def) => ({
    ...def, name: '狂暴+', description: '消耗所有魔力转为体力，获得3力量',
    effects: [{ type: 'convert_mana_to_stamina', value: 1 }, { type: 'gain_strength', value: 3 }],
  }),
  purify: (def) => ({
    ...def, name: '净化+', cost: 0, description: '移除手牌中所有诅咒牌，每移除1张抽1张',
    effects: [{ type: 'purge_curse_in_hand_draw' }],
  }),
  armor_breaker: (def) => ({
    ...def, name: '破甲击+', description: '造成12伤害，击碎目标全部护甲',
    effects: [{ type: 'damage_shred_armor', damage: 12, shred: 999 }],
  }),
  blade_arcane_unity: (def) => ({
    ...def, name: '剑魔合一+', description: '本回合所有卡费-1，抽3张牌',
    effects: [{ type: 'global_cost_reduction', value: 1 }, { type: 'draw_cards', value: 3 }],
  }),
  blood_frenzy: (def) => ({
    ...def, name: '血之狂怒+', description: '失去20%当前HP，获得6力量',
    effects: [{ type: 'current_hp_percent_for_strength', hpPercent: 20, strength: 6 }],
  }),

  final_judgment: (def) => ({
    ...def, name: '终末审判+', cost: 2, description: '造成30伤害；敌人HP≤30%时即死',
    effects: [{ type: 'execute', threshold: 30, damage: 999, baseDamage: 30 }],
  }),
  annihilation_flame: (def) => ({
    ...def, name: '湮灭之焰+', description: '对所有敌人造成20伤害并施加5灼烧，自身受6伤',
    effects: [{ type: 'aoe_damage', value: 20 }, { type: 'aoe_burn', value: 5 }, { type: 'self_damage', value: 6 }],
  }),
  eternal_shield: (def) => ({
    ...def, name: '永恒之盾+', description: '获得25护甲与5层屏障，本回合受伤减半',
    effects: [{ type: 'armor', value: 25 }, { type: 'gain_barrier', value: 5 }, { type: 'set_damage_taken_multiplier', value: 0.5 }],
  }),
  time_rewind: (def) => ({
    ...def, name: '时间倒流+', cost: 1, description: '弃掉当前手牌，重抽5张',
    effects: [{ type: 'redraw_hand', value: 5 }],
  }),
  soul_sacrifice: (def) => ({
    ...def, name: '灵魂献祭+', description: '失去15HP，本回合所有伤害值和护甲值+100%',
    effects: [{ type: 'self_damage', value: 15 }, { type: 'set_damage_armor_multiplier_this_turn', value: 2 }],
  }),
  destiny_rewrite: (def) => ({
    ...def,
    name: '命运改写+',
    cost: 1,
    costType: 'mana',
    description: '消耗。选择1个敌人，跳过它下一次行动',
    effects: [{ type: 'freeze', value: 1 }],
    exhaust: true,
  }),
}

/** Restore to full HP. */
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
