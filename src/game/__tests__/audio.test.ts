import { describe, expect, it } from 'vitest'
import { resolveBgmTrack } from '../audio'

describe('resolveBgmTrack', () => {
  it('should use title music for title-adjacent scenes', () => {
    expect(resolveBgmTrack('title')).toBe('/music/标题.mp3')
    expect(resolveBgmTrack('weapon_select')).toBe('/music/标题.mp3')
    expect(resolveBgmTrack('style_lab')).toBe('/music/标题.mp3')
  })

  it('should use map music for exploration-related scenes', () => {
    expect(resolveBgmTrack('map')).toBe('/music/地图.mp3')
    expect(resolveBgmTrack('inventory')).toBe('/music/地图.mp3')
    expect(resolveBgmTrack('forge')).toBe('/music/地图.mp3')
    expect(resolveBgmTrack('enchant')).toBe('/music/地图.mp3')
    expect(resolveBgmTrack('event')).toBe('/music/地图.mp3')
    expect(resolveBgmTrack('act_transition')).toBe('/music/地图.mp3')
  })

  it('should distinguish normal and boss battle bgm', () => {
    expect(resolveBgmTrack('battle')).toBe('/music/战斗bgm.mp3')
    expect(resolveBgmTrack('battle', { boss: true })).toBe('/music/boss.mp3')
  })

  it('should use dedicated scene music for shop, campfire and results', () => {
    expect(resolveBgmTrack('shop')).toBe('/music/shop.mp3')
    expect(resolveBgmTrack('campfire')).toBe('/music/篝火.mp3')
    expect(resolveBgmTrack('result', { result: 'victory' })).toBe('/music/胜利.mp3')
    expect(resolveBgmTrack('result', { result: 'defeat' })).toBe('/music/失败.mp3')
  })
})
