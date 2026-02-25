import type { BattleState } from '../../game/types'
import type { GameCallbacks } from '../renderer'
import { getEnemyDef } from '../../game/enemies'
import { canPlayCard } from '../../game/combat'
import { getWeaponDef } from '../../game/weapons'
import { getEffectiveCardDef } from '../../game/campfire'

export function renderBattle(
  container: HTMLElement,
  state: BattleState,
  callbacks: GameCallbacks,
): void {
  const enemyDef = getEnemyDef(state.enemy.defId)
  const hpPercent = (state.enemy.hp / state.enemy.maxHp) * 100
  const intent = enemyDef.intents[state.enemy.intentIndex]

  // Intent display text
  let intentText = ''
  if (state.enemy.freeze > 0) {
    intentText = '🧊 冻结中'
  } else if (intent.type === 'attack') {
    let dmg = intent.value + state.enemy.strength
    if (state.enemy.weakened > 0) dmg = Math.floor(dmg * 0.75)
    intentText = `⚔️ 攻击 ${dmg}`
  } else if (intent.type === 'buff') {
    intentText = `💪 战吼 (+${intent.value}力量)`
  }

  // Status effects on enemy
  let enemyStatus = ''
  if (state.enemy.burn > 0) enemyStatus += ` 🔥${state.enemy.burn}`
  if (state.enemy.poison > 0) enemyStatus += ` 🐍${state.enemy.poison}`
  if (state.enemy.freeze > 0) enemyStatus += ` 🧊${state.enemy.freeze}`
  if (state.enemy.weakened > 0) enemyStatus += ` 😵${state.enemy.weakened}`
  if (state.enemy.strength > 0) enemyStatus += ` 💪${state.enemy.strength}`

  // Weapon display
  let weaponText = ''
  if (state.player.equippedWeaponId) {
    const wDef = getWeaponDef(state.player.equippedWeaponId)
    weaponText = `⚔️ ${wDef.name}`
  }

  // Player status effects
  let playerStatus = ''
  if (state.player.strength > 0) playerStatus += ` 💪${state.player.strength}`
  if (state.player.buffNextCombat > 0) playerStatus += ` ✨+${state.player.buffNextCombat}%`

  // Build hand cards HTML
  const cardsHtml = state.player.hand.map(card => {
    const def = getEffectiveCardDef(card)
    const playable = canPlayCard(state, card.uid)
    let costLabel = ''
    if (def.costType === 'free') {
      costLabel = '免费'
    } else if (def.costType === 'stamina') {
      const actualCost = Math.max(0, def.cost - state.player.weaponDiscount)
      costLabel = actualCost < def.cost ? `⚡<s>${def.cost}</s>${actualCost}` : `⚡${def.cost}`
    } else {
      costLabel = `✦${def.cost}`
    }
    return `
      <div class="card ${playable ? '' : 'disabled'}" data-uid="${card.uid}">
        <div class="card-name">${def.name}</div>
        <div class="card-cost ${def.costType}">${costLabel}</div>
        <div class="card-desc">${def.description}</div>
      </div>
    `
  }).join('')

  container.innerHTML = `
    <div class="player-bar">
      <span class="stat stat-hp">♥ ${state.player.hp}/${state.player.maxHp}</span>
      <span class="stat stat-stamina">⚡ ${state.player.stamina}/${state.player.maxStamina}</span>
      <span class="stat stat-mana">✦ ${state.player.mana}/${state.player.maxMana}</span>
      <span class="stat stat-armor">🛡️ ${state.player.armor}</span>
      ${weaponText ? `<span class="stat" style="color:#f0a500;">${weaponText}</span>` : ''}
      ${playerStatus ? `<span class="stat" style="color:#4caf50;">${playerStatus}</span>` : ''}
      <span class="stat">回合 ${state.turn}</span>
    </div>
    <div class="enemy-area">
      <div class="enemy-name">👾 ${enemyDef.name}${enemyStatus}</div>
      <div class="hp-bar-container">
        <div class="hp-bar-fill" style="width: ${hpPercent}%"></div>
      </div>
      <div style="font-size:9px; color:#aaa;">
        HP ${state.enemy.hp}/${state.enemy.maxHp}
        ${state.enemy.armor > 0 ? `🛡️${state.enemy.armor}` : ''}
      </div>
      <div class="enemy-intent">意图: ${intentText}</div>
    </div>
    <div class="hand-area">
      <div class="hand-cards">${cardsHtml}</div>
      <div class="hand-footer">
        <span>抽牌堆: ${state.player.drawPile.length}</span>
        <button class="btn" id="btn-end-turn">结束回合</button>
        <span>弃牌堆: ${state.player.discardPile.length}</span>
      </div>
    </div>
  `

  // Bind card click events
  container.querySelectorAll('.card:not(.disabled)').forEach(el => {
    el.addEventListener('click', () => {
      const uid = (el as HTMLElement).dataset.uid!
      callbacks.onPlayCard(uid)
    })
  })

  // Bind end turn button
  container.querySelector('#btn-end-turn')!
    .addEventListener('click', callbacks.onEndTurn)
}
