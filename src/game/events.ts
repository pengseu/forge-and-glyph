import { ALL_CARDS } from './cards'
import { addMaterialReward } from './run'
import { resolveLegacyWeaponChoice } from './meta'
import type { EventDef, EventOptionId, MaterialId, RunState } from './types'

const ACT1_EVENTS: Array<{ def: EventDef; weight: number }> = [
  {
    weight: 3,
    def: {
      id: 'traveler',
      title: '旅行者',
      description: '旅行者向你伸出援手。',
      options: [
        { id: 'traveler_gold', label: '接受金币', description: '获得25金币' },
        { id: 'traveler_iron', label: '接受铁锭', description: '获得铁锭x2' },
        { id: 'traveler_essence', label: '接受精华', description: '获得元素精华x1' },
        { id: 'traveler_heal', label: '接受治疗', description: '回复12HP' },
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
        { id: 'camp_rest', label: '休息', description: '回复8HP' },
        { id: 'leave', label: '离开', description: '不做任何事' },
      ],
    },
  },
  {
    weight: 2,
    def: {
      id: 'mysterious_merchant',
      title: '神秘商人',
      description: '商人提出交易：支付生命，换取强力卡牌。',
      options: [
        { id: 'trade_hp_for_rare', label: '交易', description: '失去8HP，获得随机rare卡' },
        { id: 'leave', label: '离开', description: '不做任何事' },
      ],
    },
  },
  {
    weight: 2,
    def: {
      id: 'forge_spirit',
      title: '锻造之灵',
      description: '锻造之灵愿意强化你的一张牌。',
      options: [
        { id: 'upgrade_random_card', label: '升级一张卡', description: '随机升级一张未升级卡牌' },
        { id: 'remove_random_card', label: '移除一张卡', description: '随机移除一张卡牌' },
        { id: 'leave', label: '离开', description: '不做任何事' },
      ],
    },
  },
]

const ACT2_EVENTS: Array<{ def: EventDef; weight: number }> = [
  {
    weight: 3,
    def: {
      id: 'cursed_chest',
      title: '被诅咒的宝箱',
      description: '宝箱散发不祥气息。',
      options: [
        { id: 'cursed_open', label: '开启', description: '获得随机epic并加入3张诅咒' },
        { id: 'cursed_leave', label: '离开', description: '谨慎离去' },
      ],
    },
  },
  {
    weight: 3,
    def: {
      id: 'wandering_smith',
      title: '流浪铁匠',
      description: '铁匠愿意无偿帮你一次。',
      options: [
        { id: 'smith_upgrade', label: '免费升级', description: '随机升级1张卡' },
        { id: 'smith_steel', label: '领取精钢', description: '获得精钢锭x1' },
      ],
    },
  },
  {
    weight: 2,
    def: {
      id: 'shadow_altar',
      title: '暗影祭坛',
      description: '祭坛要求献祭。',
      options: [
        { id: 'altar_blood', label: '献血', description: '-12HP，移除2张basic' },
        { id: 'altar_gold', label: '献金', description: '-60金，回满HP并净化诅咒' },
        { id: 'altar_leave', label: '离开', description: '不作选择' },
      ],
    },
  },
  {
    weight: 2,
    def: {
      id: 'injured_traveler',
      title: '受伤的旅者',
      description: '他请求你的帮助。',
      options: [
        { id: 'traveler_help', label: '给药', description: '消耗铁锭x1，获得25金+随机精华x1' },
        { id: 'traveler_rob', label: '抢劫', description: '+40金，但下场敌人+1力量' },
        { id: 'traveler_ignore', label: '无视', description: '什么都不发生' },
      ],
    },
  },
  {
    weight: 1,
    def: {
      id: 'ancient_library',
      title: '古老图书馆',
      description: '尘封书页中藏着战斗知识。',
      options: [
        { id: 'library_take_two', label: '阅读', description: '从5张卡中获得2张（保底1张rare）' },
      ],
    },
  },
]

