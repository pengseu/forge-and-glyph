import type { EnchantmentId } from './types'

export interface EnchantmentDef {
  id: EnchantmentId
  name: string
  icon: string
  desc: string
}

export const ENCHANTMENTS: EnchantmentDef[] = [
  { id: 'flame', icon: '🔥', name: '烈焰', desc: '攻击命中施加1灼烧' },
  { id: 'frost', icon: '❄️', name: '寒冰', desc: '每第3次攻击命中触发冻结' },
  { id: 'thunder', icon: '⚡', name: '雷电', desc: '攻击命中弹射4伤害' },
  { id: 'soul', icon: '💀', name: '汲魂', desc: '击杀回复5HP' },
  { id: 'void', icon: '🌀', name: '虚空', desc: '攻击无视4点护甲' },
  { id: 'bless', icon: '✨', name: '祝福', desc: '攻击伤害+3' },
  { id: 'abyss', icon: '🕳️', name: '深渊', desc: '本回合已造成总伤≥30时，此次攻击额外+10伤害' },
]

export interface ResonanceDef {
  id: 'magma' | 'thunderflame' | 'storm' | 'reaper' | 'holyflame' | 'annihilation' | 'inferno_abyss' | 'eclipse_abyss'
  name: string
  pair: [EnchantmentId, EnchantmentId]
}

export const RESONANCES: ResonanceDef[] = [
  { id: 'magma', name: '熔岩', pair: ['flame', 'frost'] },
  { id: 'thunderflame', name: '雷焰', pair: ['flame', 'thunder'] },
  { id: 'storm', name: '风暴', pair: ['frost', 'thunder'] },
  { id: 'reaper', name: '死神', pair: ['soul', 'void'] },
  { id: 'holyflame', name: '圣火', pair: ['flame', 'bless'] },
  { id: 'annihilation', name: '终焉', pair: ['abyss', 'void'] },
  { id: 'inferno_abyss', name: '末日', pair: ['abyss', 'flame'] },
  { id: 'eclipse_abyss', name: '轮回', pair: ['abyss', 'soul'] },
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
