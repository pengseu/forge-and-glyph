import type { EventDef, EnemyDef, EnemyIntent, EnchantmentId } from './types'
import type { MetaProfile, ChampionSummary } from './meta'

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

function resolveWeaponTypeFromDefId(weaponDefId: string): 'longsword' | 'staff' | 'dagger' | 'hammer' | 'bow' {
  if (weaponDefId.includes('longsword') || weaponDefId.includes('greatsword')) return 'longsword'
  if (weaponDefId.includes('staff') || weaponDefId.includes('scepter')) return 'staff'
  if (weaponDefId.includes('dagger')) return 'dagger'
  if (weaponDefId.includes('hammer')) return 'hammer'
  if (weaponDefId.includes('bow')) return 'bow'
  return 'longsword'
}

function generateEchoIntents(weaponType: 'longsword' | 'staff' | 'dagger' | 'hammer' | 'bow', enchantments: EnchantmentId[], cycleTier: number): EnemyIntent[] {
  const tierMultiplier = 1 + cycleTier * 0.15
  const baseIntents: EnemyIntent[] = []

  if (weaponType === 'longsword') {
    baseIntents.push(
      { type: 'attack', value: Math.floor(16 * tierMultiplier) },
      { type: 'defend_attack', defendValue: Math.floor(10 * tierMultiplier), attackValue: Math.floor(12 * tierMultiplier) },
      { type: 'attack', value: Math.floor(20 * tierMultiplier) },
    )
  } else if (weaponType === 'staff') {
    baseIntents.push(
      { type: 'attack', value: Math.floor(14 * tierMultiplier) },
      { type: 'curse', cardId: 'curse_doubt', count: 1 },
      { type: 'attack', value: Math.floor(18 * tierMultiplier) },
    )
  } else if (weaponType === 'dagger') {
    baseIntents.push(
      { type: 'attack', value: Math.floor(12 * tierMultiplier) },
      { type: 'attack', value: Math.floor(12 * tierMultiplier) },
      { type: 'poison', value: Math.floor(2 * tierMultiplier) },
    )
  } else if (weaponType === 'hammer') {
    baseIntents.push(
      { type: 'defend', value: Math.floor(12 * tierMultiplier) },
      { type: 'attack', value: Math.floor(22 * tierMultiplier) },
      { type: 'attack', value: Math.floor(18 * tierMultiplier) },
    )
  } else {
    baseIntents.push(
      { type: 'attack', value: Math.floor(14 * tierMultiplier) },
      { type: 'attack', value: Math.floor(14 * tierMultiplier) },
      { type: 'defend', value: Math.floor(8 * tierMultiplier) },
    )
  }

  if (enchantments.includes('flame')) {
    baseIntents.splice(1, 0, { type: 'attack', value: Math.floor(10 * tierMultiplier) })
  }
  if (enchantments.includes('frost')) {
    baseIntents.push({ type: 'defend', value: Math.floor(10 * tierMultiplier) })
  }
  if (enchantments.includes('thunder')) {
    baseIntents.splice(0, 0, { type: 'attack', value: Math.floor(8 * tierMultiplier) })
  }

  return baseIntents.slice(0, 4)
}

export function generateEchoBoss(summary: ChampionSummary | null, cycleTier: number): EnemyDef {
  const weaponType = summary ? resolveWeaponTypeFromDefId(summary.weaponDefId) : 'longsword'
  const enchantments = summary?.enchantments ?? []
  const tierMultiplier = 1 + cycleTier * 0.2

  return {
    id: 'echo_champion',
    name: '锻铸者残响',
    sprite: '/assets/characters/enemies/echo_champion.png',
    maxHp: Math.floor(180 * tierMultiplier),
    intents: generateEchoIntents(weaponType, enchantments, cycleTier),
  }
}

export function createEchoWhisperEvent(): EventDef {
  return {
    id: 'echo_whisper',
    title: '残响的低语',
    description: '在第三幕Boss倒下后，你听见了来自更深处的声音。',
    presentation: 'abyss',
    body: [
      { text: '"你又一次走到了这里。"', tone: 'whisper' },
      { text: '"但这一次，门后不再是空的。"', tone: 'whisper' },
      { text: '"上一个穿过门的人，留下了他的痕迹。"', tone: 'whisper' },
      { text: '"他的武器，他的选择，他的意志……"', tone: 'whisper' },
      { text: '"都被门记住了。"', tone: 'corrupt' },
      { text: '"现在，他在等你。"', tone: 'corrupt' },
    ],
    options: [
      { id: 'continue_forward', label: '继续前进', description: '你感觉到了那个残响的存在，并准备面对它。' },
    ],
  }
}

