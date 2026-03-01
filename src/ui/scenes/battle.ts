import type { BattleState } from '../../game/types'
import type { GameCallbacks } from '../renderer'
import { getEnemyDef } from '../../game/enemies'
import { canPlayCard, canUseNormalAttack, cardNeedsTarget } from '../../game/combat'
import { getWeaponDef } from '../../game/weapons'
import { getEffectiveCardDef } from '../../game/campfire'
import { showDamageFloat, showTextFloat, shakeEnemy, screenShake, playerHitShake } from '../animations'
import { formatMaterial, getBattleMaterialEffectText } from '../../game/materials'
import type { MaterialId } from '../../game/types'

let pendingCardUid: string | null = null
let pendingNormalAttack = false

export function resolveNormalAttackMode(livingEnemyCount: number): 'auto' | 'target' {
  return livingEnemyCount > 1 ? 'target' : 'auto'
}

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
  pendingNormalAttack = false
  container.querySelector('.enemy-area')?.classList.remove('target-mode')
  container.querySelectorAll('.card.selected').forEach(el => el.classList.remove('selected'))
  container.querySelector('#target-hint')?.remove()
}

function enterNormalAttackTargetMode(container: HTMLElement) {
  pendingNormalAttack = true
  pendingCardUid = null
  container.querySelector('.enemy-area')?.classList.add('target-mode')
  container.querySelector('#target-hint')?.remove()
  const hint = document.createElement('div')
  hint.className = 'target-hint'
  hint.id = 'target-hint'
  hint.textContent = '选择普攻目标（右键取消）'
  const enemyArea = container.querySelector('.enemy-area')
  if (enemyArea) enemyArea.after(hint)
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
  const enchantText = state.player.equippedEnchantments.length > 0
    ? `🔮 ${state.player.equippedEnchantments.join(' / ')}`
    : ''
  const enchantFeedback = state.turnTracking.enchantEvents.length > 0
    ? `<span class="stat" style="color:#7ad3ff;">${state.turnTracking.enchantEvents.join(' · ')}</span>`
    : ''

  // Player status effects
  const playerStatusBadges: string[] = []
  if (state.player.strength > 0) playerStatusBadges.push(`<span class="status-badge">💪${state.player.strength}</span>`)
  if (state.player.wisdom > 0) playerStatusBadges.push(`<span class="status-badge">📖${state.player.wisdom}</span>`)
  if (state.player.barrier > 0) playerStatusBadges.push(`<span class="status-badge">🔵${state.player.barrier}</span>`)
  if (state.player.charge > 0) playerStatusBadges.push(`<span class="status-badge">⚡蓄${state.player.charge}</span>`)
  if (state.player.poisonOnAttack > 0) playerStatusBadges.push(`<span class="status-badge">🐍+${state.player.poisonOnAttack}</span>`)
  if (state.player.poison > 0) playerStatusBadges.push(`<span class="status-badge status-debuff">☠️${state.player.poison}</span>`)
  if (state.player.weakened > 0) playerStatusBadges.push(`<span class="status-badge status-debuff">😵${state.player.weakened}</span>`)
  if (state.turnTracking.combatDamageBonus > 0) playerStatusBadges.push(`<span class="status-badge">🗡️+${state.turnTracking.combatDamageBonus}</span>`)
  if (state.player.buffNextCombat > 0) playerStatusBadges.push(`<span class="status-badge">✨+${state.player.buffNextCombat}%</span>`)
  if (state.player.buffNextCombatDouble) playerStatusBadges.push('<span class="status-badge">⚡x2</span>')
  if (state.player.buffNextSpellDamage > 0) playerStatusBadges.push(`<span class="status-badge">🔮+${state.player.buffNextSpellDamage}</span>`)
  const playerStatus = playerStatusBadges.join('')

  // Build enemies HTML
  const enemiesHtml = state.enemies.map((enemy, idx) => {
    if (enemy.hp <= 0) return ''
    const enemyDef = getEnemyDef(enemy.defId)
    const hpPercent = (enemy.hp / enemy.maxHp) * 100

    const intent = enemyDef.intents[enemy.intentIndex]
    const passiveText =
      enemy.defId === 'shadow_assassin'
        ? '⚡闪避：单次≤5伤害无效'
        : enemy.defId === 'stone_gargoyle'
          ? '🪨石化：每回合开始+8护甲'
          : ''
    let intentText = ''
    let intentHint = ''
    let intentClass = ''
    if (enemy.freeze > 0) {
      intentText = '🧊 冻结中'
      intentHint = '跳过本回合行动，随后获得短暂冻结免疫'
      intentClass = 'intent-freeze'
    } else if (intent.type === 'attack') {
      let dmg = intent.value + enemy.strength
      if (enemy.weakened > 0) dmg = Math.floor(dmg * 0.75)
      intentText = `🗡️ ${dmg}`
      intentHint = `将造成 ${dmg} 点伤害`
      intentClass = 'intent-attack'
    } else if (intent.type === 'defend') {
      intentText = `🛡️ ${intent.value}`
      intentHint = `将获得 ${intent.value} 点护甲`
      intentClass = 'intent-defend'
    } else if (intent.type === 'buff') {
      intentText = `💪 +${intent.value}`
      intentHint = `将提升 ${intent.value} 点力量`
      intentClass = 'intent-buff'
    } else if (intent.type === 'poison') {
      intentText = `☠️ ${intent.value}`
      intentHint = `将施加 ${intent.value} 层中毒`
      intentClass = 'intent-poison'
    } else if (intent.type === 'weaken') {
      intentText = `😵 ${intent.value}`
      intentHint = `将施加 ${intent.value} 层虚弱`
      intentClass = 'intent-poison'
    } else if (intent.type === 'summon') {
      intentText = '📢 召唤'
      intentHint = '将召唤新的敌方单位'
      intentClass = 'intent-buff'
    } else if (intent.type === 'summon_multi') {
      intentText = '👥 召唤'
      intentHint = `将尝试召唤 ${intent.count} 个单位`
      intentClass = 'intent-buff'
    } else if (intent.type === 'defend_attack') {
      let dmg = intent.attackValue + enemy.strength
      if (enemy.weakened > 0) dmg = Math.floor(dmg * 0.75)
      intentText = `🛡️${intent.defendValue} 🗡️${dmg}`
      intentHint = `将先获得 ${intent.defendValue} 护甲，再造成 ${dmg} 伤害`
      intentClass = 'intent-attack'
    }

    const enemyStatusBadges: string[] = []
    if (enemy.strength > 0) enemyStatusBadges.push(`<span class="status-badge">💪${enemy.strength}</span>`)
    if (enemy.burn > 0) enemyStatusBadges.push(`<span class="status-badge">🔥${enemy.burn}</span>`)
    if (enemy.poison > 0) enemyStatusBadges.push(`<span class="status-badge">🐍${enemy.poison}</span>`)
    if (enemy.freeze > 0) enemyStatusBadges.push('<span class="status-badge">🧊</span>')
    if (enemy.weakened > 0) enemyStatusBadges.push(`<span class="status-badge status-debuff">😵${enemy.weakened}</span>`)
    if (enemy.vulnerable > 0) enemyStatusBadges.push(`<span class="status-badge status-debuff">💀${enemy.vulnerable}</span>`)
    const enemyStatus = enemyStatusBadges.join('')

    return `
      <div class="enemy-unit" data-enemy-idx="${idx}" tabindex="0" role="button" aria-label="${enemyDef.name}">
        <div class="enemy-intent ${intentClass}" title="${intentHint}">${intentText}</div>
        <div class="enemy-intent-hint">${intentHint}</div>
        <div class="enemy-name">👾 ${enemyDef.name}</div>
        ${passiveText ? `<div class="enemy-passive">${passiveText}</div>` : ''}
        <div class="hp-bar-container">
          <div class="hp-bar-fill" style="width: ${hpPercent}%"></div>
        </div>
        <div style="font-size:9px; color:#aaa;">
          HP ${enemy.hp}/${enemy.maxHp}
          ${enemy.armor > 0 ? ` 🛡️${enemy.armor}` : ''}
        </div>
        ${enemyStatus ? `<div class="status-row enemy-status-row">${enemyStatus}</div>` : ''}
      </div>
    `
  }).join('')

  // Build hand cards HTML
  const cardsHtml = state.player.hand.map(card => {
    const def = getEffectiveCardDef(card)
    const playable = canPlayCard(state, card.uid)
    let costLabel = ''
    const reducedCost = Math.max(0, def.cost - state.player.tempCostReduction)
    if (def.costType === 'free') {
      costLabel = '免费'
    } else if (def.costType === 'stamina') {
      const actualCost = Math.max(0, reducedCost - state.player.weaponDiscount)
      costLabel = actualCost < def.cost ? `⚡<s>${def.cost}</s>${actualCost}` : `⚡${def.cost}`
    } else if (def.costType === 'hybrid') {
      const staminaCost = Math.max(0, reducedCost - state.player.weaponDiscount)
      costLabel = `⚡${staminaCost} + ✦${reducedCost}`
    } else {
      costLabel = reducedCost < def.cost ? `✦<s>${def.cost}</s>${reducedCost}` : `✦${def.cost}`
    }
    const selectedClass = pendingCardUid === card.uid ? 'selected' : ''
    return `
      <div class="card ${playable ? '' : 'disabled'} ${selectedClass}" data-uid="${card.uid}" tabindex="${playable ? '0' : '-1'}" role="button" aria-label="${def.name}">
        <div class="card-name">${def.name}</div>
        <div class="card-cost ${def.costType}">${costLabel}</div>
        <div class="card-desc">${def.description}</div>
      </div>
    `
  }).join('')

  const targetModeClass = pendingCardUid ? 'target-mode' : ''
  const battleMaterials = (Object.keys(state.availableMaterials) as MaterialId[])
    .filter((id) => state.availableMaterials[id] > 0)
    .map((id) => {
      const used = !!state.usedMaterials[id]
      return `
        <button class="btn btn-small battle-material-btn" data-material-id="${id}" ${used ? 'disabled' : ''}>
          <div class="battle-material-name">${formatMaterial(id)} ${used ? '(已用)' : `×${state.availableMaterials[id]}`}</div>
          <div class="battle-material-effect">${getBattleMaterialEffectText(id)}</div>
        </button>
      `
    }).join('')

  container.innerHTML = `
    <div class="player-bar">
      <span class="stat stat-hp">♥ ${state.player.hp}/${state.player.maxHp}</span>
      <span class="stat stat-stamina">⚡ ${state.player.stamina}/${state.player.maxStamina}</span>
      <span class="stat stat-mana">✦ ${state.player.mana}/${state.player.maxMana}</span>
      <span class="stat stat-armor">🛡️ ${state.player.armor}</span>
      ${weaponText ? `<span class="stat" style="color:#f0a500;">${weaponText}</span>` : ''}
      ${enchantText ? `<span class="stat" style="color:#7ad3ff;">${enchantText}</span>` : ''}
      ${enchantFeedback}
      ${playerStatus ? `<span class="stat status-row">${playerStatus}</span>` : ''}
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
    <div class="battle-material-bar">
      ${battleMaterials || '<span class="battle-material-empty">无可用材料</span>'}
    </div>
    ${pendingCardUid ? '<div class="target-hint">选择目标（右键取消）</div>' : ''}
    <div class="hand-area">
      <div class="hand-cards">${cardsHtml}</div>
      <div class="hand-footer">
        <span>抽牌堆: ${state.player.drawPile.length}</span>
        <button class="btn btn-small" id="btn-normal-attack" ${canUseNormalAttack(state) ? '' : 'disabled'}>${state.player.normalAttackUsedThisTurn ? '普攻(已用)' : '普攻(0费)'}</button>
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
  container.querySelectorAll<HTMLElement>('.enemy-unit').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation()
      if (!pendingCardUid) return
      const idx = parseInt(el.dataset.enemyIdx!, 10)
      const uid = pendingCardUid
      exitTargetMode(container)
      callbacks.onPlayCard(uid, idx)
    })
    el.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        const idx = parseInt(el.dataset.enemyIdx!, 10)
        if (pendingCardUid) {
          const uid = pendingCardUid
          exitTargetMode(container)
          callbacks.onPlayCard(uid, idx)
          return
        }
        if (pendingNormalAttack) {
          exitTargetMode(container)
          callbacks.onNormalAttack(idx)
        }
      }
    })
    el.addEventListener('click', (e) => {
      if (!pendingNormalAttack) return
      if (pendingCardUid) return
      e.stopPropagation()
      const idx = parseInt(el.dataset.enemyIdx!, 10)
      exitTargetMode(container)
      callbacks.onNormalAttack(idx)
    })
  })

  // Card click
  container.querySelectorAll<HTMLElement>('.card:not(.disabled)').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation()
      const uid = el.dataset.uid!
      const card = state.player.hand.find(c => c.uid === uid)
      if (!card) return
      const def = getEffectiveCardDef(card)

      // If already in target mode, cancel first
      const wasPendingUid = pendingCardUid
      const wasPendingNormalAttack = pendingNormalAttack
      if (pendingCardUid) {
        exitTargetMode(container)
        if (uid === wasPendingUid) return
      }
      if (wasPendingNormalAttack && !pendingCardUid) {
        exitTargetMode(container)
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
    el.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        el.click()
      }
    })
  })

  // End turn button
  container.querySelector('#btn-end-turn')!
    .addEventListener('click', () => {
      pendingCardUid = null
      callbacks.onEndTurn()
    })

  container.querySelector('#btn-normal-attack')?.addEventListener('click', () => {
    const livingEnemies = state.enemies.filter(en => en.hp > 0)
    const mode = resolveNormalAttackMode(livingEnemies.length)
    if (mode === 'target') {
      enterNormalAttackTargetMode(container)
      return
    }
    const targetIdx = state.enemies.findIndex(en => en.hp > 0)
    if (targetIdx >= 0) {
      callbacks.onNormalAttack(targetIdx)
    }
  })

  container.querySelectorAll<HTMLElement>('.battle-material-btn').forEach(el => {
    el.addEventListener('click', () => {
      const materialId = el.dataset.materialId as MaterialId
      if (!materialId) return
      if (window.confirm(`确认消耗 ${formatMaterial(materialId)}？每场战斗每种材料只能使用一次。`)) {
        callbacks.onUseBattleMaterial(materialId)
      }
    })
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

      const enemyEl = container.querySelector(`.enemy-unit[data-enemy-idx="${i}"]`) as HTMLElement
      if (enemyEl) {
        const rect = enemyEl.getBoundingClientRect()
        const x = rect.left - containerRect.left + rect.width / 2 - 20
        const y = rect.top - containerRect.top + rect.height / 2
        if (curr.evadedThisAction && !prev.evadedThisAction) {
          showTextFloat(container, '闪避！', x, y - 14, 'poison')
        }
        if (curr.turnStartArmorGain > 0 && curr.turnStartArmorGain !== prev.turnStartArmorGain) {
          showDamageFloat(container, curr.turnStartArmorGain, x, y - 30, 'armor')
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
