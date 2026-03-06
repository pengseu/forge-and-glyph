import type { BattleState, CardCategory, CardEffect } from '../../game/types'
import type { GameCallbacks } from '../renderer'
import { getEnemyDef } from '../../game/enemies'
import { canPlayCard, canUseNormalAttack, cardNeedsTarget, resolveAbyssLordAction, resolveAbyssLordPhase } from '../../game/combat'
import { getWeaponDef } from '../../game/weapons'
import { getEffectiveCardDef } from '../../game/campfire'
import { showDamageFloat, showTextFloat, shakeEnemy, screenShake, playerHitShake } from '../animations'
import { formatMaterial, getBattleMaterialEffectText } from '../../game/materials'
import type { MaterialId } from '../../game/types'

let pendingCardUid: string | null = null
let pendingNormalAttack = false
let hoverCardUid: string | null = null
let cardFlightAnimating = false

const KEYWORD_TIPS: Record<string, string> = {
  灼烧: '回合末受到层数伤害，随后层数-1',
  冻结: '跳过下一次行动',
  中毒: '回合开始受到层数伤害，不自然衰减',
  易伤: '受到伤害+50%，每回合-1层',
  虚弱: '造成伤害-25%，每回合-1层',
  屏障: '回合开始最多保留对应点数护甲',
  蓄能: '下个法术每层+10%伤害，用后清零',
  力量: '提高战技与普攻伤害',
  智慧: '提高法术伤害',
  护甲: '先抵消等量伤害',
}

function decorateKeywords(text: string): string {
  let out = text
  for (const [kw, tip] of Object.entries(KEYWORD_TIPS)) {
    out = out.replaceAll(kw, `<span class="card-keyword" title="${tip}">${kw}</span>`)
  }
  return out
}

function extractBaseDamage(effects: CardEffect[], target: BattleState['enemies'][number]): { damage: number; isMultiHit: boolean } {
  let damage = 0
  let isMultiHit = false
  for (const effect of effects) {
    if (effect.type === 'damage') damage += effect.value
    if (effect.type === 'multi_damage') {
      damage += effect.value * effect.hits
      isMultiHit = true
    }
    if (effect.type === 'aoe_damage') damage += effect.value
    if (effect.type === 'execute') {
      const hpPercent = (target.hp / target.maxHp) * 100
      damage += hpPercent <= effect.threshold ? effect.damage : effect.baseDamage
    }
    if (effect.type === 'burn_burst') damage += target.burn * effect.perStack
    if (effect.type === 'poison_burst') damage += effect.base + (target.poison * effect.perPoison)
    if (effect.type === 'conditional_damage_vs_vulnerable') {
      damage += target.vulnerable > 0 ? effect.vulnerableDamage : effect.base
    }
  }
  return { damage, isMultiHit }
}

function applyPreviewMods(
  rawDamage: number,
  state: BattleState,
  target: BattleState['enemies'][number],
  category: CardCategory,
): { damage: number; armorPenetration: number } {
  let damage = rawDamage
  const isAttack = category === 'combat' || category === 'spell'
  let armorPenetration = 0

  if (category === 'combat') damage += state.player.strength
  if (category === 'spell') damage += state.player.wisdom

  if (isAttack && state.player.equippedEnchantments.includes('bless')) damage += 3
  if (isAttack && state.player.equippedEnchantments.includes('void')) armorPenetration = 4
  if (isAttack && state.player.equippedEnchantments.includes('flame') && state.player.equippedEnchantments.includes('bless') && target.burn > 0) {
    damage = Math.floor(damage * 1.5)
  }

  if (category === 'combat') {
    damage += state.turnTracking.combatDamageBonus
    if (state.player.buffNextCombatDouble) damage *= 2
    if (state.player.buffNextCombat > 0) damage = Math.floor(damage * (1 + state.player.buffNextCombat / 100))
    if (state.player.equippedWeaponId === 'iron_bow' && !state.player.weaponPerTurnUsed) {
      damage = Math.floor(damage * 1.3)
    }
  }
  if (category === 'spell') {
    if (state.player.equippedWeaponId === 'iron_staff') damage = Math.floor(damage * 1.2)
    if (state.player.charge > 0) damage = Math.floor(damage * (1 + state.player.charge * 0.1))
    if (state.player.buffNextSpellDamage > 0) damage += state.player.buffNextSpellDamage
  }

  if (state.player.weakened > 0) damage = Math.floor(damage * 0.75)
  if (target.vulnerable > 0) damage = Math.floor(damage * 1.5)

  return { damage, armorPenetration }
}

function estimateCardPreview(state: BattleState, cardUid: string, targetIndex: number): { armorDamage: number; hpDamage: number } | null {
  const card = state.player.hand.find((c) => c.uid === cardUid)
  if (!card) return null
  const target = state.enemies[targetIndex]
  if (!target || target.hp <= 0) return null
  const def = getEffectiveCardDef(card)
  const { damage: rawDamage, isMultiHit } = extractBaseDamage(def.effects, target)
  if (rawDamage <= 0) return null
  const { damage, armorPenetration } = applyPreviewMods(rawDamage, state, target, def.category)
  if (target.defId === 'shadow_assassin' && !isMultiHit && damage <= 4) {
    return { armorDamage: 0, hpDamage: 0 }
  }
  const effectiveArmor = Math.max(0, target.armor - armorPenetration)
  const armorDamage = Math.min(effectiveArmor, damage)
  const hpDamage = Math.max(0, damage - armorDamage)
  return { armorDamage, hpDamage }
}

