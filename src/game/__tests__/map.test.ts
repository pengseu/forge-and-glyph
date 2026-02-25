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

  it('should have 5 normal and 2 elite nodes', () => {
    const map = generateMap()
    const normal = map.filter(n => n.type === 'normal_battle').length
    const elite = map.filter(n => n.type === 'elite_battle').length
    expect(normal).toBe(5)
    expect(elite).toBe(2)
  })

  it('should have 1 campfire node without enemyId', () => {
    const map = generateMap()
    const campfire = map.filter(n => n.type === 'campfire')
    expect(campfire).toHaveLength(1)
    expect(campfire[0].enemyId).toBeUndefined()
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
