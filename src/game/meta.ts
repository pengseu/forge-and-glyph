import { BOSS_LEGENDARY_WEAPON_BY_ACT } from './config'
import { EMPTY_MATERIAL_BAG } from './materials'
import type { EnchantmentId, EventDef, RunState } from './types'
import { random } from './random'

const META_KEY = 'fg_meta_profile_v1'

export interface ChampionSummary {
  version: 1
  weaponDefId: string
  enchantments: EnchantmentId[]
  primaryArchetype: string | null
  secondaryArchetype: string | null
  signatureTraitA: string | null
  signatureTraitB: string | null
  epitaph: string
  clearedCycleTier: number
  usedRiftBlade: boolean
  capturedAt: number
}

export interface SecretCycleProgress {
  highestUnlockedTier: number
  highestClearedTier: number
  hiddenBossClearCount: number
  secretEntrySeenCount: number
  unlockedTitles: string[]
  unlockedStarterWeapons: string[]
  latestSummaryByTier: Record<string, ChampionSummary>
}

export interface MetaProfile {
  version: 1
  adventureTokens: number
  totalRuns: number
  totalVictories: number
  unlockedBlueprints: string[]
  blueprintMastery: Record<string, number>
  blueprintProgress: Record<string, { replicaEliteKills: number; replicaClears: number; replicaInheritances: number }>
  legacyWeaponDefId: string | null
  legacyWeaponEnchantments: EnchantmentId[]
  unlockedMetaCards: string[]
  unlockedMetaWeapons: string[]
  unlockedMetaEnchantments: string[]
  unlockedStarters: string[]
  milestones: Record<string, { progress: number; target: number; unlocked: boolean }>
  unlockFlags: {
    challengeMode: boolean
    extraStarters: boolean
    firstDeathBonusClaimed: boolean
  }
  secretCycle: SecretCycleProgress
  lastRunAt: number | null
}

export interface StorageLike {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

export function createDefaultSecretCycleProgress(): SecretCycleProgress {
  return {
    highestUnlockedTier: 0,
    highestClearedTier: -1,
    hiddenBossClearCount: 0,
    secretEntrySeenCount: 0,
    unlockedTitles: [],
    unlockedStarterWeapons: [],
    latestSummaryByTier: {},
  }
}

export function createDefaultMetaProfile(): MetaProfile {
  return {
    version: 1,
    adventureTokens: 0,
    totalRuns: 0,
    totalVictories: 0,
    unlockedBlueprints: [],
    blueprintMastery: {},
    blueprintProgress: {},
    legacyWeaponDefId: null,
    legacyWeaponEnchantments: [],
    unlockedMetaCards: [],
    unlockedMetaWeapons: [],
    unlockedMetaEnchantments: [],
    unlockedStarters: [],
    milestones: {},
    unlockFlags: {
      challengeMode: false,
      extraStarters: false,
      firstDeathBonusClaimed: false,
    },
    secretCycle: createDefaultSecretCycleProgress(),
    lastRunAt: null,
  }
}

function resolveStorage(storage?: StorageLike): StorageLike | null {
  if (storage) return storage
  if (typeof window === 'undefined' || !window.localStorage) return null
  return window.localStorage
}

function uniqueStrings(items: unknown): string[] {
  if (!Array.isArray(items)) return []
  const set = new Set<string>()
  for (const item of items) {
    if (typeof item === 'string' && item.trim().length > 0) set.add(item)
  }
  return [...set]
}

function normalizeBlueprintMastery(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object') return {}
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof k !== 'string') continue
    const n = typeof v === 'number' ? v : Number(v)
    if (!Number.isFinite(n)) continue
    out[k] = Math.max(0, Math.min(3, Math.floor(n)))
  }
  return out
}

