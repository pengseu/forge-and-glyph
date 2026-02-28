import type { EnchantmentId, RunState } from '../../game/types'
import type { GameCallbacks } from '../renderer'
import { ENCHANTMENTS, getEnchantmentDef, getTriggeredResonances } from '../../game/enchantments'
import { getWeaponDef } from '../../game/weapons'

export function renderEnchant(
  container: HTMLElement,
  run: RunState,
  callbacks: GameCallbacks,
): void {
  const weapon = run.equippedWeapon
  const essence = run.materials.elemental_essence
  const slots = weapon?.enchantments ?? []

  const slotText = weapon
    ? [0, 1]
      .map((i) => {
        const id = slots[i]
        if (!id) return `<span class="enchant-slot">[空]</span>`
        const def = getEnchantmentDef(id)
        return `<span class="enchant-slot">${def.icon} ${def.name}</span>`
      })
      .join(' ')
    : ''

  const resonanceHints = getTriggeredResonances(slots).map((r) => `✨可触发共鸣：${r.name}`)

  const enchantHtml = ENCHANTMENTS.map((e) => {
    if (!weapon) return ''
    if (slots.length < 2) {
      return `
        <div class="enchant-item">
          <div class="enchant-name">${e.icon} ${e.name}</div>
          <div class="enchant-desc">${e.desc}</div>
          <button class="btn btn-small" data-enchant-id="${e.id}" ${essence < 1 ? 'disabled' : ''}>附魔(消耗🔥x1)</button>
        </div>
      `
    }
    return `
      <div class="enchant-item">
        <div class="enchant-name">${e.icon} ${e.name}</div>
        <div class="enchant-desc">${e.desc}</div>
        <div class="enchant-replace-actions">
          <button class="btn btn-small" data-enchant-id="${e.id}" data-replace-idx="0" ${essence < 1 ? 'disabled' : ''}>覆盖槽1</button>
          <button class="btn btn-small" data-enchant-id="${e.id}" data-replace-idx="1" ${essence < 1 ? 'disabled' : ''}>覆盖槽2</button>
        </div>
      </div>
    `
  }).join('')

  container.innerHTML = weapon
    ? `
      <div class="scene-enchant">
        <h2>🔮 附魔台</h2>
        <div class="enchant-current">当前武器：${getWeaponDef(weapon.defId).name}</div>
        <div class="enchant-slots">附魔槽：${slotText}</div>
        <div class="enchant-essence">元素精华：${essence}</div>
        <div class="enchant-resonance">${resonanceHints.map((t) => `<div>${t}</div>`).join('') || '<div>暂无可触发共鸣</div>'}</div>
        <div class="enchant-list">${enchantHtml}</div>
        <button class="btn" id="btn-leave-enchant">离开</button>
      </div>
    `
    : `
      <div class="scene-enchant">
        <h2>🔮 附魔台</h2>
        <p>未装备武器，无法附魔。</p>
        <button class="btn" id="btn-leave-enchant">离开</button>
      </div>
    `

  container.querySelectorAll<HTMLElement>('[data-enchant-id]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = el.dataset.enchantId as EnchantmentId | undefined
      if (!id) return
      const replaceIndex = el.dataset.replaceIdx ? Number(el.dataset.replaceIdx) : undefined
      callbacks.onEnchantApply(id, replaceIndex)
    })
  })

  container.querySelector('#btn-leave-enchant')?.addEventListener('click', () => callbacks.onEnchantLeave())
}