export function createSecretTransitionEvent(): EventDef {
  return {
    id: 'secret_transition',
    title: '残响的请求',
    description: '你击败了那个曾经的锻铸者。但在他消散前，你听见了他真正的声音。',
    presentation: 'abyss',
    body: [
      { text: '"谢谢你。"他的声音不再扭曲。' },
      { text: '"我曾以为自己赢了。我击败了门后的守卫，拿到了力量，带着胜利离开。"' },
      { text: '"但门不会为胜者停留。它只会记住真正穿过来的人。"' },
      { text: '"我以为我在使用它的力量。实际上，是它在使用我的身体。"' },
      { text: '"你刚才击败的，是我被改写后的样子。而真正的守门者，还在门后等着。"', tone: 'whisper' },
      { text: '"如果你真的要继续……帮我一个忙。"' },
      { text: '"别让它再找到下一个容器。"', tone: 'corrupt' },
    ],
    options: [
      { id: 'continue_forward', label: '继续前进', description: '你答应了他的请求，并准备面对真正的门后存在。' },
    ],
  }
}

export function createActWhisperEvent(act: 1 | 2 | 3, cycleTier: number): EventDef {
  const isFirstCycle = cycleTier === 0

  if (act === 1) {
    if (isFirstCycle) {
      return {
        id: 'act1_whisper',
        title: '低语',
        description: '在踏入森林前，你听见了什么。',
        presentation: 'abyss',
        body: [
          { text: '"又一个。"', tone: 'whisper' },
          { text: '"带着新的器物，新的意志，新的温度。"', tone: 'whisper' },
          { text: '"来吧。让我看看你能走多远。"', tone: 'whisper' },
        ],
        options: [
          { id: 'continue', label: '继续', description: '' },
        ],
      }
    } else {
      return {
        id: 'act1_whisper',
        title: '低语',
        description: '在踏入森林前，你听见了熟悉的声音。',
        presentation: 'abyss',
        body: [
          { text: '"你又回来了。"', tone: 'whisper' },
          { text: '"带着上一次的记忆，上一次的痕迹。"', tone: 'whisper' },
          { text: '"这一次，会有什么不同吗？"', tone: 'whisper' },
        ],
        options: [
          { id: 'continue', label: '继续', description: '' },
        ],
      }
    }
  }
  if (act === 2) {
    if (isFirstCycle) {
      return {
        id: 'act2_whisper',
        title: '低语',
        description: '地下城的入口处，声音更清晰了。',
        presentation: 'abyss',
        body: [
          { text: '"你比大多数人走得更远。"', tone: 'whisper' },
          { text: '"你的武器记住了你的选择。"', tone: 'whisper' },
          { text: '"继续。门会为你准备好位置。"', tone: 'whisper' },
        ],
        options: [
          { id: 'continue', label: '继续', description: '' },
        ],
      }
    } else {
      return {
        id: 'act2_whisper',
        title: '低语',
        description: '地下城的入口处，声音带着期待。',
        presentation: 'abyss',
        body: [
          { text: '"你的武器还记得上一次的锻造。"', tone: 'whisper' },
          { text: '"你的选择还留在门的记忆里。"', tone: 'whisper' },
          { text: '"这一次，你会走得更深吗？"', tone: 'whisper' },
        ],
        options: [
          { id: 'continue', label: '继续', description: '' },
        ],
      }
    }
  }
  if (isFirstCycle) {
    return {
      id: 'act3_whisper',
      title: '低语',
      description: '深渊的边缘，声音几乎就在耳边。',
      presentation: 'abyss',
      body: [
        { text: '"你已经很接近了。"', tone: 'whisper' },
        { text: '"你的每一次锻造，每一场战斗，每一个选择……"', tone: 'whisper' },
        { text: '"都在证明你是合格的容器。"', tone: 'whisper' },
        { text: '"来吧。门已经为你开启。"', tone: 'corrupt' },
      ],
      options: [
        { id: 'continue', label: '继续', description: '' },
      ],
    }
  } else {
    return {
      id: 'act3_whisper',
      title: '低语',
      description: '深渊的边缘，声音带着某种满足。',
      presentation: 'abyss',
      body: [
        { text: '"你又站在这里了。"', tone: 'whisper' },
        { text: '"上一次的你，已经成为门的一部分。"', tone: 'whisper' },
        { text: '"这一次的你，会留下什么新的痕迹？"', tone: 'whisper' },
        { text: '"来吧。门一直在等你。"', tone: 'corrupt' },
      ],
      options: [
        { id: 'continue', label: '继续', description: '' },
      ],
    }
  }
}
