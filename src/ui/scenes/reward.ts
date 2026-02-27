import type { CardDef, MaterialBag } from '../../game/types'
import type { GameCallbacks } from '../renderer'
import { getWeaponDef } from '../../game/weapons'
import { formatMaterial } from '../../game/materials'

export function renderReward(
  container: HTMLElement,
  candidateCards: CardDef[],
  materialRewards: Partial<MaterialBag>,
  droppedWeaponId: string | null,
  callbacks: GameCallbacks,
): void {
  const cardsHtml = candidateCards.map(card => `
    <div class="reward-card" data-card-id="${card.id}" tabindex="0" role="button" aria-label="${card.name}">
      <div class="card-name">${card.name}</div>
      <div class="card-cost">${card.cost}${card.costType === 'stamina' ? '⚡' : card.costType === 'mana' ? '✦' : '免'}</div>
      <div class="card-desc">${card.description}</div>
    </div>
  `).join('')

  const materialEntries = Object.entries(materialRewards).filter(([, v]) => (v ?? 0) > 0)
  const materialHtml = materialEntries.length > 0
    ? `
      <div class="reward-material">
        <div class="reward-material-title">材料奖励</div>
        <div class="reward-material-desc">${materialEntries.map(([k, v]) => `${formatMaterial(k as keyof MaterialBag)}×${v}`).join(' , ')}</div>
        <button class="btn" id="btn-take-material">选择材料</button>
      </div>
    `
    : ''

  let weaponHtml = ''
  if (droppedWeaponId) {
    const weaponDef = getWeaponDef(droppedWeaponId)
    weaponHtml = `
      <div class="weapon-drop">
        <div class="weapon-drop-name">${weaponDef.name}</div>
        <div class="weapon-drop-effect">${weaponDef.effect}</div>
        <button class="btn" id="btn-equip-weapon">装备</button>
      </div>
    `
  }

  container.innerHTML = `
    <div class="scene-reward">
      <h2>选择一张卡牌</h2>
      <div class="reward-cards">${cardsHtml}</div>
      ${materialHtml}
      ${weaponHtml}
      <button class="btn" id="btn-skip">跳过</button>
    </div>
  `

  container.querySelectorAll<HTMLElement>('.reward-card').forEach(el => {
    el.addEventListener('click', () => {
      const cardId = el.dataset.cardId!
      callbacks.onSelectCard(cardId)
    })
    el.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        const cardId = el.dataset.cardId!
        callbacks.onSelectCard(cardId)
      }
    })
  })

  const equipBtn = container.querySelector('#btn-equip-weapon')
  if (equipBtn && droppedWeaponId) {
    equipBtn.addEventListener('click', () => {
      callbacks.onEquipWeapon(droppedWeaponId)
    })
  }

  container.querySelector('#btn-skip')!.addEventListener('click', () => {
    callbacks.onSkipReward()
  })

  container.querySelector('#btn-take-material')?.addEventListener('click', () => {
    callbacks.onSelectMaterialReward()
  })
}