const ACT3_EVENTS: Array<{ def: EventDef; weight: number }> = [
  {
    weight: 3,
    def: {
      id: 'abyss_rift',
      title: '深渊裂隙',
      description: '裂隙低语着禁忌知识。',
      options: [
        { id: 'rift_gaze', label: '凝视', description: '获得1张legendary并加入2张诅咒' },
        { id: 'rift_avoid', label: '回避', description: '回复20HP' },
      ],
    },
  },
  {
    weight: 3,
    def: {
      id: 'ancient_guardian',
      title: '远古守卫',
      description: '守卫挡住了你的去路。',
      options: [
        { id: 'guardian_challenge', label: '挑战', description: '触发战斗，获得守护精华x2和1张epic' },
        { id: 'guardian_escape', label: '逃跑', description: '避开风险' },
      ],
    },
  },
  {
    weight: 2,
    def: {
      id: 'destiny_pool',
      title: '命运之池',
      description: '池水能改写卡牌命运。',
      options: [
        { id: 'pool_sacrifice', label: '献祭', description: '献祭1张卡，获得高一级随机卡' },
        { id: 'pool_drink', label: '饮用', description: '回满HP，但随机1张卡降级' },
      ],
    },
  },
  {
    weight: 2,
    def: {
      id: 'last_caravan',
      title: '最后的商队',
      description: '终幕前最后的交易机会。',
      options: [
        { id: 'caravan_sell_materials', label: '卖材料', description: '每个材料按40金币出售' },
        { id: 'caravan_buy_steel_bundle', label: '买精钢', description: '60金币购买精钢x2' },
        { id: 'caravan_buy_essence_bundle', label: '买精华', description: '50金币购买随机精华x2' },
      ],
    },
  },
]

function pickOne<T>(list: T[], rng: () => number): T {
  return list[Math.floor(rng() * list.length)]
}

function pickRandomCardIdByRarity(rarity: 'common' | 'rare' | 'epic' | 'legendary', rng: () => number): string | null {
  const pool = ALL_CARDS.filter(card => card.rarity === rarity)
  if (pool.length === 0) return null
  return pickOne(pool, rng).id
}

function randomEssenceId(rng: () => number): MaterialId {
  const essences: MaterialId[] = ['elemental_essence', 'war_essence', 'guard_essence']
  return pickOne(essences, rng)
}

function weightedRoll(pool: Array<{ def: EventDef; weight: number }>, rng: () => number): EventDef {
  const total = pool.reduce((sum, item) => sum + item.weight, 0)
  let roll = rng() * total
  for (const item of pool) {
    roll -= item.weight
    if (roll <= 0) return item.def
  }
  return pool[0].def
}

function addCard(run: RunState, cardId: string, rng: () => number): RunState {
  return {
    ...run,
    deck: [...run.deck, { uid: `event_${Date.now()}_${rng()}`, defId: cardId }],
  }
}

function removeRandomCard(run: RunState, rng: () => number): RunState {
  if (run.deck.length <= 1) return run
  const idx = Math.floor(rng() * run.deck.length)
  return {
    ...run,
    deck: run.deck.filter((_, i) => i !== idx),
  }
}

function removeRandomCardsByFilter(run: RunState, count: number, predicate: (defId: string) => boolean, rng: () => number): RunState {
  const candidates = run.deck
    .map((card, index) => ({ card, index }))
    .filter(({ card }) => predicate(card.defId))
  if (candidates.length === 0) return run

  const selected = new Set<number>()
  const maxTake = Math.min(count, candidates.length)
  while (selected.size < maxTake) {
    const pick = candidates[Math.floor(rng() * candidates.length)]
    selected.add(pick.index)
  }

  return {
    ...run,
    deck: run.deck.filter((_, idx) => !selected.has(idx)),
  }
}

function purgeCurseCards(run: RunState): RunState {
  return {
    ...run,
    deck: run.deck.filter(card => !card.defId.startsWith('curse_')),
  }
}

function upgradeRandomCard(run: RunState, rng: () => number): RunState {
  const candidates = run.deck
    .map((card, index) => ({ card, index }))
    .filter(({ card }) => !card.upgraded)
  if (candidates.length === 0) return run
  const pick = candidates[Math.floor(rng() * candidates.length)]
  return {
    ...run,
    deck: run.deck.map((card, index) => (index === pick.index ? { ...card, upgraded: true } : card)),
  }
}

