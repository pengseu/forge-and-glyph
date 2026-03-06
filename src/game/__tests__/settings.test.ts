import { describe, expect, it } from 'vitest'
import { createDefaultSettings, loadSettings, saveSettings } from '../settings'

interface MemoryStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

function withWindowStorage<T>(storage: MemoryStorage, run: () => T): T {
  const previous = (globalThis as { window?: unknown }).window
  ;(globalThis as { window?: { localStorage: Storage } }).window = { localStorage: storage as unknown as Storage }
  try {
    return run()
  } finally {
    ;(globalThis as { window?: unknown }).window = previous
  }
}

function createMemoryStorage(): MemoryStorage {
  const map = new Map<string, string>()
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value)
    },
  }
}

describe('settings', () => {
  it('default settings should include guide progress flags', () => {
    const settings = createDefaultSettings()
    expect(settings.guides.act1TutorialCompleted).toBe(false)
    expect(settings.guides.workshop).toBe(false)
    expect(settings.guides.resonance).toBe(false)
    expect(settings.guides.curse).toBe(false)
    expect(settings.guides.materialEmergency).toBe(false)
    expect(settings.guides.temple).toBe(false)
  })

  it('should persist and reload guide progress', () => {
    const storage = createMemoryStorage()
    withWindowStorage(storage, () => {
      const next = createDefaultSettings()
      next.skipTutorial = true
      next.guides.act1TutorialCompleted = true
      next.guides.workshop = true
      next.guides.temple = true
      saveSettings(next)
      const loaded = loadSettings()
      expect(loaded.skipTutorial).toBe(true)
      expect(loaded.guides.act1TutorialCompleted).toBe(true)
      expect(loaded.guides.workshop).toBe(true)
      expect(loaded.guides.temple).toBe(true)
    })
  })

  it('should stay backward compatible when old payload has no guide section', () => {
    const storage = createMemoryStorage()
    withWindowStorage(storage, () => {
      storage.setItem('fg_settings_v1', JSON.stringify({
        skipTutorial: true,
        challengeModeEnabled: false,
        audio: { muted: false, master: 0.6, sfx: 0.5, bgm: 0.4 },
      }))
      const loaded = loadSettings()
      expect(loaded.skipTutorial).toBe(true)
      expect(loaded.guides.act1TutorialCompleted).toBe(false)
      expect(loaded.guides.workshop).toBe(false)
      expect(loaded.guides.temple).toBe(false)
    })
  })
})
