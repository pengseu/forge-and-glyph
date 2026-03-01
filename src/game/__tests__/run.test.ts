import { describe, it, expect } from 'vitest'
import type { RunState, WeaponInstance } from '../types'
import {
  createRunState,
  moveToNode,
  completeNode,
  addBattleGoldReward,
  addMaterialReward,
  addCardToDeck,
  addWeaponToInventory,
  applyBattleVictoryRewards,
  canAccessNode,
  equipWeapon,
  generateBattleGold,
  healInShop,
  isBossNode,
  removeCardFromDeck,
  craftWeapon,
  enchantWeapon,
  upgradeEquippedWeapon,
} from '../run'
import { EMPTY_MATERIAL_BAG } from '../materials'
import { getNodeById } from '../map'

function makeRunState(overrides: Partial<RunState> = {}): RunState {
  return {
    currentNodeId: 'node_0',
    visitedNodes: new Set(),
    deck: [],
    mapNodes: [],
    turn: 0,
    equippedWeapon: null,
    weaponInventory: [],
    playerHp: 50,
    playerMaxHp: 50,
    gold: 0,
    materials: { ...EMPTY_MATERIAL_BAG },
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
    const weapon: WeaponInstance = { uid: 'w1', defId: 'longsword', enchantments: [] }
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
    const weapon: WeaponInstance = { uid: 'w1', defId: 'longsword', enchantments: [] }
    const state = makeRunState({ equippedWeapon: weapon, weaponInventory: [weapon] })
    const next = upgradeEquippedWeapon(state)
    expect(next.equippedWeapon!.defId).toBe('longsword_upgraded')
    expect(next.equippedWeapon!.uid).toBe('w1')
    expect(next.weaponInventory[0].defId).toBe('longsword_upgraded')
  })

  it('should return original state when no weapon equipped', () => {
    const state = makeRunState()
    const next = upgradeEquippedWeapon(state)
    expect(next).toBe(state)
  })
})

describe('canAccessNode', () => {
  const base = makeRunState({
    currentNodeId: 'n1',
    mapNodes: [
      { id: 'n1', type: 'normal_battle', completed: false, x: 0, y: 0, connections: ['n2'] },
      { id: 'n2', type: 'normal_battle', completed: false, x: 1, y: 0, connections: [] },
      { id: 'n3', type: 'normal_battle', completed: false, x: 2, y: 0, connections: [] },
    ],
  })

  it('allows current and connected uncompleted nodes', () => {
    expect(canAccessNode(base, 'n1')).toBe(true)
    expect(canAccessNode(base, 'n2')).toBe(true)
  })

  it('rejects unconnected nodes', () => {
    expect(canAccessNode(base, 'n3')).toBe(false)
  })

  it('rejects completed nodes', () => {
    const withCompleted = {
      ...base,
      mapNodes: base.mapNodes.map(n => (n.id === 'n2' ? { ...n, completed: true } : n)),
    }
    expect(canAccessNode(withCompleted, 'n2')).toBe(false)
  })
})

describe('isBossNode', () => {
  it('returns true when current node is boss', () => {
    const state = makeRunState({
      currentNodeId: 'boss',
      mapNodes: [
        { id: 'boss', type: 'boss_battle', completed: false, x: 0, y: 0, connections: [] },
      ],
    })
    expect(isBossNode(state)).toBe(true)
  })

  it('returns false for non-boss node', () => {
    const state = makeRunState({
      currentNodeId: 'n1',
      mapNodes: [
        { id: 'n1', type: 'normal_battle', completed: false, x: 0, y: 0, connections: [] },
      ],
    })
    expect(isBossNode(state)).toBe(false)
  })
})

describe('applyBattleVictoryRewards', () => {
  it('elite battle should increase max hp by 5 and heal 5', () => {
    const state = makeRunState({ playerHp: 40, playerMaxHp: 50 })
    const next = applyBattleVictoryRewards(state, 'elite_battle')
    expect(next.playerMaxHp).toBe(55)
    expect(next.playerHp).toBe(45)
  })

  it('normal battle should not increase max hp', () => {
    const state = makeRunState({ playerHp: 40, playerMaxHp: 50 })
    const next = applyBattleVictoryRewards(state, 'normal_battle')
    expect(next.playerMaxHp).toBe(50)
    expect(next.playerHp).toBe(40)
  })
})

describe('gold rewards', () => {
  it('normal battle gold range should be 15~25', () => {
    expect(generateBattleGold('normal_battle', () => 0)).toBe(15)
    expect(generateBattleGold('normal_battle', () => 0.999999)).toBe(25)
  })

  it('elite battle gold range should be 30~40', () => {
    expect(generateBattleGold('elite_battle', () => 0)).toBe(30)
    expect(generateBattleGold('elite_battle', () => 0.999999)).toBe(40)
  })

  it('boss battle gold range should be 50~70', () => {
    expect(generateBattleGold('boss_battle', () => 0)).toBe(50)
    expect(generateBattleGold('boss_battle', () => 0.999999)).toBe(70)
  })

  it('addBattleGoldReward should increase run gold', () => {
    const state = makeRunState({ gold: 10 })
    const next = addBattleGoldReward(state, 22)
    expect(next.gold).toBe(32)
  })
})

