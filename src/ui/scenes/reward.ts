import type { CardDef, MaterialBag, MaterialId } from '../../game/types'
import type { GameCallbacks } from '../renderer'
import { describeWeaponEffect, getWeaponDef } from '../../game/weapons'
import { getBattleMaterialEffectText, getMaterialIconSrc, getMaterialName } from '../../game/materials'
import { buildCardCostBadgeHtml, resolveReadableCostLabel } from '../card-cost'

function resolveCardTypeClass(card: CardDef): string {
  if (card.id.startsWith('curse_')) return 'card--curse'
  if (card.category === 'combat') return 'card--attack'
  if (card.category === 'spell') return 'card--skill'
  return 'card--power'
}

function resolveBossAutoDropMaterialId(act: 1 | 2 | 3): MaterialId {
  if (act === 1) return 'goblin_crown_fragment'
  if (act === 2) return 'shadow_crystal'
  return 'abyss_heart'
}

function buildRewardMaterialCardHtml(materialId: MaterialId, count: number, compact = false): string {
  const effectText = getBattleMaterialEffectText(materialId)
  return `
    <article class="reward-material-card ${compact ? 'reward-material-card--compact' : ''}" title="${getMaterialName(materialId)}｜${effectText || getMaterialName(materialId)}">
      <div class="reward-material-art"><img class="img-contain" src="${getMaterialIconSrc(materialId)}" alt="" loading="lazy" /></div>
      <div class="reward-material-name">${getMaterialName(materialId)}</div>
      <div class="reward-material-effect">${effectText || '剧情 / 锻造用途材料'}</div>
      <div class="reward-material-count">×${count}</div>
    </article>
  `
}

export function buildRewardMaterialListHtml(materialRewards: Partial<MaterialBag>): string {
  const materialEntries = Object.entries(materialRewards).filter(([, value]) => (value ?? 0) > 0) as Array<[MaterialId, number]>
  if (materialEntries.length === 0) return ''
  return materialEntries.map(([materialId, count]) => buildRewardMaterialCardHtml(materialId, count)).join('')
}

export function buildRewardMaterialChoiceHtml(materialRewards: Partial<MaterialBag>): string {
  const materialListHtml = buildRewardMaterialListHtml(materialRewards)
  if (!materialListHtml) return ''
  return `
    <div class="reward-choice reward-choice--materials" data-choice-kind="materials">
      <div class="reward-choice-option reward-choice-material" data-choice-key="materials" tabindex="0" role="button" aria-label="材料奖励">
        <div class="reward-choice-material-title">材料奖励</div>
        <div class="reward-choice-material-list">${materialListHtml}</div>
      </div>
    </div>
  `
}

export function buildRewardChoiceStripHtml(cardsHtml: string, materialChoiceHtml: string): string {
  const content = [cardsHtml, materialChoiceHtml].filter(Boolean).join('')
  return `<div class="reward-choice-strip">${content}</div>`
}

export function buildRewardBossAutoDropHtml(act: 1 | 2 | 3, bossAutoDropHint: string): string {
  const materialId = resolveBossAutoDropMaterialId(act)
  return `
    <div class="reward-drop-item reward-drop-item--auto reward-boss-drop-hint">
      <div class="reward-drop-title">自动获得</div>
      <div class="reward-boss-drop-copy">${bossAutoDropHint}</div>
      <div class="reward-boss-drop-card-wrap">${buildRewardMaterialCardHtml(materialId, 1, true)}</div>
    </div>
  `
}

export function buildRewardTitleText(): string {
  return '战斗胜利'
}

export function buildRewardSkipText(gold: number): string {
  return `跳过，获得 ${gold} 金币`
}

export function buildRewardWeaponDropHtml(droppedWeaponId: string): string {
  const weaponDef = getWeaponDef(droppedWeaponId)
  return `
    <div class="reward-drop-item reward-drop-item--weapon">
      <div class="reward-drop-title">已收入背包</div>
      <div class="reward-drop-desc">${weaponDef.name} · ${describeWeaponEffect(weaponDef.effect)}</div>
      <button class="btn btn-md" id="btn-equip-weapon">立即装备</button>
    </div>
  `
}

export function buildRewardSupplementRowHtml(autoDropHtml: string, weaponHtml: string): string {
  const blocks = [
    autoDropHtml ? `<div class="reward-supplement-col reward-supplement-col--auto">${autoDropHtml}</div>` : '',
    weaponHtml ? `<div class="reward-supplement-col reward-supplement-col--weapon">${weaponHtml}</div>` : '',
  ].filter(Boolean)
  if (blocks.length === 0) return ''
  const rowClass = blocks.length === 1 ? 'reward-supplement-row reward-supplement-row--single' : 'reward-supplement-row'
  return `<div class="${rowClass}">${blocks.join('')}</div>`
}

