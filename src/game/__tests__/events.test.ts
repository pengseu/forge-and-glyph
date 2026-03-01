import { describe, it, expect } from 'vitest'
import { createRunState } from '../run'
import { resolveEventOption, rollEvent } from '../events'

describe('events', () => {
  it('rollEvent should return weighted event defs', () => {
    const e1 = rollEvent(() => 0)
    const e2 = rollEvent(() => 0.99)
    expect(e1.id).toBeDefined()
    expect(e2.id).toBeDefined()
  })

  it('mysterious merchant should cost 8 hp and grant one rare card', () => {
    const run = createRunState()
    const result = resolveEventOption(run, {
      id: 'mysterious_merchant',
      title: 'x',
      description: 'x',
      options: [],
    }, 'trade_hp_for_rare', () => 0)
    expect(result.run.playerHp).toBe(run.playerHp - 8)
    expect(result.run.deck.length).toBe(run.deck.length + 1)
  })

  it('abandoned camp search should grant iron when rng < 0.5', () => {
    const run = createRunState()
    const result = resolveEventOption(run, {
      id: 'abandoned_camp',
      title: 'x',
      description: 'x',
      options: [],
    }, 'search_camp', () => 0)
    expect(result.run.materials.iron_ingot).toBe(2)
    expect(result.triggerBattleEnemyIds).toBeUndefined()
  })

  it('abandoned camp search should trigger battle when rng >= 0.5', () => {
    const run = createRunState()
    const result = resolveEventOption(run, {
      id: 'abandoned_camp',
      title: 'x',
      description: 'x',
      options: [],
    }, 'search_camp', () => 0.9)
    expect(result.triggerBattleEnemyIds?.length).toBeGreaterThan(0)
  })

  it('abandoned camp rest should heal 8 hp', () => {
    const run = { ...createRunState(), playerHp: 22, playerMaxHp: 60 }
    const result = resolveEventOption(run, {
      id: 'abandoned_camp',
      title: 'x',
      description: 'x',
      options: [],
    }, 'camp_rest', () => 0.1)
    expect(result.run.playerHp).toBe(30)
  })

  it('forge spirit should upgrade one random non-upgraded card', () => {
    const run = createRunState()
    const result = resolveEventOption(run, {
      id: 'forge_spirit',
      title: 'x',
      description: 'x',
      options: [],
    }, 'upgrade_random_card', () => 0)
    const upgradedCount = result.run.deck.filter(c => c.upgraded).length
    expect(upgradedCount).toBe(1)
  })

  it('forge spirit remove option should remove one card from deck', () => {
    const run = createRunState()
    const result = resolveEventOption(run, {
      id: 'forge_spirit',
      title: 'x',
      description: 'x',
      options: [],
    }, 'remove_random_card', () => 0)
    expect(result.run.deck.length).toBe(run.deck.length - 1)
  })

  it('legacy echo should support equip and salvage branches', () => {
    const run = createRunState({
      legacyWeaponDefId: 'mythic_ant_swarm_dagger',
      unlockedBlueprints: [],
      blueprintMastery: {},
    })
    const equip = resolveEventOption(run, {
      id: 'legacy_echo',
      title: 'x',
      description: 'x',
      options: [],
    }, 'legacy_equip', () => 0)
    expect(equip.run.equippedWeapon?.defId).toBe('steel_dagger')

    const salvage = resolveEventOption(run, {
      id: 'legacy_echo',
      title: 'x',
      description: 'x',
      options: [],
    }, 'legacy_salvage', () => 0)
    expect(salvage.run.materials.steel_ingot).toBeGreaterThanOrEqual(2)
  })
})
