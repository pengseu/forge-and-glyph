import { BOSS_LEGENDARY_WEAPON_BY_ACT } from './config'
import { EMPTY_MATERIAL_BAG } from './materials'
import type { EnchantmentId, EventDef, RunState } from './types'

const META_KEY = 'fg_meta_profile_v1'

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
  unlockFlags: {
    challengeMode: boolean
    extraStarters: boolean
  }
  lastRunAt: number | null
}

export interface StorageLike {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
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
    unlockFlags: {
      challengeMode: false,
      extraStarters: false,
    },
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
      unlockFlags: {
        challengeMode: !!parsed.unlockFlags?.challengeMode,
        extraStarters: !!parsed.unlockFlags?.extraStarters,
      },
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
  let next: MetaProfile = {
    ...profile,
    adventureTokens: profile.adventureTokens + calcAdventureTokens(payload.result, payload.act),
    totalRuns: profile.totalRuns + 1,
    totalVictories: profile.totalVictories + (payload.result === 'victory' ? 1 : 0),
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
  next = {
    ...next,
    blueprintProgress,
    blueprintMastery: nextMastery,
    unlockFlags: {
      challengeMode: next.unlockFlags.challengeMode || totalVictories >= 1,
      extraStarters: next.unlockFlags.extraStarters || totalVictories >= 3,
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
    const uid = `legacy_${Date.now()}_${Math.random()}`
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
  const randomEssence = essenceIds[Math.floor(Math.random() * essenceIds.length)]
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
