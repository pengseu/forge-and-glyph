import type { CardDef } from '../../game/types'
import type { GameCallbacks } from '../renderer'
import { getWeaponDef } from '../../game/weapons'

export function renderReward(
  container: HTMLElement,
  candidateCards: CardDef[],
  droppedWeaponId: string | null,
  callbacks: GameCallbacks,
): void {
  const cardsHtml = candidateCards.map(card => `
    <div class="reward-card" data-card-id="${card.id}">
      <div class="card-name">${card.name}</div>
      <div class="card-cost">${card.cost}${card.costType === 'stamina' ? '⚡' : card.costType === 'mana' ? '✦' : '免'}</div>
      <div class="card-desc">${card.description}</div>
    </div>
  `).join('')

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
      ${weaponHtml}
      <button class="btn" id="btn-skip">跳过</button>
    </div>
  `

  container.querySelectorAll('.reward-card').forEach(el => {
    el.addEventListener('click', () => {
      const cardId = (el as HTMLElement).dataset.cardId!
      callbacks.onSelectCard(cardId)
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
}
