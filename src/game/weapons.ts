import type { WeaponDef } from './types'

export const ALL_WEAPONS: WeaponDef[] = [
  {
    id: 'longsword', name: '长剑', rarity: 'basic',
    effect: '战技卡打出后，下一张战技卡费用-1',
    normalAttack: { damage: 6 },
  },
  {
    id: 'longsword_upgraded', name: '精钢长剑', rarity: 'upgraded',
    effect: '战技卡打出后，下一张战技卡费用-2',
    normalAttack: { damage: 8 },
  },
  {
    id: 'iron_longsword', name: '铁制长剑', rarity: 'basic',
    effect: '战技卡打出后，下一张战技卡费用-1',
    normalAttack: { damage: 6 },
  },
  {
    id: 'steel_longsword', name: '精钢长剑·锻造', rarity: 'upgraded',
    effect: '战技卡打出后，下一张战技卡费用-2',
    normalAttack: { damage: 8 },
  },
  {
    id: 'iron_dagger', name: '铁制匕首', rarity: 'basic',
    effect: '每回合首张≤1费战技：额外抽1张牌',
    normalAttack: { damage: 3, hits: 2 },
  },
  {
    id: 'iron_hammer', name: '铁制战锤', rarity: 'basic',
    effect: '单次重击造成≥15总伤时，额外击碎3点护甲',
    normalAttack: { damage: 10 },
  },
  {
    id: 'iron_bow', name: '铁制弓', rarity: 'basic',
    effect: '本回合未受伤时，战技伤害+30%',
    normalAttack: { damage: 5 },
  },
  {
    id: 'iron_staff', name: '铁制法杖', rarity: 'basic',
    effect: '法术伤害+20%，每打出1张法术获得1层蓄能',
    normalAttack: { damage: 3 },
  },
]

export function getWeaponDef(id: string): WeaponDef {
  const weapon = ALL_WEAPONS.find(w => w.id === id)
  if (!weapon) throw new Error(`Weapon not found: ${id}`)
  return weapon
}