function estimateNormalAttackPreview(state: BattleState, targetIndex: number): { armorDamage: number; hpDamage: number } | null {
  if (!state.player.equippedWeaponId) return null
  const target = state.enemies[targetIndex]
  if (!target || target.hp <= 0) return null
  const attack = getWeaponDef(state.player.equippedWeaponId).normalAttack
  const rawDamage = attack.damage * (attack.hits ?? 1)
  const { damage, armorPenetration } = applyPreviewMods(rawDamage, state, target, 'combat')
  const effectiveArmor = Math.max(0, target.armor - armorPenetration)
  const armorDamage = Math.min(effectiveArmor, damage)
  const hpDamage = Math.max(0, damage - armorDamage)
  return { armorDamage, hpDamage }
}

function applyPreviewToDom(container: HTMLElement, state: BattleState, cardUid: string | null, forNormalAttack: boolean): void {
  state.enemies.forEach((enemy, idx) => {
    const holder = container.querySelector<HTMLElement>(`.enemy-preview[data-preview-idx=\"${idx}\"]`)
    if (!holder) return
    if (enemy.hp <= 0) {
      holder.textContent = ''
      return
    }

    const preview = forNormalAttack
      ? estimateNormalAttackPreview(state, idx)
      : (cardUid ? estimateCardPreview(state, cardUid, idx) : null)
    if (!preview || (preview.armorDamage + preview.hpDamage) <= 0) {
      holder.textContent = ''
      return
    }
    holder.innerHTML = `<span style=\"color:#9e9e9e;\">${preview.armorDamage}</span><span style=\"color:#ff6b6b;\">/${preview.hpDamage}</span>`
  })
}

export function resolveNormalAttackMode(livingEnemyCount: number): 'auto' | 'target' {
  return livingEnemyCount > 1 ? 'target' : 'auto'
}

export function resolveSummonIntentPreview(minionCount: number, summonCount: number, enemyStrength: number): {
  intentText: string
  intentHint: string
  intentClass: string
} {
  if (minionCount >= 2) {
    return {
      intentText: `🗡️ ${16 + enemyStrength}`,
      intentHint: '召唤位已满，将改为重击',
      intentClass: 'intent-attack',
    }
  }
  if (summonCount > 1) {
    return {
      intentText: '👥 召唤',
      intentHint: `将尝试召唤 ${summonCount} 个单位`,
      intentClass: 'intent-buff',
    }
  }
  return {
    intentText: '📢 召唤',
    intentHint: '将召唤新的敌方单位',
    intentClass: 'intent-buff',
  }
}

export function resolveGoblinKingPhase2Preview(_intentIndex: number, enemyStrength: number): {
  intentText: string
  intentHint: string
  intentClass: string
} {
  return {
    intentText: `🗡️ ${20 + enemyStrength}`,
    intentHint: '二阶段：不再召唤，发动狂怒重击',
    intentClass: 'intent-attack',
  }
}

export type HudStatusItem = {
  key: string
  html: string
  danger: boolean
}

export function partitionHudStatuses(items: HudStatusItem[]): {
  main: HudStatusItem[]
  sub: HudStatusItem[]
} {
  return {
    main: items.filter((item) => item.danger),
    sub: items.filter((item) => !item.danger),
  }
}

export type BattleHudSectionsInput = {
  hpBarHtml: string
  armorHtml: string
  staminaHtml: string
  manaHtml: string
  enemyCountHtml: string
  weaponHtml: string
  turnHtml: string
  dangerStatusHtml: string
  trialHtml: string
  enchantHtml: string
  enchantFeedbackHtml: string
  subStatusHtml: string
  helpHtml: string
}

export function buildBattleHudSections(input: BattleHudSectionsInput): string {
  return `
    <div class="hud-main">
      <div class="hud-group hud-group--vitals">${input.hpBarHtml}${input.armorHtml}</div>
      <div class="hud-group hud-group--resources">${input.staminaHtml}${input.manaHtml}</div>
      <div class="hud-group hud-group--combat">${input.enemyCountHtml}${input.weaponHtml}${input.turnHtml}${input.dangerStatusHtml}</div>
    </div>
    <div class="hud-sub">
      <div class="hud-group hud-group--meta">${input.trialHtml}${input.enchantHtml}${input.enchantFeedbackHtml}</div>
      <div class="hud-group hud-group--statuses">${input.subStatusHtml}</div>
      <div class="hud-group hud-group--help">${input.helpHtml}</div>
    </div>
  `
}

