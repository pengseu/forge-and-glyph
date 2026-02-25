import type { RunState, CardInstance } from '../../game/types'
import type { GameCallbacks } from '../renderer'
import { getCardDef } from '../../game/cards'
import { getUpgradeOptions, getEffectiveCardDef } from '../../game/campfire'

type CampfireView = 'menu' | 'upgrade'

let currentView: CampfireView = 'menu'
let selectedCardUid: string | null = null

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
  selectedCardUid = null
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
    selectedCardUid = null
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
  if (selectedCardUid) {
    renderUpgradeOptions(wrapper, run, callbacks, rerender)
    return
  }

  const title = document.createElement('h2')
  title.textContent = '选择要升级的卡牌'
  wrapper.appendChild(title)

  const cardsContainer = document.createElement('div')
  cardsContainer.className = 'campfire-cards'

  for (const card of run.deck) {
    const effectiveDef = getEffectiveCardDef(card)
    const isUpgraded = !!card.upgraded
    const el = document.createElement('div')
    el.className = 'campfire-card' + (isUpgraded ? ' upgraded' : '')

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

    if (!isUpgraded) {
      const baseDef = getCardDef(card.defId)
      const options = getUpgradeOptions(baseDef)
      if (options.length > 0) {
        el.addEventListener('click', () => {
          selectedCardUid = card.uid
          rerender()
        })
      } else {
        el.classList.add('upgraded')
      }
    }

    cardsContainer.appendChild(el)
  }

  wrapper.appendChild(cardsContainer)

  const backBtn = document.createElement('button')
  backBtn.className = 'btn'
  backBtn.textContent = '返回'
  backBtn.addEventListener('click', () => {
    currentView = 'menu'
    selectedCardUid = null
    rerender()
  })
  wrapper.appendChild(backBtn)
}

function renderUpgradeOptions(
  wrapper: HTMLElement,
  run: RunState,
  callbacks: GameCallbacks,
  rerender: () => void,
): void {
  const card = run.deck.find(c => c.uid === selectedCardUid)
  if (!card) {
    currentView = 'menu'
    selectedCardUid = null
    rerender()
    return
  }

  const baseDef = getCardDef(card.defId)
  const options = getUpgradeOptions(baseDef)

  const title = document.createElement('h2')
  title.textContent = `升级: ${baseDef.name}`
  wrapper.appendChild(title)

  const optionsContainer = document.createElement('div')
  optionsContainer.className = 'upgrade-options'

  for (const opt of options) {
    const btn = document.createElement('button')
    btn.className = 'btn'
    if (opt === 'damage') {
      btn.textContent = '伤害 +2'
    } else {
      btn.textContent = '费用 -1'
    }
    btn.addEventListener('click', () => {
      resetCampfireView()
      callbacks.onCampfireUpgradeCard(card.uid, opt)
    })
    optionsContainer.appendChild(btn)
  }

  wrapper.appendChild(optionsContainer)

  const backBtn = document.createElement('button')
  backBtn.className = 'btn'
  backBtn.textContent = '返回'
  backBtn.addEventListener('click', () => {
    selectedCardUid = null
    rerender()
  })
  wrapper.appendChild(backBtn)
}