export function renderReward(
  container: HTMLElement,
  candidateCards: CardDef[],
  materialRewards: Partial<MaterialBag>,
  droppedWeaponId: string | null,
  callbacks: GameCallbacks,
  act: 1 | 2 | 3 = 1,
  bossAutoDropHint: string | null = null,
): void {
  const materialRuleHint = act === 1
    ? 'Act 1 掉落：普通=铁锭×1；精英=元素精华×1；Boss=王冠碎片×1'
    : act === 2
      ? 'Act 2 掉落：普通=铁/精钢；精英=精钢+随机精华；Boss=Boss材料+额外资源'
      : 'Act 3 掉落：普通=精钢/高阶材质；精英=高阶材质+精华；Boss=终幕专属材料'

  const cardsHtml = candidateCards.map((card, idx) => `
    <div class="reward-choice" data-choice-index="${idx}">
      <div class="card card--showcase ${resolveCardTypeClass(card)} reward-card reward-choice-option" data-card-id="${card.id}" data-choice-key="card:${card.id}" tabindex="0" role="button" aria-label="${card.name}">
        ${buildCardCostBadgeHtml({ costType: card.costType, costLabel: resolveReadableCostLabel(card.cost, card.costType) })}
        <div class="card-name">${card.name}</div>
        <div class="card-divider"></div>
        <div class="card-type">${card.category === 'combat' ? '攻击' : card.category === 'spell' ? '法术' : '技巧'}</div>
        <div class="card-desc">${card.description}</div>
      </div>
    </div>
  `).join('')

  const materialChoiceHtml = buildRewardMaterialChoiceHtml(materialRewards)

  const autoDropHtml = bossAutoDropHint ? buildRewardBossAutoDropHtml(act, bossAutoDropHint) : ''

  const weaponHtml = droppedWeaponId ? buildRewardWeaponDropHtml(droppedWeaponId) : ''

  container.innerHTML = `
    <div class="scene-reward scene-reward-v2">
      <div class="reward-overlay">
        <div class="reward-panel panel">
          <h2 class="panel-title reward-title">${buildRewardTitleText()}</h2>
          <div class="reward-rule-hint">${materialRuleHint}</div>
          <div class="reward-divider"></div>
          <div class="reward-cards">${buildRewardChoiceStripHtml(cardsHtml, materialChoiceHtml)}</div>
          <div class="reward-divider"></div>
          <div class="reward-drops">
            ${buildRewardSupplementRowHtml(autoDropHtml, weaponHtml)}
          </div>
          <div class="reward-actions">
            <button class="btn btn-ghost btn-md" id="btn-skip">${buildRewardSkipText(25)}</button>
          </div>
        </div>
      </div>
    </div>
  `

  let lockedSelection = false
  const setSelectedChoice = (selectedKey: string): void => {
    container.querySelectorAll<HTMLElement>('.reward-choice-option').forEach((el) => {
      const isSelected = el.dataset.choiceKey === selectedKey
      el.classList.toggle('is-selected', isSelected)
      el.classList.toggle('is-dimmed', !isSelected)
    })
  }

  container.querySelectorAll<HTMLElement>('.reward-card').forEach((el, idx) => {
    el.style.animationDelay = `${idx * 150}ms`
    const chooseCard = (): void => {
      if (lockedSelection) return
      const cardId = el.dataset.cardId
      if (!cardId) return
      lockedSelection = true
      setSelectedChoice(`card:${cardId}`)
      window.setTimeout(() => {
        callbacks.onSelectCard(cardId)
      }, 120)
    }
    el.addEventListener('click', chooseCard)
    el.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        chooseCard()
      }
    })
  })

  const materialChoiceEl = container.querySelector<HTMLElement>('.reward-choice-material')
  if (materialChoiceEl) {
    const chooseMaterial = (): void => {
      if (lockedSelection) return
      lockedSelection = true
      setSelectedChoice('materials')
      window.setTimeout(() => {
        callbacks.onSelectMaterialReward()
      }, 120)
    }
    materialChoiceEl.addEventListener('click', chooseMaterial)
    materialChoiceEl.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        chooseMaterial()
      }
    })
  }

  const equipBtn = container.querySelector('#btn-equip-weapon')
  if (equipBtn && droppedWeaponId) {
    equipBtn.addEventListener('click', () => {
      callbacks.onEquipWeapon(droppedWeaponId)
    })
  }

  container.querySelector('#btn-skip')?.addEventListener('click', () => {
    callbacks.onSkipReward()
  })

}
