import { getCardDef } from '../../game/cards'
import type { CardCategory, CardInstance, MaterialId, RunState } from '../../game/types'
import { describeWeaponEffect, getWeaponDef } from '../../game/weapons'
import type { GameCallbacks } from '../renderer'
import { MATERIAL_DEFS, getBattleMaterialEffectText, getMaterialIconSrc } from '../../game/materials'
import { toWebpAsset } from '../../assets'
import { buildCardCostBadgeHtml, resolveReadableCostLabel } from '../card-cost'

export type InventoryTab = 'weapons' | 'cards' | 'materials'

let currentInventoryTab: InventoryTab = 'weapons'
let selectedWeaponUid: string | null = null

export function normalizeInventoryTab(tab: string | null | undefined): InventoryTab {
  if (tab === 'cards' || tab === 'materials' || tab === 'weapons') return tab
  return 'weapons'
}

export function buildInventoryTabsHtml(currentTab: InventoryTab): string {
  return `
    <nav class="inventory-tabs" aria-label="背包分类">
      <button class="inventory-tab ${currentTab === 'weapons' ? 'is-active' : ''}" data-inventory-tab="weapons" aria-selected="${currentTab === 'weapons' ? 'true' : 'false'}">武器</button>
      <button class="inventory-tab ${currentTab === 'cards' ? 'is-active' : ''}" data-inventory-tab="cards" aria-selected="${currentTab === 'cards' ? 'true' : 'false'}">卡组</button>
      <button class="inventory-tab ${currentTab === 'materials' ? 'is-active' : ''}" data-inventory-tab="materials" aria-selected="${currentTab === 'materials' ? 'true' : 'false'}">材料</button>
    </nav>
  `
}

function resolveCardTypeClass(category: CardCategory, id: string): string {
  if (id.startsWith('curse_')) return 'card--curse'
  if (category === 'combat') return 'card--attack'
  if (category === 'spell') return 'card--skill'
  return 'card--power'
}

function resolveWeaponAsset(defId: string): string {
  return toWebpAsset(`/assets/weapons/${defId}.png`)
}

export function resolveInventoryMaterialName(materialId: MaterialId): string {
  return MATERIAL_DEFS[materialId].name
}

export function buildInventoryMaterialItemHtml(materialId: MaterialId, count: number): string {
  const name = resolveInventoryMaterialName(materialId)
  const effectText = getBattleMaterialEffectText(materialId)
  return `
      <article class="inventory-material-item" title="${effectText || name}">
        <div class="inventory-material-art" data-material-name="${name}">
          <img class="img-contain" src="${getMaterialIconSrc(materialId)}" alt="" loading="lazy" />
        </div>
        <div class="inventory-material-name">${name}</div>
        <div class="inventory-material-effect">${effectText}</div>
        <div class="inventory-material-count">×${count}</div>
      </article>
    `
}

export type InventoryCardStack = {
  defId: string
  upgraded: boolean
  count: number
}

function resolveInventoryCardTypeLabel(category: CardCategory): string {
  if (category === 'combat') return '攻击'
  if (category === 'spell') return '法术'
  return '技巧'
}

export function buildInventoryCardStacks(deck: CardInstance[]): InventoryCardStack[] {
  const stackMap = new Map<string, InventoryCardStack>()
  const stacks: InventoryCardStack[] = []
  for (const card of deck) {
    const upgraded = Boolean(card.upgraded)
    const key = `${card.defId}::${upgraded ? '1' : '0'}`
    const existing = stackMap.get(key)
    if (existing) {
      existing.count += 1
      continue
    }
    const stack = { defId: card.defId, upgraded, count: 1 }
    stackMap.set(key, stack)
    stacks.push(stack)
  }
  return stacks
}

export function buildInventoryCardItemHtml(stack: InventoryCardStack): string {
  const def = getCardDef(stack.defId)
  const name = `${def.name}${stack.upgraded ? '+' : ''}`
  return `
      <article class="card card--showcase inventory-card ${resolveCardTypeClass(def.category, def.id)}">
        ${buildCardCostBadgeHtml({ costType: def.costType, costLabel: resolveReadableCostLabel(def.cost, def.costType) })}
        <div class="inventory-card-stack-count">×${stack.count}</div>
        <div class="card-name">${name}</div>
        <div class="card-divider"></div>
        <div class="card-type">${resolveInventoryCardTypeLabel(def.category)}</div>
        <div class="card-desc">${def.description}</div>
        ${stack.upgraded ? '<div class="card-upgraded">+</div>' : ''}
      </article>
    `
}

