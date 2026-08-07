import type { Track } from '../types/track.ts'

function shuffleIndices(indices: number[]): number[] {
  const shuffled = [...indices]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const current = shuffled[index]
    shuffled[index] = shuffled[swapIndex]!
    shuffled[swapIndex] = current!
  }

  return shuffled
}

export class PlaylistManager {
  private items: Track[] = []
  private selectedIndex = -1
  private shuffleActive = false
  private upcomingIndices: number[] = []
  private historyIndices: number[] = []

  get tracks(): readonly Track[] {
    return this.items
  }

  get currentIndex(): number {
    return this.selectedIndex
  }

  get currentTrack(): Track | null {
    return this.items[this.selectedIndex] ?? null
  }

  get shuffleEnabled(): boolean {
    return this.shuffleActive
  }

  canMovePrevious(wrap = false): boolean {
    if (this.shuffleActive) {
      return this.historyIndices.length > 0
    }

    return this.selectedIndex > 0 || (wrap && this.items.length > 1)
  }

  canMoveNext(wrap = false): boolean {
    if (this.selectedIndex < 0) {
      return false
    }

    if (this.shuffleActive) {
      return this.upcomingIndices.length > 0 || (wrap && this.items.length > 1)
    }

    return this.selectedIndex < this.items.length - 1 || (wrap && this.items.length > 1)
  }

  replace(tracks: Track[]): void {
    this.items = [...tracks]
    this.selectedIndex = -1
    this.resetShuffleState()
  }

  select(index: number): Track | null {
    if (index < 0 || index >= this.items.length) {
      return null
    }

    if (this.shuffleActive && this.selectedIndex >= 0 && this.selectedIndex !== index) {
      this.historyIndices.push(this.selectedIndex)
    }

    this.selectedIndex = index
    this.upcomingIndices = this.upcomingIndices.filter((itemIndex) => itemIndex !== index)
    return this.currentTrack
  }

  setShuffle(enabled: boolean): void {
    if (this.shuffleActive === enabled) {
      return
    }

    this.shuffleActive = enabled
    this.resetShuffleState()
  }

  movePrevious(wrap = false): Track | null {
    if (this.shuffleActive) {
      const previousIndex = this.historyIndices.pop()

      if (previousIndex === undefined) {
        return null
      }

      if (this.selectedIndex >= 0 && !this.upcomingIndices.includes(this.selectedIndex)) {
        this.upcomingIndices.unshift(this.selectedIndex)
      }

      this.selectedIndex = previousIndex
      return this.currentTrack
    }

    if (this.selectedIndex > 0) {
      return this.select(this.selectedIndex - 1)
    }

    return wrap && this.items.length > 0 ? this.select(this.items.length - 1) : null
  }

  moveNext(wrap = false): Track | null {
    if (this.shuffleActive) {
      if (this.upcomingIndices.length === 0 && wrap) {
        this.refillShuffleQueue()
      }

      const nextIndex = this.upcomingIndices.shift()

      if (nextIndex === undefined) {
        return wrap ? this.currentTrack : null
      }

      return this.select(nextIndex)
    }

    if (this.selectedIndex < this.items.length - 1) {
      return this.select(this.selectedIndex + 1)
    }

    return wrap && this.items.length > 0 ? this.select(0) : null
  }

  remove(index: number): Track | null {
    if (index < 0 || index >= this.items.length) {
      return null
    }

    const [removedTrack] = this.items.splice(index, 1)

    if (index === this.selectedIndex) {
      this.selectedIndex = -1
    } else if (index < this.selectedIndex) {
      this.selectedIndex -= 1
    }

    this.resetShuffleState()
    return removedTrack ?? null
  }

  clear(): void {
    this.items = []
    this.selectedIndex = -1
    this.resetShuffleState()
  }

  private resetShuffleState(): void {
    this.historyIndices = []
    this.refillShuffleQueue()
  }

  private refillShuffleQueue(): void {
    if (!this.shuffleActive) {
      this.upcomingIndices = []
      return
    }

    const candidates = this.items
      .map((_, index) => index)
      .filter((index) => index !== this.selectedIndex)
    this.upcomingIndices = shuffleIndices(candidates)
  }
}
