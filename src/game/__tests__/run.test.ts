import { describe, it, expect } from 'vitest'
import type { RunState, WeaponInstance } from '../types'
import { addWeaponToInventory, equipWeapon, upgradeEquippedWeapon } from '../run'

function makeRunState(overrides: Partial<RunState> = {}): RunState {
  return {
    currentNodeId: 'node_0',
    visitedNodes: new Set(),
    deck: [],
    mapNodes: [],
    turn: 0,
    equippedWeapon: null,
    weaponInventory: [],
    ...overrides,
  }
}

describe('addWeaponToInventory', () => {
  it('should add a weapon to the inventory', () => {
    const state = makeRunState()
    const next = addWeaponToInventory(state, 'longsword')
    expect(next.weaponInventory).toHaveLength(1)
    expect(next.weaponInventory[0].defId).toBe('longsword')
    expect(next.weaponInventory[0].uid).toMatch(/^weapon_/)
  })
})

describe('equipWeapon', () => {
  it('should equip a weapon from inventory', () => {
    const weapon: WeaponInstance = { uid: 'w1', defId: 'longsword' }
    const state = makeRunState({ weaponInventory: [weapon] })
    const next = equipWeapon(state, 'w1')
    expect(next.equippedWeapon).toEqual(weapon)
  })

  it('should return original state when weapon uid not found', () => {
    const state = makeRunState()
    const next = equipWeapon(state, 'nonexistent')
    expect(next).toBe(state)
  })
})

describe('upgradeEquippedWeapon', () => {
  it('should upgrade longsword to longsword_upgraded', () => {
    const weapon: WeaponInstance = { uid: 'w1', defId: 'longsword' }
    const state = makeRunState({ equippedWeapon: weapon })
    const next = upgradeEquippedWeapon(state)
    expect(next.equippedWeapon!.defId).toBe('longsword_upgraded')
    expect(next.equippedWeapon!.uid).toBe('w1')
  })

  it('should return original state when no weapon equipped', () => {
    const state = makeRunState()
    const next = upgradeEquippedWeapon(state)
    expect(next).toBe(state)
  })
})
