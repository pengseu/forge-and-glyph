import { describe, it, expect } from 'vitest'
import { generateMap, generateMapByAct, getNodeById } from '../map'

describe('map', () => {
  it('should generate 12 nodes across 7 layers', () => {
    const map = generateMap()
    expect(map).toHaveLength(12)
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
    expect(bosses[0].id).toBe('l7_boss')
    expect(bosses[0].y).toBe(6)
  })

  it('should have fixed shop/start/boss ids in expected layers', () => {
    const map = generateMap()
    expect(map.find(n => n.id === 'l1_start')?.type).toBe('normal_battle')
    expect(map.find(n => n.id === 'l5_shop')?.type).toBe('shop')
    expect(map.find(n => n.id === 'l7_boss')?.type).toBe('boss_battle')
  })

  it('boss predecessors should be exactly l6_a and l6_b', () => {
    const map = generateMap()
    const boss = map.find(n => n.id === 'l7_boss')!
    const predecessors = map.filter(n => n.connections.includes(boss.id))
    const ids = predecessors.map(n => n.id).sort()
    expect(ids).toEqual(['l6_a', 'l6_b'])
  })

  it('all battle nodes should have enemyIds', () => {
    const map = generateMap()
    const battles = map.filter(n => ['normal_battle', 'elite_battle', 'boss_battle'].includes(n.type))
    expect(battles.every(n => (n.enemyIds?.length ?? 0) > 0)).toBe(true)
  })

  it('layer constraints should hold in repeated generation', () => {
    for (let i = 0; i < 60; i++) {
      const map = generateMap()
      const l2 = map.filter(n => n.y === 1)
      const l3 = map.filter(n => n.y === 2)
      const l4 = map.filter(n => n.y === 3)
      const l6 = map.filter(n => n.y === 5)

      expect(l2.filter(n => n.type === 'normal_battle').length).toBeGreaterThanOrEqual(1)
      expect(l3.filter(n => n.type !== 'normal_battle' && n.type !== 'elite_battle').length).toBeGreaterThanOrEqual(1)
      expect(l3.filter(n => n.type === 'elite_battle').length).toBeLessThanOrEqual(1)
      expect(l4.filter(n => n.type === 'campfire').length).toBeLessThanOrEqual(1)
      expect(l6.filter(n => n.type === 'event').length).toBeLessThanOrEqual(1)
    }
  })

  it('should find node by id', () => {
    const map = generateMap()
    const node = getNodeById(map, map[0].id)
    expect(node).toBeDefined()
  })

  it('generateMapByAct should support act2/act3 fixed map roots', () => {
    const map2 = generateMapByAct(2)
    const map3 = generateMapByAct(3)
    expect(map2.some(n => n.id === 'l1_combat')).toBe(true)
    expect(map3.some(n => n.id === 'l1_combat')).toBe(true)
    expect(map2.some(n => n.type === 'boss_battle')).toBe(true)
    expect(map3.some(n => n.type === 'boss_battle')).toBe(true)
  })

  it('act2 map should be 8 layers / 14 nodes and contain hidden vault rule', () => {
    const map2 = generateMapByAct(2)
    expect(map2).toHaveLength(14)
    expect(new Set(map2.map(n => n.y)).size).toBe(8)
    const vault = map2.find(n => n.id === 'l5_secret')
    expect(vault).toBeDefined()
    expect(vault?.requiresMaterial).toBe('goblin_crown_fragment')
  })

  it('act3 map should be 9 layers / 14 nodes and contain trial + temple nodes', () => {
    const map3 = generateMapByAct(3)
    expect(map3).toHaveLength(14)
    expect(new Set(map3.map(n => n.y)).size).toBe(9)
    expect(map3.some(n => n.type === 'trial')).toBe(true)
    expect(map3.some(n => n.type === 'temple')).toBe(true)
  })
})
