import { describe, it, expect } from 'vitest'
import { applyCardEffects } from '../effects'
import { createBattleState, startTurn, endPlayerTurn } from '../combat'
import { ALL_CARDS } from '../cards'
import type { BattleState } from '../types'

function makeState(enemyId = 'goblin_scout'): BattleState {
  return createBattleState([enemyId])
}

describe('Checklist: 力量/智慧作用范围', () => {
  it('力量只增加战技伤害', () => {
    let s = makeState()
    s = { ...s, player: { ...s.player, strength: 4 } }
    const hp = s.enemies[0].hp
    s = applyCardEffects(s, [{ type: 'damage', value: 5 }], 0, 'combat')
    expect(s.enemies[0].hp).toBe(hp - 9) // 5+4
  })

  it('力量不影响法术伤害', () => {
    let s = makeState()
    s = { ...s, player: { ...s.player, strength: 4 } }
    const hp = s.enemies[0].hp
    s = applyCardEffects(s, [{ type: 'damage', value: 5 }], 0, 'spell')
    expect(s.enemies[0].hp).toBe(hp - 5) // no strength
  })

  it('智慧只增加法术伤害', () => {
    let s = makeState()
    s = { ...s, player: { ...s.player, wisdom: 4 } }
    const hp = s.enemies[0].hp
    s = applyCardEffects(s, [{ type: 'damage', value: 5 }], 0, 'spell')
    expect(s.enemies[0].hp).toBe(hp - 9) // 5+4
  })

  it('智慧不影响战技伤害', () => {
    let s = makeState()
    s = { ...s, player: { ...s.player, wisdom: 4 } }
    const hp = s.enemies[0].hp
    s = applyCardEffects(s, [{ type: 'damage', value: 5 }], 0, 'combat')
    expect(s.enemies[0].hp).toBe(hp - 5) // no wisdom
  })

  it('智慧不影响technique伤害', () => {
    let s = makeState()
    s = { ...s, player: { ...s.player, wisdom: 4 } }
    const hp = s.enemies[0].hp
    s = applyCardEffects(s, [{ type: 'damage', value: 5 }], 0, 'technique')
    expect(s.enemies[0].hp).toBe(hp - 5)
  })
})

describe('Checklist: 淬毒触发范围', () => {
  it('淬毒在战技命中时触发', () => {
    let s = makeState()
    s = { ...s, player: { ...s.player, poisonOnAttack: 3 } }
    s = applyCardEffects(s, [{ type: 'damage', value: 5 }], 0, 'combat')
    expect(s.enemies[0].poison).toBe(3)
  })

  it('淬毒在法术命中时不触发', () => {
    let s = makeState()
    s = { ...s, player: { ...s.player, poisonOnAttack: 3 } }
    s = applyCardEffects(s, [{ type: 'damage', value: 5 }], 0, 'spell')
    expect(s.enemies[0].poison).toBe(0)
  })

  it('淬毒在technique命中时不触发', () => {
    let s = makeState()
    s = { ...s, player: { ...s.player, poisonOnAttack: 3 } }
    s = applyCardEffects(s, [{ type: 'damage', value: 5 }], 0, 'technique')
    expect(s.enemies[0].poison).toBe(0)
  })
})

describe('Checklist: 虚弱/易伤不影响DOT', () => {
  it('虚弱不影响灼烧结算伤害', () => {
    let s = makeState()
    s = startTurn(s)
    // Enemy has burn=6, player has weakened=2
    s = {
      ...s,
      player: { ...s.player, weakened: 2 },
      enemies: s.enemies.map(e => ({ ...e, burn: 6 })),
    }
    const hpBefore = s.enemies[0].hp
    s = endPlayerTurn(s)
    // Burn should deal exactly 6 damage (not reduced by player weakened)
    // After endPlayerTurn → startTurn, enemy hp should be hpBefore - 6
    // (burn settles at end of turn, before startTurn)
    expect(s.enemies[0].hp).toBe(hpBefore - 6)
  })

  it('虚弱不影响中毒结算伤害', () => {
    let s = makeState()
    s = startTurn(s)
    s = {
      ...s,
      player: { ...s.player, weakened: 2 },
      enemies: s.enemies.map(e => ({ ...e, poison: 4 })),
    }
    const hpBefore = s.enemies[0].hp
    s = endPlayerTurn(s)
    // Poison should deal exactly 4 damage
    expect(s.enemies[0].hp).toBe(hpBefore - 4)
  })

  it('易伤不影响灼烧结算伤害', () => {
    let s = makeState()
    s = startTurn(s)
    s = {
      ...s,
      enemies: s.enemies.map(e => ({ ...e, burn: 6, vulnerable: 3 })),
    }
    const hpBefore = s.enemies[0].hp
    s = endPlayerTurn(s)
    // Burn deals exactly 6, not 9 (no vulnerable multiplier)
    expect(s.enemies[0].hp).toBe(hpBefore - 6)
  })

  it('易伤不影响中毒结算伤害', () => {
    let s = makeState()
    s = startTurn(s)
    s = {
      ...s,
      enemies: s.enemies.map(e => ({ ...e, poison: 4, vulnerable: 3 })),
    }
    const hpBefore = s.enemies[0].hp
    s = endPlayerTurn(s)
    // Poison deals exactly 4, not 6
    expect(s.enemies[0].hp).toBe(hpBefore - 4)
  })
})

