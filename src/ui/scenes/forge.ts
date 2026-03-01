import { getCardDef } from '../../game/cards'
import { ENCHANTMENTS, getEnchantmentDef, getTriggeredResonances } from '../../game/enchantments'
import { FORGE_RECIPES, isRecipeUnlocked, resolveRecipeCost } from '../../game/forge'
import { formatMaterial } from '../../game/materials'
import type { EnchantmentId, RunState } from '../../game/types'
import { describeWeaponEffect, getWeaponDef } from '../../game/weapons'
import type { GameCallbacks } from '../renderer'

export function renderForge(
  container: HTMLElement,
  run: RunState,
  callbacks: GameCallbacks,
): void {
  const recipesHtml = FORGE_RECIPES.map(r => {
    const masteryLevel = r.requiresBlueprint ? (run.blueprintMastery?.[r.requiresBlueprint] ?? 0) : 0
    const effective = resolveRecipeCost(r, masteryLevel)
    const unlocked = isRecipeUnlocked(run, r)
    const canPayFixedCost = Object.entries(effective.cost).every(([k, v]) => run.materials[k as keyof typeof run.materials] >= (v ?? 0))
    const totalEssence = run.materials.elemental_essence + run.materials.war_essence + run.materials.guard_essence
    const canPayAnyEssence = (effective.anyEssenceCost ?? 0) <= totalEssence
    const canCraft = unlocked && canPayFixedCost && canPayAnyEssence
    const fixedCostText = Object.entries(effective.cost).map(([k, v]) => `${formatMaterial(k as keyof RunState['materials'])}×${v}`).join(' + ')
    const costText = [fixedCostText, effective.anyEssenceCost ? `任意精华×${effective.anyEssenceCost}` : '']
      .filter(Boolean)
      .join(' + ')
    const weapon = getWeaponDef(r.weaponDefId)
    const lockText = unlocked ? '' : `（未解锁蓝图：${r.requiresBlueprint}）`
    return `
      <div class="forge-recipe">
        <div class="forge-name">${r.name}</div>
        <div class="forge-effect">效果：${describeWeaponEffect(weapon.effect)}</div>
        <div class="forge-cost">${costText} ${lockText}</div>
        <button class="btn btn-small" data-recipe-id="${r.id}" ${canCraft ? '' : 'disabled'}>锻造</button>
      </div>
    `
  }).join('')

  const weapon = run.equippedWeapon
  const enchantSlots = weapon?.enchantments ?? []
  const resonanceHints = getTriggeredResonances(enchantSlots).map((r) => `✨共鸣：${r.name}`).join(' · ')
  const enchantHtml = ENCHANTMENTS.map((e) => {
    if (!weapon) return ''
    if (enchantSlots.length < 2) {
      return `<button class="btn btn-small" data-forge-enchant="${e.id}" ${run.materials.elemental_essence < 1 ? 'disabled' : ''}>${e.icon}${e.name}</button>`
    }
    return `
      <div class="enchant-replace-actions">
        <button class="btn btn-small" data-forge-enchant="${e.id}" data-replace-idx="0" ${run.materials.elemental_essence < 1 ? 'disabled' : ''}>${e.icon}${e.name}→槽1</button>
        <button class="btn btn-small" data-forge-enchant="${e.id}" data-replace-idx="1" ${run.materials.elemental_essence < 1 ? 'disabled' : ''}>${e.icon}${e.name}→槽2</button>
      </div>
    `
  }).join('')

  const upgradableCards = run.deck.filter((c) => !c.upgraded)
  const upgradeHtml = upgradableCards
    .map((card) => {
      const def = getCardDef(card.defId)
      return `<button class="shop-remove-card" data-forge-upgrade="${card.uid}">${def.name}</button>`
    })
    .join('')

  const removeHtml = run.deck
    .map((card) => {
      const def = getCardDef(card.defId)
      return `<button class="shop-remove-card" data-forge-remove="${card.uid}">${def.name}</button>`
    })
    .join('')

  const slotText = weapon
    ? [0, 1]
      .map((i) => {
        const id = enchantSlots[i]
        if (!id) return '[空]'
        const def = getEnchantmentDef(id)
        return `${def.icon}${def.name}`
      })
      .join(' / ')
    : '未装备武器'

  container.innerHTML = `
    <div class="scene-forge">
      <h2>⚒️ 工坊（本次仅能执行1项）</h2>
      <div class="forge-materials">
        ${Object.entries(run.materials).map(([k, v]) => `<span>${formatMaterial(k as keyof RunState['materials'])}:${v}</span>`).join(' ')}
      </div>

      <div class="inventory-section">
        <h3>1) 锻造武器</h3>
        <div class="forge-recipes">${recipesHtml}</div>
      </div>

      <div class="inventory-section">
        <h3>2) 附魔武器（元素精华×1）</h3>
        <div class="inventory-item">当前武器：${weapon ? getWeaponDef(weapon.defId).name : '无'} · 槽位：${slotText}</div>
        <div class="inventory-item">${resonanceHints || '暂无共鸣'}</div>
        <div class="forge-recipes">${enchantHtml || '<div class="inventory-item">未装备武器</div>'}</div>
      </div>

      <div class="inventory-section">
        <h3>3) 升级卡牌</h3>
        <div class="shop-remove-list">${upgradeHtml || '<span class="inventory-item">无可升级卡牌</span>'}</div>
      </div>

      <div class="inventory-section">
        <h3>4) 精简卡组（移除1张）</h3>
        <div class="shop-remove-list">${removeHtml || '<span class="inventory-item">无可移除卡牌</span>'}</div>
      </div>

      <button class="btn" id="btn-leave-forge">离开</button>
    </div>
  `

  container.querySelectorAll<HTMLElement>('[data-recipe-id]').forEach(el => {
    el.addEventListener('click', () => callbacks.onForgeCraft(el.dataset.recipeId!))
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
    el.addEventListener('click', () => callbacks.onForgeUpgradeCard(el.dataset.forgeUpgrade!))
  })

  container.querySelectorAll<HTMLElement>('[data-forge-remove]').forEach((el) => {
    el.addEventListener('click', () => callbacks.onForgeRemoveCard(el.dataset.forgeRemove!))
  })

  container.querySelector('#btn-leave-forge')?.addEventListener('click', () => callbacks.onForgeLeave())
}
