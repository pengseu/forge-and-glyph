import type { EnchantmentId, RunState } from '../../game/types'
import type { GameCallbacks } from '../renderer'
import { ENCHANTMENTS, getEnchantmentDef, getTriggeredResonances } from '../../game/enchantments'
import { getWeaponDef } from '../../game/weapons'

function resolveWeaponAsset(defId: string): string {
  return `/assets/weapons/${defId}.png`
}

function resolveSlotClass(enchantmentId: EnchantmentId | undefined): string {
  if (!enchantmentId) return 'is-empty'
  if (enchantmentId === 'flame') return 'is-flame'
  if (enchantmentId === 'frost') return 'is-frost'
  return 'is-glyph'
}

export function renderEnchant(
  container: HTMLElement,
  run: RunState,
  callbacks: GameCallbacks,
): void {
  const weapon = run.equippedWeapon
  const essence = run.materials.elemental_essence
  const slots = weapon?.enchantments ?? []

  const resonanceHints = getTriggeredResonances(slots).map((r) => `✨共鸣：${r.name}`)

  const enchantHtml = ENCHANTMENTS.map((enchant) => {
    if (!weapon) return ''
    if (slots.length < 2) {
      return `
        <article class="enchant-option-item" data-enchant-id="${enchant.id}">
          <div class="enchant-option-main">
            <div class="enchant-option-name">${enchant.icon} ${enchant.name}</div>
            <div class="enchant-option-desc">${enchant.desc}</div>
          </div>
          <button class="btn btn-sm" data-enchant-id="${enchant.id}" ${essence < 1 ? 'disabled' : ''}>附魔</button>
        </article>
      `
    }
    return `
      <article class="enchant-option-item" data-enchant-id="${enchant.id}">
        <div class="enchant-option-main">
          <div class="enchant-option-name">${enchant.icon} ${enchant.name}</div>
          <div class="enchant-option-desc">${enchant.desc}</div>
        </div>
        <div class="enchant-option-actions">
          <button class="btn btn-sm" data-enchant-id="${enchant.id}" data-replace-idx="0" ${essence < 1 ? 'disabled' : ''}>覆盖槽1</button>
          <button class="btn btn-sm" data-enchant-id="${enchant.id}" data-replace-idx="1" ${essence < 1 ? 'disabled' : ''}>覆盖槽2</button>
        </div>
      </article>
    `
  }).join('')

  container.innerHTML = weapon
    ? `
      <div class="scene-enchant scene-enchant-v3">
        <header class="enchant-header">
          <h2 class="enchant-title">🔮 附魔台</h2>
        </header>

        <section class="enchant-main">
          <article class="panel enchant-weapon-panel">
            <div class="enchant-weapon-art" data-weapon-name="${getWeaponDef(weapon.defId).name}">
              <img src="${resolveWeaponAsset(weapon.defId)}" alt="${getWeaponDef(weapon.defId).name}" loading="lazy" />
            </div>
            <h3>${getWeaponDef(weapon.defId).name}</h3>
            <div class="enchant-slots">
              ${[0, 1, 2].map((index) => {
                const enchantId = slots[index]
                const label = enchantId ? `${getEnchantmentDef(enchantId).icon}` : '+'
                return `<span class="enchant-slot ${resolveSlotClass(enchantId)}">${label}</span>`
              }).join('')}
            </div>
            <div class="enchant-resonance">${resonanceHints.join(' · ') || '暂无共鸣'}</div>
          </article>

          <article class="panel enchant-options-panel">
            <div class="panel-title">可用附魔</div>
            <div class="enchant-options-list">${enchantHtml || '<div class="enchant-empty">暂无可用附魔</div>'}</div>
          </article>
        </section>

        <footer class="enchant-footer">
          <div class="enchant-essence">元素精华：${essence}</div>
          <button class="btn btn-md" id="btn-leave-enchant">← 返回地图</button>
        </footer>
      </div>
    `
    : `
      <div class="scene-enchant scene-enchant-v3">
        <section class="panel enchant-empty-panel">
          <h2 class="enchant-title">🔮 附魔台</h2>
          <p>未装备武器，无法附魔。</p>
          <button class="btn btn-md" id="btn-leave-enchant">← 返回地图</button>
        </section>
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

  container.querySelectorAll<HTMLImageElement>('.enchant-weapon-art img').forEach((imgEl) => {
    const wrapper = imgEl.closest<HTMLElement>('.enchant-weapon-art')
    if (!wrapper) return
    const name = wrapper.dataset.weaponName ?? imgEl.alt ?? '武器'
    const renderFallback = () => {
      const fallback = document.createElement('div')
      fallback.className = 'enchant-image-fallback'
      fallback.textContent = name
      wrapper.replaceChildren(fallback)
    }
    imgEl.addEventListener('error', renderFallback, { once: true })
    if (imgEl.complete && imgEl.naturalWidth === 0) renderFallback()
  })
}