function normalizeEnchantmentList(value: unknown): EnchantmentId[] {
  if (!Array.isArray(value)) return []
  const allowed: EnchantmentId[] = ['flame', 'frost', 'thunder', 'soul', 'void', 'bless', 'abyss']
  const set = new Set<EnchantmentId>()
  for (const item of value) {
    if (typeof item !== 'string') continue
    if ((allowed as string[]).includes(item)) {
      set.add(item as EnchantmentId)
    }
  }
  return [...set]
}

function normalizeBlueprintProgress(
  value: unknown,
): Record<string, { replicaEliteKills: number; replicaClears: number; replicaInheritances: number }> {
  if (!value || typeof value !== 'object') return {}
  const out: Record<string, { replicaEliteKills: number; replicaClears: number; replicaInheritances: number }> = {}
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof key !== 'string' || !raw || typeof raw !== 'object') continue
    const row = raw as Record<string, unknown>
    const eliteKills = Math.max(0, Math.floor(Number(row.replicaEliteKills ?? 0)))
    const clears = Math.max(0, Math.floor(Number(row.replicaClears ?? 0)))
    const inheritances = Math.max(0, Math.floor(Number(row.replicaInheritances ?? 0)))
    out[key] = {
      replicaEliteKills: Number.isFinite(eliteKills) ? eliteKills : 0,
      replicaClears: Number.isFinite(clears) ? clears : 0,
      replicaInheritances: Number.isFinite(inheritances) ? inheritances : 0,
    }
  }
  return out
}

function normalizeChampionSummary(value: unknown): ChampionSummary | null {
  if (!value || typeof value !== 'object') return null
  const row = value as Record<string, unknown>
  return {
    version: 1,
    weaponDefId: typeof row.weaponDefId === 'string' ? row.weaponDefId : 'iron_longsword',
    enchantments: normalizeEnchantmentList(row.enchantments),
    primaryArchetype: typeof row.primaryArchetype === 'string' ? row.primaryArchetype : null,
    secondaryArchetype: typeof row.secondaryArchetype === 'string' ? row.secondaryArchetype : null,
    signatureTraitA: typeof row.signatureTraitA === 'string' ? row.signatureTraitA : null,
    signatureTraitB: typeof row.signatureTraitB === 'string' ? row.signatureTraitB : null,
    epitaph: typeof row.epitaph === 'string' ? row.epitaph : '',
    clearedCycleTier: Math.max(0, Math.floor(Number(row.clearedCycleTier ?? 0))),
    usedRiftBlade: !!row.usedRiftBlade,
    capturedAt: Math.max(0, Math.floor(Number(row.capturedAt ?? 0))),
  }
}

function normalizeSecretCycleProgress(value: unknown): SecretCycleProgress {
  const base = createDefaultSecretCycleProgress()
  if (!value || typeof value !== 'object') return base
  const row = value as Record<string, unknown>
  const latestSummaryByTier: Record<string, ChampionSummary> = {}
  if (row.latestSummaryByTier && typeof row.latestSummaryByTier === 'object') {
    for (const [tier, raw] of Object.entries(row.latestSummaryByTier as Record<string, unknown>)) {
      const normalized = normalizeChampionSummary(raw)
      if (normalized) latestSummaryByTier[tier] = normalized
    }
  }
  return {
    highestUnlockedTier: Math.max(0, Math.floor(Number(row.highestUnlockedTier ?? base.highestUnlockedTier))),
    highestClearedTier: Math.max(-1, Math.floor(Number(row.highestClearedTier ?? base.highestClearedTier))),
    hiddenBossClearCount: Math.max(0, Math.floor(Number(row.hiddenBossClearCount ?? base.hiddenBossClearCount))),
    secretEntrySeenCount: Math.max(0, Math.floor(Number(row.secretEntrySeenCount ?? base.secretEntrySeenCount))),
    unlockedTitles: uniqueStrings(row.unlockedTitles),
    unlockedStarterWeapons: uniqueStrings(row.unlockedStarterWeapons),
    latestSummaryByTier,
  }
}

