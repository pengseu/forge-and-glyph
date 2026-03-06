import type { GameState } from './types'

export const ACT1_TUTORIAL_GUIDES: Array<{ title: string; body: string }> = [
  { title: '教程 1/5', body: '你每回合有体力与魔力两种资源，都会在回合开始刷新。' },
  { title: '教程 2/5', body: '战技消耗体力，法术消耗魔力。请优先体验两种资源的取舍。' },
  { title: '教程 3/5', body: '观察敌人意图再出牌。刀是攻击，盾是防御，箭头是增益/特殊。' },
  { title: '教程 4/5', body: '可先用格挡降低伤害，再找机会输出。活下来比贪刀更重要。' },
  { title: '教程 5/5', body: '战斗后可选卡或拿材料。构筑方向与武器/附魔联动很关键。' },
]

export function applyGuideQueue(state: GameState): GameState {
  if (state.skipTutorial || state.activeGuide) return state

  if (
    state.scene === 'battle' &&
    state.run?.act === 1 &&
    state.run.currentNodeId === 'l1_start' &&
    state.tutorialStep < ACT1_TUTORIAL_GUIDES.length
  ) {
    const step = state.tutorialStep
    const guide = ACT1_TUTORIAL_GUIDES[step]
    return { ...state, activeGuide: { id: `tutorial_act1_${step + 1}`, ...guide } }
  }

  if (state.scene === 'forge' && !state.workshopGuideSeen) {
    return {
      ...state,
      workshopGuideSeen: true,
      activeGuide: {
        id: 'tutorial_workshop_first',
        title: '工坊引导',
        body: '工坊每次只能执行一项：锻造、附魔、升级或移除。请根据当前构筑做取舍。',
      },
    }
  }

  if (!state.guideFlags.resonance && (state.run?.equippedWeapon?.enchantments.length ?? 0) >= 2) {
    return {
      ...state,
      guideFlags: { ...state.guideFlags, resonance: true },
      activeGuide: {
        id: 'hint_resonance_first',
        title: '系统提示：共鸣',
        body: '双附魔可能触发共鸣效果。请查看武器描述确认当前组合收益。',
      },
    }
  }

  if (
    !state.guideFlags.curse &&
    state.scene === 'battle' &&
    state.battle &&
    [...state.battle.player.hand, ...state.battle.player.drawPile, ...state.battle.player.discardPile]
      .some((card) => card.defId.startsWith('curse_'))
  ) {
    return {
      ...state,
      guideFlags: { ...state.guideFlags, curse: true },
      activeGuide: {
        id: 'hint_curse_first',
        title: '系统提示：诅咒牌',
        body: '诅咒会占据抽牌节奏，部分不可打出。尽快净化或缩短战斗回合数。',
      },
    }
  }

  if (
    !state.guideFlags.materialEmergency &&
    state.scene === 'battle' &&
    (state.run?.act ?? 0) >= 2 &&
    state.battle &&
    Object.values(state.battle.availableMaterials).some((count) => count > 0)
  ) {
    return {
      ...state,
      guideFlags: { ...state.guideFlags, materialEmergency: true },
      activeGuide: {
        id: 'hint_material_emergency_first',
        title: '系统提示：材料应急',
        body: '战斗中可消耗材料触发应急效果。每种材料每场战斗限用一次。',
      },
    }
  }

  if (
    !state.guideFlags.temple &&
    state.scene === 'event' &&
    state.currentEvent?.id === 'sanctum_choice'
  ) {
    return {
      ...state,
      guideFlags: { ...state.guideFlags, temple: true },
      activeGuide: {
        id: 'hint_temple_first',
        title: '系统提示：圣殿',
        body: '圣殿是终局强抉择，收益与代价都很大，不可跳过，请按构筑方向选择。',
      },
    }
  }

  return state
}
