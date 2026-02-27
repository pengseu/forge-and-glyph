import { describe, it, expect } from 'vitest'
import { generateMap, getNodeById } from '../map'

describe('map', () => {
  it('should generate 9 nodes', () => {
    const map = generateMap()
    expect(map).toHaveLength(9)
  })

  it('should have 1 boss node', () => {
    const map = generateMap()
    const bossNode = map.find(n => n.type === 'boss_battle')
    expect(bossNode).toBeDefined()
  })

  it('should have 3 normal, 2 elite, 1 shop, 1 forge nodes', () => {
    const map = generateMap()
    const normal = map.filter(n => n.type === 'normal_battle').length
    const elite = map.filter(n => n.type === 'elite_battle').length
    const shop = map.filter(n => n.type === 'shop').length
    const forge = map.filter(n => n.type === 'forge').length
    expect(normal).toBe(3)
    expect(elite).toBe(2)
    expect(shop).toBe(1)
    expect(forge).toBe(1)
  })

  it('elite nodes should use phase-3 elite enemies', () => {
    const map = generateMap()
    const elites = map.filter(n => n.type === 'elite_battle')
    expect(elites).toHaveLength(2)
    for (const node of elites) {
      expect(node.enemyIds).toBeDefined()
      expect(node.enemyIds).toHaveLength(1)
      expect(['shadow_assassin', 'stone_gargoyle']).toContain(node.enemyIds![0])
    }
  })

  it('boss predecessor nodes should not be elite', () => {
    const map = generateMap()
    const boss = map.find(n => n.type === 'boss_battle')!
    const predecessors = map.filter(n => n.connections.includes(boss.id))
    expect(predecessors.length).toBeGreaterThan(0)
    expect(predecessors.some(n => n.type === 'elite_battle')).toBe(false)
  })

  it('should have 1 campfire node without enemyId', () => {
    const map = generateMap()
    const campfire = map.filter(n => n.type === 'campfire')
    expect(campfire).toHaveLength(1)
    expect(campfire[0].enemyIds).toBeUndefined()
  })

  it('campfire node should connect to subsequent nodes', () => {
    const map = generateMap()
    const campfire = map.find(n => n.type === 'campfire')!
    expect(campfire.connections.length).toBeGreaterThan(0)
  })

  it('should have nodes connecting to campfire', () => {
    const map = generateMap()
    const campfire = map.find(n => n.type === 'campfire')!
    const nodesConnectingToCampfire = map.filter(n => n.connections.includes(campfire.id))
    expect(nodesConnectingToCampfire.length).toBeGreaterThan(0)
  })

  it('should find node by id', () => {
    const map = generateMap()
    const node = getNodeById(map, map[0].id)
    expect(node).toBeDefined()
  })
})
