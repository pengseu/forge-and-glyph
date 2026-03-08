import { getCardDef } from '../../game/cards'
import { getIntermissionChoices } from '../../game/act'
import type { IntermissionChoiceId } from '../../game/act'
import type { CardDef, RunState } from '../../game/types'

type ActTransitionMode = 'none' | 'knowledge_pick' | 'knowledge_remove' | 'foresight_pick' | 'deep_purify'

type ModeMeta = {
  kind: 'choices' | 'pick' | 'remove'
  title: string
  subtitle: string
  allowConfirm: boolean
}

export function resolveActTransitionModeMeta(mode: ActTransitionMode): ModeMeta {
  if (mode === 'knowledge_pick') {
    return {
      kind: 'pick',
      title: '知识积累：选择 1 张稀有卡',
      subtitle: '选卡后还需要移除 1 张卡。',
      allowConfirm: false,
    }
  }
  if (mode === 'foresight_pick') {
    return {
      kind: 'pick',
      title: '远见之眼：选择 1 张史诗卡',
      subtitle: '选卡后获得 +50 金币。',
      allowConfirm: false,
    }
  }
  if (mode === 'knowledge_remove') {
    return {
      kind: 'remove',
      title: '知识积累：移除 1 张卡',
      subtitle: '必须移除 1 张卡后进入下一幕。',
      allowConfirm: false,
    }
  }
  if (mode === 'deep_purify') {
    return {
      kind: 'remove',
      title: '深度净化',
      subtitle: '可提前完成净化并进入下一幕。',
      allowConfirm: true,
    }
  }
  return {
    kind: 'choices',
    title: '幕间抉择',
    subtitle: '请选择一项幕间增益。',
    allowConfirm: false,
  }
}

function resolveCardTypeClass(card: CardDef): string {
  if (card.id.startsWith('curse_')) return 'card--curse'
  if (card.category === 'combat') return 'card--attack'
  if (card.category === 'spell') return 'card--skill'
  return 'card--power'
}

export function renderActTransition(
  container: HTMLElement,
  run: RunState,
  mode: ActTransitionMode,
  cardOptions: CardDef[],
  removeRemaining: number,
  onChoose: (choiceId: IntermissionChoiceId) => void,
  onChooseCard: (cardId: string) => void,
  onRemoveCard: (cardUid: string) => void,
  onConfirm: () => void,
): void {
  const nextAct = run.act + 1
  const choices = getIntermissionChoices(run.act)
  const meta = resolveActTransitionModeMeta(mode)

  if (mode === 'none') {
    const choicesHtml = choices.map(choice => `
      <article class="panel act-choice-panel">
        <h3 class="act-choice-name">${choice.name}</h3>
        <p class="act-choice-desc">${choice.description}</p>
        <button class="btn btn-md" data-choice-id="${choice.id}">选择</button>
      </article>
    `).join('')

    container.innerHTML = `
      <div class="scene-act-transition scene-act-transition-v3">
        <div class="panel act-transition-panel-v3">
          <h2 class="act-transition-title">第 ${run.act} 幕结束</h2>
          <p class="act-transition-subtitle">新的篇章即将展开…进入第 ${nextAct} 幕前请选择一项增益。</p>
          <div class="act-transition-choice-grid">${choicesHtml}</div>
        </div>
      </div>
    `

    container.querySelectorAll<HTMLElement>('[data-choice-id]').forEach(el => {
      el.addEventListener('click', () => {
        const choiceId = el.dataset.choiceId as IntermissionChoiceId
        onChoose(choiceId)
      })
    })
    return
  }

  if (mode === 'knowledge_pick' || mode === 'foresight_pick') {
    const cardsHtml = cardOptions.map((card) => `
      <article class="card card--showcase ${resolveCardTypeClass(card)} act-transition-card" data-card-id="${card.id}" tabindex="0" role="button">
        <div class="card-cost">${card.cost}</div>
        <div class="card-name">${card.name}</div>
        <div class="card-divider"></div>
        <div class="card-type">${card.rarity}</div>
        <div class="card-desc">${card.description}</div>
      </article>
    `).join('')

    container.innerHTML = `
      <div class="scene-act-transition scene-act-transition-v3">
        <div class="panel act-transition-panel-v3">
          <h2 class="act-transition-title">第 ${run.act} 幕结束</h2>
          <p class="act-transition-subtitle">${meta.title} · ${meta.subtitle}</p>
          <div class="act-transition-pick-grid">${cardsHtml}</div>
        </div>
      </div>
    `

    container.querySelectorAll<HTMLElement>('.act-transition-card').forEach(el => {
      const choose = () => {
        const cardId = el.dataset.cardId
        if (!cardId) return
        onChooseCard(cardId)
      }
      el.addEventListener('click', choose)
      el.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          choose()
        }
      })
    })
    return
  }

  const canRemove = run.deck.length > 1
  const cardsHtml = run.deck.map((card) => {
    const def = getCardDef(card.defId)
    return `
      <article class="card card--hand ${resolveCardTypeClass(def)} act-remove-card" data-card-uid="${card.uid}" ${canRemove ? '' : 'aria-disabled="true"'}>
        <div class="card-cost">${def.cost}</div>
        <div class="card-name">${def.name}${card.upgraded ? '+' : ''}</div>
        <div class="card-divider"></div>
        <div class="card-type">${def.category}</div>
      </article>
    `
  }).join('')

  const remainingHint = mode === 'deep_purify' ? `选择 ${removeRemaining} 张移除（可提前确认）` : '选择 1 张移除'

  container.innerHTML = `
    <div class="scene-act-transition scene-act-transition-v3">
      <div class="panel act-transition-panel-v3">
        <h2 class="act-transition-title">第 ${run.act} 幕结束</h2>
        <p class="act-transition-subtitle">${meta.title}</p>
        <div class="act-transition-remove-hint">${remainingHint}</div>
        <div class="act-transition-remove-grid">${cardsHtml}</div>
        ${meta.allowConfirm ? '<button class="btn btn-danger btn-md" id="btn-intermission-confirm">确认并进入下一幕</button>' : ''}
      </div>
    </div>
  `

  container.querySelectorAll<HTMLElement>('.act-remove-card').forEach(el => {
    el.addEventListener('click', () => {
      if (!canRemove) return
      const cardUid = el.dataset.cardUid
      if (!cardUid) return
      onRemoveCard(cardUid)
    })
  })

  container.querySelector<HTMLElement>('#btn-intermission-confirm')?.addEventListener('click', () => {
    onConfirm()
  })
}