export function resolveHandFanStyle(index: number, cardCount: number): {
  rotateDeg: number
  offsetY: number
  marginLeft: number
} {
  if (cardCount <= 1) {
    return { rotateDeg: 0, offsetY: 0, marginLeft: 0 }
  }
  const totalSpread = Math.min(cardCount * 8, 60)
  const step = totalSpread / Math.max(cardCount - 1, 1)
  const centerIndex = (cardCount - 1) / 2
  const rotateDeg = Number(((index - centerIndex) * step).toFixed(2))
  const offsetY = Math.round(Math.abs(index - centerIndex) * 6)
  const marginLeft = index === 0 ? 0 : -20
  return { rotateDeg, offsetY, marginLeft }
}

export function buildHandCardStyleVars(index: number, fan: { rotateDeg: number; offsetY: number; marginLeft: number }): string {
  return `--fan-rotate:${fan.rotateDeg}deg;--fan-offset-y:${fan.offsetY}px;--fan-margin-left:${fan.marginLeft}px;--fan-z:${100 + index};`
}

function resolveCardFlightTarget(
  container: HTMLElement,
  category: CardCategory,
  targetIndex: number,
): HTMLElement | null {
  if (category === 'combat' || category === 'spell') {
    return (
      container.querySelector<HTMLElement>(`.enemy-unit[data-enemy-idx="${targetIndex}"]`) ??
      container.querySelector<HTMLElement>('.enemy-area .enemy-unit') ??
      container.querySelector<HTMLElement>('.enemy-area')
    )
  }
  return (
    container.querySelector<HTMLElement>('.player-sprite') ??
    container.querySelector<HTMLElement>('.player-area')
  )
}

function animateCardFlight(
  sourceCardEl: HTMLElement,
  targetEl: HTMLElement,
  done: () => void,
): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    done()
    return
  }

  const sourceRect = sourceCardEl.getBoundingClientRect()
  const targetRect = targetEl.getBoundingClientRect()
  const centerDx = (targetRect.left + targetRect.width / 2) - (sourceRect.left + sourceRect.width / 2)
  const centerDy = (targetRect.top + targetRect.height / 2) - (sourceRect.top + sourceRect.height / 2)

  const ghost = sourceCardEl.cloneNode(true) as HTMLElement
  ghost.classList.add('card-flight-ghost')
  ghost.removeAttribute('style')
  ghost.style.left = `${sourceRect.left}px`
  ghost.style.top = `${sourceRect.top}px`
  ghost.style.width = `${sourceRect.width}px`
  ghost.style.height = `${sourceRect.height}px`
  ghost.style.transform = 'translate(0, 0) scale(1)'
  ghost.style.opacity = '1'
  document.body.appendChild(ghost)

  sourceCardEl.classList.add('is-flying')

  window.requestAnimationFrame(() => {
    ghost.style.transform = `translate(${centerDx}px, ${centerDy}px) scale(0.8)`
  })

  window.setTimeout(() => {
    ghost.style.transform = `translate(${centerDx}px, ${centerDy}px) scale(0)`
    ghost.style.opacity = '0'
  }, 220)

  window.setTimeout(() => {
    ghost.remove()
    sourceCardEl.classList.remove('is-flying')
    done()
  }, 420)
}

