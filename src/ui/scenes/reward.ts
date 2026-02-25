import type { CardDef } from '../../game/types'
import type { GameCallbacks } from '../renderer'

export function renderReward(
  container: HTMLElement,
  candidateCards: CardDef[],
  callbacks: GameCallbacks,
): void {
  const cardsHtml = candidateCards.map(card => `
    <div class="reward-card" data-card-id="${card.id}">
      <div class="card-name">${card.name}</div>
      <div class="card-cost">${card.cost}${card.costType === 'stamina' ? '⚡' : card.costType === 'mana' ? '✦' : '免'}</div>
      <div class="card-desc">${card.description}</div>
    </div>
  `).join('')

  container.innerHTML = `
    <div class="scene-reward">
      <h2>选择一张卡牌</h2>
      <div class="reward-cards">${cardsHtml}</div>
      <button class="btn" id="btn-skip">跳过</button>
    </div>
  `

  container.querySelectorAll('.reward-card').forEach(el => {
    el.addEventListener('click', () => {
      const cardId = (el as HTMLElement).dataset.cardId!
      callbacks.onSelectCard(cardId)
    })
  })

  container.querySelector('#btn-skip')!.addEventListener('click', () => {
    callbacks.onSkipReward()
  })
}
