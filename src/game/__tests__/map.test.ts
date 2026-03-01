import { describe, it, expect } from 'vitest'
import { generateMap, getNodeById } from '../map'

describe('map', () => {
  it('should generate 14 nodes across 7 layers', () => {
    const map = generateMap()
    expect(map).toHaveLength(14)
    const layers = new Set(map.map(n => n.y))
    expect(layers.size).toBe(7)
  })

  it('should have exactly one start normal node on layer 1', () => {
    const map = generateMap()
    const layer1 = map.filter(n => n.y === 0)
    expect(layer1).toHaveLength(1)
    expect(layer1[0].type).toBe('normal_battle')
  })

  it('should have 1 boss node on layer 7', () => {
    const map = generateMap()
    const bosses = map.filter(n => n.type === 'boss_battle')
    expect(bosses).toHaveLength(1)
    expect(bosses[0].y).toBe(6)
  })

  it('should include required node types for full act1 route', () => {
    const map = generateMap()
    expect(map.filter(n => n.type === 'elite_battle')).toHaveLength(2)
    expect(map.filter(n => n.type === 'campfire')).toHaveLength(2)
    expect(map.filter(n => n.type === 'event')).toHaveLength(1)
    expect(map.filter(n => n.type === 'shop')).toHaveLength(1)
    expect(map.filter(n => n.type === 'forge')).toHaveLength(1)
    expect(map.filter(n => n.type === 'enchant')).toHaveLength(1)
  })

  it('elite nodes should appear in mid/late layers and use phase-3 elites', () => {
    const map = generateMap()
    const elites = map.filter(n => n.type === 'elite_battle')
    expect(elites).toHaveLength(2)
    for (const node of elites) {
      expect([2, 4]).toContain(node.y)
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

  it('all battle nodes should have enemyIds', () => {
    const map = generateMap()
    const battles = map.filter(n => ['normal_battle', 'elite_battle', 'boss_battle'].includes(n.type))
    expect(battles.every(n => (n.enemyIds?.length ?? 0) > 0)).toBe(true)
  })

  it('should find node by id', () => {
    const map = generateMap()
    const node = getNodeById(map, map[0].id)
    expect(node).toBeDefined()
  })
})
