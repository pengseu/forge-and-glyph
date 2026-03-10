import { ALL_CARDS, getCardDef } from './cards'
import { generateMapByAct } from './map'
import { upgradeEquippedWeapon } from './run'
import type { RunState } from './types'
import { random } from './random'
import { getWeaponDef } from './weapons'

export type IntermissionChoiceId =
  | 'elite_armament'
  | 'knowledge_accumulation'
  | 'war_loot_reserve'
  | 'legend_forge'
  | 'deep_purify'
  | 'foresight_eye'

export interface IntermissionChoiceDef {
  id: IntermissionChoiceId
  name: string
  description: string
}

const ACT1_TO_2_CHOICES: IntermissionChoiceDef[] = [
  {
    id: 'elite_armament',
    name: '精锐武装',
    description: '升级当前武器为精钢版',
  },
  {
    id: 'knowledge_accumulation',
    name: '知识积累',
    description: '从稀有卡中随机获得1张，并移除1张牌',
  },
  {
    id: 'war_loot_reserve',
    name: '战利储备',
    description: '+40金币并回复至满血',
  },
]

const ACT2_TO_3_CHOICES: IntermissionChoiceDef[] = [
  {
    id: 'legend_forge',
    name: '传说锻造',
    description: '满足材料则升级为传说武器，否则永久+3力量',
  },
  {
    id: 'deep_purify',
    name: '深度净化',
    description: '移除最多3张卡并回复至满血',
  },
  {
    id: 'foresight_eye',
    name: '远见之眼',
    description: '获得1张随机epic并+50金币',
  },
]

const LEGEND_UPGRADE_MAP: Record<string, string> = {
  iron_longsword: 'legend_kings_blade',
  steel_longsword: 'legend_kings_blade',
  iron_staff: 'legend_prismatic_scepter',
  steel_staff: 'legend_prismatic_scepter',
  iron_dagger: 'legend_shadow_daggers',
  steel_dagger: 'legend_shadow_daggers',
  iron_hammer: 'legend_doom_hammer',
  steel_hammer: 'legend_doom_hammer',
}

function randomRareCardId(rng: () => number): string | null {
  const rares = ALL_CARDS.filter((card) => card.rarity === 'rare')
  if (rares.length === 0) return null
  return rares[Math.floor(rng() * rares.length)]?.id ?? null
}

function randomEpicCardId(rng: () => number): string | null {
  const epics = ALL_CARDS.filter((card) => card.rarity === 'epic')
  if (epics.length === 0) return null
  return epics[Math.floor(rng() * epics.length)]?.id ?? null
}

function removeRandomCards(state: RunState, count: number, rng: () => number): RunState {
  const deck = [...state.deck]
  for (let i = 0; i < count; i++) {
    if (deck.length <= 1) break
    const idx = Math.floor(rng() * deck.length)
    deck.splice(idx, 1)
  }
  return { ...state, deck }
}

function addCardToRunDeck(state: RunState, cardId: string, rng: () => number): RunState {
  return {
    ...state,
    deck: [...state.deck, { uid: `intermission_${Date.now()}_${rng()}`, defId: cardId }],
  }
}

function buildRewardNotice(parts: string[]): string | undefined {
  if (parts.length === 0) return undefined
  const prefix = parts[0]?.includes('卡【') ? '已获得' : '已获得 '
  if (parts.length === 1) {
    const [single] = parts
    if (!single) return undefined
    if (single.startsWith('恢复')) return `已${single}`
    return `${prefix}${single}`
  }
  return `${prefix}${parts.join('、')}`
}

function getCardRarityLabel(cardId: string): string {
  const rarity = getCardDef(cardId).rarity
  if (rarity === 'legendary') return '传奇'
  if (rarity === 'epic') return '史诗'
  if (rarity === 'rare') return '稀有'
  return '普通'
}

function getAddedCardIds(previousRun: RunState, nextRun: RunState): string[] {
  const previousCardUids = new Set(previousRun.deck.map((card) => card.uid))
  return nextRun.deck
    .filter((card) => !previousCardUids.has(card.uid))
    .map((card) => card.defId)
}