function upgradeRandomCards(run: RunState, count: number, rng: () => number): RunState {
  let next = run
  for (let i = 0; i < count; i++) {
    const updated = upgradeRandomCard(next, rng)
    if (updated === next) break
    next = updated
  }
  return next
}

function downgradeRandomCard(run: RunState, rng: () => number): RunState {
  if (run.deck.length === 0) return run
  const idx = Math.floor(rng() * run.deck.length)
  const target = run.deck[idx]
  if (!target) return run
  const cardDef = ALL_CARDS.find(card => card.id === target.defId)
  if (!cardDef) return run
  const order: Array<typeof cardDef.rarity> = ['common', 'rare', 'epic', 'legendary']
  const cur = order.indexOf(cardDef.rarity)
  if (cur <= 0) return run
  const lowerPool = ALL_CARDS.filter(card => card.rarity === order[cur - 1])
  if (lowerPool.length === 0) return run
  const replacement = pickOne(lowerPool, rng)
  return {
    ...run,
    deck: run.deck.map((card, i) => (i === idx ? { ...card, defId: replacement.id, upgraded: false } : card)),
  }
}

function upgradeOneRarityFromRandomCard(run: RunState, rng: () => number): RunState {
  if (run.deck.length === 0) return run
  const idx = Math.floor(rng() * run.deck.length)
  const target = run.deck[idx]
  if (!target) return run
  const cardDef = ALL_CARDS.find(card => card.id === target.defId)
  if (!cardDef) return run
  const order: Array<typeof cardDef.rarity> = ['common', 'rare', 'epic', 'legendary']
  const cur = order.indexOf(cardDef.rarity)
  if (cur < 0 || cur >= order.length - 1) return run
  const higherPool = ALL_CARDS.filter(card => card.rarity === order[cur + 1])
  if (higherPool.length === 0) return run
  const replacement = pickOne(higherPool, rng)
  return {
    ...run,
    deck: run.deck.map((card, i) => (i === idx ? { ...card, defId: replacement.id, upgraded: false } : card)),
  }
}

export interface EventResolution {
  run: RunState
  triggerBattleEnemyIds?: string[]
}

export function createTempleEvent(): EventDef {
  return {
    id: 'sanctum_choice',
    title: '圣殿抉择',
    description: '终极抉择，四选一，不可跳过。',
    options: [
      { id: 'sanctum_sacrifice', label: '牺牲之路', description: '最大HP-15，全卡组升级' },
      { id: 'sanctum_warrior', label: '战士之路', description: '移除所有法术卡，永久+4力量' },
      { id: 'sanctum_mage', label: '法师之路', description: '移除所有战技卡(保留挥砍x1)，永久+4智慧，每回合+1魔力' },
      { id: 'sanctum_balance', label: '平衡之路', description: '升级3张卡+回满HP+移除1张卡' },
    ],
  }
}

export function createTrialChoiceEvent(): EventDef {
  return {
    id: 'trial_choice',
    title: '试炼选择',
    description: '进入试炼前，选择一种全局修改器。',
    options: [
      { id: 'trial_flame', label: '烈焰试炼', description: '所有角色每回合获得1层灼烧；胜利：元素精华x2' },
      { id: 'trial_speed', label: '速度试炼', description: '限时5回合；胜利：从3张epic中选1' },
      { id: 'trial_endure', label: '耐久试炼', description: '敌方HPx2、伤害x0.5；胜利：回满HP+守护精华x1' },
    ],
  }
}

export function rollEventByAct(act: 1 | 2 | 3, rng: () => number = Math.random): EventDef {
  if (act === 1) return weightedRoll(ACT1_EVENTS, rng)
  if (act === 2) return weightedRoll(ACT2_EVENTS, rng)
  return weightedRoll(ACT3_EVENTS, rng)
}

export function rollEvent(rng: () => number = Math.random): EventDef {
  return rollEventByAct(1, rng)
}

