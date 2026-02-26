import type { BattleState } from '../../game/types'
import type { GameCallbacks } from '../renderer'
import { getEnemyDef } from '../../game/enemies'
import { canPlayCard, cardNeedsTarget } from '../../game/combat'
import { getWeaponDef } from '../../game/weapons'
import { getEffectiveCardDef } from '../../game/campfire'
import { showDamageFloat, shakeEnemy, screenShake, playerHitShake } from '../animations'

let pendingCardUid: string | null = null

function enterTargetMode(container: HTMLElement, uid: string) {
  pendingCardUid = uid
  container.querySelector('.enemy-area')?.classList.add('target-mode')
  container.querySelectorAll('.card').forEach(el => {
    if ((el as HTMLElement).dataset.uid === uid) {
      el.classList.add('selected')
    }
  })
  const hint = document.createElement('div')
  hint.className = 'target-hint'
  hint.id = 'target-hint'
  hint.textContent = '选择目标（右键取消）'
  const enemyArea = container.querySelector('.enemy-area')
  if (enemyArea) enemyArea.after(hint)
}

function exitTargetMode(container: HTMLElement) {
  pendingCardUid = null
  container.querySelector('.enemy-area')?.classList.remove('target-mode')
  container.querySelectorAll('.card.selected').forEach(el => el.classList.remove('selected'))
  container.querySelector('#target-hint')?.remove()
}

