import { describe, expect, it } from 'vitest'
import { ENEMIES, getEnemyDef } from '../enemies'

describe('enemy sprite paths', () => {
  it('should map every enemy id to the expected sprite path', () => {
    for (const [enemyId, def] of Object.entries(ENEMIES)) {
      expect(def.sprite).toBe(`/assets/characters/enemies/${enemyId}.webp`)
    }
  })
})


describe('hidden boss definitions', () => {
  it('should expose the first secret boss enemy', () => {
    const enemy = getEnemyDef('gate_warden')
    expect(enemy.name).toBe('门后守望者')
    expect(enemy.intents.length).toBeGreaterThanOrEqual(3)
  })
})
