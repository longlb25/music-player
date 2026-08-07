import type { Track } from '../types/track.ts'
import { createIcon } from '../ui/icons.ts'

export function renderPlaylist(
  container: HTMLElement,
  tracks: readonly Track[],
  currentTrackId: string | null,
  isPlaying: boolean,
): void {
  container.replaceChildren()

  if (tracks.length === 0) {
    const emptyState = document.createElement('p')
    emptyState.className = 'empty-state'
    emptyState.textContent = 'No FLAC files selected yet.'
    container.append(emptyState)
    return
  }

  const list = document.createElement('ol')
  list.className = 'track-list'

  tracks.forEach((track, index) => {
    const item = document.createElement('li')
    item.className = 'track-item'
    item.dataset.trackId = track.id

    const button = document.createElement('button')
    button.className = 'track-button'
    button.type = 'button'
    button.dataset.trackIndex = String(index)
    button.setAttribute('aria-label', `Play ${track.title}`)

    if (track.id === currentTrackId) {
      item.classList.add('is-current')
      button.setAttribute('aria-current', 'true')
    }

    const order = document.createElement('span')
    order.className = 'track-order'
    order.textContent = String(index + 1).padStart(2, '0')

    const name = document.createElement('span')
    name.className = 'track-name'
    name.textContent = track.fileName

    const status = document.createElement('span')
    status.className = 'track-status'
    status.textContent = track.id === currentTrackId
      ? (isPlaying ? 'Playing' : 'Paused')
      : 'FLAC'

    button.append(order, name, status)

    const removeButton = document.createElement('button')
    removeButton.className = 'remove-track-button'
    removeButton.type = 'button'
    removeButton.dataset.removeTrackIndex = String(index)
    removeButton.setAttribute('aria-label', `Remove ${track.title} from playlist`)
    removeButton.title = `Remove ${track.title}`
    removeButton.append(createIcon('close'))

    item.append(button, removeButton)
    list.append(item)
  })

  container.append(list)
}
