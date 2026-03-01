export function renderWeaponSelect(
  container: HTMLElement,
  onSelect: (weaponDefId: 'iron_longsword' | 'iron_staff') => void,
): void {
  container.innerHTML = `
    <div class="scene-title">
      <h1>选择起始武器</h1>
      <p class="subtitle">你的构筑将围绕武器展开</p>
      <div class="campfire-options">
        <button class="btn" id="btn-pick-longsword">⚔️ 铁制长剑（战技流）</button>
        <button class="btn" id="btn-pick-staff">🔮 铁制法杖（法术流）</button>
      </div>
    </div>
  `

  container.querySelector('#btn-pick-longsword')?.addEventListener('click', () => onSelect('iron_longsword'))
  container.querySelector('#btn-pick-staff')?.addEventListener('click', () => onSelect('iron_staff'))
}