describe('shop services', () => {
  it('healInShop should heal 30% max hp and cost 30 gold', () => {
    const state = makeRunState({ playerHp: 20, playerMaxHp: 50, gold: 40 })
    const next = healInShop(state)
    expect(next.playerHp).toBe(35)
    expect(next.gold).toBe(10)
  })

  it('removeCardFromDeck should remove exactly one card and cost 50 gold', () => {
    const state = makeRunState({
      gold: 70,
      deck: [
        { uid: 'c1', defId: 'slash' },
        { uid: 'c2', defId: 'block' },
      ],
    })
    const next = removeCardFromDeck(state, 'c2')
    expect(next.deck).toEqual([{ uid: 'c1', defId: 'slash' }])
    expect(next.gold).toBe(20)
  })

  it('addCardToDeck should allow shop purchase flow when gold is deducted externally', () => {
    const state = makeRunState({ gold: 100 })
    const withGoldSpent = { ...state, gold: 45 }
    const next = addCardToDeck(withGoldSpent, 'soul_siphon')
    expect(next.deck.length).toBe(1)
    expect(next.deck[0].defId).toBe('soul_siphon')
    expect(next.gold).toBe(45)
  })
})

describe('materials and forge', () => {
  it('addMaterialReward should respect material cap', () => {
    const state = makeRunState({
      materials: { ...EMPTY_MATERIAL_BAG, iron_ingot: 5 },
    })
    const next = addMaterialReward(state, { iron_ingot: 3 })
    expect(next.materials.iron_ingot).toBe(5)
  })

  it('addMaterialReward should respect shared essence total cap (8)', () => {
    const state = makeRunState({
      materials: {
        ...EMPTY_MATERIAL_BAG,
        elemental_essence: 4,
        war_essence: 3,
        guard_essence: 0,
      },
    })
    const next = addMaterialReward(state, { guard_essence: 3 })
    expect(next.materials.guard_essence).toBe(1)
    expect(
      next.materials.elemental_essence +
      next.materials.war_essence +
      next.materials.guard_essence
    ).toBe(8)
  })

  it('craftWeapon should consume materials and add weapon', () => {
    const state = makeRunState({
      materials: { ...EMPTY_MATERIAL_BAG, iron_ingot: 2 },
    })
    const next = craftWeapon(state, 'forge_iron_longsword')
    expect(next.materials.iron_ingot).toBe(0)
    expect(next.weaponInventory.some(w => w.defId === 'iron_longsword')).toBe(true)
  })

  it('craftWeapon steel recipe should accept any one essence', () => {
    const state = makeRunState({
      materials: {
        ...EMPTY_MATERIAL_BAG,
        steel_ingot: 2,
        war_essence: 1,
      },
    })
    const next = craftWeapon(state, 'forge_steel_longsword')
    expect(next.materials.steel_ingot).toBe(0)
    expect(next.materials.war_essence).toBe(0)
    expect(next.weaponInventory.some(w => w.defId === 'steel_longsword')).toBe(true)
  })

  it('craftWeapon should do nothing when materials are not enough', () => {
    const state = makeRunState({
      materials: { ...EMPTY_MATERIAL_BAG, iron_ingot: 1 },
    })
    const next = craftWeapon(state, 'forge_iron_longsword')
    expect(next).toEqual(state)
  })
})

describe('enchantments', () => {
  it('enchantWeapon should consume elemental essence and append enchantment when slot available', () => {
    const weapon: WeaponInstance = { uid: 'w1', defId: 'iron_longsword', enchantments: [] }
    const state = makeRunState({
      equippedWeapon: weapon,
      weaponInventory: [weapon],
      materials: { ...EMPTY_MATERIAL_BAG, elemental_essence: 1 },
    })
    const next = enchantWeapon(state, 'flame')
    expect(next.materials.elemental_essence).toBe(0)
    expect(next.equippedWeapon?.enchantments).toEqual(['flame'])
  })

  it('enchantWeapon should require replaceIndex when slots are full', () => {
    const weapon: WeaponInstance = {
      uid: 'w1',
      defId: 'iron_longsword',
      enchantments: ['flame', 'bless'],
    }
    const state = makeRunState({
      equippedWeapon: weapon,
      weaponInventory: [weapon],
      materials: { ...EMPTY_MATERIAL_BAG, elemental_essence: 2 },
    })
    const blocked = enchantWeapon(state, 'thunder')
    expect(blocked).toEqual(state)
    const replaced = enchantWeapon(state, 'thunder', 1)
    expect(replaced.equippedWeapon?.enchantments).toEqual(['flame', 'thunder'])
    expect(replaced.materials.elemental_essence).toBe(1)
  })
})

describe('act1 flow smoke', () => {
  it('should traverse a valid route from start to boss without blockers', () => {
    let run = createRunState()
    const route = [
      'l2_left',   // layer2 normal
      'l3_mid',    // layer3 event
      'l4_left',   // layer4 normal
      'l5_mid',    // layer5 elite
      'l6_right',  // layer6 campfire
      'l7_boss',   // boss
    ]

    for (const nodeId of route) {
      expect(canAccessNode(run, nodeId)).toBe(true)
      run = moveToNode(run, nodeId)
      run = completeNode(run, nodeId)
    }

    const boss = getNodeById(run.mapNodes, run.currentNodeId)
    expect(boss?.type).toBe('boss_battle')
    expect(isBossNode(run)).toBe(true)
  })
})
