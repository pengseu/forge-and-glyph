import { getCardDef } from '../../game/cards'
import { ENCHANTMENTS, getEnchantmentDef, getTriggeredResonances } from '../../game/enchantments'
import { FORGE_RECIPES, isRecipeUnlocked, resolveRecipeCost } from '../../game/forge'
import { getMaterialIconSrc, getMaterialName } from '../../game/materials'
import type { EnchantmentId, RunState } from '../../game/types'
import { describeWeaponEffect, getWeaponDef } from '../../game/weapons'
import type { GameCallbacks } from '../renderer'

export function buildForgeMaterialTagHtml(materialId: keyof RunState['materials'], count: number): string {
  return `<span class="forge-material-tag"><span class="forge-material-tag-art"><img class="img-contain" src="${getMaterialIconSrc(materialId)}" alt="" loading="lazy" /></span><span class="forge-material-tag-name">${getMaterialName(materialId)}</span><span class="forge-material-tag-count">×${count}</span></span>`
}

export function buildForgeTitleText(): string {
  return '铁匠工坊'
}

export function buildForgeActionTitle(kind: 'craft' | 'enchant' | 'upgrade' | 'remove'): string {
  if (kind === 'craft') return '锻造'
  if (kind === 'enchant') return '附魔'
  if (kind === 'upgrade') return '升级卡牌'
  return '精简卡组'
}

export function buildForgeEnchantButtonLabel(name: string, replaceIndex?: number): string {
  return replaceIndex === undefined ? name : `${name}→槽${replaceIndex + 1}`
}


