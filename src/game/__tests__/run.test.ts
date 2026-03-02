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
  transformCardInShop,
  craftWeapon,
  enchantWeapon,
  upgradeEquippedWeapon,
  applySkipRewardCompensation,
} from '../run'
import { EMPTY_MATERIAL_BAG } from '../materials'
import { getNodeById } from '../map'

function makeRunState(overrides: Partial<RunState> = {}): RunState {
  return {
    act: 1,
    currentNodeId: 'node_0',
    visitedNodes: new Set(),
    deck: [],
    mapNodes: [],
    turn: 0,
    equippedWeapon: null,
    weaponInventory: [],
    playerHp: 60,
    playerMaxHp: 60,
    gold: 0,
    bonusStrength: 0,
    bonusWisdom: 0,
    bonusMaxMana: 0,
    nextBattleEnemyStrengthBonus: 0,
    materials: { ...EMPTY_MATERIAL_BAG },
    ...overrides,
  }
}

describe('addWeaponToInventory', () => {
  it('should add a weapon to the inventory', () => {
    const state = makeRunState()
    const next = addWeaponToInventory(state, 'iron_longsword')
    expect(next.weaponInventory).toHaveLength(1)
    expect(next.weaponInventory[0].defId).toBe('iron_longsword')
    expect(next.weaponInventory[0].uid).toMatch(/^weapon_/)
  })
})

