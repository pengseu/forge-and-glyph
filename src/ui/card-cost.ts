import type { CostType } from '../game/types'

export type CardCostBadgeInput = {
  costType: CostType | string
  costLabel: string
}

type ParsedSingleCost = {
  resource: string
  current: string
  old?: string
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function resolveTypeClass(costType: CostType | string): string {
  return ['stamina', 'mana', 'hybrid', 'free'].includes(costType) ? costType : 'neutral'
}

function parseSingleCost(label: string): ParsedSingleCost | null {
  const matched = label.match(/^(体|法)(\d+)(?:→(\d+))?$/)
  if (!matched) return null
  return {
    resource: matched[1],
    old: matched[3] ? matched[2] : undefined,
    current: matched[3] ?? matched[2],
  }
}

function buildValueHtml(current: string, old?: string): string {
  if (!old || old === current) {
    return `<span class="card-cost__value"><span class="card-cost__value-current">${escapeHtml(current)}</span></span>`
  }
  return `<span class="card-cost__value card-cost__value--discount"><span class="card-cost__value-old">${escapeHtml(old)}</span><span class="card-cost__arrow">→</span><span class="card-cost__value-current">${escapeHtml(current)}</span></span>`
}

function buildResourceHtml(resource: string): string {
  const tone = resource === '法' ? 'mana' : 'stamina'
  return `<span class="card-cost__resource card-cost__resource--${tone} card-cost__resource--paper">${escapeHtml(resource)}</span>`
}

function buildPairHtml(parsed: ParsedSingleCost): string {
  return `<span class="card-cost__pair">${buildResourceHtml(parsed.resource)}${buildValueHtml(parsed.current, parsed.old)}</span>`
}

function buildBadgeInnerHtml(costType: CostType | string, costLabel: string): string {
  if (costType === 'free' || costLabel === '免') {
    return `<span class="card-cost__value card-cost__value--paper card-cost__value-free"><span class="card-cost__value-current">免</span></span>`
  }

  if (costType === 'hybrid' || costLabel.includes('/')) {
    const parts = costLabel.split('/').map((part) => parseSingleCost(part.trim())).filter(Boolean) as ParsedSingleCost[]
    if (parts.length > 0) {
      return parts.map((part) => buildPairHtml(part)).join('')
    }
  }

  const parsed = parseSingleCost(costLabel)
  if (parsed) {
    return buildPairHtml(parsed)
  }

  return `<span class="card-cost__value"><span class="card-cost__value-current">${escapeHtml(costLabel)}</span></span>`
}

export function resolveReadableCostLabel(cost: number, costType: CostType | string): string {
  if (costType === 'free') return '免'
  if (costType === 'stamina') return `体${cost}`
  if (costType === 'mana') return `法${cost}`
  if (costType === 'hybrid') return `体${cost}/法${cost}`
  return `${cost}`
}

export function buildCardCostBadgeHtml(input: CardCostBadgeInput): string {
  const typeClass = resolveTypeClass(input.costType)
  return `<div class="card-cost card-cost--${typeClass}" aria-label="费用 ${escapeHtml(input.costLabel)}"><span class="card-cost__body">${buildBadgeInnerHtml(input.costType, input.costLabel)}</span></div>`
}
