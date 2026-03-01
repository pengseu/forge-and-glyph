import { ALL_CARDS } from './cards'
import { addMaterialReward } from './run'
import type { EventDef, EventOptionId, RunState } from './types'

const EVENT_POOL: Array<{ def: EventDef; weight: number }> = [
  {
    weight: 3,
    def: {
      id: 'mysterious_merchant',
      title: '神秘商人',
      description: '商人提出交易：支付生命，换取强力卡牌。',
      options: [
        { id: 'trade_hp_for_rare', label: '交易', description: '失去10HP，获得随机rare卡' },
        { id: 'leave', label: '离开', description: '不做任何事' },
      ],
    },
  },
  {
    weight: 3,
    def: {
      id: 'abandoned_camp',
      title: '废弃营地',
      description: '你发现一处废弃营地。',
      options: [
        { id: 'search_camp', label: '搜索', description: '50%获得铁锭x2，50%触发战斗' },
        { id: 'leave', label: '离开', description: '不做任何事' },
      ],
    },
  },
  {
    weight: 2,
    def: {
      id: 'altar',
      title: '祭坛',
      description: '古老祭坛发出微光。',
      options: [
        { id: 'altar_blood', label: '献血', description: '失去15%最大HP，获得随机epic卡' },
        { id: 'altar_gold', label: '献金', description: '失去50金币，回复至满血' },
        { id: 'leave', label: '离开', description: '不做任何事' },
      ],
    },
  },
  {
    weight: 2,
    def: {
      id: 'traveler',
      title: '旅行者',
      description: '旅行者向你伸出援手。',
      options: [
        { id: 'take_traveler_gift', label: '接受赠礼', description: '随机获得金币/材料/治疗' },
        { id: 'leave', label: '离开', description: '不做任何事' },
      ],
    },
  },
  {
    weight: 1,
    def: {
      id: 'forge_spirit',
      title: '锻造之灵',
      description: '锻造之灵愿意强化你的一张牌。',
      options: [
        { id: 'upgrade_random_card', label: '接受强化', description: '随机升级一张未升级卡牌' },
        { id: 'leave', label: '离开', description: '不做任何事' },
      ],
    },
  },
]

export interface EventResolution {
  run: RunState
  triggerBattleEnemyIds?: string[]
}

function pickRandomCardIdByRarity(rarity: 'rare' | 'epic', rng: () => number): string {
  const pool = ALL_CARDS.filter(c => c.rarity === rarity)
  const idx = Math.floor(rng() * pool.length)
  return pool[Math.max(0, Math.min(pool.length - 1, idx))].id
}

export function rollEvent(rng: () => number = Math.random): EventDef {
  const total = EVENT_POOL.reduce((sum, item) => sum + item.weight, 0)
  let roll = rng() * total
  for (const item of EVENT_POOL) {
    roll -= item.weight
    if (roll <= 0) return item.def
  }
  return EVENT_POOL[0].def
}

export function resolveEventOption(
  run: RunState,
  event: EventDef,
  optionId: EventOptionId,
  rng: () => number = Math.random,
): EventResolution {
  if (optionId === 'leave') {
    return { run }
  }

  if (event.id === 'mysterious_merchant' && optionId === 'trade_hp_for_rare') {
    const hp = Math.max(1, run.playerHp - 10)
    const cardId = pickRandomCardIdByRarity('rare', rng)
    return {
      run: {
        ...run,
        playerHp: hp,
        deck: [...run.deck, { uid: `event_${Date.now()}_${rng()}`, defId: cardId }],
      },
    }
  }

  if (event.id === 'abandoned_camp' && optionId === 'search_camp') {
    if (rng() < 0.5) {
      return { run: addMaterialReward(run, { iron_ingot: 2 }) }
    }
    return { run, triggerBattleEnemyIds: ['goblin_scout', 'mushroom_creature'] }
  }

  if (event.id === 'altar' && optionId === 'altar_blood') {
    const hpLoss = Math.max(1, Math.floor(run.playerMaxHp * 0.15))
    const cardId = pickRandomCardIdByRarity('epic', rng)
    return {
      run: {
        ...run,
        playerHp: Math.max(1, run.playerHp - hpLoss),
        deck: [...run.deck, { uid: `event_${Date.now()}_${rng()}`, defId: cardId }],
      },
    }
  }

  if (event.id === 'altar' && optionId === 'altar_gold') {
    if (run.gold < 50) return { run }
    return {
      run: {
        ...run,
        gold: run.gold - 50,
        playerHp: run.playerMaxHp,
      },
    }
  }

  if (event.id === 'traveler' && optionId === 'take_traveler_gift') {
    const roll = rng()
    if (roll < 0.25) {
      return { run: { ...run, gold: run.gold + 30 } }
    }
    if (roll < 0.5) {
      return { run: addMaterialReward(run, { iron_ingot: 2 }) }
    }
    if (roll < 0.75) {
      return { run: addMaterialReward(run, { elemental_essence: 1 }) }
    }
    return { run: { ...run, playerHp: Math.min(run.playerMaxHp, run.playerHp + 15) } }
  }

  if (event.id === 'forge_spirit' && optionId === 'upgrade_random_card') {
    const candidates = run.deck
      .map((card, index) => ({ card, index }))
      .filter(({ card }) => !card.upgraded)
    if (candidates.length === 0) return { run }

    const pick = candidates[Math.floor(rng() * candidates.length)]
    return {
      run: {
        ...run,
        deck: run.deck.map((card, index) => (index === pick.index ? { ...card, upgraded: true } : card)),
      },
    }
  }

  return { run }
}
