import type { RunState, ShopMaterialOffer, ShopOffer } from '../../game/types'
import type { GameCallbacks } from '../renderer'
import { getCardDef } from '../../game/cards'
import { formatMaterial } from '../../game/materials'
import { getShopServicePricingByAct } from '../../game/shop'
import { canTransformCardInShop } from '../../game/run'

export function buildShopHpInfo(playerHp: number, playerMaxHp: number, healPercent: number): string {
  const healValue = Math.min(playerMaxHp - playerHp, Math.floor(playerMaxHp * healPercent))
  return `生命：${playerHp}/${playerMaxHp}（本次治疗 +${Math.max(0, healValue)}）`
}

export function renderShop(
  container: HTMLElement,
  run: RunState,
  offers: ShopOffer[],
  materialOffers: ShopMaterialOffer[],
  callbacks: GameCallbacks,
): void {
  const servicePricing = getShopServicePricingByAct(run.act)
  const healValue = Math.min(run.playerMaxHp - run.playerHp, Math.floor(run.playerMaxHp * servicePricing.healPercent))
  const hpInfo = buildShopHpInfo(run.playerHp, run.playerMaxHp, servicePricing.healPercent)
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
        <div>${def.name}</div>
        <div class="card-desc">${def.description}</div>
      </button>
    `
  }).join('')

  const materialHtml = materialOffers.map((offer, idx) => {
    const affordable = run.gold >= offer.price
    const qty = offer.quantity ?? 1
    return `
      <button class="btn btn-small" data-material-offer-idx="${idx}" ${offer.sold || !affordable ? 'disabled' : ''}>
        ${offer.sold ? '已购' : `${formatMaterial(offer.materialId)} ×${qty} · ${offer.price}G`}
      </button>
    `
  }).join('')

  const transformCards = run.deck.map(card => {
    const def = getCardDef(card.defId)
    const canTransform = canTransformCardInShop(run, card.uid)
    return `
      <button class="shop-transform-card" data-card-uid="${card.uid}" ${canTransform ? '' : 'disabled'}>
        <div>${def.name}</div>
        <div class="card-desc">${def.description}</div>
      </button>
    `
  }).join('')

  container.innerHTML = `
    <div class="scene-shop">
      <h2>🏪 商店</h2>
      <div class="shop-gold">金币：${run.gold}</div>
      <div class="shop-hp">${hpInfo}</div>
      <div class="shop-cards">${cardsHtml}</div>
      <div class="shop-materials">${materialHtml}</div>
      <div class="shop-services">
        <button class="btn" id="btn-shop-heal" ${run.playerHp >= run.playerMaxHp || run.gold < servicePricing.healPrice ? 'disabled' : ''}>
          回复${Math.floor(servicePricing.healPercent * 100)}%HP（预计+${Math.max(0, healValue)}）(${servicePricing.healPrice}金币)
        </button>
        <div class="shop-remove">
          <div class="shop-remove-title">移除卡牌 (${servicePricing.removePrice}金币)</div>
          <div class="shop-remove-list ${run.gold < servicePricing.removePrice ? 'disabled' : ''}">
            ${removableCards}
          </div>
        </div>
        ${servicePricing.transformPrice ? `
          <div class="shop-remove">
            <div class="shop-remove-title">变换卡牌 (${servicePricing.transformPrice}金币)</div>
            <div class="shop-remove-list ${run.gold < servicePricing.transformPrice ? 'disabled' : ''}">
              ${transformCards}
            </div>
          </div>
        ` : ''}
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

  container.querySelectorAll<HTMLElement>('[data-material-offer-idx]').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.materialOfferIdx!, 10)
      callbacks.onShopBuyMaterial(idx)
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

  container.querySelectorAll<HTMLElement>('.shop-transform-card').forEach(el => {
    el.addEventListener('click', () => {
      callbacks.onShopTransformCard(el.dataset.cardUid!)
    })
  })

  container.querySelector('#btn-shop-leave')?.addEventListener('click', () => {
    callbacks.onShopLeave()
  })
}
