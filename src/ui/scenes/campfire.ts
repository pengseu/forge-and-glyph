import type { RunState } from '../../game/types'
import type { GameCallbacks } from '../renderer'
import { getCardDef } from '../../game/cards'
import { canUpgrade, getEffectiveCardDef, upgradeCard } from '../../game/campfire'
import { toWebpAsset } from '../../assets'
import { buildCardCostBadgeHtml, resolveReadableCostLabel } from '../card-cost'

type CampfireView = 'menu' | 'upgrade'
type CampfireOptionId = 'rest' | 'upgrade' | 'continue'

type CampfireMenuOption = {
  id: CampfireOptionId
  title: string
  desc: string
  buttonLabel: string
  disabled: boolean
}

let currentView: CampfireView = 'menu'

export function resolveCampfireMenuOptions(playerHp: number, playerMaxHp: number): CampfireMenuOption[] {
  return [
    {
      id: 'rest',
      title: '休息',
      desc: '恢复30%HP',
      buttonLabel: `休息 (${playerHp}/${playerMaxHp})`,
      disabled: playerHp >= playerMaxHp,
    },
    {
      id: 'upgrade',
      title: '升级卡牌',
      desc: '选择一张卡牌升级',
      buttonLabel: '选择卡牌',
      disabled: false,
    },
    {
      id: 'continue',
      title: '继续旅程',
      desc: '返回地图',
      buttonLabel: '出发',
      disabled: false,
    },
  ]
}

export function renderCampfire(
  container: HTMLElement,
  run: RunState,
  playerHp: number,
  playerMaxHp: number,
  callbacks: GameCallbacks,
): void {
  container.innerHTML = ''
  const wrapper = document.createElement('div')
  wrapper.className = `scene-campfire scene-campfire-v3 ${currentView === 'upgrade' ? 'scene-campfire--upgrade' : ''}`
  wrapper.innerHTML = `
    <div class="campfire-bg" data-art-name="篝火场景背景">
      <img src="${toWebpAsset('/assets/scenes/campfire.png')}" alt="篝火场景背景" loading="lazy" />
    </div>
    <div class="campfire-content"></div>
  `

  const bgImg = wrapper.querySelector<HTMLImageElement>('.campfire-bg img')
  if (bgImg) {
    const bgWrapper = wrapper.querySelector<HTMLElement>('.campfire-bg')
    const renderFallback = () => {
      if (!bgWrapper) return
      const fallback = document.createElement('div')
      fallback.className = 'campfire-art-fallback'
      fallback.textContent = bgWrapper.dataset.artName ?? '篝火场景背景'
      bgWrapper.replaceChildren(fallback)
    }
    bgImg.addEventListener('error', renderFallback, { once: true })
    if (bgImg.complete && bgImg.naturalWidth === 0) renderFallback()
  }

  const content = wrapper.querySelector<HTMLElement>('.campfire-content')
  if (!content) return

  const rerender = () => renderCampfire(container, run, playerHp, playerMaxHp, callbacks)

  if (currentView === 'menu') {
    renderMenu(content, playerHp, playerMaxHp, callbacks, rerender)
  } else {
    renderUpgradeView(content, run, callbacks, rerender)
  }

  container.appendChild(wrapper)
}

export function resetCampfireView(): void {
  currentView = 'menu'
}

function renderMenu(
  content: HTMLElement,
  playerHp: number,
  playerMaxHp: number,
  callbacks: GameCallbacks,
  rerender: () => void,
): void {
  const options = resolveCampfireMenuOptions(playerHp, playerMaxHp)

  content.innerHTML = `
    <header class="campfire-header">
      <h2 class="campfire-title">篝火休憩</h2>
      <p class="campfire-subtitle">在温暖中恢复力量…</p>
    </header>
    <div class="campfire-option-grid">
      ${options.map((option) => `
        <section class="panel campfire-option" data-option-id="${option.id}">
          <h3 class="campfire-option-title">${option.title}</h3>
          <p class="campfire-option-desc">${option.desc}</p>
          <button class="btn btn-md" id="btn-campfire-${option.id}" ${option.disabled ? 'disabled' : ''}>${option.buttonLabel}</button>
        </section>
      `).join('')}
    </div>
  `

  let lockedChoice = false
  const chooseOption = (optionId: CampfireOptionId, action: () => void): void => {
    if (lockedChoice) return
    lockedChoice = true
    content.querySelectorAll<HTMLElement>('.campfire-option').forEach((panel) => {
      const selected = panel.dataset.optionId === optionId
      panel.classList.toggle('is-selected', selected)
      panel.classList.toggle('is-dimmed', !selected)
    })
    content.querySelectorAll<HTMLButtonElement>('.campfire-option .btn').forEach((btn) => {
      btn.disabled = true
    })
    window.setTimeout(action, 90)
  }

  content.querySelector('#btn-campfire-rest')?.addEventListener('click', () => {
    chooseOption('rest', callbacks.onCampfireHeal)
  })
  content.querySelector('#btn-campfire-upgrade')?.addEventListener('click', () => {
    chooseOption('upgrade', () => {
      currentView = 'upgrade'
      rerender()
    })
  })
  content.querySelector('#btn-campfire-continue')?.addEventListener('click', () => {
    chooseOption('continue', () => {
      resetCampfireView()
      callbacks.onCampfireContinue()
    })
  })
}

function renderUpgradeView(
  content: HTMLElement,
  run: RunState,
  callbacks: GameCallbacks,
  rerender: () => void,
): void {
  const title = document.createElement('h2')
  title.textContent = '选择要升级的卡牌'
  title.className = 'campfire-upgrade-title campfire-title'
  content.appendChild(title)

  const subtitle = document.createElement('p')
  subtitle.className = 'campfire-upgrade-subtitle'
  subtitle.textContent = '只能选择一张，升级后将继续旅程。'
  content.appendChild(subtitle)

  const cardsContainer = document.createElement('div')
  cardsContainer.className = 'campfire-cards'

  let lockedSelection = false
  for (const card of run.deck) {
    const effectiveDef = getEffectiveCardDef(card)
    const isUpgraded = !!card.upgraded
    const baseDef = getCardDef(card.defId)
    const hasUpgrade = canUpgrade(baseDef)
    const el = document.createElement('div')
    el.className = 'campfire-card' + (isUpgraded || !hasUpgrade ? ' upgraded' : '')

    const name = document.createElement('div')
    name.className = 'card-name'
    name.textContent = effectiveDef.name + (isUpgraded ? '（已升级）' : '')
    el.appendChild(name)

    const cost = document.createElement('div')
    cost.innerHTML = buildCardCostBadgeHtml({
      costType: effectiveDef.costType,
      costLabel: resolveReadableCostLabel(effectiveDef.cost, effectiveDef.costType),
    })
    el.appendChild(cost.firstElementChild as HTMLElement)

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
        if (lockedSelection) return
        lockedSelection = true
        el.classList.add('campfire-card--picked')
        resetCampfireView()
        window.setTimeout(() => callbacks.onCampfireUpgradeCard(card.uid), 90)
      })
    }

    cardsContainer.appendChild(el)
  }

  content.appendChild(cardsContainer)

  const actions = document.createElement('div')
  actions.className = 'campfire-upgrade-actions'
  const backBtn = document.createElement('button')
  backBtn.className = 'btn btn-md btn-ghost'
  backBtn.textContent = '返回'
  backBtn.addEventListener('click', () => {
    currentView = 'menu'
    rerender()
  })
  actions.appendChild(backBtn)
  content.appendChild(actions)
}
