import type { RepeatMode } from '../player/player-state.ts'

export interface PlayerSettings {
  volume: number
  playbackRate: number
  repeatMode: RepeatMode
  shuffle: boolean
}

const STORAGE_KEY = 'flac-player:settings'
const ALLOWED_PLAYBACK_RATES = [0.5, 1, 1.25, 1.5, 2]
const ALLOWED_REPEAT_MODES: RepeatMode[] = ['off', 'all', 'one']

export function saveSettings(settings: PlayerSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Settings are optional; playback should continue if storage is unavailable.
  }
}

export function loadSettings(): PlayerSettings | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)

    if (!value) {
      return null
    }

    const parsed: unknown = JSON.parse(value)

    if (!parsed || typeof parsed !== 'object') {
      return null
    }

    const settings = parsed as Record<string, unknown>
    const volume = settings.volume
    const playbackRate = settings.playbackRate
    const repeatMode = ALLOWED_REPEAT_MODES.includes(settings.repeatMode as RepeatMode)
      ? settings.repeatMode as RepeatMode
      : 'off'
    const shuffle = typeof settings.shuffle === 'boolean' ? settings.shuffle : false

    if (
      typeof volume !== 'number'
      || volume < 0
      || volume > 1
      || typeof playbackRate !== 'number'
      || !ALLOWED_PLAYBACK_RATES.includes(playbackRate)
    ) {
      return null
    }

    return { volume, playbackRate, repeatMode, shuffle }
  } catch {
    return null
  }
}