export function getIntermissionChoices(act: 1 | 2 | 3): IntermissionChoiceDef[] {
  if (act === 1) return ACT1_TO_2_CHOICES
  if (act === 2) return ACT2_TO_3_CHOICES
  return []
}

export function applyIntermissionChoice(
  state: RunState,
  choiceId: IntermissionChoiceId,
  rng: () => number = random,
): RunState {
  if (choiceId === 'elite_armament') {
    return upgradeEquippedWeapon(state)
  }

  if (choiceId === 'knowledge_accumulation') {
    const rare = randomRareCardId(rng)
    const withCard = rare ? addCardToRunDeck(state, rare, rng) : state
    return removeRandomCards(withCard, 1, rng)
  }

  if (choiceId === 'war_loot_reserve') {
    return {
      ...state,
      gold: state.gold + 40,
      playerHp: state.playerMaxHp,
    }
  }

  if (choiceId === 'legend_forge') {
    const canForgeLegend = state.materials.goblin_crown_fragment >= 1 && state.materials.steel_ingot >= 2
    if (!state.equippedWeapon || !canForgeLegend) {
      return { ...state, bonusStrength: state.bonusStrength + 3 }
    }
    const nextDefId = LEGEND_UPGRADE_MAP[state.equippedWeapon.defId]
    if (!nextDefId) {
      return { ...state, bonusStrength: state.bonusStrength + 3 }
    }
    const upgraded = { ...state.equippedWeapon, defId: nextDefId }
    return {
      ...state,
      equippedWeapon: upgraded,
      weaponInventory: state.weaponInventory.map((weapon) =>
        weapon.uid === upgraded.uid ? upgraded : weapon,
      ),
      materials: {
        ...state.materials,
        goblin_crown_fragment: Math.max(0, state.materials.goblin_crown_fragment - 1),
        steel_ingot: Math.max(0, state.materials.steel_ingot - 2),
      },
    }
  }

  if (choiceId === 'deep_purify') {
    const purged = removeRandomCards(state, 3, rng)
    return { ...purged, playerHp: purged.playerMaxHp }
  }

  if (choiceId === 'foresight_eye') {
    const epic = randomEpicCardId(rng)
    const withEpic = epic ? addCardToRunDeck(state, epic, rng) : state
    return {
      ...withEpic,
      gold: withEpic.gold + 50,
    }
  }

  return state
}

export function buildIntermissionRewardNotice(
  previousRun: RunState,
  nextRun: RunState,
  choiceId: IntermissionChoiceId,
): string | undefined {
  const parts: string[] = []
  const addedCards = getAddedCardIds(previousRun, nextRun)
  const goldGain = nextRun.gold - previousRun.gold
  const strengthGain = nextRun.bonusStrength - previousRun.bonusStrength
  const healedToFull = nextRun.playerHp === nextRun.playerMaxHp && nextRun.playerHp > previousRun.playerHp
  const weaponChanged = previousRun.equippedWeapon?.defId !== nextRun.equippedWeapon?.defId

  if (addedCards.length === 1) {
    const cardId = addedCards[0]
    parts.push(`${getCardRarityLabel(cardId)}卡【${getCardDef(cardId).name}】`)
  } else if (addedCards.length > 1) {
    parts.push(`${addedCards.length} 张卡牌`)
  }

  if (weaponChanged && nextRun.equippedWeapon) {
    const weaponName = getWeaponDef(nextRun.equippedWeapon.defId).name
    parts.push(`${choiceId === 'legend_forge' ? '传奇武器' : '武器'}【${weaponName}】`)
  }

  if (goldGain > 0) {
    parts.push(`${goldGain} 金币`)
  }

  if (strengthGain > 0) {
    parts.push(`+${strengthGain} 力量`)
  }

  if (healedToFull) {
    parts.push('恢复至满血')
  }

  return buildRewardNotice(parts)
}

export function advanceToNextAct(state: RunState, rng: () => number = random): RunState {
  if (state.act >= 3) return state
  const nextAct = (state.act + 1) as 1 | 2 | 3
  const nextMap = generateMapByAct(nextAct, rng)
  return {
    ...state,
    act: nextAct,
    mapNodes: nextMap,
    currentNodeId: nextMap[0]?.id ?? state.currentNodeId,
    visitedNodes: new Set(),
    turn: 0,
  }
}
