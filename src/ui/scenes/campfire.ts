import type { RunState } from '../../game/types'
import type { GameCallbacks } from '../renderer'
import { getCardDef } from '../../game/cards'
import { canUpgrade, getEffectiveCardDef, upgradeCard } from '../../game/campfire'

type CampfireView = 'menu' | 'upgrade'

let currentView: CampfireView = 'menu'

export function renderCampfire(
  container: HTMLElement,
  run: RunState,
  playerHp: number,
  playerMaxHp: number,
  callbacks: GameCallbacks,
): void {
  container.innerHTML = ''
  const wrapper = document.createElement('div')
  wrapper.className = 'scene-campfire'

  const rerender = () => renderCampfire(container, run, playerHp, playerMaxHp, callbacks)

  if (currentView === 'menu') {
    renderMenu(wrapper, playerHp, playerMaxHp, callbacks, rerender)
  } else {
    renderUpgradeView(wrapper, run, callbacks, rerender)
  }

  container.appendChild(wrapper)
}

export function resetCampfireView(): void {
  currentView = 'menu'
}

function renderMenu(
  wrapper: HTMLElement,
  playerHp: number,
  playerMaxHp: number,
  callbacks: GameCallbacks,
  rerender: () => void,
): void {
  const title = document.createElement('h2')
  title.textContent = '🔥 篝火'
  wrapper.appendChild(title)

  const options = document.createElement('div')
  options.className = 'campfire-options'
  const healBtn = document.createElement('button')
  healBtn.className = 'btn'
  healBtn.textContent = `回血 (${playerHp} / ${playerMaxHp})`
  if (playerHp >= playerMaxHp) {
    healBtn.disabled = true
  }
  healBtn.addEventListener('click', () => {
    callbacks.onCampfireHeal()
  })
  options.appendChild(healBtn)

  const upgradeBtn = document.createElement('button')
  upgradeBtn.className = 'btn'
  upgradeBtn.textContent = '升级卡牌'
  upgradeBtn.addEventListener('click', () => {
    currentView = 'upgrade'
    rerender()
  })
  options.appendChild(upgradeBtn)

  const continueBtn = document.createElement('button')
  continueBtn.className = 'btn'
  continueBtn.textContent = '继续旅程'
  continueBtn.addEventListener('click', () => {
    resetCampfireView()
    callbacks.onCampfireContinue()
  })
  options.appendChild(continueBtn)

  wrapper.appendChild(options)
}

function renderUpgradeView(
  wrapper: HTMLElement,
  run: RunState,
  callbacks: GameCallbacks,
  rerender: () => void,
): void {
  const title = document.createElement('h2')
  title.textContent = '选择要升级的卡牌'
  wrapper.appendChild(title)

  const cardsContainer = document.createElement('div')
  cardsContainer.className = 'campfire-cards'

  for (const card of run.deck) {
    const effectiveDef = getEffectiveCardDef(card)
    const isUpgraded = !!card.upgraded
    const baseDef = getCardDef(card.defId)
    const hasUpgrade = canUpgrade(baseDef)
    const el = document.createElement('div')
    el.className = 'campfire-card' + (isUpgraded || !hasUpgrade ? ' upgraded' : '')

    const name = document.createElement('div')
    name.className = 'card-name'
    name.textContent = effectiveDef.name + (isUpgraded ? ' ✦' : '')
    el.appendChild(name)

    const cost = document.createElement('div')
    cost.className = `card-cost ${effectiveDef.costType}`
    cost.textContent = effectiveDef.costType === 'free'
      ? '免费'
      : `${effectiveDef.cost} ${effectiveDef.costType === 'stamina' ? '体力' : '魔力'}`
    el.appendChild(cost)

    const desc = document.createElement('div')
    desc.className = 'card-desc'
    desc.textContent = effectiveDef.description
    el.appendChild(desc)

    // Show upgrade preview on non-upgraded cards
    if (!isUpgraded && hasUpgrade) {
      const upgradedDef = upgradeCard(baseDef)
      const preview = document.createElement('div')
      preview.className = 'card-desc'
      preview.style.color = '#4caf50'
      preview.textContent = `→ ${upgradedDef.description}`
      el.appendChild(preview)

      el.addEventListener('click', () => {
        resetCampfireView()
        callbacks.onCampfireUpgradeCard(card.uid)
      })
    }

    cardsContainer.appendChild(el)
  }

  wrapper.appendChild(cardsContainer)

  const backBtn = document.createElement('button')
  backBtn.className = 'btn'
  backBtn.textContent = '返回'
  backBtn.addEventListener('click', () => {
    currentView = 'menu'
    rerender()
  })
  wrapper.appendChild(backBtn)
}