function normalizeMilestones(value: unknown): Record<string, { progress: number; target: number; unlocked: boolean }> {
  if (!value || typeof value !== 'object') return {}
  const out: Record<string, { progress: number; target: number; unlocked: boolean }> = {}
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof key !== 'string' || !raw || typeof raw !== 'object') continue
    const row = raw as Record<string, unknown>
    const progress = Math.max(0, Math.floor(Number(row.progress ?? 0)))
    const target = Math.max(1, Math.floor(Number(row.target ?? 1)))
    out[key] = {
      progress: Number.isFinite(progress) ? progress : 0,
      target: Number.isFinite(target) ? target : 1,
      unlocked: !!row.unlocked,
    }
  }
  return out
}

type MilestoneRewardKind = 'card' | 'weapon' | 'enchantment' | 'starter'

interface MilestoneDef {
  id: string
  target: number
  rewardKind: MilestoneRewardKind
  rewardId: string
  progressGain: (ctx: {
    prev: MetaProfile
    payload: {
      result: 'victory' | 'defeat'
      act: 1 | 2 | 3
      equippedWeaponDefId?: string | null
      equippedWeaponEnchantments?: EnchantmentId[]
    }
  }) => number
}

const META_MILESTONES: MilestoneDef[] = [
  {
    id: 'unlock_poison_core',
    target: 1,
    rewardKind: 'card',
    rewardId: 'acidic_poison_core',
    progressGain: ({ payload }) => (payload.result === 'victory' ? 1 : 0),
  },
  {
    id: 'unlock_staff_blueprint',
    target: 1,
    rewardKind: 'weapon',
    rewardId: 'staff_master_blueprint',
    progressGain: ({ payload }) => (payload.result === 'victory' && payload.equippedWeaponDefId?.includes('staff') ? 1 : 0),
  },
  {
    id: 'unlock_flame_script',
    target: 1,
    rewardKind: 'enchantment',
    rewardId: 'burnout_script',
    progressGain: ({ payload }) => (payload.result === 'victory' && (payload.equippedWeaponEnchantments ?? []).includes('flame') ? 1 : 0),
  },
  {
    id: 'unlock_extra_starters_pack',
    target: 3,
    rewardKind: 'starter',
    rewardId: 'dagger_hammer_pack',
    progressGain: ({ payload }) => (payload.result === 'victory' ? 1 : 0),
  },
]

function resolveMasteryByProgress(progress: { replicaEliteKills: number; replicaClears: number; replicaInheritances: number }): number {
  if (progress.replicaInheritances >= 1) return 3
  if (progress.replicaClears >= 1) return 2
  if (progress.replicaEliteKills >= 10) return 1
  return 0
}

export function resolveBlueprintIdFromWeaponDef(defId: string): string | null {
  if (defId.includes('ant_swarm_dagger')) return 'mythic_ant_swarm_dagger'
  if (defId.includes('twilight_staff')) return 'mythic_twilight_staff'
  if (defId.includes('finale_greatsword')) return 'mythic_finale_greatsword'
  return null
}

