import type { BattleState, WeaponDef, WeaponEffect } from './types'

function dealFlatDamageToAllEnemies(state: BattleState, damage: number): BattleState {
  if (damage <= 0) return state
  return {
    ...state,
    enemies: state.enemies.map((enemy) => {
      if (enemy.hp <= 0) return enemy
      let remaining = damage
      let armor = enemy.armor
      let hp = enemy.hp
      if (armor > 0) {
        const absorbed = Math.min(armor, remaining)
        armor -= absorbed
        remaining -= absorbed
      }
      hp = Math.max(0, hp - remaining)
      return { ...enemy, armor, hp }
    }),
  }
}

export const ALL_WEAPONS: WeaponDef[] = [
  {
    id: 'iron_longsword', name: '铁制长剑', rarity: 'basic',
    effect: { type: 'next_combat_discount', discount: 1 },
    normalAttack: { damage: 6 },
    onCardPlayed: ({ state, cardDef }) => {
      if (cardDef.category !== 'combat') return state
      return { ...state, player: { ...state.player, weaponDiscount: 1 } }
    },
  },
  {
    id: 'iron_staff', name: '铁制法杖', rarity: 'basic',
    effect: { type: 'spell_damage_bonus_and_charge', damagePercent: 20, chargeGain: 1 },
    normalAttack: { damage: 3 },
    onCardPlayed: ({ state, cardDef }) => {
      if (cardDef.category !== 'spell') return state
      return {
        ...state,
        player: {
          ...state.player,
          charge: state.player.charge + 1,
          spellCounterThisBattle: state.player.spellCounterThisBattle + 1,
        },
      }
    },
  },
  {
    id: 'iron_dagger', name: '铁制匕首', rarity: 'basic',
    effect: { type: 'first_low_cost_combat_draw', maxCost: 1, draw: 1 },
    normalAttack: { damage: 3, hits: 2 },
    onCardPlayed: ({ state, cardDef, spentStaminaCost, drawCards }) => {
      if (cardDef.category !== 'combat') return state
      if (spentStaminaCost > 1 || state.player.weaponPerTurnUsed) return state
      const withDraw = drawCards(state, 1)
      return { ...withDraw, player: { ...withDraw.player, weaponPerTurnUsed: true } }
    },
  },
  {
    id: 'iron_hammer', name: '铁制战锤', rarity: 'basic',
    effect: { type: 'heavy_hit_shred_armor', minDamage: 15, shred: 3 },
    normalAttack: { damage: 10 },
    onCardPlayed: ({ state, cardDef, targetIndex, targetBeforeHpArmor }) => {
      if (cardDef.category !== 'combat') return state
      const targetAfter = state.enemies[targetIndex]
      if (!targetAfter) return state
      const targetAfterHpArmor = targetAfter.hp + targetAfter.armor
      const dealt = Math.max(0, targetBeforeHpArmor - targetAfterHpArmor)
      if (dealt < 15 || targetAfter.armor <= 0) return state
      return {
        ...state,
        enemies: state.enemies.map((e, i) =>
          i === targetIndex ? { ...e, armor: Math.max(0, e.armor - 3) } : e,
        ),
      }
    },
  },
  {
    id: 'iron_bow', name: '铁制弓', rarity: 'basic',
    effect: { type: 'first_combat_damage_bonus_percent', percent: 30 },
    normalAttack: { damage: 5 },
  },

  {
    id: 'steel_longsword', name: '精钢长剑', rarity: 'upgraded',
    effect: { type: 'next_combat_discount', discount: 2 },
    normalAttack: { damage: 8 },
    onCardPlayed: ({ state, cardDef }) => {
      if (cardDef.category !== 'combat') return state
      return { ...state, player: { ...state.player, weaponDiscount: 2 } }
    },
  },
  {
    id: 'steel_staff', name: '精钢法杖', rarity: 'upgraded',
    effect: { type: 'spell_damage_bonus_and_charge', damagePercent: 30, chargeGain: 1 },
    normalAttack: { damage: 4 },
    onCardPlayed: ({ state, cardDef }) => {
      if (cardDef.category !== 'spell') return state
      return {
        ...state,
        player: {
          ...state.player,
          charge: state.player.charge + 1,
          armor: state.player.armor + 1,
          spellCounterThisBattle: state.player.spellCounterThisBattle + 1,
        },
      }
    },
  },
  {
    id: 'steel_dagger', name: '精钢匕首', rarity: 'upgraded',
    effect: { type: 'custom', text: '每回合首张实际体力≤1的战技：额外抽1并回复1体力' },
    normalAttack: { damage: 4, hits: 2 },
    onCardPlayed: ({ state, cardDef, spentStaminaCost, drawCards }) => {
      if (cardDef.category !== 'combat') return state
      if (spentStaminaCost > 1 || state.player.weaponPerTurnUsed) return state
      const withDraw = drawCards(state, 1)
      return {
        ...withDraw,
        player: {
          ...withDraw.player,
          stamina: withDraw.player.stamina + 1,
          weaponPerTurnUsed: true,
        },
      }
    },
  },
  {
    id: 'steel_hammer', name: '精钢战锤', rarity: 'upgraded',
    effect: { type: 'custom', text: '单次重击≥15伤时：额外击碎5甲并施加1易伤' },
    normalAttack: { damage: 12 },
    onCardPlayed: ({ state, cardDef, targetIndex, targetBeforeHpArmor }) => {
      if (cardDef.category !== 'combat') return state
      const targetAfter = state.enemies[targetIndex]
      if (!targetAfter) return state
      const dealt = Math.max(0, targetBeforeHpArmor - (targetAfter.hp + targetAfter.armor))
      if (dealt < 15) return state
      return {
        ...state,
        enemies: state.enemies.map((e, i) =>
          i === targetIndex
            ? { ...e, armor: Math.max(0, e.armor - 5), vulnerable: e.vulnerable + 1 }
            : e,
        ),
      }
    },
  },
  {
    id: 'steel_bow', name: '精钢弓', rarity: 'upgraded',
    effect: { type: 'custom', text: '每回合首个攻击+30%；若本回合未受伤额外+2伤' },
    normalAttack: { damage: 7 },
  },

  {
    id: 'legend_kings_blade', name: '传说长剑·王者之刃', rarity: 'legendary',
    effect: { type: 'custom', text: '下张战技-2费；每回合首次战技暴击×1.5' },
    normalAttack: { damage: 10 },
    onCardPlayed: ({ state, cardDef }) => {
      if (cardDef.category !== 'combat') return state
      return { ...state, player: { ...state.player, weaponDiscount: 2 } }
    },
  },
  {
    id: 'legend_prismatic_scepter', name: '传说法杖·虹彩权杖', rarity: 'legendary',
    effect: { type: 'custom', text: '法术+40%；每回合前两张法术-1费；蓄能满5自动全体15伤' },
    normalAttack: { damage: 5 },
    onCardPlayed: ({ state, cardDef }) => {
      if (cardDef.category !== 'spell') return state
      const nextCharge = state.player.charge + 1
      let nextState: BattleState = {
        ...state,
        player: {
          ...state.player,
          charge: nextCharge,
          spellCounterThisBattle: state.player.spellCounterThisBattle + 1,
        },
      }
      if (nextCharge >= 5) {
        nextState = dealFlatDamageToAllEnemies(nextState, 15)
        nextState = {
          ...nextState,
          player: { ...nextState.player, charge: nextCharge - 5 },
        }
      }
      return nextState
    },
  },
  {
    id: 'legend_shadow_daggers', name: '传说匕首·影舞双刃', rarity: 'legendary',
    effect: { type: 'custom', text: '首张≤1费战技抽1+回1体；每回合第三张战技免费' },
    normalAttack: { damage: 5, hits: 2 },
    onCardPlayed: ({ state, cardDef, spentStaminaCost, drawCards }) => {
      if (cardDef.category !== 'combat') return state
      if (spentStaminaCost > 1 || state.player.weaponPerTurnUsed) return state
      const withDraw = drawCards(state, 1)
      return {
        ...withDraw,
        player: {
          ...withDraw.player,
          stamina: withDraw.player.stamina + 1,
          weaponPerTurnUsed: true,
        },
      }
    },
  },
  {
    id: 'legend_doom_hammer', name: '传说战锤·毁灭之锤', rarity: 'legendary',
    effect: { type: 'custom', text: '重击击碎全部护甲并施加2易伤；对有护甲目标伤害+50%' },
    normalAttack: { damage: 14 },
    onCardPlayed: ({ state, cardDef, targetIndex, targetBeforeHpArmor }) => {
      if (cardDef.category !== 'combat') return state
      const targetAfter = state.enemies[targetIndex]
      if (!targetAfter) return state
      const dealt = Math.max(0, targetBeforeHpArmor - (targetAfter.hp + targetAfter.armor))
      if (dealt < 15) return state
      return {
        ...state,
        enemies: state.enemies.map((e, i) =>
          i === targetIndex ? { ...e, armor: 0, vulnerable: e.vulnerable + 2 } : e,
        ),
      }
    },
  },

  {
    id: 'mythic_ant_swarm_dagger', name: '传奇匕首·蚁群', rarity: 'legendary',
    effect: { type: 'custom', text: '每次攻击召唤地精幽灵协同攻击（3伤）' },
    normalAttack: { damage: 6 },
  },
  {
    id: 'mythic_twilight_staff', name: '传奇法杖·暮影', rarity: 'legendary',
    effect: { type: 'custom', text: '法术命中后额外抽1并回复1魔力' },
    normalAttack: { damage: 6 },
    onCardPlayed: ({ state, cardDef, drawCards }) => {
      if (cardDef.category !== 'spell') return state
      const withDraw = drawCards(state, 1)
      return {
        ...withDraw,
        player: {
          ...withDraw.player,
          mana: withDraw.player.mana + 1,
          spellCounterThisBattle: withDraw.player.spellCounterThisBattle + 1,
        },
      }
    },
  },
  {
    id: 'mythic_finale_greatsword', name: '传奇巨剑·终焉', rarity: 'legendary',
    effect: { type: 'custom', text: '每次攻击对全体敌人造成50%溅射伤害' },
    normalAttack: { damage: 12 },
  },

  {
    id: 'replica_ant_swarm_dagger', name: '凡人仿品·蚁群', rarity: 'replica',
    effect: { type: 'custom', text: '每第3次攻击召唤地精幽灵协同攻击（3伤）' },
    normalAttack: { damage: 5 },
  },
  {
    id: 'replica_twilight_staff', name: '凡人仿品·暮影', rarity: 'replica',
    effect: { type: 'custom', text: '每第2张法术额外抽1张' },
    normalAttack: { damage: 5 },
    onCardPlayed: ({ state, cardDef, drawCards }) => {
      if (cardDef.category !== 'spell') return state
      const nextCount = state.player.spellCounterThisBattle + 1
      let nextState: BattleState = {
        ...state,
        player: { ...state.player, spellCounterThisBattle: nextCount },
      }
      if (nextCount % 2 === 0) {
        nextState = drawCards(nextState, 1)
      }
      return nextState
    },
  },
  {
    id: 'replica_finale_greatsword', name: '凡人仿品·终焉', rarity: 'replica',
    effect: { type: 'custom', text: '击杀目标时对相邻敌人造成8伤' },
    normalAttack: { damage: 10 },
  },
]

export function describeWeaponEffect(effect: WeaponEffect): string {
  switch (effect.type) {
    case 'next_combat_discount':
      return `战技卡打出后，下一张战技卡费用-${effect.discount}`
    case 'first_low_cost_combat_draw':
      return `每回合首张≤${effect.maxCost}费战技：额外抽${effect.draw}张牌`
    case 'heavy_hit_shred_armor':
      return `单次重击造成≥${effect.minDamage}总伤时，额外击碎${effect.shred}点护甲`
    case 'first_combat_damage_bonus_percent':
      return `每回合首个攻击伤害+${effect.percent}%`
    case 'spell_damage_bonus_and_charge':
      return `法术伤害+${effect.damagePercent}%，每打出1张法术获得${effect.chargeGain}层蓄能`
    case 'custom':
      return effect.text
  }
}

export function getWeaponDef(id: string): WeaponDef {
  const weapon = ALL_WEAPONS.find(w => w.id === id)
  if (!weapon) throw new Error(`Weapon not found: ${id}`)
  return weapon
}
