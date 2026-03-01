import type { NodeType } from './types'

export const RUN_BASE_CONFIG = {
  startingHp: 60,
  startingGold: 0,
  postBattleHeal: 4,
  eliteBonusMaxHp: 5,
  eliteBonusHeal: 8,
} as const

export const BATTLE_GOLD_RANGE: Record<'normal' | 'elite' | 'boss', { min: number; max: number }> = {
  normal: { min: 18, max: 25 },
  elite: { min: 32, max: 40 },
  boss: { min: 50, max: 70 },
}

export function resolveBattleGoldRange(nodeType: NodeType): { min: number; max: number } {
  if (nodeType === 'elite_battle' || nodeType === 'trial') return BATTLE_GOLD_RANGE.elite
  if (nodeType === 'boss_battle') return BATTLE_GOLD_RANGE.boss
  return BATTLE_GOLD_RANGE.normal
}

export const SHOP_SERVICE_BY_ACT: Record<1 | 2 | 3, { healPrice: number; removePrice: number; healPercent: number; transformPrice?: number }> = {
  1: { healPrice: 25, removePrice: 40, healPercent: 0.3 },
  2: { healPrice: 25, removePrice: 50, healPercent: 0.3 },
  3: { healPrice: 30, removePrice: 60, healPercent: 0.5, transformPrice: 35 },
}

export const BOSS_LEGENDARY_WEAPON_BY_ACT: Record<1 | 2 | 3, string> = {
  1: 'mythic_ant_swarm_dagger',
  2: 'mythic_twilight_staff',
  3: 'mythic_finale_greatsword',
}