describe('Checklist: 冻结免疫', () => {
  it('冻结解除后有1回合免疫期', () => {
    let s = makeState()
    s = startTurn(s)
    s = { ...s, enemies: s.enemies.map(e => ({ ...e, freeze: 1 })) }
    s = endPlayerTurn(s)
    // After frozen enemy skips, freezeImmune should be true
    expect(s.enemies[0].freezeImmune).toBe(true)
    expect(s.enemies[0].freeze).toBe(0)
  })

  it('免疫期间不能再冻', () => {
    let s = makeState()
    s = { ...s, enemies: s.enemies.map(e => ({ ...e, freezeImmune: true })) }
    s = applyCardEffects(s, [{ type: 'freeze', value: 1 }], 0)
    expect(s.enemies[0].freeze).toBe(0)
  })

  it('免疫期在敌人正常行动后清除', () => {
    let s = makeState()
    s = startTurn(s)
    s = { ...s, enemies: s.enemies.map(e => ({ ...e, freezeImmune: true })) }
    s = endPlayerTurn(s)
    // Enemy acted normally → freezeImmune cleared
    expect(s.enemies[0].freezeImmune).toBe(false)
  })
})

describe('Checklist: 新卡牌效果', () => {
  it('冥思卡正确给予智慧', () => {
    let s = makeState()
    s = applyCardEffects(s, [{ type: 'gain_wisdom', value: 2 }], 0)
    expect(s.player.wisdom).toBe(2)
    // Stacks
    s = applyCardEffects(s, [{ type: 'gain_wisdom', value: 3 }], 0)
    expect(s.player.wisdom).toBe(5)
  })

  it('铁壁卡附带屏障效果', () => {
    let s = makeState()
    s = applyCardEffects(s, [{ type: 'armor', value: 12 }, { type: 'gain_barrier', value: 2 }], 0)
    expect(s.player.armor).toBe(12)
    expect(s.player.barrier).toBe(2)
  })

  it('坚守卡给予护甲+屏障', () => {
    let s = makeState()
    s = applyCardEffects(s, [{ type: 'armor', value: 8 }, { type: 'gain_barrier', value: 3 }], 0)
    expect(s.player.armor).toBe(8)
    expect(s.player.barrier).toBe(3)
  })

  it('屏障让护甲回合开始时保留最多N点', () => {
    let s = makeState()
    s = { ...s, player: { ...s.player, armor: 10, barrier: 4 } }
    s = startTurn(s)
    expect(s.player.armor).toBe(4)
  })

  it('屏障为0时护甲正常清零', () => {
    let s = makeState()
    s = { ...s, player: { ...s.player, armor: 10, barrier: 0 } }
    s = startTurn(s)
    expect(s.player.armor).toBe(0)
  })

  it('聚能卡正确给予蓄能', () => {
    let s = makeState()
    s = applyCardEffects(s, [{ type: 'gain_charge', value: 3 }], 0)
    expect(s.player.charge).toBe(3)
  })
})

describe('Checklist: 蓄能结算', () => {
  it('蓄能在法术造成伤害时消耗加成', () => {
    let s = makeState()
    s = { ...s, player: { ...s.player, charge: 3 } }
    const hp = s.enemies[0].hp
    // 10 base, charge 3 => floor(10 * 1.3) = 13
    s = applyCardEffects(s, [{ type: 'damage', value: 10 }], 0, 'spell')
    expect(s.enemies[0].hp).toBe(hp - 13)
    expect(s.player.charge).toBe(0)
  })

  it('不造成伤害的法术不消耗蓄能', () => {
    let s = makeState()
    s = { ...s, player: { ...s.player, charge: 3 } }
    // gain_charge is a non-damage spell effect
    s = applyCardEffects(s, [{ type: 'gain_charge', value: 2 }], 0, 'spell')
    expect(s.player.charge).toBe(5) // 3 + 2, not consumed
  })

  it('蓄能不影响战技伤害', () => {
    let s = makeState()
    s = { ...s, player: { ...s.player, charge: 3 } }
    const hp = s.enemies[0].hp
    s = applyCardEffects(s, [{ type: 'damage', value: 10 }], 0, 'combat')
    expect(s.enemies[0].hp).toBe(hp - 10) // no charge bonus
    expect(s.player.charge).toBe(3) // not consumed
  })
})

describe('Checklist: 卡牌存在性', () => {
  it('冥思卡存在于卡池', () => {
    const card = ALL_CARDS.find(c => c.id === 'deep_thought')
    expect(card).toBeDefined()
    expect(card!.name).toBe('冥思')
    expect(card!.effects[0].type).toBe('gain_wisdom')
  })

  it('聚能卡存在于卡池', () => {
    const card = ALL_CARDS.find(c => c.id === 'focus_energy')
    expect(card).toBeDefined()
    expect(card!.name).toBe('聚能')
    expect(card!.effects[0].type).toBe('gain_charge')
  })

  it('永恒之盾存在于卡池', () => {
    const card = ALL_CARDS.find(c => c.id === 'eternal_shield')
    expect(card).toBeDefined()
    expect(card!.name).toBe('永恒之盾')
    expect(card!.effects).toEqual([
      { type: 'armor', value: 20 },
      { type: 'gain_barrier', value: 5 },
      { type: 'set_damage_taken_multiplier', value: 0.5 },
    ])
  })

  it('铁壁卡包含屏障效果', () => {
    const card = ALL_CARDS.find(c => c.id === 'iron_wall')
    expect(card!.effects).toEqual([
      { type: 'armor', value: 12 },
      { type: 'gain_barrier', value: 2 },
    ])
  })
})
