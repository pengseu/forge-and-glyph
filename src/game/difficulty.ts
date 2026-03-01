import type { EnemyState, NodeType } from './types'

export function getNodeHpScale(layerY: number, nodeType: NodeType, act: 1 | 2 | 3): number {
  if (nodeType === 'boss_battle') return 1
  const perLayer = act === 1 ? 0.05 : act === 2 ? 0.08 : 0.1
  const eliteBonus = act === 1 ? 0.05 : act === 2 ? 0.08 : 0.1
  const layerDelta = Math.max(0, layerY - 2)
  const baseScale = 1 + (layerDelta * perLayer)
  const scaled = (nodeType === 'elite_battle' || nodeType === 'trial') ? baseScale + eliteBonus : baseScale
  return Math.round(scaled * 100) / 100
}

export function scaleEnemyHp(enemies: EnemyState[], scale: number): EnemyState[] {
  if (scale <= 1) return enemies
  return enemies.map((enemy) => {
    const scaledMaxHp = Math.max(1, Math.floor(enemy.maxHp * scale))
    const hpRatio = enemy.maxHp > 0 ? enemy.hp / enemy.maxHp : 1
    const scaledHp = Math.max(1, Math.floor(scaledMaxHp * hpRatio))
    return {
      ...enemy,
      maxHp: scaledMaxHp,
      hp: scaledHp,
    }
  })
}