export function loadMetaProfile(storage?: StorageLike): MetaProfile {
  const store = resolveStorage(storage)
  if (!store) return createDefaultMetaProfile()
  try {
    const raw = store.getItem(META_KEY)
    if (!raw) return createDefaultMetaProfile()
    const parsed = JSON.parse(raw) as Partial<MetaProfile>
    const base = createDefaultMetaProfile()
    return {
      version: 1,
      adventureTokens: Math.max(0, Math.floor(parsed.adventureTokens ?? 0)),
      totalRuns: Math.max(0, Math.floor(parsed.totalRuns ?? 0)),
      totalVictories: Math.max(0, Math.floor(parsed.totalVictories ?? 0)),
      unlockedBlueprints: uniqueStrings(parsed.unlockedBlueprints),
      blueprintMastery: normalizeBlueprintMastery(parsed.blueprintMastery),
      blueprintProgress: normalizeBlueprintProgress(parsed.blueprintProgress),
      legacyWeaponDefId: typeof parsed.legacyWeaponDefId === 'string' ? parsed.legacyWeaponDefId : null,
      legacyWeaponEnchantments: normalizeEnchantmentList(parsed.legacyWeaponEnchantments),
      unlockedMetaCards: uniqueStrings(parsed.unlockedMetaCards),
      unlockedMetaWeapons: uniqueStrings(parsed.unlockedMetaWeapons),
      unlockedMetaEnchantments: uniqueStrings(parsed.unlockedMetaEnchantments),
      unlockedStarters: uniqueStrings(parsed.unlockedStarters),
      milestones: normalizeMilestones(parsed.milestones),
      unlockFlags: {
        challengeMode: !!parsed.unlockFlags?.challengeMode,
        extraStarters: !!parsed.unlockFlags?.extraStarters,
        firstDeathBonusClaimed: !!parsed.unlockFlags?.firstDeathBonusClaimed,
      },
      secretCycle: normalizeSecretCycleProgress(parsed.secretCycle),
      lastRunAt: typeof parsed.lastRunAt === 'number' ? parsed.lastRunAt : base.lastRunAt,
    }
  } catch {
    return createDefaultMetaProfile()
  }
}

export function saveMetaProfile(profile: MetaProfile, storage?: StorageLike): void {
  const store = resolveStorage(storage)
  if (!store) return
  store.setItem(META_KEY, JSON.stringify(profile))
}

export function calcAdventureTokens(result: 'victory' | 'defeat', act: 1 | 2 | 3): number {
  if (result === 'victory') return 14 + (act * 6)
  return 6 + (act * 3)
}

export function getBossLegendaryWeaponByAct(act: 1 | 2 | 3): string {
  return BOSS_LEGENDARY_WEAPON_BY_ACT[act]
}

export function withUnlockedBlueprint(profile: MetaProfile, blueprintId: string): MetaProfile {
  if (profile.unlockedBlueprints.includes(blueprintId)) return profile
  return {
    ...profile,
    unlockedBlueprints: [...profile.unlockedBlueprints, blueprintId],
    blueprintProgress: {
      ...profile.blueprintProgress,
      [blueprintId]: profile.blueprintProgress[blueprintId] ?? { replicaEliteKills: 0, replicaClears: 0, replicaInheritances: 0 },
    },
  }
}

export function incrementBlueprintMastery(profile: MetaProfile, blueprintId: string): MetaProfile {
  const current = profile.blueprintMastery[blueprintId] ?? 0
  const next = Math.min(3, current + 1)
  if (next === current) return profile
  return {
    ...profile,
    blueprintMastery: {
      ...profile.blueprintMastery,
      [blueprintId]: next,
    },
  }
}

