export type TrackSource = File | string

export interface Track {
  id: string
  title: string
  fileName: string
  source: TrackSource
  duration?: number
}