describe('equipWeapon', () => {
  it('should equip a weapon from inventory', () => {
    const weapon: WeaponInstance = { uid: 'w1', defId: 'iron_longsword', enchantments: [] }
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
  it('should upgrade iron_longsword to steel_longsword', () => {
    const weapon: WeaponInstance = { uid: 'w1', defId: 'iron_longsword', enchantments: [] }
    const state = makeRunState({ equippedWeapon: weapon, weaponInventory: [weapon] })
    const next = upgradeEquippedWeapon(state)
    expect(next.equippedWeapon!.defId).toBe('steel_longsword')
    expect(next.equippedWeapon!.uid).toBe('w1')
    expect(next.weaponInventory[0].defId).toBe('steel_longsword')
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

  it('allows current node even when not completed', () => {
    expect(canAccessNode(base, 'n1')).toBe(true)
  })

  it('blocks moving forward when current node is not completed', () => {
    expect(canAccessNode(base, 'n2')).toBe(false)
  })

  it('allows connected node only after current node is completed', () => {
    const withCurrentCompleted = {
      ...base,
      mapNodes: base.mapNodes.map(n => (n.id === 'n1' ? { ...n, completed: true } : n)),
    }
    expect(canAccessNode(withCurrentCompleted, 'n2')).toBe(true)
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

  it('rejects node when material requirement is not met', () => {
    const run = makeRunState({
      currentNodeId: 'n1',
      materials: { ...EMPTY_MATERIAL_BAG, goblin_crown_fragment: 0 },
      mapNodes: [
        { id: 'n1', type: 'normal_battle', completed: true, x: 0, y: 0, connections: ['n2'] },
        {
          id: 'n2',
          type: 'treasure',
          completed: false,
          x: 1,
          y: 0,
          connections: [],
          requiresMaterial: 'goblin_crown_fragment',
        },
      ],
    })
    expect(canAccessNode(run, 'n2')).toBe(false)
  })

  it('allows node when material requirement is met', () => {
    const run = makeRunState({
      currentNodeId: 'n1',
      materials: { ...EMPTY_MATERIAL_BAG, goblin_crown_fragment: 1 },
      mapNodes: [
        { id: 'n1', type: 'normal_battle', completed: true, x: 0, y: 0, connections: ['n2'] },
        {
          id: 'n2',
          type: 'treasure',
          completed: false,
          x: 1,
          y: 0,
          connections: [],
          requiresMaterial: 'goblin_crown_fragment',
        },
      ],
    })
    expect(canAccessNode(run, 'n2')).toBe(true)
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
  it('normal battle should heal 4 hp', () => {
    const state = makeRunState({ playerHp: 40, playerMaxHp: 60 })
    const next = applyBattleVictoryRewards(state, 'normal_battle')
    expect(next.playerMaxHp).toBe(60)
    expect(next.playerHp).toBe(44)
  })

  it('elite battle should increase max hp by 5 and additionally heal 8 hp', () => {
    const state = makeRunState({ playerHp: 40, playerMaxHp: 60 })
    const next = applyBattleVictoryRewards(state, 'elite_battle')
    expect(next.playerMaxHp).toBe(65)
    expect(next.playerHp).toBe(52)
  })
})

describe('gold rewards', () => {
  it('normal battle gold range should be 18~25', () => {
    expect(generateBattleGold('normal_battle', () => 0)).toBe(18)
    expect(generateBattleGold('normal_battle', () => 0.999999)).toBe(25)
  })

  it('elite battle gold range should be 32~40', () => {
    expect(generateBattleGold('elite_battle', () => 0)).toBe(32)
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

  it('skip reward compensation should grant +25 gold', () => {
    const state = makeRunState({ gold: 10 })
    const next = applySkipRewardCompensation(state)
    expect(next.gold).toBe(35)
  })
})

describe('shop services', () => {
  it('healInShop should heal 30% max hp and cost 25 gold', () => {
    const state = makeRunState({ playerHp: 20, playerMaxHp: 60, gold: 40 })
    const next = healInShop(state)
    expect(next.playerHp).toBe(38)
    expect(next.gold).toBe(15)
  })

  it('removeCardFromDeck should remove exactly one card and cost 40 gold', () => {
    const state = makeRunState({
      gold: 70,
      deck: [
        { uid: 'c1', defId: 'slash' },
        { uid: 'c2', defId: 'block' },
      ],
    })
    const next = removeCardFromDeck(state, 'c2')
    expect(next.deck).toEqual([{ uid: 'c1', defId: 'slash' }])
    expect(next.gold).toBe(30)
  })

  it('shop service prices should scale by act', () => {
    const act2 = makeRunState({ act: 2, playerHp: 20, playerMaxHp: 60, gold: 60 })
    const healed = healInShop(act2)
    expect(healed.playerHp).toBe(38)
    expect(healed.gold).toBe(35)

    const removed = removeCardFromDeck(
      {
        ...act2,
        gold: 70,
        deck: [
          { uid: 'c1', defId: 'slash' },
          { uid: 'c2', defId: 'block' },
        ],
      },
      'c2',
    )
    expect(removed.deck).toEqual([{ uid: 'c1', defId: 'slash' }])
    expect(removed.gold).toBe(20)
  })

  it('addCardToDeck should allow shop purchase flow when gold is deducted externally', () => {
    const state = makeRunState({ gold: 100 })
    const withGoldSpent = { ...state, gold: 45 }
    const next = addCardToDeck(withGoldSpent, 'soul_siphon')
    expect(next.deck.length).toBe(1)
    expect(next.deck[0].defId).toBe('soul_siphon')
    expect(next.gold).toBe(45)
  })

  it('transformCardInShop should still transform starter/basic cards in act3', () => {
    const state = makeRunState({
      act: 3,
      gold: 100,
      deck: [{ uid: 'c1', defId: 'slash' }],
    })
    const next = transformCardInShop(state, 'c1', () => 0)
    expect(next.gold).toBe(65)
    expect(next.deck[0].defId).not.toBe('slash')
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

  it('replica recipe should require unlocked blueprint', () => {
    const locked = makeRunState({
      act: 2,
      materials: {
        ...EMPTY_MATERIAL_BAG,
        iron_ingot: 3,
        elemental_essence: 1,
      },
      unlockedBlueprints: [],
      blueprintMastery: {},
    })
    const next = craftWeapon(locked, 'forge_replica_ant_swarm_dagger')
    expect(next).toEqual(locked)
  })

  it('replica recipe should consume adjusted cost and increase mastery', () => {
    const unlocked = makeRunState({
      act: 2,
      materials: {
        ...EMPTY_MATERIAL_BAG,
        iron_ingot: 3,
        elemental_essence: 1,
      },
      unlockedBlueprints: ['mythic_ant_swarm_dagger'],
      blueprintMastery: { mythic_ant_swarm_dagger: 0 },
    })
    const next = craftWeapon(unlocked, 'forge_replica_ant_swarm_dagger')
    expect(next.weaponInventory.some(w => w.defId === 'replica_ant_swarm_dagger')).toBe(true)
    expect(next.blueprintMastery?.mythic_ant_swarm_dagger).toBe(1)
  })

  it('mastery level 3 should reduce replica cost', () => {
    const state = makeRunState({
      act: 2,
      materials: {
        ...EMPTY_MATERIAL_BAG,
        iron_ingot: 2,
        elemental_essence: 1,
      },
      unlockedBlueprints: ['mythic_ant_swarm_dagger'],
      blueprintMastery: { mythic_ant_swarm_dagger: 3 },
    })
    const next = craftWeapon(state, 'forge_replica_ant_swarm_dagger')
    expect(next.weaponInventory.some(w => w.defId === 'replica_ant_swarm_dagger')).toBe(true)
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
    run = completeNode(run, run.currentNodeId)
    const route = [
      'l2_a',
      'l3_b',
      'l4_a',
      'l5_shop',
      'l6_a',
      'l7_boss',
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
