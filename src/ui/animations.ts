export function showDamageFloat(
  container: HTMLElement,
  value: number,
  x: number,
  y: number,
): void {
  const el = document.createElement('div')
  el.className = 'damage-float'
  el.textContent = `-${value}`
  el.style.left = `${x}px`
  el.style.top = `${y}px`
  container.appendChild(el)
  el.addEventListener('animationend', () => el.remove())
}