export function applyRunResultToMeta(
  profile: MetaProfile,
  payload: {
    result: 'victory' | 'defeat'
    act: 1 | 2 | 3
    equippedWeaponDefId?: string | null
    equippedWeaponEnchantments?: EnchantmentId[]
    unlockedBlueprints?: string[]
    blueprintMastery?: Record<string, number>
    replicaEliteKills?: Record<string, number>
    completedReplicaInheritanceBlueprints?: string[]
  },
): MetaProfile {
  const firstDeathBonus = payload.result === 'defeat' && !profile.unlockFlags.firstDeathBonusClaimed ? 1 : 0
  let next: MetaProfile = {
    ...profile,
    adventureTokens: profile.adventureTokens + calcAdventureTokens(payload.result, payload.act) + firstDeathBonus,
    totalRuns: profile.totalRuns + 1,
    totalVictories: profile.totalVictories + (payload.result === 'victory' ? 1 : 0),
    unlockFlags: {
      ...profile.unlockFlags,
      firstDeathBonusClaimed: profile.unlockFlags.firstDeathBonusClaimed || payload.result === 'defeat',
    },
    secretCycle: { ...profile.secretCycle },
    lastRunAt: Date.now(),
  }
  for (const blueprintId of payload.unlockedBlueprints ?? []) {
    next = withUnlockedBlueprint(next, blueprintId)
  }
  if (payload.blueprintMastery) {
    next = {
      ...next,
      blueprintMastery: {
        ...next.blueprintMastery,
        ...normalizeBlueprintMastery(payload.blueprintMastery),
      },
    }
  }

  let blueprintProgress = { ...next.blueprintProgress }
  const ensureProgress = (blueprintId: string): void => {
    if (!blueprintProgress[blueprintId]) {
      blueprintProgress[blueprintId] = { replicaEliteKills: 0, replicaClears: 0, replicaInheritances: 0 }
    }
  }

  for (const blueprintId of next.unlockedBlueprints) {
    ensureProgress(blueprintId)
  }

  for (const [weaponDefId, count] of Object.entries(payload.replicaEliteKills ?? {})) {
    if (!weaponDefId.startsWith('replica_')) continue
    const blueprintId = resolveBlueprintIdFromWeaponDef(weaponDefId)
    if (!blueprintId) continue
    const kills = Math.max(0, Math.floor(Number(count ?? 0)))
    if (kills <= 0) continue
    ensureProgress(blueprintId)
    blueprintProgress[blueprintId].replicaEliteKills += kills
  }

  if (payload.result === 'victory' && payload.equippedWeaponDefId?.startsWith('replica_')) {
    const blueprintId = resolveBlueprintIdFromWeaponDef(payload.equippedWeaponDefId)
    if (blueprintId) {
      ensureProgress(blueprintId)
      blueprintProgress[blueprintId].replicaClears += 1
    }
  }

  for (const blueprintId of payload.completedReplicaInheritanceBlueprints ?? []) {
    ensureProgress(blueprintId)
    blueprintProgress[blueprintId].replicaInheritances += 1
  }

  const nextMastery = { ...next.blueprintMastery }
  for (const [blueprintId, progress] of Object.entries(blueprintProgress)) {
    nextMastery[blueprintId] = Math.max(nextMastery[blueprintId] ?? 0, resolveMasteryByProgress(progress))
  }

  const totalVictories = next.totalVictories

  const nextMilestones = { ...next.milestones }
  let unlockedMetaCards = [...next.unlockedMetaCards]
  let unlockedMetaWeapons = [...next.unlockedMetaWeapons]
  let unlockedMetaEnchantments = [...next.unlockedMetaEnchantments]
  let unlockedStarters = [...next.unlockedStarters]
  for (const def of META_MILESTONES) {
    const base = nextMilestones[def.id] ?? { progress: 0, target: def.target, unlocked: false }
    if (base.unlocked) {
      nextMilestones[def.id] = base
      continue
    }
    const gained = Math.max(0, Math.floor(def.progressGain({ prev: profile, payload })))
    const progress = Math.min(def.target, base.progress + gained)
    const unlocked = progress >= def.target
    nextMilestones[def.id] = { progress, target: def.target, unlocked }
    if (!unlocked) continue
    if (def.rewardKind === 'card' && !unlockedMetaCards.includes(def.rewardId)) unlockedMetaCards.push(def.rewardId)
    if (def.rewardKind === 'weapon' && !unlockedMetaWeapons.includes(def.rewardId)) unlockedMetaWeapons.push(def.rewardId)
    if (def.rewardKind === 'enchantment' && !unlockedMetaEnchantments.includes(def.rewardId)) unlockedMetaEnchantments.push(def.rewardId)
    if (def.rewardKind === 'starter' && !unlockedStarters.includes(def.rewardId)) unlockedStarters.push(def.rewardId)
  }

  next = {
    ...next,
    blueprintProgress,
    blueprintMastery: nextMastery,
    milestones: nextMilestones,
    unlockedMetaCards,
    unlockedMetaWeapons,
    unlockedMetaEnchantments,
    unlockedStarters,
    unlockFlags: {
      challengeMode: next.unlockFlags.challengeMode || totalVictories >= 1,
      extraStarters: next.unlockFlags.extraStarters || totalVictories >= 3 || unlockedStarters.includes('dagger_hammer_pack'),
      firstDeathBonusClaimed: next.unlockFlags.firstDeathBonusClaimed,
    },
  }

  if (payload.result === 'victory' && payload.equippedWeaponDefId) {
    next = {
      ...next,
      legacyWeaponDefId: payload.equippedWeaponDefId,
      legacyWeaponEnchantments: normalizeEnchantmentList(payload.equippedWeaponEnchantments ?? []),
    }
  }
  return next
}

