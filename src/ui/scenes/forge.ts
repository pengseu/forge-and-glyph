import { FORGE_RECIPES } from '../../game/forge'
import type { RunState } from '../../game/types'
import type { GameCallbacks } from '../renderer'
import { formatMaterial } from '../../game/materials'
import { getWeaponDef } from '../../game/weapons'

export function renderForge(
  container: HTMLElement,
  run: RunState,
  callbacks: GameCallbacks,
): void {
  const recipesHtml = FORGE_RECIPES.map(r => {
    const canPayFixedCost = Object.entries(r.cost).every(([k, v]) => run.materials[k as keyof typeof run.materials] >= (v ?? 0))
    const totalEssence = run.materials.elemental_essence + run.materials.war_essence + run.materials.guard_essence
    const canPayAnyEssence = (r.anyEssenceCost ?? 0) <= totalEssence
    const canCraft = canPayFixedCost && canPayAnyEssence
    const fixedCostText = Object.entries(r.cost).map(([k, v]) => `${formatMaterial(k as keyof RunState['materials'])}×${v}`).join(' + ')
    const costText = [fixedCostText, r.anyEssenceCost ? `任意精华×${r.anyEssenceCost}` : '']
      .filter(Boolean)
      .join(' + ')
    const weapon = getWeaponDef(r.weaponDefId)
    return `
      <div class="forge-recipe">
        <div class="forge-name">${r.name}</div>
        <div class="forge-effect">效果：${weapon.effect}</div>
        <div class="forge-cost">${costText}</div>
        <button class="btn btn-small" data-recipe-id="${r.id}" ${canCraft ? '' : 'disabled'}>锻造</button>
      </div>
    `
  }).join('')

  container.innerHTML = `
    <div class="scene-forge">
      <h2>⚒️ 铁匠铺</h2>
      <div class="forge-materials">
        ${Object.entries(run.materials).map(([k, v]) => `<span>${formatMaterial(k as keyof RunState['materials'])}:${v}</span>`).join(' ')}
      </div>
      <div class="forge-recipes">${recipesHtml}</div>
      <button class="btn" id="btn-leave-forge">离开</button>
    </div>
  `

  container.querySelectorAll<HTMLElement>('[data-recipe-id]').forEach(el => {
    el.addEventListener('click', () => callbacks.onForgeCraft(el.dataset.recipeId!))
  })
  container.querySelector('#btn-leave-forge')?.addEventListener('click', () => callbacks.onForgeLeave())
}
