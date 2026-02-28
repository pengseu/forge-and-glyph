export function showDamageFloat(
  container: HTMLElement,
  value: number,
  x: number,
  y: number,
  type: 'damage' | 'heal' | 'armor' | 'poison' = 'damage',
): void {
  const el = document.createElement('div')
  el.className = `damage-float damage-float-${type}`
  const offsetX = (Math.random() - 0.5) * 30
  if (type === 'damage') {
    el.textContent = `-${value}`
    if (value >= 10) el.classList.add('big-damage')
  } else if (type === 'heal') {
    el.textContent = `+${value}`
  } else if (type === 'poison') {
    el.textContent = `🐍${value}`
  } else {
    el.textContent = `+${value}`
  }
  el.style.left = `${x + offsetX}px`
  el.style.top = `${y}px`
  container.appendChild(el)
  el.addEventListener('animationend', () => el.remove())
}

export function showTextFloat(
  container: HTMLElement,
  text: string,
  x: number,
  y: number,
  type: 'damage' | 'heal' | 'armor' | 'poison' = 'damage',
): void {
  const el = document.createElement('div')
  el.className = `damage-float damage-float-${type}`
  const offsetX = (Math.random() - 0.5) * 30
  el.textContent = text
  el.style.left = `${x + offsetX}px`
  el.style.top = `${y}px`
  container.appendChild(el)
  el.addEventListener('animationend', () => el.remove())
}

export function shakeEnemy(enemyEl: HTMLElement): void {
  enemyEl.classList.add('enemy-shake')
  enemyEl.addEventListener('animationend', () => {
    enemyEl.classList.remove('enemy-shake')
  }, { once: true })
}

export function screenShake(container: HTMLElement): void {
  container.classList.add('screen-shake')
  container.addEventListener('animationend', () => {
    container.classList.remove('screen-shake')
  }, { once: true })
}

export function enemyDeathFade(enemyEl: HTMLElement): Promise<void> {
  return new Promise(resolve => {
    enemyEl.classList.add('enemy-death')
    enemyEl.addEventListener('animationend', () => {
      resolve()
    }, { once: true })
  })
}

export function playerHitShake(playerBar: HTMLElement, damage: number): void {
  // Intensity scales with damage: light (<5), medium (5-14), heavy (>=15)
  const cls = damage >= 15 ? 'player-hit-heavy' : damage >= 5 ? 'player-hit-medium' : 'player-hit-light'
  playerBar.classList.add(cls)
  playerBar.addEventListener('animationend', () => {
    playerBar.classList.remove(cls)
  }, { once: true })
}
