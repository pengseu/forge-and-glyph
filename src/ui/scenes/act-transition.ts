import { getIntermissionChoices } from '../../game/act'
import type { IntermissionChoiceId } from '../../game/act'
import type { CardDef, RunState } from '../../game/types'
import type { CardInstance } from '../../game/types'
import { getCardDef } from '../../game/cards'

export function resolveIntermissionRemoveCardView(card: CardInstance, canRemove: boolean): { name: string; description: string } {
  try {
    const def = getCardDef(card.defId)
    return {
      name: `${def.name}${card.upgraded ? ' +' : ''}`,
      description: canRemove ? def.description : '卡组至少需保留 1 张',
    }
  } catch {
    return {
      name: `${card.defId}${card.upgraded ? ' +' : ''}`,
      description: canRemove ? '点击移除' : '卡组至少需保留 1 张',
    }
  }
}

export function renderActTransition(
  container: HTMLElement,
  run: RunState,
  mode: 'none' | 'knowledge_pick' | 'knowledge_remove' | 'foresight_pick' | 'deep_purify',
  cardOptions: CardDef[],
  removeRemaining: number,
  onChoose: (choiceId: IntermissionChoiceId) => void,
  onChooseCard: (cardId: string) => void,
  onRemoveCard: (cardUid: string) => void,
  onConfirm: () => void,
): void {
  const nextAct = run.act + 1
  const choices = getIntermissionChoices(run.act)

  if (mode === 'none') {
    const choicesHtml = choices.map(choice => `
      <button class="btn btn-intermission" data-choice-id="${choice.id}">
        <div class="intermission-choice-name">${choice.name}</div>
        <div class="intermission-choice-desc">${choice.description}</div>
      </button>
    `).join('')

    container.innerHTML = `
      <div class="scene-act-transition">
        <div class="panel act-transition-panel">
          <h2>第 ${run.act} 幕完成</h2>
          <p class="act-transition-subtitle">请选择一项幕间增益，然后进入第 ${nextAct} 幕</p>
          <div class="act-transition-choices">${choicesHtml}</div>
        </div>
      </div>
    `

    container.querySelectorAll<HTMLElement>('.btn-intermission').forEach(el => {
      el.addEventListener('click', () => {
        const choiceId = el.dataset.choiceId as IntermissionChoiceId
        onChoose(choiceId)
      })
    })
    return
  }

  if (mode === 'knowledge_pick' || mode === 'foresight_pick') {
    const title = mode === 'knowledge_pick' ? '知识积累：选择 1 张稀有卡' : '远见之眼：选择 1 张史诗卡'
    const desc = mode === 'knowledge_pick'
      ? '选卡后还需要移除 1 张卡。'
      : '选卡后获得 +50 金币。'
    const cardsHtml = cardOptions.map((card) => `
      <button class="btn btn-intermission" data-card-id="${card.id}">
        <div class="intermission-choice-name">${card.name} (${card.rarity})</div>
        <div class="intermission-choice-desc">${card.description}</div>
      </button>
    `).join('')
    container.innerHTML = `
      <div class="scene-act-transition">
        <div class="panel act-transition-panel">
          <h2>${title}</h2>
          <p class="act-transition-subtitle">${desc}</p>
          <div class="act-transition-choices">${cardsHtml}</div>
        </div>
      </div>
    `
    container.querySelectorAll<HTMLElement>('.btn-intermission').forEach(el => {
      el.addEventListener('click', () => {
        const cardId = el.dataset.cardId
        if (!cardId) return
        onChooseCard(cardId)
      })
    })
    return
  }

  const canRemove = run.deck.length > 1
  const title = mode === 'knowledge_remove' ? '知识积累：移除 1 张卡' : `深度净化：最多移除 ${removeRemaining} 张卡`
  const desc = mode === 'knowledge_remove'
    ? '必须移除 1 张卡后进入下一幕。'
    : '可提前完成净化并进入下一幕。'
  const cardsHtml = run.deck.map((card) => {
    const view = resolveIntermissionRemoveCardView(card, canRemove)
    return `
      <button class="btn btn-intermission" data-card-uid="${card.uid}" ${canRemove ? '' : 'disabled'}>
        <div class="intermission-choice-name">${view.name}</div>
        <div class="intermission-choice-desc">${view.description}</div>
      </button>
    `
  }).join('')
  const confirmHtml = mode === 'deep_purify'
    ? `<button class="btn" id="btn-intermission-confirm">完成净化并进入第 ${nextAct} 幕</button>`
    : ''
  container.innerHTML = `
    <div class="scene-act-transition">
      <div class="panel act-transition-panel">
        <h2>${title}</h2>
        <p class="act-transition-subtitle">${desc}</p>
        <div class="act-transition-choices">${cardsHtml}</div>
        ${confirmHtml}
      </div>
    </div>
  `
  container.querySelectorAll<HTMLElement>('.btn-intermission[data-card-uid]').forEach(el => {
    el.addEventListener('click', () => {
      const cardUid = el.dataset.cardUid
      if (!cardUid) return
      onRemoveCard(cardUid)
    })
  })
  container.querySelector<HTMLElement>('#btn-intermission-confirm')?.addEventListener('click', () => {
    onConfirm()
  })
}
