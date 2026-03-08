import type { EventDef } from './types'
import type { MetaProfile } from './meta'

export interface CycleTierOption {
  tier: number
  label: string
  unlocked: boolean
  unlockHint: string | null
}

export interface SecretFlowStep {
  id:
    | 'secret_thanks_first'
    | 'secret_boss_final'
    | 'secret_epilogue'
    | 'ordinary_recognition'
    | 'secret_reentry'
    | 'secret_transition'
    | 'secret_boss_echo'
}

export const FIRST_SECRET_BOSS_ID = 'gate_warden'

export function resolveCycleTierLabel(tier: number): string {
  if (tier <= 0) return '第一轮回'
  if (tier === 1) return '第二轮回·侵影'
  return `深渊回响·${tier - 1}`
}

export function resolveCycleTierUnlockHint(tier: number): string | null {
  if (tier <= 0) return null
  if (tier === 1) return '击败门后的存在'
  if (tier === 2) return '击败第二轮回·侵影'
  return `击败深渊回响·${tier - 2}`
}

export function buildCycleTierOptions(highestUnlockedTier: number, visibleCount: number = Math.max(3, highestUnlockedTier + 2)): CycleTierOption[] {
  const count = Math.max(3, visibleCount)
  return Array.from({ length: count }, (_, tier) => ({
    tier,
    label: resolveCycleTierLabel(tier),
    unlocked: tier <= highestUnlockedTier,
    unlockHint: tier <= highestUnlockedTier ? null : resolveCycleTierUnlockHint(tier),
  }))
}

export function resolvePostAct3BossSecretFlow(input: { hiddenBossClearCount: number; cycleTier: number }): SecretFlowStep[] {
  if (input.hiddenBossClearCount <= 0 && input.cycleTier === 0) {
    return [
      { id: 'secret_thanks_first' },
      { id: 'secret_boss_final' },
      { id: 'secret_epilogue' },
    ]
  }
  return [
    { id: 'ordinary_recognition' },
    { id: 'secret_reentry' },
    { id: 'secret_boss_echo' },
    { id: 'secret_transition' },
    { id: 'secret_boss_final' },
    { id: 'secret_epilogue' },
  ]
}

export function createSecretThanksEvent(): EventDef {
  return {
    id: 'secret_thanks_first',
    title: '被侵染的鸣谢',
    description: '门已经记住你了。请继续前进。',
    presentation: 'abyss',
    body: [
      { text: '感谢你玩到这里。' },
      { text: '如果你正在读这段话，说明你已经把这条路，走到了大多数人不会抵达的地方。' },
      { text: '我是一个产品经理，最近一直在尝试借助 AI，把脑海里那款想了很久的游戏，一点一点做出来。' },
      { text: '它还不完整，也还在生长，但你能来到这里，已经说明你真的看见了它。' },
      { text: '谢谢你愿意体验、包容、停留。也谢谢你，把这条路走得比我最初想象得更远。' },
      { text: '因为通常不会有人到这里。不会有人继续往下。不会有人听见门后的声音。' },
      { text: '可总要有一个。？？？？总要有一个。而现在，门已经记住你了。请继续前进。', tone: 'corrupt' },
    ],
    options: [
      { id: 'touch_gate', label: '把手放上去', description: '让门记住你的温度，并继续向前。' },
    ],
  }
}

export function createSecretEpilogueEvent(): EventDef {
  return {
    id: 'secret_epilogue',
    title: '门后之言',
    description: '门不会为胜者停留。它只会记住真正穿过来的人。',
    presentation: 'abyss',
    body: [
      { text: '门不会为弱者开启，也不会为胜者停留。' },
      { text: '你已越过它一次，便会被它永远记住。' },
      { text: '带着裂隙离开。或者回来，直到所有回响都只剩你的名字。', tone: 'whisper' },
    ],
    options: [
      { id: 'accept_echo', label: '接受回响', description: '带着门后的余音离开这里。' },
    ],
  }
}

export function applyFirstSecretClearRewards(profile: MetaProfile): MetaProfile {
  const unlockedTitles = profile.secretCycle.unlockedTitles.includes('超越者')
    ? profile.secretCycle.unlockedTitles
    : [...profile.secretCycle.unlockedTitles, '超越者']
  const unlockedStarterWeapons = profile.secretCycle.unlockedStarterWeapons.includes('rift_blade')
    ? profile.secretCycle.unlockedStarterWeapons
    : [...profile.secretCycle.unlockedStarterWeapons, 'rift_blade']
  return {
    ...profile,
    secretCycle: {
      ...profile.secretCycle,
      highestUnlockedTier: Math.max(profile.secretCycle.highestUnlockedTier, 1),
      highestClearedTier: Math.max(profile.secretCycle.highestClearedTier, 0),
      hiddenBossClearCount: profile.secretCycle.hiddenBossClearCount + 1,
      secretEntrySeenCount: profile.secretCycle.secretEntrySeenCount + 1,
      unlockedTitles,
      unlockedStarterWeapons,
    },
  }
}
