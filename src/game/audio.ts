import type { Scene } from './types'

type AudioSettings = {
  muted: boolean
  master: number
  sfx: number
  bgm: number
}

type SfxType = 'card' | 'hit' | 'heal' | 'victory' | 'defeat' | 'boss_phase'

type BgmOptions = {
  boss?: boolean
  result?: 'victory' | 'defeat' | null
}

let settings: AudioSettings = {
  muted: false,
  master: 0.8,
  sfx: 0.9,
  bgm: 0.5,
}

let audioCtx: AudioContext | null = null
let bgmAudio: HTMLAudioElement | null = null
let currentBgmTrack: string | null = null

function ensureContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (settings.muted || settings.master <= 0) return null
  const Ctor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!audioCtx) audioCtx = new Ctor()
  return audioCtx
}

function createBeep(freq: number, durationMs: number, volume: number): void {
  const ctx = ensureContext()
  if (!ctx || settings.muted) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'square'
  osc.frequency.value = freq
  gain.gain.value = Math.max(0, Math.min(1, volume * settings.master * settings.sfx))
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + durationMs / 1000)
}

function resolveBgmVolume(): number {
  return settings.muted ? 0 : Math.max(0, Math.min(1, settings.master * settings.bgm))
}

function applyBgmVolume(): void {
  if (!bgmAudio) return
  bgmAudio.volume = resolveBgmVolume()
}

function ensureBgmAudio(track: string): HTMLAudioElement | null {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return null
  if (bgmAudio && currentBgmTrack === track) return bgmAudio
  stopBgm()
  const audio = new Audio(track)
  audio.loop = true
  audio.preload = 'auto'
  bgmAudio = audio
  currentBgmTrack = track
  applyBgmVolume()
  return audio
}

export function resolveBgmTrack(scene: Scene, options: BgmOptions = {}): string | null {
  if (scene === 'title' || scene === 'weapon_select' || scene === 'style_lab') return '/music/标题.mp3'
  if (scene === 'map' || scene === 'inventory' || scene === 'forge' || scene === 'enchant' || scene === 'event' || scene === 'act_transition') return '/music/地图.mp3'
  if (scene === 'battle') return options.boss ? '/music/boss.mp3' : '/music/战斗bgm.mp3'
  if (scene === 'shop') return '/music/shop.mp3'
  if (scene === 'campfire') return '/music/篝火.mp3'
  if (scene === 'result') return options.result === 'defeat' ? '/music/失败.mp3' : '/music/胜利.mp3'
  return null
}

export function applyAudioSettings(next: AudioSettings): void {
  settings = {
    muted: !!next.muted,
    master: Math.max(0, Math.min(1, next.master)),
    sfx: Math.max(0, Math.min(1, next.sfx)),
    bgm: Math.max(0, Math.min(1, next.bgm)),
  }
  applyBgmVolume()
}

export function playSfx(type: SfxType): void {
  if (settings.muted) return
  if (type === 'card') createBeep(440, 40, 0.3)
  if (type === 'hit') createBeep(200, 60, 0.55)
  if (type === 'heal') createBeep(620, 80, 0.5)
  if (type === 'victory') {
    createBeep(520, 90, 0.5)
    createBeep(780, 120, 0.4)
  }
  if (type === 'defeat') createBeep(110, 180, 0.5)
  if (type === 'boss_phase') {
    createBeep(280, 70, 0.6)
    createBeep(180, 120, 0.6)
  }
}

export function startBgmForScene(scene: Scene, options: BgmOptions = {}): void {
  const track = resolveBgmTrack(scene, options)
  if (!track || settings.muted || settings.master <= 0 || settings.bgm <= 0) {
    stopBgm()
    return
  }
  const audio = ensureBgmAudio(track)
  if (!audio) return
  applyBgmVolume()
  if (!audio.paused) return
  const playPromise = audio.play()
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(() => {})
  }
}

export function stopBgm(): void {
  if (!bgmAudio) {
    currentBgmTrack = null
    return
  }
  try {
    bgmAudio.pause()
    bgmAudio.currentTime = 0
  } catch {
    // no-op
  }
  bgmAudio = null
  currentBgmTrack = null
}