export function createLegacyWeaponEvent(legacyWeaponDefId: string): EventDef {
  return {
    id: 'legacy_echo',
    title: '传承回响',
    description: `你感应到上一位锻铸者遗留的武器：${legacyWeaponDefId}`,
    options: [
      { id: 'legacy_equip', label: '继承武器', description: '装备并继续本局冒险' },
      { id: 'legacy_salvage', label: '拆解回响', description: '获得精钢锭x2与随机精华x1' },
    ],
  }
}

function weakenLegacyWeaponDefId(defId: string): string {
  const map: Record<string, string> = {
    legend_kings_blade: 'steel_longsword',
    legend_prismatic_scepter: 'steel_staff',
    legend_shadow_daggers: 'steel_dagger',
    legend_doom_hammer: 'steel_hammer',
    mythic_ant_swarm_dagger: 'steel_dagger',
    mythic_twilight_staff: 'steel_staff',
    mythic_finale_greatsword: 'steel_longsword',
    replica_ant_swarm_dagger: 'steel_dagger',
    replica_twilight_staff: 'steel_staff',
    replica_finale_greatsword: 'steel_longsword',
    iron_longsword: 'steel_longsword',
    iron_staff: 'steel_staff',
    iron_dagger: 'steel_dagger',
    iron_hammer: 'steel_hammer',
    iron_bow: 'steel_bow',
  }
  return map[defId] ?? defId
}

export function resolveLegacyWeaponChoice(
  run: RunState,
  optionId: 'legacy_equip' | 'legacy_salvage',
): RunState {
  if (!run.legacyWeaponDefId) return { ...run, legacyEventSeen: true }
  if (optionId === 'legacy_equip') {
    const keepCount = run.materials.abyss_heart > 0 ? 2 : 1
    const keptEnchantments = [...(run.legacyWeaponEnchantments ?? [])].slice(0, keepCount)
    const inheritedBlueprint = run.legacyWeaponDefId.startsWith('replica_')
      ? resolveBlueprintIdFromWeaponDef(run.legacyWeaponDefId)
      : null
    const completed = new Set(run.completedReplicaInheritanceBlueprints ?? [])
    if (inheritedBlueprint) {
      completed.add(inheritedBlueprint)
    }
    const uid = `legacy_${Date.now()}_${random()}`
    const weapon = {
      uid,
      defId: weakenLegacyWeaponDefId(run.legacyWeaponDefId),
      enchantments: keptEnchantments as RunState['weaponInventory'][number]['enchantments'],
    }
    return {
      ...run,
      weaponInventory: [...run.weaponInventory, weapon],
      equippedWeapon: weapon,
      legacyEventSeen: true,
      completedReplicaInheritanceBlueprints: [...completed],
    }
  }
  const essenceIds: Array<keyof RunState['materials']> = ['elemental_essence', 'war_essence', 'guard_essence']
  const randomEssence = essenceIds[Math.floor(random() * essenceIds.length)]
  const materialGain = { steel_ingot: 2, [randomEssence]: 1 } as Partial<RunState['materials']>
  const nextMaterials = { ...EMPTY_MATERIAL_BAG, ...run.materials }
  for (const [k, v] of Object.entries(materialGain)) {
    nextMaterials[k as keyof typeof nextMaterials] += v
  }
  return {
    ...run,
    materials: nextMaterials,
    legacyEventSeen: true,
  }
}
