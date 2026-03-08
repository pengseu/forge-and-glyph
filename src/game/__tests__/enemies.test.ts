import { describe, expect, it } from 'vitest'
import { ENEMIES } from '../enemies'

describe('enemy sprite paths', () => {
  it('should map every enemy id to the expected sprite path', () => {
    for (const [enemyId, def] of Object.entries(ENEMIES)) {
      expect(def.sprite).toBe(`/assets/characters/enemies/${enemyId}.webp`)
    }
  })
})
