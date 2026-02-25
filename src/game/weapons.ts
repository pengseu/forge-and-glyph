import type { WeaponDef } from './types'

export const ALL_WEAPONS: WeaponDef[] = [
  {
    id: 'longsword', name: '长剑', rarity: 'basic',
    effect: '战技卡打出后，下一张战技卡费用-1',
  },
  {
    id: 'longsword_upgraded', name: '精钢长剑', rarity: 'upgraded',
    effect: '战技卡打出后，下一张战技卡费用-2',
  },
]

export function getWeaponDef(id: string): WeaponDef {
  const weapon = ALL_WEAPONS.find(w => w.id === id)
  if (!weapon) throw new Error(`Weapon not found: ${id}`)
  return weapon
}
