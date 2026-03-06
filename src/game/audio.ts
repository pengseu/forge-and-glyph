type AudioSettings = {
  muted: boolean
  master: number
  sfx: number
  bgm: number
}

type SfxType = 'card' | 'hit' | 'heal' | 'victory' | 'defeat' | 'boss_phase'

let settings: AudioSettings = {
  muted: false,
  master: 0.8,
  sfx: 0.9,
  bgm: 0.5,
}

let audioCtx: AudioContext | null = null
let bgmOsc: OscillatorNode | null = null
let bgmGain: GainNode | null = null

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

export function applyAudioSettings(next: AudioSettings): void {
  settings = {
    muted: !!next.muted,
    master: Math.max(0, Math.min(1, next.master)),
    sfx: Math.max(0, Math.min(1, next.sfx)),
    bgm: Math.max(0, Math.min(1, next.bgm)),
  }
  if (bgmGain) {
    bgmGain.gain.value = settings.muted ? 0 : settings.master * settings.bgm * 0.12
  }
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

export function startBgmForAct(act: 1 | 2 | 3): void {
  const ctx = ensureContext()
  if (!ctx || settings.muted) return
  stopBgm()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const baseFreq = act === 1 ? 110 : act === 2 ? 92 : 74
  osc.type = 'triangle'
  osc.frequency.value = baseFreq
  gain.gain.value = settings.master * settings.bgm * 0.12
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
  bgmOsc = osc
  bgmGain = gain
}

export function stopBgm(): void {
  if (bgmOsc) {
    try {
      bgmOsc.stop()
    } catch {
      // no-op
    }
    bgmOsc.disconnect()
    bgmOsc = null
  }
  if (bgmGain) {
    bgmGain.disconnect()
    bgmGain = null
  }
}

