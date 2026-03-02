import weaponCardSkin from '../../assets/style-lab/stylelab_weapon_card_bg.png'
import { getCardDef } from '../../game/cards'
import type { EnchantmentId, RunState } from '../../game/types'
import { describeWeaponEffect, getWeaponDef } from '../../game/weapons'
import type { GameCallbacks } from '../renderer'
import { formatMaterial } from '../../game/materials'

interface WeaponCardRect {
  x: number
  y: number
  width: number
  height: number
  fontSize: number
}

const INVENTORY_WEAPON_CARD_CANVAS = { width: 340, height: 500 }
const INVENTORY_WEAPON_CARD_LAYOUT: Record<
  'name' | 'art' | 'description' | 'type' | 'enchant_1' | 'enchant_2' | 'enchant_3',
  WeaponCardRect
> = {
  name: { x: 34, y: 42, width: 225, height: 20, fontSize: 20 },
  art: { x: 54, y: 80, width: 230, height: 200, fontSize: 12 },
  description: { x: 38, y: 359, width: 260, height: 85, fontSize: 18 },
  type: { x: 190, y: 305, width: 80, height: 30, fontSize: 20 },
  enchant_1: { x: 37, y: 302, width: 30, height: 30, fontSize: 18 },
  enchant_2: { x: 89, y: 302, width: 30, height: 30, fontSize: 18 },
  enchant_3: { x: 142, y: 302, width: 30, height: 30, fontSize: 18 },
}

export function resolveInventoryWeaponTypeLabel(defId: string): string {
  if (defId.includes('staff') || defId.includes('scepter')) return '法杖·武器'
  if (defId.includes('dagger')) return '匕首·武器'
  if (defId.includes('hammer')) return '战锤·武器'
  if (defId.includes('bow')) return '弓·武器'
  if (defId.includes('greatsword')) return '巨剑·武器'
  return '长剑·武器'
}

export function resolveInventoryWeaponRarityTag(rarity: 'basic' | 'upgraded' | 'legendary' | 'replica'): string {
  if (rarity === 'basic') return '基础'
  if (rarity === 'upgraded') return '进阶'
  if (rarity === 'legendary') return '传说'
  return '仿品'
}

export function buildInventoryWeaponEnchantGlyphs(enchantments: EnchantmentId[]): string[] {
  const glyphMap: Record<EnchantmentId, string> = {
    flame: '火',
    frost: '冰',
    thunder: '雷',
    soul: '魂',
    void: '虚',
    bless: '圣',
    abyss: '渊',
  }
  return enchantments.slice(0, 3).map((id) => glyphMap[id])
}

function buildWeaponFieldStyle(rect: WeaponCardRect, scale: number): string {
  const left = Math.round(rect.x * scale)
  const top = Math.round(rect.y * scale)
  const width = Math.round(rect.width * scale)
  const height = Math.round(rect.height * scale)
  const fontSize = Math.max(8, Math.round(rect.fontSize * scale))
  return `left:${left}px;top:${top}px;width:${width}px;height:${height}px;font-size:${fontSize}px;`
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

  const cardsHtml = [...cardCounts.entries()].map(([defId, count]) => {
    const def = getCardDef(defId)
    return `<div class="inventory-item">${def.name} ×${count}</div>`
  }).join('')

  const materialsHtml = Object.entries(run.materials).map(([id, count]) => {
    return `<div class="inventory-item">${formatMaterial(id as keyof RunState['materials'])}: ${count}</div>`
  }).join('')

  const cardScale = 0.62
  const cardWidth = Math.round(INVENTORY_WEAPON_CARD_CANVAS.width * cardScale)
  const cardHeight = Math.round(INVENTORY_WEAPON_CARD_CANVAS.height * cardScale)

  const weaponsHtml = run.weaponInventory.map(w => {
    const def = getWeaponDef(w.defId)
    const equipped = run.equippedWeapon?.uid === w.uid
    const typeLabel = resolveInventoryWeaponTypeLabel(def.id)
    const rarityTag = resolveInventoryWeaponRarityTag(def.rarity)
    const effectText = `【${rarityTag}】${describeWeaponEffect(def.effect)}`
    const enchantGlyphs = buildInventoryWeaponEnchantGlyphs(w.enchantments)
    while (enchantGlyphs.length < 3) enchantGlyphs.push('·')

    return `
      <div class="inventory-weapon-card-wrap">
        <div
          class="inventory-weapon-card ${equipped ? 'equipped' : ''}"
          style="width:${cardWidth}px;height:${cardHeight}px;background-image:url('${weaponCardSkin}')"
        >
          <div class="inventory-weapon-field inventory-weapon-name" style="${buildWeaponFieldStyle(INVENTORY_WEAPON_CARD_LAYOUT.name, cardScale)}">${def.name}</div>
          <div class="inventory-weapon-field inventory-weapon-art" style="${buildWeaponFieldStyle(INVENTORY_WEAPON_CARD_LAYOUT.art, cardScale)}">武器插画</div>
          <div class="inventory-weapon-field inventory-weapon-enchant" style="${buildWeaponFieldStyle(INVENTORY_WEAPON_CARD_LAYOUT.enchant_1, cardScale)}">${enchantGlyphs[0]}</div>
          <div class="inventory-weapon-field inventory-weapon-enchant" style="${buildWeaponFieldStyle(INVENTORY_WEAPON_CARD_LAYOUT.enchant_2, cardScale)}">${enchantGlyphs[1]}</div>
          <div class="inventory-weapon-field inventory-weapon-enchant" style="${buildWeaponFieldStyle(INVENTORY_WEAPON_CARD_LAYOUT.enchant_3, cardScale)}">${enchantGlyphs[2]}</div>
          <div class="inventory-weapon-field inventory-weapon-type" style="${buildWeaponFieldStyle(INVENTORY_WEAPON_CARD_LAYOUT.type, cardScale)}">${typeLabel}</div>
          <div class="inventory-weapon-field inventory-weapon-description" style="${buildWeaponFieldStyle(INVENTORY_WEAPON_CARD_LAYOUT.description, cardScale)}">${effectText}</div>
        </div>
        <button class="btn btn-small inventory-weapon-equip-btn" data-weapon-uid="${w.uid}" ${equipped ? 'disabled' : ''}>
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
        <div class="inventory-list inventory-weapons">${weaponsHtml || '<div class="inventory-item">暂无</div>'}</div>
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