export function resolveEventOption(
  run: RunState,
  event: EventDef,
  optionId: EventOptionId,
  rng: () => number = Math.random,
): EventResolution {
  if (optionId === 'leave' || optionId === 'cursed_leave' || optionId === 'traveler_ignore' || optionId === 'guardian_escape' || optionId === 'altar_leave') {
    return { run }
  }

  if (event.id === 'mysterious_merchant' && optionId === 'trade_hp_for_rare') {
    const rare = pickRandomCardIdByRarity('rare', rng)
    if (!rare) return { run }
    return {
      run: addCard({ ...run, playerHp: Math.max(1, run.playerHp - 8) }, rare, rng),
    }
  }

  if (event.id === 'abandoned_camp' && optionId === 'search_camp') {
    if (rng() < 0.5) {
      return { run: addMaterialReward(run, { iron_ingot: 2 }) }
    }
    return { run, triggerBattleEnemyIds: ['goblin_scout', 'mushroom_creature'] }
  }

  if (event.id === 'abandoned_camp' && optionId === 'camp_rest') {
    return {
      run: {
        ...run,
        playerHp: Math.min(run.playerMaxHp, run.playerHp + 8),
      },
    }
  }

  if (event.id === 'traveler') {
    if (optionId === 'traveler_gold') return { run: { ...run, gold: run.gold + 25 } }
    if (optionId === 'traveler_iron') return { run: addMaterialReward(run, { iron_ingot: 2 }) }
    if (optionId === 'traveler_essence') return { run: addMaterialReward(run, { elemental_essence: 1 }) }
    if (optionId === 'traveler_heal') {
      return { run: { ...run, playerHp: Math.min(run.playerMaxHp, run.playerHp + 12) } }
    }
  }

  if (event.id === 'forge_spirit' && optionId === 'upgrade_random_card') {
    return { run: upgradeRandomCard(run, rng) }
  }
  if (event.id === 'forge_spirit' && optionId === 'remove_random_card') {
    return { run: removeRandomCard(run, rng) }
  }

  if (event.id === 'cursed_chest' && optionId === 'cursed_open') {
    const epic = pickRandomCardIdByRarity('epic', rng)
    let next = run
    if (epic) {
      next = addCard(next, epic, rng)
    }
    next = addCard(next, 'curse_doubt', rng)
    next = addCard(next, 'curse_doubt', rng)
    next = addCard(next, 'curse_doubt', rng)
    return { run: next }
  }

  if (event.id === 'wandering_smith') {
    if (optionId === 'smith_upgrade') return { run: upgradeRandomCard(run, rng) }
    if (optionId === 'smith_steel') return { run: addMaterialReward(run, { steel_ingot: 1 }) }
  }

  if (event.id === 'shadow_altar') {
    if (optionId === 'altar_blood') {
      const afterHp = { ...run, playerHp: Math.max(1, run.playerHp - 12) }
      const noBasic = removeRandomCardsByFilter(afterHp, 2, (defId) => {
        const def = ALL_CARDS.find(card => card.id === defId)
        return def?.rarity === 'basic'
      }, rng)
      return { run: noBasic }
    }
    if (optionId === 'altar_gold') {
      if (run.gold < 60) return { run }
      const paid = { ...run, gold: run.gold - 60, playerHp: run.playerMaxHp }
      return { run: purgeCurseCards(paid) }
    }
  }

  if (event.id === 'injured_traveler') {
    if (optionId === 'traveler_help') {
      if (run.materials.iron_ingot < 1) return { run }
      const essence = randomEssenceId(rng)
      return {
        run: addMaterialReward(
          {
            ...run,
            gold: run.gold + 25,
            materials: { ...run.materials, iron_ingot: run.materials.iron_ingot - 1 },
          },
          { [essence]: 1 },
        ),
      }
    }
    if (optionId === 'traveler_rob') {
      return {
        run: {
          ...run,
          gold: run.gold + 40,
          nextBattleEnemyStrengthBonus: run.nextBattleEnemyStrengthBonus + 1,
        },
      }
    }
  }

  if (event.id === 'ancient_library' && optionId === 'library_take_two') {
    const rare = pickRandomCardIdByRarity('rare', rng)
    const secondPool = ALL_CARDS.filter(card => card.rarity === 'rare' || card.rarity === 'epic' || card.rarity === 'common')
    const second = secondPool.length > 0 ? pickOne(secondPool, rng).id : null
    let next = run
    if (rare) next = addCard(next, rare, rng)
    if (second) next = addCard(next, second, rng)
    return { run: next }
  }

  if (event.id === 'abyss_rift') {
    if (optionId === 'rift_gaze') {
      const legendary = pickRandomCardIdByRarity('legendary', rng)
      let next = run
      if (legendary) next = addCard(next, legendary, rng)
      next = addCard(next, 'curse_pain', rng)
      next = addCard(next, 'curse_pain', rng)
      return { run: next }
    }
    if (optionId === 'rift_avoid') {
      return { run: { ...run, playerHp: Math.min(run.playerMaxHp, run.playerHp + 20) } }
    }
  }

  if (event.id === 'ancient_guardian' && optionId === 'guardian_challenge') {
    const epic = pickRandomCardIdByRarity('epic', rng)
    let next = addMaterialReward(run, { guard_essence: 2 })
    if (epic) next = addCard(next, epic, rng)
    return { run: next, triggerBattleEnemyIds: ['iron_golem'] }
  }

  if (event.id === 'destiny_pool') {
    if (optionId === 'pool_sacrifice') {
      const sacrificed = removeRandomCard(run, rng)
      return { run: upgradeOneRarityFromRandomCard(sacrificed, rng) }
    }
    if (optionId === 'pool_drink') {
      return { run: downgradeRandomCard({ ...run, playerHp: run.playerMaxHp }, rng) }
    }
  }

  if (event.id === 'last_caravan') {
    if (optionId === 'caravan_sell_materials') {
      let soldCount = 0
      const nextMaterials = { ...run.materials }
      ;(Object.keys(nextMaterials) as MaterialId[]).forEach((id) => {
        const amount = nextMaterials[id]
        if (amount <= 0) return
        soldCount += amount
        nextMaterials[id] = 0
      })
      return {
        run: {
          ...run,
          gold: run.gold + soldCount * 40,
          materials: nextMaterials,
        },
      }
    }
    if (optionId === 'caravan_buy_steel_bundle') {
      if (run.gold < 60) return { run }
      return { run: addMaterialReward({ ...run, gold: run.gold - 60 }, { steel_ingot: 2 }) }
    }
    if (optionId === 'caravan_buy_essence_bundle') {
      if (run.gold < 50) return { run }
      const essence = randomEssenceId(rng)
      return { run: addMaterialReward({ ...run, gold: run.gold - 50 }, { [essence]: 2 }) }
    }
  }

  if (event.id === 'sanctum_choice') {
    if (optionId === 'sanctum_sacrifice') {
      const nextMaxHp = Math.max(1, run.playerMaxHp - 15)
      return {
        run: {
          ...run,
          playerMaxHp: nextMaxHp,
          playerHp: Math.min(nextMaxHp, run.playerHp),
          deck: run.deck.map(card => ({ ...card, upgraded: true })),
        },
      }
    }
    if (optionId === 'sanctum_warrior') {
      const deck = run.deck.filter(card => {
        const def = ALL_CARDS.find(c => c.id === card.defId)
        return def?.category !== 'spell'
      })
      return {
        run: {
          ...run,
          deck,
          bonusStrength: run.bonusStrength + 4,
        },
      }
    }
    if (optionId === 'sanctum_mage') {
      let slashKept = false
      const deck = run.deck.filter(card => {
        const def = ALL_CARDS.find(c => c.id === card.defId)
        if (!def) return true
        if (def.category !== 'combat') return true
        if (def.id === 'slash' && !slashKept) {
          slashKept = true
          return true
        }
        return false
      })
      return {
        run: {
          ...run,
          deck,
          bonusWisdom: run.bonusWisdom + 4,
          bonusMaxMana: run.bonusMaxMana + 1,
        },
      }
    }
    if (optionId === 'sanctum_balance') {
      const upgraded = upgradeRandomCards(run, 3, rng)
      const purged = removeRandomCard(upgraded, rng)
      return {
        run: {
          ...purged,
          playerHp: purged.playerMaxHp,
        },
      }
    }
  }

  if (event.id === 'legacy_echo') {
    if (optionId === 'legacy_equip' || optionId === 'legacy_salvage') {
      return { run: resolveLegacyWeaponChoice(run, optionId) }
    }
  }

  return { run }
}
