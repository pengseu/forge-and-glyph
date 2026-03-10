import type { RunState } from '../../game/types'
import type { GameCallbacks } from '../renderer'
import { getCardDef } from '../../game/cards'
import { canUpgrade, getEffectiveCardDef, upgradeCard } from '../../game/campfire'
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
      desc: '恢复至满血',
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
  const options = resolveCampfireMenuOptions(playerHp, playerMaxHp)

  if (currentView === 'menu') {
    container.innerHTML = `
      <div class="scene-campfire scene-campfire-v3">
        <header class="campfire-header">
          <h2 class="campfire-title">篝火休憩</h2>
          <div class="campfire-status">生命：${playerHp}/${playerMaxHp}</div>
        </header>
        <section class="campfire-panel">
          <div class="campfire-option-grid">
            ${options.map((option) => `
              <article class="panel campfire-option" data-option-id="${option.id}">
                <h3 class="campfire-option-title">${option.title}</h3>
                <p class="campfire-option-desc">${option.desc}</p>
                <button class="btn btn-md" data-campfire-action="${option.id}" ${option.disabled ? 'disabled' : ''}>${option.buttonLabel}</button>
              </article>
            `).join('')}
          </div>
        </section>
      </div>
    `
  } else {
    renderUpgradeView(container, run, callbacks)
  }

  const rerender = () => renderCampfire(container, run, playerHp, playerMaxHp, callbacks)

  let lockedChoice = false
  const chooseOption = (optionId: CampfireOptionId, action: () => void): void => {
    if (lockedChoice) return
    lockedChoice = true
    container.querySelectorAll<HTMLElement>('.campfire-option').forEach((panel) => {
      const selected = panel.dataset.optionId === optionId
      panel.classList.toggle('is-selected', selected)
      panel.classList.toggle('is-dimmed', !selected)
    })
    container.querySelectorAll<HTMLButtonElement>('.campfire-option .btn').forEach((btn) => {
      btn.disabled = true
    })
    window.setTimeout(action, 90)
  }

  container.querySelector('[data-campfire-action="rest"]')?.addEventListener('click', () => {
    chooseOption('rest', callbacks.onCampfireHeal)
  })
  container.querySelector('[data-campfire-action="upgrade"]')?.addEventListener('click', () => {
    chooseOption('upgrade', () => {
      currentView = 'upgrade'
      rerender()
    })
  })
  container.querySelector('[data-campfire-action="continue"]')?.addEventListener('click', () => {
    chooseOption('continue', () => {
      resetCampfireView()
      callbacks.onCampfireContinue()
    })
  })
}

export function resetCampfireView(): void {
  currentView = 'menu'
}

function renderUpgradeView(
  container: HTMLElement,
  run: RunState,
  callbacks: GameCallbacks,
): void {
  const upgradableCards = run.deck.filter(card => {
    const baseDef = getCardDef(card.defId)
    return !card.upgraded && canUpgrade(baseDef)
  })

  container.innerHTML = `
    <div class="scene-campfire scene-campfire-v3 scene-campfire--upgrade">
      <header class="campfire-header">
        <h2 class="campfire-title">升级卡牌</h2>
        <div class="campfire-subtitle">选择一张卡牌进行升级</div>
      </header>
      <section class="campfire-panel">
        <div class="campfire-cards-grid">
          ${upgradableCards.map(card => {
            const effectiveDef = getEffectiveCardDef(card)
            const baseDef = getCardDef(card.defId)
            const upgradedDef = upgradeCard(baseDef)
            return `
              <article class="campfire-card-item" data-card-uid="${card.uid}">
                <div class="campfire-card-current">
                  <div class="card-name">${effectiveDef.name}</div>
                  ${buildCardCostBadgeHtml({
                    costType: effectiveDef.costType,
                    costLabel: resolveReadableCostLabel(effectiveDef.cost, effectiveDef.costType),
                  })}
                  <div class="card-desc">${effectiveDef.description}</div>
                </div>
                <div class="campfire-card-arrow">→</div>
                <div class="campfire-card-upgraded">
                  <div class="card-name">${upgradedDef.name}</div>
                  ${buildCardCostBadgeHtml({
                    costType: upgradedDef.costType,
                    costLabel: resolveReadableCostLabel(upgradedDef.cost, upgradedDef.costType),
                  })}
                  <div class="card-desc card-desc--upgrade">${upgradedDef.description}</div>
                </div>
              </article>
            `
          }).join('')}
        </div>
      </section>
      <footer class="campfire-footer">
        <button class="btn btn-md" id="btn-campfire-back">返回</button>
      </footer>
    </div>
  `

  const rerender = () => renderCampfire(container, run, run.playerHp, run.playerMaxHp, callbacks)

  let lockedSelection = false
  container.querySelectorAll<HTMLElement>('[data-card-uid]').forEach((el) => {
    el.addEventListener('click', () => {
      if (lockedSelection) return
      const uid = el.dataset.cardUid
      if (!uid) return
      lockedSelection = true
      el.classList.add('is-selected')
      resetCampfireView()
      window.setTimeout(() => callbacks.onCampfireUpgradeCard(uid), 90)
    })
  })

  container.querySelector('#btn-campfire-back')?.addEventListener('click', () => {
    currentView = 'menu'
    rerender()
  })
}
