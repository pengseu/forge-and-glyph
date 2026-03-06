import { describeWeaponEffect, getWeaponDef } from '../../game/weapons'

type StartingWeaponId = 'iron_longsword' | 'iron_staff'

type StartingWeaponPreview = {
  id: StartingWeaponId
  icon: string
  title: string
  role: string
  normalAttackText: string
  effectText: string
  sprite: string
  buttonId: string
  buttonLabel: string
  archClass: 'sword' | 'staff'
}

export function resolveStartingWeaponPreview(weaponId: StartingWeaponId): StartingWeaponPreview {
  const def = getWeaponDef(weaponId)
  if (weaponId === 'iron_staff') {
    return {
      id: weaponId,
      icon: '🔮',
      title: def.name,
      role: '法术流',
      normalAttackText: `普攻：${def.normalAttack.damage}伤害`,
      effectText: describeWeaponEffect(def.effect),
      sprite: '/assets/weapons/iron_staff.png',
      buttonId: 'btn-pick-staff',
      buttonLabel: '选择法杖',
      archClass: 'staff',
    }
  }
  return {
    id: weaponId,
    icon: '⚔️',
    title: def.name,
    role: '战技流',
    normalAttackText: `普攻：${def.normalAttack.damage}伤害`,
    effectText: describeWeaponEffect(def.effect),
    sprite: '/assets/weapons/iron_longsword.png',
    buttonId: 'btn-pick-longsword',
    buttonLabel: '选择长剑',
    archClass: 'sword',
  }
}

function renderWeaponOption(weapon: StartingWeaponPreview): string {
  return `
    <section class="panel weapon-option weapon-option--${weapon.archClass}">
      <div class="weapon-option-art" data-weapon-name="${weapon.title}">
        <img src="${weapon.sprite}" alt="${weapon.title}" loading="lazy" />
      </div>
      <h3 class="weapon-option-name">${weapon.icon} ${weapon.title}</h3>
      <ul class="weapon-option-stats">
        <li>${weapon.role}</li>
        <li>${weapon.normalAttackText}</li>
      </ul>
      <p class="weapon-option-desc">${weapon.effectText}</p>
      <button
        class="btn btn-primary btn-md ${weapon.archClass === 'sword' ? 'btn-arch-sword' : 'btn-arch-staff'}"
        id="${weapon.buttonId}"
      >
        ${weapon.buttonLabel}
      </button>
    </section>
  `
}

export function renderWeaponSelect(
  container: HTMLElement,
  onSelect: (weaponDefId: StartingWeaponId) => void,
): void {
  const sword = resolveStartingWeaponPreview('iron_longsword')
  const staff = resolveStartingWeaponPreview('iron_staff')

  container.innerHTML = `
    <div class="scene-weapon-select">
      <header class="weapon-select-header">
        <h1>选择你的起始武器</h1>
        <p class="weapon-select-subtitle">每位工匠都有自己的道路</p>
      </header>
      <div class="weapon-select-grid">
        ${renderWeaponOption(sword)}
        ${renderWeaponOption(staff)}
      </div>
    </div>
  `

  container.querySelector('#btn-pick-longsword')?.addEventListener('click', () => onSelect('iron_longsword'))
  container.querySelector('#btn-pick-staff')?.addEventListener('click', () => onSelect('iron_staff'))

  container.querySelectorAll<HTMLImageElement>('.weapon-option-art img').forEach((imgEl) => {
    const wrapper = imgEl.closest<HTMLElement>('.weapon-option-art')
    if (!wrapper) return
    const weaponName = wrapper.dataset.weaponName ?? imgEl.alt ?? '武器'
    const renderFallback = () => {
      const fallback = document.createElement('div')
      fallback.className = 'weapon-option-art-fallback'
      fallback.textContent = weaponName
      wrapper.replaceChildren(fallback)
    }
    imgEl.addEventListener('error', renderFallback, { once: true })
    if (imgEl.complete && imgEl.naturalWidth === 0) renderFallback()
  })
}
