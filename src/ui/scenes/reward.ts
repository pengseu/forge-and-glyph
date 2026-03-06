import type { CardDef, MaterialBag } from '../../game/types'
import type { GameCallbacks } from '../renderer'
import { describeWeaponEffect, getWeaponDef } from '../../game/weapons'
import { formatMaterial } from '../../game/materials'

function resolveCardTypeClass(card: CardDef): string {
  if (card.id.startsWith('curse_')) return 'card--curse'
  if (card.category === 'combat') return 'card--attack'
  if (card.category === 'spell') return 'card--skill'
  return 'card--power'
}

export function renderReward(
  container: HTMLElement,
  candidateCards: CardDef[],
  materialRewards: Partial<MaterialBag>,
  droppedWeaponId: string | null,
  callbacks: GameCallbacks,
  act: 1 | 2 | 3 = 1,
  bossAutoDropHint: string | null = null,
): void {
  const materialRuleHint = act === 1
    ? 'Act 1 掉落：普通=铁锭×1；精英=元素精华×1；Boss=王冠碎片×1'
    : act === 2
      ? 'Act 2 掉落：普通=铁/精钢；精英=精钢+随机精华；Boss=Boss材料+额外资源'
      : 'Act 3 掉落：普通=精钢/高阶材质；精英=高阶材质+精华；Boss=终幕专属材料'

  const cardsHtml = candidateCards.map((card, idx) => `
    <div class="reward-choice" data-choice-index="${idx}">
      <div class="card card--showcase ${resolveCardTypeClass(card)} reward-card" data-card-id="${card.id}" tabindex="0" role="button" aria-label="${card.name}">
        <div class="card-cost">${card.cost}</div>
        <div class="card-name">${card.name}</div>
        <div class="card-divider"></div>
        <div class="card-type">${card.category === 'combat' ? '攻击' : card.category === 'spell' ? '法术' : '技巧'}</div>
        <div class="card-desc">${card.description}</div>
      </div>
    </div>
  `).join('')

  const materialEntries = Object.entries(materialRewards).filter(([, v]) => (v ?? 0) > 0)
  const materialHtml = materialEntries.length > 0
    ? `
      <div class="reward-drop-item">
        <div class="reward-drop-title">材料奖励</div>
        <div class="reward-drop-desc">${materialEntries.map(([k, v]) => `${formatMaterial(k as keyof MaterialBag)}×${v}`).join(' · ')}</div>
        <button class="btn btn-md" id="btn-take-material">领取材料</button>
      </div>
    `
    : ''

  let weaponHtml = ''
  if (droppedWeaponId) {
    const weaponDef = getWeaponDef(droppedWeaponId)
    weaponHtml = `
      <div class="reward-drop-item">
        <div class="reward-drop-title">武器掉落</div>
        <div class="reward-drop-desc">${weaponDef.name} · ${describeWeaponEffect(weaponDef.effect)}</div>
        <button class="btn btn-md" id="btn-equip-weapon">装备</button>
      </div>
    `
  }

  container.innerHTML = `
    <div class="scene-reward scene-reward-v2">
      <div class="reward-overlay">
        <div class="reward-panel panel">
          <h2 class="panel-title reward-title">🎉 战斗胜利</h2>
          <div class="reward-rule-hint">${materialRuleHint}</div>
          ${bossAutoDropHint ? `<div class="reward-boss-drop-hint">🏆 ${bossAutoDropHint}</div>` : ''}
          <div class="reward-divider"></div>
          <div class="reward-cards">${cardsHtml}</div>
          <div class="reward-divider"></div>
          <div class="reward-drops">
            ${materialHtml}
            ${weaponHtml}
          </div>
          <div class="reward-actions">
            <button class="btn btn-ghost btn-md" id="btn-skip">跳过 → 获得 25💰</button>
          </div>
        </div>
      </div>
    </div>
  `

  let lockedSelection = false
  const setSelectedCard = (selectedId: string): void => {
    container.querySelectorAll<HTMLElement>('.reward-card').forEach((el) => {
      const isSelected = el.dataset.cardId === selectedId
      el.classList.toggle('is-selected', isSelected)
      el.classList.toggle('is-dimmed', !isSelected)
    })
  }

  container.querySelectorAll<HTMLElement>('.reward-card').forEach((el, idx) => {
    el.style.animationDelay = `${idx * 150}ms`
    const chooseCard = (): void => {
      if (lockedSelection) return
      const cardId = el.dataset.cardId
      if (!cardId) return
      lockedSelection = true
      setSelectedCard(cardId)
      window.setTimeout(() => {
        callbacks.onSelectCard(cardId)
      }, 120)
    }
    el.addEventListener('click', chooseCard)
    el.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        chooseCard()
      }
    })
  })

  const equipBtn = container.querySelector('#btn-equip-weapon')
  if (equipBtn && droppedWeaponId) {
    equipBtn.addEventListener('click', () => {
      callbacks.onEquipWeapon(droppedWeaponId)
    })
  }

  container.querySelector('#btn-skip')?.addEventListener('click', () => {
    callbacks.onSkipReward()
  })

  container.querySelector('#btn-take-material')?.addEventListener('click', () => {
    callbacks.onSelectMaterialReward()
  })
}
