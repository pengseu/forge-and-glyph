import type { CostType } from '../game/types'

export type CardCostBadgeInput = {
  costType: CostType | string
  costLabel: string
}

export function resolveReadableCostLabel(cost: number, costType: CostType | string): string {
  if (costType === 'free') return '免'
  if (costType === 'stamina') return `体${cost}`
  if (costType === 'mana') return `法${cost}`
  if (costType === 'hybrid') return `体${cost}/法${cost}`
  return `${cost}`
}

export function buildCardCostBadgeHtml(input: CardCostBadgeInput): string {
  const typeClass = ['stamina', 'mana', 'hybrid', 'free'].includes(input.costType) ? input.costType : 'neutral'
  return `<div class="card-cost card-cost--${typeClass}"><span class="card-cost-label">${input.costLabel}</span></div>`
}
