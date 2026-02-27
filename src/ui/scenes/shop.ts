import type { RunState, ShopOffer } from '../../game/types'
import type { GameCallbacks } from '../renderer'
import { getCardDef } from '../../game/cards'

export function renderShop(
  container: HTMLElement,
  run: RunState,
  offers: ShopOffer[],
  callbacks: GameCallbacks,
): void {
  const cardsHtml = offers.map((offer, index) => {
    const card = getCardDef(offer.cardId)
    const affordable = run.gold >= offer.price
    return `
      <div class="shop-card ${offer.sold ? 'sold' : ''}" data-offer-idx="${index}">
        <div class="card-name">${card.name}</div>
        <div class="card-cost">${card.cost}${card.costType === 'stamina' ? '⚡' : card.costType === 'mana' ? '✦' : '免'}</div>
        <div class="card-desc">${card.description}</div>
        <button class="btn btn-shop-buy" ${offer.sold || !affordable ? 'disabled' : ''}>
          ${offer.sold ? '已售出' : `${offer.price} 金币`}
        </button>
      </div>
    `
  }).join('')

  const removableCards = run.deck.map(card => {
    const def = getCardDef(card.defId)
    return `
      <button class="shop-remove-card" data-card-uid="${card.uid}">
        ${def.name}
      </button>
    `
  }).join('')

  container.innerHTML = `
    <div class="scene-shop">
      <h2>🏪 商店</h2>
      <div class="shop-gold">金币：${run.gold}</div>
      <div class="shop-cards">${cardsHtml}</div>
      <div class="shop-services">
        <button class="btn" id="btn-shop-heal" ${run.playerHp >= run.playerMaxHp || run.gold < 30 ? 'disabled' : ''}>
          回复30%HP (30金币)
        </button>
        <div class="shop-remove">
          <div class="shop-remove-title">移除卡牌 (50金币)</div>
          <div class="shop-remove-list ${run.gold < 50 ? 'disabled' : ''}">
            ${removableCards}
          </div>
        </div>
      </div>
      <button class="btn" id="btn-shop-leave">离开商店</button>
    </div>
  `

  container.querySelectorAll<HTMLElement>('.shop-card').forEach(el => {
    el.querySelector('.btn-shop-buy')?.addEventListener('click', () => {
      const idx = parseInt(el.dataset.offerIdx!, 10)
      callbacks.onShopBuyCard(idx)
    })
  })

  container.querySelector('#btn-shop-heal')?.addEventListener('click', () => {
    callbacks.onShopHeal()
  })

  container.querySelectorAll<HTMLElement>('.shop-remove-card').forEach(el => {
    el.addEventListener('click', () => {
      callbacks.onShopRemoveCard(el.dataset.cardUid!)
    })
  })

  container.querySelector('#btn-shop-leave')?.addEventListener('click', () => {
    callbacks.onShopLeave()
  })
}
