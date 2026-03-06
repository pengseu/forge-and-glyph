import type { RunState, ShopMaterialOffer, ShopOffer } from '../../game/types'
import type { GameCallbacks } from '../renderer'
import { getCardDef } from '../../game/cards'
import { formatMaterial } from '../../game/materials'
import { getShopServicePricingByAct } from '../../game/shop'

export type ShopTab = 'cards' | 'materials' | 'services'

let currentShopTab: ShopTab = 'cards'

export function normalizeShopTab(tab: string | null | undefined): ShopTab {
  if (tab === 'materials' || tab === 'services' || tab === 'cards') return tab
  return 'cards'
}

function resolveCardTypeClass(cardId: string): string {
  const card = getCardDef(cardId)
  if (card.id.startsWith('curse_')) return 'card--curse'
  if (card.category === 'combat') return 'card--attack'
  if (card.category === 'spell') return 'card--skill'
  return 'card--power'
}

export function renderShop(
  container: HTMLElement,
  run: RunState,
  offers: ShopOffer[],
  materialOffers: ShopMaterialOffer[],
  callbacks: GameCallbacks,
): void {
  const servicePricing = getShopServicePricingByAct(run.act)
  const cardsHtml = offers.map((offer, index) => {
    const card = getCardDef(offer.cardId)
    const affordable = run.gold >= offer.price
    const soldClass = offer.sold ? 'is-sold' : ''
    const canBuy = !offer.sold && affordable
    return `
      <article class="shop-card-tile ${soldClass}" data-offer-idx="${index}">
        <div class="card card--showcase ${resolveCardTypeClass(offer.cardId)}">
          <div class="card-cost">${card.cost}</div>
          <div class="card-name">${card.name}</div>
          <div class="card-divider"></div>
          <div class="card-type">${card.category === 'combat' ? '攻击' : card.category === 'spell' ? '法术' : '技巧'}</div>
          <div class="card-desc">${card.description}</div>
          ${offer.sold ? '<div class="shop-sold-mask">已售罄</div>' : ''}
        </div>
        <button class="btn btn-md shop-buy-btn ${canBuy ? '' : 'is-unaffordable'}" data-buy-card-idx="${index}" ${canBuy ? '' : 'disabled'}>
          💰 ${offer.price}
        </button>
      </article>
    `
  }).join('')

  const removableCards = run.deck.map(card => {
    const def = getCardDef(card.defId)
    return `
      <button class="shop-remove-card" data-remove-card-uid="${card.uid}">
        ${def.name}
      </button>
    `
  }).join('')

  const materialHtml = materialOffers.map((offer, idx) => {
    const affordable = run.gold >= offer.price
    const qty = offer.quantity ?? 1
    const canBuy = !offer.sold && affordable
    return `
      <article class="shop-material-item ${offer.sold ? 'is-sold' : ''}">
        <div class="shop-material-name">📦 ${formatMaterial(offer.materialId)} ×${qty}</div>
        <button class="btn btn-md ${canBuy ? '' : 'is-unaffordable'}" data-buy-material-idx="${idx}" ${canBuy ? '' : 'disabled'}>
          ${offer.sold ? '已购' : `💰 ${offer.price}`}
        </button>
      </article>
    `
  }).join('')

  const transformCards = run.deck.map(card => {
    const def = getCardDef(card.defId)
    return `
      <button class="shop-transform-card" data-transform-card-uid="${card.uid}">
        ${def.name}
      </button>
    `
  }).join('')

  container.innerHTML = `
    <div class="scene-shop scene-shop-v3">
      <header class="shop-header">
        <h2 class="shop-title">🏪 旅途商店</h2>
        <div class="shop-gold">💰 余额: ${run.gold}</div>
      </header>
      <nav class="shop-tabs" aria-label="商店分类">
        <button class="shop-tab ${currentShopTab === 'cards' ? 'is-active' : ''}" data-shop-tab="cards" aria-selected="${currentShopTab === 'cards' ? 'true' : 'false'}">🃏 卡牌</button>
        <button class="shop-tab ${currentShopTab === 'materials' ? 'is-active' : ''}" data-shop-tab="materials" aria-selected="${currentShopTab === 'materials' ? 'true' : 'false'}">📦 材料</button>
        <button class="shop-tab ${currentShopTab === 'services' ? 'is-active' : ''}" data-shop-tab="services" aria-selected="${currentShopTab === 'services' ? 'true' : 'false'}">🔧 服务</button>
      </nav>
      <section class="shop-panel ${currentShopTab === 'cards' ? '' : 'is-hidden'}" data-shop-panel="cards">
        <div class="shop-cards-grid">
          ${cardsHtml || '<div class="shop-empty">暂无可购买卡牌</div>'}
        </div>
      </section>
      <section class="shop-panel ${currentShopTab === 'materials' ? '' : 'is-hidden'}" data-shop-panel="materials">
        <div class="shop-materials-grid">
          ${materialHtml || '<div class="shop-empty">本幕无材料商品</div>'}
        </div>
      </section>
      <section class="shop-panel ${currentShopTab === 'services' ? '' : 'is-hidden'}" data-shop-panel="services">
        <div class="shop-services-grid">
          <article class="panel shop-service-item">
            <h3 class="shop-service-title">❤️ 治疗</h3>
            <p class="shop-service-desc">回复${Math.floor(servicePricing.healPercent * 100)}%HP</p>
            <button class="btn btn-md" id="btn-shop-heal" ${run.playerHp >= run.playerMaxHp || run.gold < servicePricing.healPrice ? 'disabled' : ''}>💰 ${servicePricing.healPrice}</button>
          </article>
          <article class="panel shop-service-item">
            <h3 class="shop-service-title">✂️ 删卡</h3>
            <p class="shop-service-desc">选择一张卡移除</p>
            <div class="shop-card-list ${run.gold < servicePricing.removePrice ? 'is-disabled' : ''}">
              ${removableCards}
            </div>
            <div class="shop-service-price">💰 ${servicePricing.removePrice}</div>
          </article>
          <article class="panel shop-service-item">
            <h3 class="shop-service-title">🌀 变卡</h3>
            <p class="shop-service-desc">${servicePricing.transformPrice ? '选择一张卡随机变换' : '本幕无此服务'}</p>
            <div class="shop-card-list ${!servicePricing.transformPrice || run.gold < servicePricing.transformPrice ? 'is-disabled' : ''}">
              ${servicePricing.transformPrice ? transformCards : '<span class="shop-empty-inline">未开放</span>'}
            </div>
            ${servicePricing.transformPrice ? `<div class="shop-service-price">💰 ${servicePricing.transformPrice}</div>` : ''}
          </article>
        </div>
      </section>
      <footer class="shop-footer">
        <button class="btn btn-md" id="btn-shop-leave">🚪 离开商店</button>
      </footer>
    </div>
  `

  const rerender = () => renderShop(container, run, offers, materialOffers, callbacks)

  container.querySelectorAll<HTMLElement>('[data-shop-tab]').forEach((el) => {
    el.addEventListener('click', () => {
      currentShopTab = normalizeShopTab(el.dataset.shopTab)
      rerender()
    })
  })

  container.querySelectorAll<HTMLElement>('[data-buy-card-idx]').forEach((el) => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.buyCardIdx ?? '-1', 10)
      if (idx < 0) return
      callbacks.onShopBuyCard(idx)
    })
  })

  container.querySelectorAll<HTMLElement>('[data-buy-material-idx]').forEach((el) => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.buyMaterialIdx ?? '-1', 10)
      if (idx < 0) return
      callbacks.onShopBuyMaterial(idx)
    })
  })

  container.querySelector('#btn-shop-heal')?.addEventListener('click', () => {
    callbacks.onShopHeal()
  })

  container.querySelectorAll<HTMLElement>('[data-remove-card-uid]').forEach((el) => {
    el.addEventListener('click', () => {
      const uid = el.dataset.removeCardUid
      if (!uid) return
      callbacks.onShopRemoveCard(uid)
    })
  })

  container.querySelectorAll<HTMLElement>('[data-transform-card-uid]').forEach((el) => {
    el.addEventListener('click', () => {
      const uid = el.dataset.transformCardUid
      if (!uid) return
      callbacks.onShopTransformCard(uid)
    })
  })

  container.querySelector('#btn-shop-leave')?.addEventListener('click', () => {
    callbacks.onShopLeave()
  })
}
