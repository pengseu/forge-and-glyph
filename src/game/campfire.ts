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
  bloodthirst: (def) => ({
    ...def, name: '嗜血+', description: '造成5伤害；本回合已伤害该敌人则改为12',
    effects: [{ type: 'conditional_damage', base: 5, value: 7, condition: 'enemy_damaged' }],
  }),
  charge_up: (def) => ({
    ...def, name: '蓄力+', cost: 0,
    description: '下一张战技卡伤害翻倍',
    effects: [{ type: 'buff_next_combat_double' }],
  }),
  arcane_amplify: (def) => ({
    ...def, name: '奥术增幅+',
    description: '下一张法术+8伤害，+1魔力',
    effects: [{ type: 'buff_next_spell', bonusDamage: 8, bonusMana: 1 }],
  }),
  sacrifice: (def) => ({
    ...def, name: '献祭+',
    description: '失去3HP，获得3魔力',
    effects: [{ type: 'self_damage_gain_mana', damage: 3, mana: 3 }],
  }),
  sword_dance: (def) => ({
    ...def, name: '剑舞+',
    description: '造成4×3伤害',
    effects: [{ type: 'multi_damage', value: 4, hits: 3 }],
  }),
  chain_lightning: (def) => ({
    ...def, name: '连锁闪电+',
    description: '造成5伤害，弹射4次',
    effects: [{ type: 'chain_damage', value: 5, bounces: 4 }],
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
  attack_defend: (def) => ({
    ...def, name: '以攻代守+',
    description: '造成7伤害，获得7护甲',
    effects: [{ type: 'damage_gain_armor', damage: 7, armor: 7 }],
  }),
  magic_shield: (def) => ({
    ...def, name: '魔法盾+',
    description: '获得11护甲；本回合受过伤额外+6',
    effects: [{ type: 'conditional_armor', value: 6, condition: 'damage_taken' }, { type: 'armor', value: 11 }],
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
  temp_forge: (def) => ({
    ...def, name: '临时锻造+',
    description: '获得11护甲，抽2张牌',
    effects: [{ type: 'armor', value: 11 }, { type: 'draw_cards', value: 2 }],
  }),
  // New card upgrades
  whirlwind: (def) => ({
    ...def, name: '旋风斩+',
    description: '对所有敌人造成8伤害',
    effects: [{ type: 'aoe_damage', value: 8 }],
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
  fortify: (def) => ({
    ...def, name: '坚守+',
    description: '获得10护甲，获得5层屏障',
    effects: [{ type: 'armor', value: 10 }, { type: 'gain_barrier', value: 5 }],
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
