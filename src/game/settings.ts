export interface GameSettings {
  skipTutorial: boolean
  challengeModeEnabled: boolean
  guides: {
    act1TutorialCompleted: boolean
    workshop: boolean
    resonance: boolean
    curse: boolean
    materialEmergency: boolean
    temple: boolean
  }
  audio: {
    muted: boolean
    master: number
    sfx: number
    bgm: number
  }
}

const SETTINGS_KEY = 'fg_settings_v1'

export function createDefaultSettings(): GameSettings {
  return {
    skipTutorial: false,
    challengeModeEnabled: false,
    guides: {
      act1TutorialCompleted: false,
      workshop: false,
      resonance: false,
      curse: false,
      materialEmergency: false,
      temple: false,
    },
    audio: {
      muted: false,
      master: 0.8,
      sfx: 0.9,
      bgm: 0.5,
    },
  }
}

function normalizeVolume(value: unknown, fallback: number): number {
  const num = Number(value)
  if (!Number.isFinite(num)) return fallback
  return Math.max(0, Math.min(1, num))
}

export function loadSettings(): GameSettings {
  if (typeof window === 'undefined' || !window.localStorage) return createDefaultSettings()
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY)
    if (!raw) return createDefaultSettings()
    const parsed = JSON.parse(raw) as Partial<GameSettings>
    const defaults = createDefaultSettings()
    return {
      skipTutorial: !!parsed.skipTutorial,
      challengeModeEnabled: !!parsed.challengeModeEnabled,
      guides: {
        act1TutorialCompleted: !!parsed.guides?.act1TutorialCompleted,
        workshop: !!parsed.guides?.workshop,
        resonance: !!parsed.guides?.resonance,
        curse: !!parsed.guides?.curse,
        materialEmergency: !!parsed.guides?.materialEmergency,
        temple: !!parsed.guides?.temple,
      },
      audio: {
        muted: !!parsed.audio?.muted,
        master: normalizeVolume(parsed.audio?.master, defaults.audio.master),
        sfx: normalizeVolume(parsed.audio?.sfx, defaults.audio.sfx),
        bgm: normalizeVolume(parsed.audio?.bgm, defaults.audio.bgm),
      },
    }
  } catch {
    return createDefaultSettings()
  }
}

export function saveSettings(settings: GameSettings): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}
