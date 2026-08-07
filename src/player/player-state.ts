import type { Track } from '../types/track.ts'

export type RepeatMode = 'off' | 'all' | 'one'

export interface PlayerState {
  tracks: Track[]
  currentTrackIndex: number
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  playbackRate: number
  repeatMode: RepeatMode
  shuffle: boolean
}

export function createInitialPlayerState(): PlayerState {
  return {
    tracks: [],
    currentTrackIndex: -1,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    playbackRate: 1,
    repeatMode: 'off',
    shuffle: false,
  }
}
