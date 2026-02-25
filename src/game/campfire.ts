import type { CardDef, CardInstance, RunState } from './types'
import { getCardDef } from './cards'

/** Restore HP to max */
export function restoreHp(_run: RunState, _currentHp: number, maxHp: number): { hp: number } {
  return { hp: maxHp }
}

/** Return available upgrade options for a card */
export function getUpgradeOptions(cardDef: CardDef): ('damage' | 'cost')[] {
  const options: ('damage' | 'cost')[] = []
  const hasDamage = cardDef.effects.some(e => e.type === 'damage')
  if (hasDamage) options.push('damage')
  if (cardDef.cost >= 1) options.push('cost')
  return options
}

/** Return a new CardDef with the upgrade applied */
export function upgradeCard(cardDef: CardDef, upgradeType: 'damage' | 'cost'): CardDef {
  if (upgradeType === 'damage') {
    return {
      ...cardDef,
      effects: cardDef.effects.map(e =>
        e.type === 'damage' ? { ...e, value: e.value + 2 } : e,
      ),
    }
  }
  // cost upgrade
  return {
    ...cardDef,
    cost: cardDef.cost - 1,
  }
}

/** Resolve the effective CardDef for a CardInstance, applying upgrades */
export function getEffectiveCardDef(card: CardInstance): CardDef {
  const baseDef = getCardDef(card.defId)
  if (!card.upgraded) return baseDef
  return upgradeCard(baseDef, card.upgraded)
}
