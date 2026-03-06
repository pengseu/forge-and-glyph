import type { MetaProfile, StorageLike } from './meta'
import type { Scene } from './types'
import type { SerializedGameState } from './state-codec'

const AUTO_KEY = 'fg_run_autosave_v1'
const SLOT_KEY_PREFIX = 'fg_run_slot_v1_'
const SLOT_COUNT = 3

export interface SavePayload {
  version: 1
  savedAt: number
  seedText: string
  rngState: number
  gameState: SerializedGameState
  metaProfile: MetaProfile
}

export interface SaveSlotSummary {
  slot: 1 | 2 | 3
  savedAt: number | null
  scene: Scene | null
  act: 1 | 2 | 3 | null
  hp: number | null
  gold: number | null
}

function resolveStorage(storage?: StorageLike): StorageLike | null {
  if (storage) return storage
  if (typeof window === 'undefined' || !window.localStorage) return null
  return window.localStorage
}

function parsePayload(raw: string | null): SavePayload | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<SavePayload>
    if (parsed.version !== 1) return null
    if (!parsed.gameState || !parsed.metaProfile) return null
    return {
      version: 1,
      savedAt: Math.max(0, Math.floor(Number(parsed.savedAt ?? 0))),
      seedText: typeof parsed.seedText === 'string' ? parsed.seedText : '',
      rngState: Math.max(0, Math.floor(Number(parsed.rngState ?? 0))),
      gameState: parsed.gameState as SerializedGameState,
      metaProfile: parsed.metaProfile as MetaProfile,
    }
  } catch {
    return null
  }
}

function slotKey(slot: 1 | 2 | 3): string {
  return `${SLOT_KEY_PREFIX}${slot}`
}

export function saveAuto(payload: SavePayload, storage?: StorageLike): void {
  const store = resolveStorage(storage)
  if (!store) return
  store.setItem(AUTO_KEY, JSON.stringify(payload))
}

export function loadAuto(storage?: StorageLike): SavePayload | null {
  const store = resolveStorage(storage)
  if (!store) return null
  return parsePayload(store.getItem(AUTO_KEY))
}

export function clearAuto(storage?: StorageLike): void {
  const store = resolveStorage(storage)
  if (!store) return
  store.setItem(AUTO_KEY, '')
}

export function saveSlot(slot: 1 | 2 | 3, payload: SavePayload, storage?: StorageLike): void {
  const store = resolveStorage(storage)
  if (!store) return
  store.setItem(slotKey(slot), JSON.stringify(payload))
}

export function loadSlot(slot: 1 | 2 | 3, storage?: StorageLike): SavePayload | null {
  const store = resolveStorage(storage)
  if (!store) return null
  return parsePayload(store.getItem(slotKey(slot)))
}

export function listSlotSummaries(storage?: StorageLike): SaveSlotSummary[] {
  const store = resolveStorage(storage)
  const slots: Array<1 | 2 | 3> = [1, 2, 3]
  return slots.map((slot) => {
    const payload = store ? parsePayload(store.getItem(slotKey(slot))) : null
    return {
      slot,
      savedAt: payload?.savedAt ?? null,
      scene: payload?.gameState.scene ?? null,
      act: payload?.gameState.run?.act ?? null,
      hp: payload?.gameState.run?.playerHp ?? null,
      gold: payload?.gameState.run?.gold ?? null,
    }
  })
}

export function getSlotCount(): number {
  return SLOT_COUNT
}