export function renderInventory(
  container: HTMLElement,
  run: RunState,
  callbacks: GameCallbacks,
): void {
  const cardCounts = new Map<string, number>()
  for (const c of run.deck) {
    cardCounts.set(c.defId, (cardCounts.get(c.defId) ?? 0) + 1)
  }

  if (!selectedWeaponUid || !run.weaponInventory.some((w) => w.uid === selectedWeaponUid)) {
    selectedWeaponUid = run.equippedWeapon?.uid ?? run.weaponInventory[0]?.uid ?? null
  }

  const selectedWeapon = run.weaponInventory.find((w) => w.uid === selectedWeaponUid) ?? null
  const selectedWeaponDef = selectedWeapon ? getWeaponDef(selectedWeapon.defId) : null

  const weaponListHtml = run.weaponInventory.map((weapon) => {
    const def = getWeaponDef(weapon.defId)
    const isEquipped = run.equippedWeapon?.uid === weapon.uid
    const isSelected = selectedWeaponUid === weapon.uid
    return `
      <article class="inventory-weapon-row ${isSelected ? 'is-selected' : ''} ${isEquipped ? 'is-equipped' : ''}" data-select-weapon-uid="${weapon.uid}">
        <div class="inventory-weapon-thumb" data-weapon-name="${def.name}">
          <img src="${resolveWeaponAsset(def.id)}" alt="${def.name}" loading="lazy" />
        </div>
        <div class="inventory-weapon-meta">
          <div class="inventory-weapon-name">${def.name}</div>
          <button class="btn btn-sm" data-equip-weapon-uid="${weapon.uid}" ${isEquipped ? 'disabled' : ''}>${isEquipped ? '已装备' : '装备'}</button>
        </div>
      </article>
    `
  }).join('')

  const cardStacks = buildInventoryCardStacks(run.deck)
  const cardsHtml = cardStacks.map((stack) => buildInventoryCardItemHtml(stack)).join('')

  const materialsHtml = Object.entries(run.materials)
    .map(([id, count]) => buildInventoryMaterialItemHtml(id as MaterialId, count))
    .join('')

  let attackCount = 0
  let defendCount = 0
  let skillCount = 0
  for (const card of run.deck) {
    const def = getCardDef(card.defId)
    if (def.category === 'combat') attackCount++
    else if (def.category === 'spell') defendCount++
    else skillCount++
  }

  container.innerHTML = `
    <div class="scene-inventory scene-inventory-v3">
      <section class="panel inventory-panel">
        <header class="inventory-header">
          <h2 class="inventory-title">背包</h2>
          <button class="btn btn-ghost btn-sm" id="btn-close-inventory">关闭</button>
        </header>

        ${buildInventoryTabsHtml(currentInventoryTab)}

        <div class="inventory-main">
          <section class="inventory-view ${currentInventoryTab === 'weapons' ? '' : 'is-hidden'}" data-inventory-view="weapons">
            <div class="inventory-weapons-layout">
              <div class="inventory-weapon-list">${weaponListHtml || '<div class="inventory-empty">暂无武器</div>'}</div>
              <div class="inventory-weapon-detail">
                ${selectedWeaponDef ? `
                  <div class="inventory-detail-art" data-weapon-name="${selectedWeaponDef.name}">
                    <img src="${resolveWeaponAsset(selectedWeaponDef.id)}" alt="${selectedWeaponDef.name}" loading="lazy" />
                  </div>
                  <h3>${selectedWeaponDef.name}</h3>
                  <p>${describeWeaponEffect(selectedWeaponDef.effect)}</p>
                  <div class="inventory-detail-tags">${selectedWeapon?.enchantments?.length ? selectedWeapon.enchantments.join(' · ') : '无附魔'}</div>
                ` : '<div class="inventory-empty">请选择武器</div>'}
              </div>
            </div>
          </section>

          <section class="inventory-view ${currentInventoryTab === 'cards' ? '' : 'is-hidden'}" data-inventory-view="cards">
            <div class="inventory-cards-grid">${cardsHtml || '<div class="inventory-empty">卡组为空</div>'}</div>
          </section>

          <section class="inventory-view ${currentInventoryTab === 'materials' ? '' : 'is-hidden'}" data-inventory-view="materials">
            <div class="inventory-materials-grid">${materialsHtml || '<div class="inventory-empty">暂无材料</div>'}</div>
          </section>
        </div>

        <footer class="inventory-footer">
          <span>总计 ${run.deck.length} 张</span>
          <span>攻击 ${attackCount}</span>
          <span>法术 ${defendCount}</span>
          <span>技巧 ${skillCount}</span>
          <span>去重后 ${cardStacks.length} 种</span>
        </footer>
      </section>
    </div>
  `

  const rerender = () => renderInventory(container, run, callbacks)

  container.querySelectorAll<HTMLElement>('[data-inventory-tab]').forEach((el) => {
    el.addEventListener('click', () => {
      currentInventoryTab = normalizeInventoryTab(el.dataset.inventoryTab)
      rerender()
    })
  })

  container.querySelectorAll<HTMLElement>('[data-select-weapon-uid]').forEach((el) => {
    el.addEventListener('click', () => {
      selectedWeaponUid = el.dataset.selectWeaponUid ?? null
      rerender()
    })
  })

  container.querySelectorAll<HTMLElement>('[data-equip-weapon-uid]').forEach((el) => {
    el.addEventListener('click', (event) => {
      event.stopPropagation()
      const uid = el.dataset.equipWeaponUid
      if (!uid) return
      callbacks.onInventoryEquip(uid)
    })
  })

  container.querySelectorAll<HTMLImageElement>('.inventory-weapon-thumb img, .inventory-detail-art img, .inventory-material-art img').forEach((imgEl) => {
    const wrapper = imgEl.parentElement as HTMLElement | null
    if (!wrapper) return
    const name = wrapper.dataset.weaponName ?? imgEl.alt ?? '武器'
    const renderFallback = () => {
      const fallback = document.createElement('div')
      fallback.className = 'inventory-image-fallback'
      fallback.textContent = name
      wrapper.replaceChildren(fallback)
    }
    imgEl.addEventListener('error', renderFallback, { once: true })
    if (imgEl.complete && imgEl.naturalWidth === 0) renderFallback()
  })

  container.querySelector('#btn-close-inventory')?.addEventListener('click', () => {
    callbacks.onCloseInventory()
  })
}
