import type { Track } from '../types/track.ts'

export class AudioPlayer {
  readonly element = new Audio()
  private currentObjectUrl: string | null = null

  get currentTime(): number {
    return this.element.currentTime
  }

  get duration(): number {
    return this.element.duration
  }

  get volume(): number {
    return this.element.volume
  }

  get muted(): boolean {
    return this.element.muted
  }

  get playbackRate(): number {
    return this.element.playbackRate
  }

  load(track: Track): void {
    this.element.pause()
    this.releaseObjectUrl()

    if (track.source instanceof File) {
      this.currentObjectUrl = URL.createObjectURL(track.source)
      this.element.src = this.currentObjectUrl
      return
    }

    this.element.src = track.source
  }

  play(): Promise<void> {
    return this.element.play()
  }

  pause(): void {
    this.element.pause()
  }

  seek(time: number): void {
    if (!Number.isFinite(time) || !Number.isFinite(this.duration)) {
      return
    }

    this.element.currentTime = Math.min(Math.max(time, 0), this.duration)
  }

  setVolume(volume: number): void {
    if (!Number.isFinite(volume)) {
      return
    }

    this.element.volume = Math.min(Math.max(volume, 0), 1)
  }

  toggleMuted(): void {
    this.element.muted = !this.element.muted
  }

  setPlaybackRate(rate: number): void {
    if (Number.isFinite(rate) && rate > 0) {
      this.element.playbackRate = rate
    }
  }

  unload(): void {
    this.element.pause()
    this.element.removeAttribute('src')
    this.element.load()
    this.releaseObjectUrl()
  }

  destroy(): void {
    this.unload()
  }

  private releaseObjectUrl(): void {
    if (this.currentObjectUrl) {
      URL.revokeObjectURL(this.currentObjectUrl)
      this.currentObjectUrl = null
    }
  }
}
