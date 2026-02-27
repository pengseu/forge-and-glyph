import { getCardDef } from '../../game/cards'
import type { RunState } from '../../game/types'
import { getWeaponDef } from '../../game/weapons'
import type { GameCallbacks } from '../renderer'
import { formatMaterial } from '../../game/materials'

export function renderInventory(
  container: HTMLElement,
  run: RunState,
  callbacks: GameCallbacks,
): void {
  const cardCounts = new Map<string, number>()
  for (const c of run.deck) {
    cardCounts.set(c.defId, (cardCounts.get(c.defId) ?? 0) + 1)
  }

  const cardsHtml = [...cardCounts.entries()].map(([defId, count]) => {
    const def = getCardDef(defId)
    return `<div class="inventory-item">${def.name} ×${count}</div>`
  }).join('')

  const materialsHtml = Object.entries(run.materials).map(([id, count]) => {
    return `<div class="inventory-item">${formatMaterial(id as keyof RunState['materials'])}: ${count}</div>`
  }).join('')

  const weaponsHtml = run.weaponInventory.map(w => {
    const def = getWeaponDef(w.defId)
    const equipped = run.equippedWeapon?.uid === w.uid
    return `
      <div class="inventory-weapon ${equipped ? 'equipped' : ''}">
        <div>${def.name}</div>
        <div class="inventory-weapon-effect">效果：${def.effect}</div>
        <button class="btn btn-small" data-weapon-uid="${w.uid}" ${equipped ? 'disabled' : ''}>
          ${equipped ? '已装备' : '装备'}
        </button>
      </div>
    `
  }).join('')

  container.innerHTML = `
    <div class="scene-inventory">
      <h2>🎒 背包</h2>
      <div class="inventory-section">
        <h3>武器</h3>
        <div class="inventory-list">${weaponsHtml || '<div class="inventory-item">暂无</div>'}</div>
      </div>
      <div class="inventory-section">
        <h3>材料</h3>
        <div class="inventory-list">${materialsHtml}</div>
      </div>
      <div class="inventory-section">
        <h3>卡牌</h3>
        <div class="inventory-list">${cardsHtml}</div>
      </div>
      <button class="btn" id="btn-close-inventory">返回地图</button>
    </div>
  `

  container.querySelectorAll<HTMLElement>('[data-weapon-uid]').forEach(el => {
    el.addEventListener('click', () => {
      callbacks.onInventoryEquip(el.dataset.weaponUid!)
    })
  })

  container.querySelector('#btn-close-inventory')?.addEventListener('click', () => {
    callbacks.onCloseInventory()
  })
}
