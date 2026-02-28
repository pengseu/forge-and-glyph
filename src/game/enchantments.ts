import type { EnchantmentId } from './types'

export interface EnchantmentDef {
  id: EnchantmentId
  name: string
  icon: string
  desc: string
}

export const ENCHANTMENTS: EnchantmentDef[] = [
  { id: 'flame', icon: '🔥', name: '烈焰', desc: '普攻/战技命中施加1灼烧' },
  { id: 'frost', icon: '❄️', name: '寒冰', desc: '普攻/战技命中20%冻结' },
  { id: 'thunder', icon: '⚡', name: '雷电', desc: '普攻/战技命中弹射3伤害' },
  { id: 'soul', icon: '💀', name: '汲魂', desc: '击杀回复5HP' },
  { id: 'void', icon: '🌀', name: '虚空', desc: '普攻/战技无视3点护甲' },
  { id: 'bless', icon: '✨', name: '祝福', desc: '普攻/战技伤害+3' },
]

export interface ResonanceDef {
  id: 'magma' | 'thunderflame' | 'storm' | 'reaper' | 'holyflame'
  name: string
  pair: [EnchantmentId, EnchantmentId]
}

export const RESONANCES: ResonanceDef[] = [
  { id: 'magma', name: '熔岩', pair: ['flame', 'frost'] },
  { id: 'thunderflame', name: '雷焰', pair: ['flame', 'thunder'] },
  { id: 'storm', name: '风暴', pair: ['frost', 'thunder'] },
  { id: 'reaper', name: '死神', pair: ['soul', 'void'] },
  { id: 'holyflame', name: '圣火', pair: ['flame', 'bless'] },
]

export function getEnchantmentDef(id: EnchantmentId): EnchantmentDef {
  const def = ENCHANTMENTS.find(e => e.id === id)
  if (!def) throw new Error(`Enchantment not found: ${id}`)
  return def
}

export function hasResonance(enchantments: EnchantmentId[], a: EnchantmentId, b: EnchantmentId): boolean {
  return enchantments.includes(a) && enchantments.includes(b)
}

export function getTriggeredResonances(enchantments: EnchantmentId[]): ResonanceDef[] {
  return RESONANCES.filter((r) => hasResonance(enchantments, r.pair[0], r.pair[1]))
}
