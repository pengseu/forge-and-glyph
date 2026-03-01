import { describe, it, expect } from 'vitest'
import type { GameState } from '../../../game/types'
import { buildResultLogText, resolveResultTurns } from '../result'

describe('result summary helpers', () => {
  it('falls back to stats.turns when run report is unavailable', () => {
    const stats: GameState['stats'] = {
      turns: 2,
      remainingHp: 0,
      runReport: null,
      finalSnapshot: null,
    }
    expect(resolveResultTurns(stats)).toBe(2)
  })

  it('uses sum of battle turns when run report exists', () => {
    const stats: GameState['stats'] = {
      turns: 2,
      remainingHp: 0,
      finalSnapshot: null,
      runReport: {
        startedAt: 1,
        path: [],
        logs: [],
        battles: [
          { nodeId: 'a', nodeType: 'normal_battle', enemyIds: ['goblin_scout'], startedAt: 1, turns: 3, logs: [] },
          { nodeId: 'b', nodeType: 'normal_battle', enemyIds: ['goblin_scout'], startedAt: 2, turns: 4, logs: [] },
          { nodeId: 'c', nodeType: 'elite_battle', enemyIds: ['shadow_assassin'], startedAt: 3, turns: 2, logs: [] },
        ],
      },
    }
    expect(resolveResultTurns(stats)).toBe(9)
  })

  it('builds result log text from report data', () => {
    const stats: GameState['stats'] = {
      turns: 2,
      remainingHp: 17,
      finalSnapshot: {
        gold: 88,
        playerHp: 17,
        playerMaxHp: 55,
        deckSize: 14,
        materials: {
          iron_ingot: 1,
          steel_ingot: 0,
          mythril_ingot: 0,
          meteor_iron_ingot: 0,
          elemental_essence: 2,
          war_essence: 0,
          guard_essence: 0,
          goblin_crown_fragment: 0,
          shadow_crystal: 0,
          abyss_heart: 0,
        },
        weapons: [{ defId: 'iron_longsword', enchantments: [] }],
      },
      runReport: {
        startedAt: 1,
        durationSec: 245,
        path: [
          { nodeId: 'l1_start', nodeType: 'normal_battle', at: 1 },
          { nodeId: 'l7_boss', nodeType: 'boss_battle', at: 2 },
        ],
        logs: ['14:00:00 开始新的一局冒险'],
        battles: [
          {
            nodeId: 'l1_start',
            nodeType: 'normal_battle',
            enemyIds: ['goblin_scout', 'goblin_scout'],
            startedAt: 1,
            turns: 3,
            result: 'victory',
            logs: [{ at: 1, turn: 1, actor: 'system', message: '战斗开始，玩家 HP 50/50' }],
          },
          {
            nodeId: 'l7_boss',
            nodeType: 'boss_battle',
            enemyIds: ['goblin_king'],
            startedAt: 2,
            turns: 6,
            result: 'victory',
            logs: [{ at: 2, turn: 6, actor: 'player', message: '结束回合' }],
          },
        ],
      },
    }
    const text = buildResultLogText('victory', stats)
    expect(text).toContain('回合数: 9')
    expect(text).toContain('本局时长: 245s')
    expect(text).toContain('战斗2 · boss_battle · goblin_king · victory · 6回合')
    expect(text).toContain('14:00:00 开始新的一局冒险')
  })
})