export function renderForge(
  container: HTMLElement,
  run: RunState,
  callbacks: GameCallbacks,
): void {
  const recipesHtml = FORGE_RECIPES.map((recipe) => {
    const masteryLevel = recipe.requiresBlueprint ? (run.blueprintMastery?.[recipe.requiresBlueprint] ?? 0) : 0
    const effective = resolveRecipeCost(recipe, masteryLevel)
    const unlocked = isRecipeUnlocked(run, recipe)
    const canPayFixedCost = Object.entries(effective.cost).every(([k, v]) => run.materials[k as keyof typeof run.materials] >= (v ?? 0))
    const totalEssence = run.materials.elemental_essence + run.materials.war_essence + run.materials.guard_essence
    const canPayAnyEssence = (effective.anyEssenceCost ?? 0) <= totalEssence
    const canCraft = unlocked && canPayFixedCost && canPayAnyEssence
    const fixedCostText = Object.entries(effective.cost)
      .map(([k, v]) => `${getMaterialName(k as keyof RunState['materials'])}×${v}`)
      .join(' + ')
    const costText = [fixedCostText, effective.anyEssenceCost ? `任意精华×${effective.anyEssenceCost}` : '']
      .filter(Boolean)
      .join(' + ')
    const weapon = getWeaponDef(recipe.weaponDefId)
    return `
      <article class="forge-action-item ${canCraft ? '' : 'is-disabled'}">
        <div class="forge-action-name">${recipe.name}</div>
        <div class="forge-action-desc">${describeWeaponEffect(weapon.effect)}</div>
        <div class="forge-action-cost">${costText}${unlocked ? '' : ` · 未解锁蓝图：${recipe.requiresBlueprint}`}</div>
        <button class="btn btn-sm" data-recipe-id="${recipe.id}" ${canCraft ? '' : 'disabled'}>锻造</button>
      </article>
    `
  }).join('')

  const weapon = run.equippedWeapon
  const enchantSlots = weapon?.enchantments ?? []
  const resonanceHints = getTriggeredResonances(enchantSlots).map((r) => r.name).join(' · ')

  const enchantHtml = ENCHANTMENTS.map((enchant) => {
    if (!weapon) return ''
    if (enchantSlots.length < 2) {
      return `<button class="btn btn-sm" data-forge-enchant="${enchant.id}" ${run.materials.elemental_essence < 1 ? 'disabled' : ''}>${buildForgeEnchantButtonLabel(enchant.name)}</button>`
    }
    return `
      <div class="forge-enchant-row">
        <button class="btn btn-sm" data-forge-enchant="${enchant.id}" data-replace-idx="0" ${run.materials.elemental_essence < 1 ? 'disabled' : ''}>${buildForgeEnchantButtonLabel(enchant.name, 0)}</button>
        <button class="btn btn-sm" data-forge-enchant="${enchant.id}" data-replace-idx="1" ${run.materials.elemental_essence < 1 ? 'disabled' : ''}>${buildForgeEnchantButtonLabel(enchant.name, 1)}</button>
      </div>
    `
  }).join('')

  const upgradableCards = run.deck.filter((card) => !card.upgraded)
  const upgradeHtml = upgradableCards
    .map((card) => {
      const def = getCardDef(card.defId)
      return `<button class="forge-compact-btn" data-forge-upgrade="${card.uid}">${def.name}</button>`
    })
    .join('')

  const removeHtml = run.deck
    .map((card) => {
      const def = getCardDef(card.defId)
      return `<button class="forge-compact-btn" data-forge-remove="${card.uid}">${def.name}</button>`
    })
    .join('')

  const slotText = weapon
    ? [0, 1]
      .map((i) => {
        const id = enchantSlots[i]
        if (!id) return '[空]'
        const def = getEnchantmentDef(id)
        return def.name
      })
      .join(' / ')
    : '未装备武器'

  container.innerHTML = `
    <div class="scene-forge scene-forge-v3">
      <header class="forge-header">
        <h2 class="forge-title">${buildForgeTitleText()}</h2>
        <p class="forge-subtitle">选择一项工艺，仅此一次</p>
      </header>

      <section class="forge-action-grid">
        <article class="panel forge-action-panel">
          <h3>${buildForgeActionTitle('craft')}</h3>
          <p>消耗材料锻造新武器</p>
          <div class="forge-action-list">${recipesHtml || '<div class="forge-empty">暂无配方</div>'}</div>
        </article>

        <article class="panel forge-action-panel">
          <h3>${buildForgeActionTitle('enchant')}</h3>
          <p>当前武器：${weapon ? getWeaponDef(weapon.defId).name : '无'} · 槽位：${slotText}</p>
          <div class="forge-resonance-hint">${resonanceHints || '暂无共鸣'}</div>
          <div class="forge-action-list">${enchantHtml || '<div class="forge-empty">未装备武器</div>'}</div>
        </article>

        <article class="panel forge-action-panel">
          <h3>${buildForgeActionTitle('upgrade')}</h3>
          <p>选择一张卡牌升级</p>
          <div class="forge-compact-list">${upgradeHtml || '<div class="forge-empty">无可升级卡牌</div>'}</div>
        </article>

        <article class="panel forge-action-panel">
          <h3>${buildForgeActionTitle('remove')}</h3>
          <p>移除一张卡牌</p>
          <div class="forge-compact-list">${removeHtml || '<div class="forge-empty">无可移除卡牌</div>'}</div>
        </article>
      </section>

      <footer class="forge-footer">
        <div class="forge-material-bar">
          ${Object.entries(run.materials).map(([key, value]) => buildForgeMaterialTagHtml(key as keyof RunState['materials'], value)).join('')}
        </div>
        <button class="btn btn-md" id="btn-leave-forge">返回地图</button>
      </footer>
    </div>
  `

  container.querySelectorAll<HTMLElement>('[data-recipe-id]').forEach((el) => {
    el.addEventListener('click', () => {
      const recipeId = el.dataset.recipeId
      if (!recipeId) return
      callbacks.onForgeCraft(recipeId)
    })
  })

  container.querySelectorAll<HTMLElement>('[data-forge-enchant]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = el.dataset.forgeEnchant as EnchantmentId | undefined
      if (!id) return
      const replaceIndex = el.dataset.replaceIdx ? Number(el.dataset.replaceIdx) : undefined
      callbacks.onForgeEnchant(id, replaceIndex)
    })
  })

  container.querySelectorAll<HTMLElement>('[data-forge-upgrade]').forEach((el) => {
    el.addEventListener('click', () => {
      const uid = el.dataset.forgeUpgrade
      if (!uid) return
      callbacks.onForgeUpgradeCard(uid)
    })
  })

  container.querySelectorAll<HTMLElement>('[data-forge-remove]').forEach((el) => {
    el.addEventListener('click', () => {
      const uid = el.dataset.forgeRemove
      if (!uid) return
      callbacks.onForgeRemoveCard(uid)
    })
  })

  container.querySelector('#btn-leave-forge')?.addEventListener('click', () => callbacks.onForgeLeave())

  container.querySelectorAll<HTMLImageElement>('.forge-weapon-preview img').forEach((imgEl) => {
    const wrapper = imgEl.closest<HTMLElement>('.forge-weapon-preview')
    if (!wrapper) return
    const name = wrapper.dataset.weaponName ?? imgEl.alt ?? '武器'
    const renderFallback = () => {
      const fallback = document.createElement('div')
      fallback.className = 'forge-image-fallback'
      fallback.textContent = name
      wrapper.replaceChildren(fallback)
    }
    imgEl.addEventListener('error', renderFallback, { once: true })
    if (imgEl.complete && imgEl.naturalWidth === 0) renderFallback()
  })
}
