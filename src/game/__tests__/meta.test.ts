import { describe, expect, it } from 'vitest'
import {
  applyRunResultToMeta,
  calcAdventureTokens,
  createDefaultMetaProfile,
  createLegacyWeaponEvent,
  incrementBlueprintMastery,
  loadMetaProfile,
  resolveLegacyWeaponChoice,
  saveMetaProfile,
  withUnlockedBlueprint,
} from '../meta'
import { createRunState } from '../run'

function makeMemoryStorage() {
  const m = new Map<string, string>()
  return {
    getItem: (key: string) => m.get(key) ?? null,
    setItem: (key: string, value: string) => {
      m.set(key, value)
    },
  }
}

describe('meta profile', () => {
  it('loads defaults when storage is empty', () => {
    const profile = loadMetaProfile(makeMemoryStorage())
    expect(profile.adventureTokens).toBe(0)
    expect(profile.unlockedBlueprints).toEqual([])
  })

  it('saves and reloads profile', () => {
    const storage = makeMemoryStorage()
    const profile = {
      ...createDefaultMetaProfile(),
      adventureTokens: 12,
      unlockedBlueprints: ['legend_crownblade'],
    }
    saveMetaProfile(profile, storage)
    const loaded = loadMetaProfile(storage)
    expect(loaded.adventureTokens).toBe(12)
    expect(loaded.unlockedBlueprints).toEqual(['legend_crownblade'])
  })

  it('awards more tokens for victories', () => {
    expect(calcAdventureTokens('victory', 3)).toBeGreaterThan(calcAdventureTokens('defeat', 3))
  })

  it('unlocks blueprint without duplicates', () => {
    const base = createDefaultMetaProfile()
    const once = withUnlockedBlueprint(base, 'legend_crownblade')
    const twice = withUnlockedBlueprint(once, 'legend_crownblade')
    expect(once.unlockedBlueprints).toEqual(['legend_crownblade'])
    expect(twice.unlockedBlueprints).toEqual(['legend_crownblade'])
  })

  it('caps blueprint mastery at level 3', () => {
    let profile = createDefaultMetaProfile()
    profile = incrementBlueprintMastery(profile, 'legend_crownblade')
    profile = incrementBlueprintMastery(profile, 'legend_crownblade')
    profile = incrementBlueprintMastery(profile, 'legend_crownblade')
    profile = incrementBlueprintMastery(profile, 'legend_crownblade')
    expect(profile.blueprintMastery.legend_crownblade).toBe(3)
  })

  it('applies run result to meta (tokens, legacy, blueprint)', () => {
    const base = createDefaultMetaProfile()
    const next = applyRunResultToMeta(base, {
      result: 'victory',
      act: 2,
      equippedWeaponDefId: 'steel_longsword',
      unlockedBlueprints: ['legend_crownblade'],
      blueprintMastery: { legend_crownblade: 2 },
    })
    expect(next.totalRuns).toBe(1)
    expect(next.totalVictories).toBe(1)
    expect(next.legacyWeaponDefId).toBe('steel_longsword')
    expect(next.unlockedBlueprints).toContain('legend_crownblade')
    expect(next.blueprintMastery.legend_crownblade).toBe(2)
  })

  it('should advance blueprint mastery by replica conditions', () => {
    let profile = createDefaultMetaProfile()
    profile = withUnlockedBlueprint(profile, 'mythic_ant_swarm_dagger')
    profile = applyRunResultToMeta(profile, {
      result: 'defeat',
      act: 2,
      replicaEliteKills: { replica_ant_swarm_dagger: 10 },
    })
    expect(profile.blueprintMastery.mythic_ant_swarm_dagger).toBe(1)

    profile = applyRunResultToMeta(profile, {
      result: 'victory',
      act: 3,
      equippedWeaponDefId: 'replica_ant_swarm_dagger',
    })
    expect(profile.blueprintMastery.mythic_ant_swarm_dagger).toBe(2)

    profile = applyRunResultToMeta(profile, {
      result: 'defeat',
      act: 2,
      completedReplicaInheritanceBlueprints: ['mythic_ant_swarm_dagger'],
    })
    expect(profile.blueprintMastery.mythic_ant_swarm_dagger).toBe(3)
  })
})

describe('legacy event', () => {
  it('builds a legacy event payload', () => {
    const event = createLegacyWeaponEvent('mythic_ant_swarm_dagger')
    expect(event.id).toBe('legacy_echo')
    expect(event.options.map((o) => o.id)).toEqual(['legacy_equip', 'legacy_salvage'])
  })

  it('legacy equip should add and equip weapon, and mark seen', () => {
    const run = createRunState({ legacyWeaponDefId: 'mythic_ant_swarm_dagger', unlockedBlueprints: [], blueprintMastery: {} })
    const next = resolveLegacyWeaponChoice(run, 'legacy_equip')
    expect(next.weaponInventory.some((w) => w.defId === 'steel_dagger')).toBe(true)
    expect(next.equippedWeapon?.defId).toBe('steel_dagger')
    expect(next.legacyEventSeen).toBe(true)
  })

  it('legacy equip should retain one enchantment by default and two with abyss heart', () => {
    const run = createRunState({
      legacyWeaponDefId: 'mythic_ant_swarm_dagger',
      unlockedBlueprints: [],
      blueprintMastery: {},
      legacyWeaponEnchantments: ['flame', 'void', 'soul'],
    })
    const one = resolveLegacyWeaponChoice(run, 'legacy_equip')
    expect(one.equippedWeapon?.enchantments).toEqual(['flame'])

    const withHeart = {
      ...run,
      materials: { ...run.materials, abyss_heart: 1 },
    }
    const two = resolveLegacyWeaponChoice(withHeart, 'legacy_equip')
    expect(two.equippedWeapon?.enchantments).toEqual(['flame', 'void'])
  })

  it('legacy salvage should grant resources, and mark seen', () => {
    const run = createRunState({ legacyWeaponDefId: 'mythic_ant_swarm_dagger', unlockedBlueprints: [], blueprintMastery: {} })
    const next = resolveLegacyWeaponChoice(run, 'legacy_salvage')
    expect(next.materials.steel_ingot).toBeGreaterThanOrEqual(2)
    expect(next.legacyEventSeen).toBe(true)
  })
})