export function renderBattle(
  container: HTMLElement,
  state: BattleState,
  callbacks: GameCallbacks,
  prevState?: BattleState,
): void {
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
  if (state.player.buffNextCombatDouble) playerStatus += ' ⚡x2'
  if (state.player.buffNextSpellDamage > 0) playerStatus += ` 🔮+${state.player.buffNextSpellDamage}`
  if (state.player.poisonOnAttack > 0) playerStatus += ` 🐍+${state.player.poisonOnAttack}`
  if (state.player.poison > 0) playerStatus += ` ☠️${state.player.poison}`
  if (state.turnTracking.combatDamageBonus > 0) playerStatus += ` 🗡️+${state.turnTracking.combatDamageBonus}`
  if (state.player.wisdom > 0) playerStatus += ` 📖${state.player.wisdom}`
  if (state.player.barrier > 0) playerStatus += ` 🔵${state.player.barrier}`
  if (state.player.charge > 0) playerStatus += ` ⚡蓄${state.player.charge}`
  if (state.player.weakened > 0) playerStatus += ` 😵${state.player.weakened}`

  // Build enemies HTML
  const enemiesHtml = state.enemies.map((enemy, idx) => {
    if (enemy.hp <= 0) return ''
    const enemyDef = getEnemyDef(enemy.defId)
    const hpPercent = (enemy.hp / enemy.maxHp) * 100

    const intent = enemyDef.intents[enemy.intentIndex]
    let intentText = ''
    let intentClass = ''
    if (enemy.freeze > 0) {
      intentText = '🧊 冻结中'
      intentClass = 'intent-freeze'
    } else if (intent.type === 'attack') {
      let dmg = intent.value + enemy.strength
      if (enemy.weakened > 0) dmg = Math.floor(dmg * 0.75)
      intentText = `🗡️ ${dmg}`
      intentClass = 'intent-attack'
    } else if (intent.type === 'defend') {
      intentText = `🛡️ ${intent.value}`
      intentClass = 'intent-defend'
    } else if (intent.type === 'buff') {
      intentText = `💪 +${intent.value}`
      intentClass = 'intent-buff'
    } else if (intent.type === 'poison') {
      intentText = `☠️ ${intent.value}`
      intentClass = 'intent-poison'
    } else if (intent.type === 'summon') {
      intentText = '📢 召唤'
      intentClass = 'intent-buff'
    } else if (intent.type === 'summon_multi') {
      intentText = '👥 召唤'
      intentClass = 'intent-buff'
    } else if (intent.type === 'defend_attack') {
      let dmg = intent.attackValue + enemy.strength
      if (enemy.weakened > 0) dmg = Math.floor(dmg * 0.75)
      intentText = `🛡️${intent.defendValue} 🗡️${dmg}`
      intentClass = 'intent-attack'
    }

    let enemyStatus = ''
    if (enemy.burn > 0) enemyStatus += ` 🔥${enemy.burn}`
    if (enemy.poison > 0) enemyStatus += ` 🐍${enemy.poison}`
    if (enemy.freeze > 0) enemyStatus += ' 🧊'
    if (enemy.weakened > 0) enemyStatus += ` 😵${enemy.weakened}`
    if (enemy.vulnerable > 0) enemyStatus += ` 💀${enemy.vulnerable}`
    if (enemy.strength > 0) enemyStatus += ` 💪${enemy.strength}`

    return `
      <div class="enemy-unit" data-enemy-idx="${idx}">
        <div class="enemy-intent ${intentClass}">${intentText}</div>
        <div class="enemy-name">👾 ${enemyDef.name}</div>
        <div class="hp-bar-container">
          <div class="hp-bar-fill" style="width: ${hpPercent}%"></div>
        </div>
        <div style="font-size:9px; color:#aaa;">
          HP ${enemy.hp}/${enemy.maxHp}
          ${enemy.armor > 0 ? ` 🛡️${enemy.armor}` : ''}
        </div>
        ${enemyStatus ? `<div style="font-size:9px;">${enemyStatus}</div>` : ''}
      </div>
    `
  }).join('')

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
    const selectedClass = pendingCardUid === card.uid ? 'selected' : ''
    return `
      <div class="card ${playable ? '' : 'disabled'} ${selectedClass}" data-uid="${card.uid}">
        <div class="card-name">${def.name}</div>
        <div class="card-cost ${def.costType}">${costLabel}</div>
        <div class="card-desc">${def.description}</div>
      </div>
    `
  }).join('')

  const targetModeClass = pendingCardUid ? 'target-mode' : ''

  container.innerHTML = `
    <div class="player-bar">
      <span class="stat stat-hp">♥ ${state.player.hp}/${state.player.maxHp}</span>
      <span class="stat stat-stamina">⚡ ${state.player.stamina}/${state.player.maxStamina}</span>
      <span class="stat stat-mana">✦ ${state.player.mana}/${state.player.maxMana}</span>
      <span class="stat stat-armor">🛡️ ${state.player.armor}</span>
      ${weaponText ? `<span class="stat" style="color:#f0a500;">${weaponText}</span>` : ''}
      ${playerStatus ? `<span class="stat" style="color:#4caf50;">${playerStatus}</span>` : ''}
      <span class="stat">回合 ${state.turn}</span>
      <span class="stat stat-help" id="btn-status-help">?</span>
    </div>
    <div id="status-guide" class="status-guide" style="display:none;">
      <div class="status-guide-inner">
        <div class="status-guide-title">状态说明</div>
        <div class="status-guide-row">💪 力量 — 战技伤害+N</div>
        <div class="status-guide-row">📖 智慧 — 法术伤害+N</div>
        <div class="status-guide-row">🛡️ 护甲 — 抵消伤害，回合开始清零</div>
        <div class="status-guide-row">🔵 屏障 — 回合开始保留最多N点护甲</div>
        <div class="status-guide-row">⚡蓄 蓄能 — 下个法术伤害+N×10%，用后清零</div>
        <div class="status-guide-row">🔥 灼烧 — 回合末受N伤害，每回合-1</div>
        <div class="status-guide-row">🐍 中毒 — 回合末受N伤害，不自然消退</div>
        <div class="status-guide-row">🧊 冻结 — 跳过下次行动</div>
        <div class="status-guide-row">💀 易伤 — 受到伤害+50%，每回合-1</div>
        <div class="status-guide-row">😵 虚弱 — 造成伤害-25%，每回合-1</div>
        <div class="status-guide-row">✨ 战技加成 — 下次战技伤害+N%</div>
        <div class="status-guide-row">⚡x2 翻倍 — 下次战技伤害×2</div>
        <div class="status-guide-row">🔮 法术加成 — 下次法术伤害+N</div>
        <div class="status-guide-row">🐍+ 淬毒 — 战技命中附加N中毒</div>
        <div class="status-guide-row">☠️ 中毒(玩家) — 每回合受N伤害</div>
        <div class="status-guide-close">点击任意处关闭</div>
      </div>
    </div>
    <div class="enemy-area ${targetModeClass}">
      ${enemiesHtml}
    </div>
    ${pendingCardUid ? '<div class="target-hint">选择目标（右键取消）</div>' : ''}
    <div class="hand-area">
      <div class="hand-cards">${cardsHtml}</div>
      <div class="hand-footer">
        <span>抽牌堆: ${state.player.drawPile.length}</span>
        <button class="btn" id="btn-end-turn">结束回合</button>
        <span>弃牌堆: ${state.player.discardPile.length}</span>
      </div>
    </div>
  `

  // --- Event binding ---

  // Cancel target selection on right-click or clicking empty area
  container.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    if (pendingCardUid) {
      exitTargetMode(container)
    }
  })

  // Enemy click (target selection)
  container.querySelectorAll('.enemy-unit').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation()
      if (!pendingCardUid) return
      const idx = parseInt((el as HTMLElement).dataset.enemyIdx!, 10)
      const uid = pendingCardUid
      exitTargetMode(container)
      callbacks.onPlayCard(uid, idx)
    })
  })

  // Card click
  container.querySelectorAll('.card:not(.disabled)').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation()
      const uid = (el as HTMLElement).dataset.uid!
      const card = state.player.hand.find(c => c.uid === uid)
      if (!card) return
      const def = getEffectiveCardDef(card)

      // If already in target mode, cancel first
      if (pendingCardUid) {
        exitTargetMode(container)
        if (pendingCardUid === null && uid === pendingCardUid) return
      }

      const livingEnemies = state.enemies.filter(en => en.hp > 0)
      if (cardNeedsTarget(def.effects) && livingEnemies.length > 1) {
        enterTargetMode(container, uid)
      } else if (cardNeedsTarget(def.effects) && livingEnemies.length === 1) {
        const targetIdx = state.enemies.findIndex(en => en.hp > 0)
        callbacks.onPlayCard(uid, targetIdx)
      } else {
        callbacks.onPlayCard(uid, 0)
      }
    })
  })

  // End turn button
  container.querySelector('#btn-end-turn')!
    .addEventListener('click', () => {
      pendingCardUid = null
      callbacks.onEndTurn()
    })

  // --- Animations based on state diff ---
  if (prevState) {
    const containerRect = container.getBoundingClientRect()

    // Per-enemy damage animations
    for (let i = 0; i < state.enemies.length; i++) {
      const prev = prevState.enemies[i]
      if (!prev) continue
      const curr = state.enemies[i]
      const enemyDmg = prev.hp - curr.hp
      const poisonGain = curr.poison - prev.poison

      if (enemyDmg > 0 || poisonGain > 0) {
        const enemyEl = container.querySelector(`.enemy-unit[data-enemy-idx="${i}"]`) as HTMLElement
        if (enemyEl) {
          const rect = enemyEl.getBoundingClientRect()
          const x = rect.left - containerRect.left + rect.width / 2 - 20
          const y = rect.top - containerRect.top + rect.height / 2

          if (enemyDmg > 0) {
            showDamageFloat(container, enemyDmg, x, y, 'damage')
            shakeEnemy(enemyEl)
            if (enemyDmg >= 10) {
              screenShake(container)
            }
          }
          if (poisonGain > 0) {
            showDamageFloat(container, poisonGain, x, y + 20, 'poison')
          }
        }
      }
    }

    // Player animations
    const playerDmg = prevState.player.hp - state.player.hp
    const healGain = state.player.hp - prevState.player.hp
    const armorGain = state.player.armor - prevState.player.armor

    const playerBar = container.querySelector('.player-bar') as HTMLElement
    if (playerBar) {
      const rect = playerBar.getBoundingClientRect()
      const px = rect.left - containerRect.left + 60
      const py = rect.top - containerRect.top

      if (playerDmg > 0) {
        showDamageFloat(container, playerDmg, px, py, 'damage')
        playerHitShake(playerBar, playerDmg)
      }
      if (healGain > 0 && playerDmg <= 0) {
        showDamageFloat(container, healGain, px, py, 'heal')
      }
      if (armorGain > 0) {
        showDamageFloat(container, armorGain, px + 90, py, 'armor')
      }
    }
  }

  // Status guide toggle
  const helpBtn = container.querySelector('#btn-status-help')
  const guide = container.querySelector('#status-guide')
  if (helpBtn && guide) {
    helpBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      guide.setAttribute('style', guide.getAttribute('style') === 'display:none;' ? '' : 'display:none;')
    })
    guide.addEventListener('click', () => {
      guide.setAttribute('style', 'display:none;')
    })
  }

  // Reset pendingCardUid on fresh render (new state from game logic)
  pendingCardUid = null
}