function playCardWithAnimation(
  container: HTMLElement,
  state: BattleState,
  callbacks: GameCallbacks,
  uid: string,
  targetIndex: number,
): void {
  if (cardFlightAnimating) return

  const card = state.player.hand.find((c) => c.uid === uid)
  if (!card) {
    callbacks.onPlayCard(uid, targetIndex)
    return
  }

  const cardDef = getEffectiveCardDef(card)
  const sourceCardEl = container.querySelector<HTMLElement>(`.card[data-uid="${uid}"]`)
  const targetEl = resolveCardFlightTarget(container, cardDef.category, targetIndex)

  if (!sourceCardEl || !targetEl) {
    callbacks.onPlayCard(uid, targetIndex)
    return
  }

  cardFlightAnimating = true
  animateCardFlight(sourceCardEl, targetEl, () => {
    cardFlightAnimating = false
    callbacks.onPlayCard(uid, targetIndex)
  })
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
  act: 1 | 2 | 3 = 1,
): void {
  const sceneTheme = act === 1 ? 'forest' : 'dungeon'
  const stagePlatformSrc = act === 1
    ? '/assets/scenes/stage-forest-platform.png'
    : '/assets/scenes/stage-dungeon-platform.png'
  const stageContactSrc = '/assets/scenes/stage-contact-shadow.png'
  const actClass = `scene-battle--act${act}`
  const eldritchClass = state.enemies.some((enemy) => enemy.defId === 'abyss_lord') ? 'scene-battle--eldritch' : ''

  // Weapon display
  let weaponText = ''
  if (state.player.equippedWeaponId) {
    const wDef = getWeaponDef(state.player.equippedWeaponId)
    weaponText = `⚔️ ${wDef.name}`
  }
  const enchantText = state.player.equippedEnchantments.length > 0
    ? `🔮 ${state.player.equippedEnchantments.join(' / ')}`
    : ''
  const enchantFeedbackText = state.turnTracking.enchantEvents.length > 0
    ? state.turnTracking.enchantEvents.join(' · ')
    : ''

  // Player status effects
  const playerStatusItems: HudStatusItem[] = []
  if (state.player.strength > 0) {
    playerStatusItems.push({ key: 'strength', html: `<span class="status-badge">💪${state.player.strength}</span>`, danger: false })
  }
  if (state.player.wisdom > 0) {
    playerStatusItems.push({ key: 'wisdom', html: `<span class="status-badge">📖${state.player.wisdom}</span>`, danger: false })
  }
  if (state.player.barrier > 0) {
    playerStatusItems.push({ key: 'barrier', html: `<span class="status-badge">🔵${state.player.barrier}</span>`, danger: false })
  }
  if (state.player.charge > 0) {
    playerStatusItems.push({ key: 'charge', html: `<span class="status-badge">⚡蓄${state.player.charge}</span>`, danger: false })
  }
  if (state.player.poisonOnAttack > 0) {
    playerStatusItems.push({ key: 'poisonOnAttack', html: `<span class="status-badge">🐍+${state.player.poisonOnAttack}</span>`, danger: false })
  }
  if (state.player.poison > 0) {
    playerStatusItems.push({ key: 'poison', html: `<span class="status-badge status-debuff">☠️${state.player.poison}</span>`, danger: true })
  }
  if (state.player.weakened > 0) {
    playerStatusItems.push({ key: 'weakened', html: `<span class="status-badge status-debuff">😵${state.player.weakened}</span>`, danger: true })
  }
  if (state.turnTracking.combatDamageBonus > 0) {
    playerStatusItems.push({
      key: 'combatDamageBonus',
      html: `<span class="status-badge">🗡️+${state.turnTracking.combatDamageBonus}</span>`,
      danger: false,
    })
  }
  if (state.player.buffNextCombat > 0) {
    playerStatusItems.push({ key: 'buffNextCombat', html: `<span class="status-badge">✨+${state.player.buffNextCombat}%</span>`, danger: false })
  }
  if (state.player.buffNextCombatDouble) {
    playerStatusItems.push({ key: 'buffNextCombatDouble', html: '<span class="status-badge">⚡x2</span>', danger: false })
  }
  if (state.player.buffNextSpellDamage > 0) {
    playerStatusItems.push({
      key: 'buffNextSpellDamage',
      html: `<span class="status-badge">🔮+${state.player.buffNextSpellDamage}</span>`,
      danger: false,
    })
  }
  const playerStatus = playerStatusItems.map((item) => item.html).join('')
  const partitionedStatus = partitionHudStatuses(playerStatusItems)
  const dangerStatusHtml = partitionedStatus.main.map((item) => item.html).join('')
  const subStatusHtml = partitionedStatus.sub.map((item) => item.html).join('')

  // Build enemies HTML
  const enemiesHtml = state.enemies.map((enemy, idx) => {
    const wasAlive = (prevState?.enemies[idx]?.hp ?? 0) > 0
    const justDied = enemy.hp <= 0 && wasAlive
    if (enemy.hp <= 0 && !justDied) return ''

    const enemyDef = getEnemyDef(enemy.defId)
    const hpPercent = Math.max(0, (enemy.hp / enemy.maxHp) * 100)

    const intent = enemyDef.intents[enemy.intentIndex]
    const passiveText =
      enemy.defId === 'shadow_assassin'
        ? '⚡闪避：单次≤4伤害无效'
        : enemy.defId === 'stone_gargoyle'
          ? '🪨石化：每回合开始+6护甲'
          : ''
    let intentText = ''
    let intentHint = ''
    let intentClass = ''
    let intentToneClass = 'enemy-intent--debuff'
    if (justDied) {
      intentText = '✂️ 倒下'
      intentHint = '敌人被击败，正在消散'
      intentClass = 'intent-defeat'
      intentToneClass = 'enemy-intent--debuff'
    } else if (enemy.freeze > 0) {
      intentText = '🧊 冻结中'
      intentHint = '跳过本回合行动，随后获得短暂冻结免疫'
      intentClass = 'intent-freeze'
      intentToneClass = 'enemy-intent--debuff'
    } else if (enemy.defId === 'abyss_lord') {
      const phase = resolveAbyssLordPhase(enemy)
      const action = resolveAbyssLordAction(enemy.intentIndex, phase)
      if (action.type === 'attack') {
        const dmg = action.value + enemy.strength
        intentText = `🗡️ ${dmg}`
        intentHint = `阶段${phase}：将造成 ${dmg} 点伤害`
        intentClass = 'intent-attack'
        intentToneClass = 'enemy-intent--attack'
      } else if (action.type === 'gaze') {
        intentText = '👁️ 凝视'
        intentHint = `阶段${phase}：随机指定3种卡，本战斗费用+1`
        intentClass = 'intent-poison'
        intentToneClass = 'enemy-intent--debuff'
      } else if (action.type === 'fortify') {
        intentText = `🛡️${action.armor} 💪+${action.strength}`
        intentHint = `阶段${phase}：获得${action.armor}护甲并提升${action.strength}力量`
        intentClass = 'intent-buff'
        intentToneClass = 'enemy-intent--defend'
      } else if (action.type === 'aoe_attack_burn') {
        const dmg = action.value + enemy.strength
        intentText = `🗡️${dmg} 🔥${action.burn}`
        intentHint = `阶段${phase}：造成${dmg}伤害并附加灼烧伤害`
        intentClass = 'intent-attack'
        intentToneClass = 'enemy-intent--attack'
      } else if (action.type === 'attack_heal') {
        const dmg = action.value + enemy.strength
        intentText = `🗡️${dmg} ❤️+${action.heal}`
        intentHint = `阶段${phase}：造成${dmg}伤害并回复${action.heal}HP`
        intentClass = 'intent-attack'
        intentToneClass = 'enemy-intent--attack'
      } else if (action.type === 'weaken_attack') {
        const dmg = action.value + enemy.strength
        intentText = `🗡️${dmg} 😵${action.weaken}`
        intentHint = `阶段${phase}：造成${dmg}伤害并施加${action.weaken}层虚弱`
        intentClass = 'intent-attack'
        intentToneClass = 'enemy-intent--attack'
      }
    } else if (enemy.defId === 'goblin_king' && enemy.hp <= Math.floor(enemy.maxHp * 0.4)) {
      const phase2Step = enemy.intentIndex % 2
      if (phase2Step === 0) {
        const preview = resolveGoblinKingPhase2Preview(enemy.intentIndex, enemy.strength)
        intentText = preview.intentText
        intentHint = preview.intentHint
        intentClass = preview.intentClass
        intentToneClass = preview.intentClass === 'intent-attack' ? 'enemy-intent--attack' : 'enemy-intent--debuff'
      } else {
        const dmg = 12 + enemy.strength
        intentText = `🛡️10 🗡️${dmg}`
        intentHint = `二阶段：先获得10护甲，再造成${dmg}伤害`
        intentClass = 'intent-attack'
        intentToneClass = 'enemy-intent--attack'
      }
    } else if (intent.type === 'attack') {
      let dmg = intent.value + enemy.strength
      if (enemy.weakened > 0) dmg = Math.floor(dmg * 0.75)
      intentText = `🗡️ ${dmg}`
      intentHint = `将造成 ${dmg} 点伤害`
      intentClass = 'intent-attack'
      intentToneClass = 'enemy-intent--attack'
    } else if (intent.type === 'defend') {
      intentText = `🛡️ ${intent.value}`
      intentHint = `将获得 ${intent.value} 点护甲`
      intentClass = 'intent-defend'
      intentToneClass = 'enemy-intent--defend'
    } else if (intent.type === 'buff') {
      intentText = `💪 +${intent.value}`
      intentHint = `将提升 ${intent.value} 点力量`
      intentClass = 'intent-buff'
      intentToneClass = 'enemy-intent--defend'
    } else if (intent.type === 'poison') {
      intentText = `☠️ ${intent.value}`
      intentHint = `将施加 ${intent.value} 层中毒`
      intentClass = 'intent-poison'
      intentToneClass = 'enemy-intent--debuff'
    } else if (intent.type === 'weaken') {
      intentText = `😵 ${intent.value}`
      intentHint = `将施加 ${intent.value} 层虚弱`
      intentClass = 'intent-poison'
      intentToneClass = 'enemy-intent--debuff'
    } else if (intent.type === 'curse') {
      intentText = `🕯️ 诅咒×${intent.count}`
      intentHint = `将塞入 ${intent.count} 张诅咒牌`
      intentClass = 'intent-poison'
      intentToneClass = 'enemy-intent--debuff'
    } else if (intent.type === 'summon') {
      const minionCount = state.enemies.filter(e => e.defId === intent.enemyId && e.hp > 0).length
      const preview = resolveSummonIntentPreview(minionCount, 1, enemy.strength)
      intentText = preview.intentText
      intentHint = preview.intentHint
      intentClass = preview.intentClass
      intentToneClass = preview.intentClass === 'intent-attack' ? 'enemy-intent--attack' : 'enemy-intent--debuff'
    } else if (intent.type === 'summon_multi') {
      const minionCount = state.enemies.filter(e => e.defId === intent.enemyId && e.hp > 0).length
      const preview = resolveSummonIntentPreview(minionCount, intent.count, enemy.strength)
      intentText = preview.intentText
      intentHint = preview.intentHint
      intentClass = preview.intentClass
      intentToneClass = preview.intentClass === 'intent-attack' ? 'enemy-intent--attack' : 'enemy-intent--debuff'
    } else if (intent.type === 'defend_attack') {
      let dmg = intent.attackValue + enemy.strength
      if (enemy.weakened > 0) dmg = Math.floor(dmg * 0.75)
      intentText = `🛡️${intent.defendValue} 🗡️${dmg}`
      intentHint = `将先获得 ${intent.defendValue} 护甲，再造成 ${dmg} 伤害`
      intentClass = 'intent-attack'
      intentToneClass = 'enemy-intent--attack'
    }

    const enemyStatusBadges: string[] = []
    if (!justDied) {
      if (enemy.strength > 0) enemyStatusBadges.push(`<span class="status-badge">💪${enemy.strength}</span>`)
      if (enemy.burn > 0) enemyStatusBadges.push(`<span class="status-badge">🔥${enemy.burn}</span>`)
      if (enemy.poison > 0) enemyStatusBadges.push(`<span class="status-badge">🐍${enemy.poison}</span>`)
      if (enemy.freeze > 0) enemyStatusBadges.push('<span class="status-badge">🧊</span>')
      if (enemy.weakened > 0) enemyStatusBadges.push(`<span class="status-badge status-debuff">😵${enemy.weakened}</span>`)
      if (enemy.vulnerable > 0) enemyStatusBadges.push(`<span class="status-badge status-debuff">💀${enemy.vulnerable}</span>`)
    }
    const enemyStatus = enemyStatusBadges.join('')
    const enemySlotClass = justDied ? 'enemy-slot enemy-slot--dying' : 'enemy-slot'

    return `
      <div class="${enemySlotClass}">
        <div class="enemy-intent ${intentClass} ${intentToneClass}" title="${intentHint}">${intentText}</div>
        <div
          class="enemy-unit ${justDied ? 'is-defeated' : ''}"
          data-enemy-idx="${idx}"
          tabindex="${enemy.hp > 0 ? '0' : '-1'}"
          role="button"
          aria-label="${enemyDef.name}"
          aria-disabled="${enemy.hp > 0 ? 'false' : 'true'}"
        >
          <div class="enemy-sprite" data-enemy-name="${enemyDef.name}">
            <img src="${enemyDef.sprite}" alt="${enemyDef.name}" loading="lazy" />
          </div>
          <div class="enemy-name">${enemyDef.name}</div>
          ${passiveText ? `<div class="enemy-passive">${passiveText}</div>` : ''}
          <div class="hp-bar enemy-hp-bar">
            <div class="hp-bar-fill" style="width: ${hpPercent}%"></div>
            <div class="hp-bar-text">${enemy.hp}/${enemy.maxHp}</div>
          </div>
          <div class="enemy-meta">
            ${enemy.armor > 0 ? `🛡️ ${enemy.armor}` : ' '}
          </div>
          <div class="enemy-preview" data-preview-idx="${idx}"></div>
          ${enemyStatus ? `<div class="status-row enemy-status-row">${enemyStatus}</div>` : ''}
        </div>
        <div class="enemy-intent-hint">${intentHint}</div>
      </div>
    `
  }).join('')

  // Build hand cards HTML
  const cardsHtml = state.player.hand.map((card, index) => {
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
    const fan = resolveHandFanStyle(index, state.player.hand.length)
    const tiltDeg = (((Math.random() - 0.5) * 2)).toFixed(2)
    const selectedClass = pendingCardUid === card.uid ? 'selected' : ''
    const cardTypeClass = def.id.startsWith('curse_')
      ? 'card--curse'
      : def.category === 'combat'
        ? 'card--attack'
        : def.category === 'spell'
          ? 'card--skill'
          : 'card--power'
    return `
      <div
        class="card card--hand ${cardTypeClass} ${playable ? '' : 'disabled'} ${selectedClass}"
        data-uid="${card.uid}"
        tabindex="${playable ? '0' : '-1'}"
        role="button"
        aria-label="${def.name}"
        style="${buildHandCardStyleVars(index, fan)}--card-tilt:${tiltDeg}deg;"
      >
        <div class="card-name">${def.name}</div>
        <div class="card-cost ${def.costType}">${costLabel}</div>
        <div class="card-desc">${decorateKeywords(def.description)}</div>
      </div>
    `
  }).join('')

  const targetModeClass = pendingCardUid ? 'target-mode' : ''
  const battleMaterials = (Object.keys(state.availableMaterials) as MaterialId[])
    .filter((id) => state.availableMaterials[id] > 0)
    .map((id) => {
      const used = !!state.usedMaterials[id]
      return `
        <button class="btn battle-material-btn" data-material-id="${id}" ${used ? 'disabled' : ''}>
          <div class="battle-material-name">${formatMaterial(id)} ${used ? '(已用)' : `×${state.availableMaterials[id]}`}</div>
          <div class="battle-material-effect">${getBattleMaterialEffectText(id)}</div>
        </button>
      `
    }).join('')
  const trialText = state.trialModifier
    ? state.trialModifier === 'flame'
      ? '试炼: 烈焰（每回合全体+1灼烧）'
      : state.trialModifier === 'speed'
        ? `试炼: 速度（限时${state.trialTurnLimit ?? 5}回合）`
        : '试炼: 耐久（敌方伤害x0.5）'
    : ''
  const playerHpPercent = Math.max(0, Math.min(100, (state.player.hp / state.player.maxHp) * 100))
  const hpDangerClass = playerHpPercent <= 35 ? 'is-low' : ''
  const livingEnemyCount = state.enemies.filter((enemy) => enemy.hp > 0).length
  const hudHtml = buildBattleHudSections({
    hpBarHtml: `
      <div class="hp-bar player-hp-bar hud-hp-bar ${hpDangerClass}">
        <div class="hp-bar-fill" style="width:${playerHpPercent}%"></div>
        <div class="hp-bar-text">${state.player.hp}/${state.player.maxHp}</div>
      </div>
    `,
    armorHtml: `<span class="hud-stat hud-stat--armor"><span class="hud-label">护甲</span><span class="hud-number">${state.player.armor}</span></span>`,
    staminaHtml: `<span class="hud-stat hud-stat--stamina"><span class="hud-label">体力</span><span class="hud-number">${state.player.stamina}/${state.player.maxStamina}</span></span>`,
    manaHtml: `<span class="hud-stat hud-stat--mana"><span class="hud-label">法力</span><span class="hud-number">${state.player.mana}/${state.player.maxMana}</span></span>`,
    enemyCountHtml: `<span class="hud-stat hud-stat--enemy"><span class="hud-label">敌人</span><span class="hud-number">${livingEnemyCount}</span></span>`,
    weaponHtml: weaponText
      ? `<span class="hud-stat hud-stat--weapon"><span class="hud-label">武器</span><span class="hud-text">${weaponText}</span></span>`
      : '',
    turnHtml: `<span class="hud-stat hud-stat--turn"><span class="hud-label">回合</span><span class="hud-number">${state.turn}</span></span>`,
    dangerStatusHtml: dangerStatusHtml ? `<span class="hud-status-row hud-status-row--danger">${dangerStatusHtml}</span>` : '',
    trialHtml: trialText ? `<span class="hud-meta hud-meta--trial">${trialText}</span>` : '',
    enchantHtml: enchantText ? `<span class="hud-meta hud-meta--enchant">${enchantText}</span>` : '',
    enchantFeedbackHtml: enchantFeedbackText ? `<span class="hud-meta hud-meta--feedback">${enchantFeedbackText}</span>` : '',
    subStatusHtml: subStatusHtml ? `<span class="hud-status-row">${subStatusHtml}</span>` : '<span class="hud-meta hud-meta--empty">无额外状态</span>',
    helpHtml: '<button class="hud-help-btn" id="btn-status-help" type="button" aria-label="状态说明">?</button>',
  })

  container.innerHTML = `
    <div class="scene-battle ${actClass} ${eldritchClass}">
      <div class="player-bar">
        ${hudHtml}
      </div>

      <div class="battle-scene-layer battle-scene-bg">
        <img src="/assets/scenes/${sceneTheme}-top.png" alt="" loading="lazy" />
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
          <div class="status-guide-row">🐍 中毒 — 回合开始受N伤害，不自然消退</div>
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

      <div class="battle-main battle-stage">
        <div class="battle-scene-layer battle-scene-platform">
          <img src="${stagePlatformSrc}" alt="" loading="lazy" />
        </div>
        <div class="battle-scene-layer battle-scene-contact" aria-hidden="true">
          <img src="${stageContactSrc}" alt="" loading="lazy" />
        </div>
        <div class="battle-scene-layer battle-scene-corners">
          <img src="/assets/scenes/stage-deco-corners.png" alt="" loading="lazy" />
        </div>
        <div class="player-area">
          <div class="player-sprite" data-player-name="工匠">
            <img src="/assets/characters/player/hero.png" alt="工匠" loading="lazy" />
          </div>
          <div class="buff-row">
            ${playerStatus}
          </div>
        </div>
        <div class="enemy-area ${targetModeClass}">
          ${enemiesHtml}
        </div>
        <div class="battle-scene-layer battle-scene-fg">
          <img src="/assets/scenes/${sceneTheme}-foreground-mask.png" alt="" loading="lazy" />
        </div>
      </div>

      <div class="battle-material-bar">
        ${battleMaterials || '<span class="battle-material-empty">无可用材料</span>'}
      </div>
      ${pendingCardUid ? '<div class="target-hint">选择目标（右键取消）</div>' : ''}

      <div class="hand-area">
        <div class="hand-cards">${cardsHtml}</div>
        <div class="hand-footer">
          <span class="deck-counter">抽牌堆: ${state.player.drawPile.length}</span>
          <span class="discard-counter">弃牌堆: ${state.player.discardPile.length}</span>
        </div>
        <div class="hand-actions">
          <button class="btn btn-md" id="btn-normal-attack" ${canUseNormalAttack(state) ? '' : 'disabled'}>${state.player.normalAttackUsedThisTurn ? '⚔️ 普攻(已用)' : '⚔️ 普攻'}</button>
          <button class="btn btn-md btn-ghost" id="btn-end-turn">⏭️ 结束回合</button>
        </div>
      </div>
    </div>
  `

  // --- Event binding ---
  container.querySelectorAll<HTMLImageElement>('.player-sprite img').forEach((imgEl) => {
    const wrapper = imgEl.closest<HTMLElement>('.player-sprite')
    if (!wrapper) return
    const playerName = wrapper.dataset.playerName ?? imgEl.alt ?? '工匠'
    const renderFallback = () => {
      const fallback = document.createElement('div')
      fallback.className = 'player-sprite--fallback'
      fallback.textContent = playerName
      wrapper.replaceChildren(fallback)
    }
    imgEl.addEventListener('error', renderFallback, { once: true })
    if (imgEl.complete && imgEl.naturalWidth === 0) {
      renderFallback()
    }
  })

  container.querySelectorAll<HTMLImageElement>('.enemy-sprite img').forEach((imgEl) => {
    const wrapper = imgEl.closest<HTMLElement>('.enemy-sprite')
    if (!wrapper) return
    const enemyName = wrapper.dataset.enemyName ?? imgEl.alt ?? '未知敌人'
    const renderFallback = () => {
      const fallback = document.createElement('div')
      fallback.className = 'enemy-sprite--fallback'
      fallback.textContent = enemyName
      wrapper.replaceChildren(fallback)
    }
    imgEl.addEventListener('error', renderFallback, { once: true })
    if (imgEl.complete && imgEl.naturalWidth === 0) {
      renderFallback()
    }
  })

  // Cancel target selection on right-click or clicking empty area
  container.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    if (pendingCardUid) {
      exitTargetMode(container)
      applyPreviewToDom(container, state, hoverCardUid, false)
    }
  })

  // Enemy click (target selection)
  container.querySelectorAll<HTMLElement>('.enemy-unit').forEach(el => {
    el.addEventListener('click', (e) => {
      if (cardFlightAnimating) return
      e.stopPropagation()
      if (!pendingCardUid) return
      const idx = parseInt(el.dataset.enemyIdx!, 10)
      if (!Number.isFinite(idx) || (state.enemies[idx]?.hp ?? 0) <= 0) return
      const uid = pendingCardUid
      exitTargetMode(container)
      applyPreviewToDom(container, state, null, false)
      playCardWithAnimation(container, state, callbacks, uid, idx)
    })
    el.addEventListener('keydown', (e: KeyboardEvent) => {
      if (cardFlightAnimating) return
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        const idx = parseInt(el.dataset.enemyIdx!, 10)
        if (!Number.isFinite(idx) || (state.enemies[idx]?.hp ?? 0) <= 0) return
        if (pendingCardUid) {
          const uid = pendingCardUid
          exitTargetMode(container)
          applyPreviewToDom(container, state, null, false)
          playCardWithAnimation(container, state, callbacks, uid, idx)
          return
        }
        if (pendingNormalAttack) {
          exitTargetMode(container)
          applyPreviewToDom(container, state, null, false)
          callbacks.onNormalAttack(idx)
        }
      }
    })
    el.addEventListener('click', (e) => {
      if (cardFlightAnimating) return
      if (!pendingNormalAttack) return
      if (pendingCardUid) return
      e.stopPropagation()
      const idx = parseInt(el.dataset.enemyIdx!, 10)
      if (!Number.isFinite(idx) || (state.enemies[idx]?.hp ?? 0) <= 0) return
      exitTargetMode(container)
      applyPreviewToDom(container, state, null, false)
      callbacks.onNormalAttack(idx)
    })
  })

  // Card click
  container.querySelectorAll<HTMLElement>('.card:not(.disabled)').forEach(el => {
    el.addEventListener('click', (e) => {
      if (cardFlightAnimating) return
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
        applyPreviewToDom(container, state, uid, false)
      } else if (cardNeedsTarget(def.effects) && livingEnemies.length === 1) {
        const targetIdx = state.enemies.findIndex(en => en.hp > 0)
        if (targetIdx >= 0) {
          playCardWithAnimation(container, state, callbacks, uid, targetIdx)
        }
      } else {
        const fallbackTarget = state.enemies.findIndex(en => en.hp > 0)
        playCardWithAnimation(container, state, callbacks, uid, Math.max(0, fallbackTarget))
      }
    })
    el.addEventListener('mouseenter', () => {
      hoverCardUid = el.dataset.uid ?? null
      if (!pendingCardUid && !pendingNormalAttack) {
        applyPreviewToDom(container, state, hoverCardUid, false)
      }
    })
    el.addEventListener('mouseleave', () => {
      hoverCardUid = null
      if (!pendingCardUid && !pendingNormalAttack) {
        applyPreviewToDom(container, state, null, false)
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
      if (cardFlightAnimating) return
      pendingCardUid = null
      callbacks.onEndTurn()
    })

  container.querySelector('#btn-normal-attack')?.addEventListener('click', () => {
    if (cardFlightAnimating) return
    const livingEnemies = state.enemies.filter(en => en.hp > 0)
    const mode = resolveNormalAttackMode(livingEnemies.length)
    if (mode === 'target') {
      enterNormalAttackTargetMode(container)
      applyPreviewToDom(container, state, null, true)
      return
    }
    const targetIdx = state.enemies.findIndex(en => en.hp > 0)
    if (targetIdx >= 0) {
      callbacks.onNormalAttack(targetIdx)
    }
  })

  container.querySelectorAll<HTMLElement>('.battle-material-btn').forEach(el => {
    el.addEventListener('click', () => {
      if (cardFlightAnimating) return
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

  // Initial preview state (for selected target mode persisted in same render cycle).
  if (pendingCardUid) {
    applyPreviewToDom(container, state, pendingCardUid, false)
  } else if (pendingNormalAttack) {
    applyPreviewToDom(container, state, null, true)
  } else {
    applyPreviewToDom(container, state, null, false)
  }

  // Reset pendingCardUid on fresh render (new state from game logic)
  pendingCardUid = null
  pendingNormalAttack = false
  hoverCardUid = null
}
