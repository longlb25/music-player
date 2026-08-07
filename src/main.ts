import './style.css'
import { getFlacFilesFromDirectory, importFlacFiles } from './file/file-importer.ts'
import { AudioPlayer } from './player/audio-player.ts'
import type { RepeatMode } from './player/player-state.ts'
import { PlaylistManager } from './playlist/playlist-manager.ts'
import { renderPlaylist } from './playlist/playlist-view.ts'
import {
  clearDirectoryHandle,
  loadDirectoryHandle,
  saveDirectoryHandle,
} from './storage/folder-handle-storage.ts'
import { loadSettings, saveSettings } from './storage/settings-storage.ts'
import { iconMarkup, iconSpriteMarkup, type IconName } from './ui/icons.ts'

type MessageTone = 'success' | 'warning' | 'error'

function getRequiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector)

  if (!element) {
    throw new Error(`Required element was not found: ${selector}`)
  }

  return element
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00'
  }

  const wholeSeconds = Math.floor(seconds)
  const minutes = Math.floor(wholeSeconds / 60)
  const remainingSeconds = String(wholeSeconds % 60).padStart(2, '0')
  return `${minutes}:${remainingSeconds}`
}

function setIconButton(button: HTMLButtonElement, icon: IconName, label: string): void {
  button.innerHTML = iconMarkup(icon)
  button.setAttribute('aria-label', label)
  button.title = label
}

function setLabeledIconButton(button: HTMLButtonElement, icon: IconName, label: string): void {
  button.innerHTML = `${iconMarkup(icon)}<span>${label}</span>`
  button.setAttribute('aria-label', label)
  button.title = label
}

const app = getRequiredElement<HTMLDivElement>('#app')

app.innerHTML = `
  ${iconSpriteMarkup}
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-mark" aria-hidden="true">LP</span>
        <div>
          <p class="eyebrow">Local audio</p>
          <span class="brand-name">FLAC Player</span>
        </div>
      </div>

      <nav class="sidebar-nav" aria-label="Main navigation">
        <span class="nav-item is-active">Your Library</span>
        <span class="nav-item">Local files only</span>
      </nav>

      <section class="source-card" aria-labelledby="source-title">
        <div>
          <p class="eyebrow">Music source</p>
          <h2 id="source-title">Add your music</h2>
          <p class="source-description">Files stay on this device and are never uploaded.</p>
        </div>

        <div class="import-actions">
          <button id="folder-access-button" class="primary-button" type="button">
            ${iconMarkup('folder')}<span>Choose folder</span>
          </button>
          <label id="folder-input-label" class="primary-button is-hidden">
            ${iconMarkup('folder')}<span>Choose folder</span>
            <input
              id="folder-input"
              class="visually-hidden"
              type="file"
              accept=".flac,audio/flac"
              webkitdirectory
              multiple
            />
          </label>
          <label class="secondary-button">
            ${iconMarkup('files')}<span>Choose FLAC files</span>
            <input
              id="file-input"
              class="visually-hidden"
              type="file"
              accept=".flac,audio/flac"
              multiple
            />
          </label>
          <button id="forget-folder-button" class="text-button is-hidden" type="button">
            ${iconMarkup('trash')}<span>Forget saved folder</span>
          </button>
        </div>
      </section>
    </aside>

    <main class="main-view">
      <header class="main-header">
        <div>
          <p class="eyebrow">Playlist</p>
          <h1>My FLAC Library</h1>
          <p class="header-description">High-quality local playback, directly in your browser.</p>
        </div>
        <div class="playlist-actions">
          <span id="track-count" class="track-count">0 tracks</span>
          <button id="clear-button" class="text-button" type="button" disabled>
            ${iconMarkup('trash')}<span>Clear playlist</span>
          </button>
        </div>
      </header>

      <p id="app-message" class="app-message" aria-live="polite"></p>

      <section id="drop-zone" class="playlist-panel" aria-labelledby="playlist-title">
        <div class="playlist-heading">
          <div>
            <p class="eyebrow">Your music</p>
            <h2 id="playlist-title">Tracks</h2>
          </div>
          <p class="drop-hint">Drop FLAC files here</p>
        </div>
        <div class="track-table-heading" aria-hidden="true">
          <span>#</span>
          <span>Title</span>
          <span>Status</span>
          <span></span>
        </div>
        <div id="playlist"></div>
      </section>
    </main>

    <section class="player-panel" aria-label="Audio player">
      <div class="now-playing">
        <div class="track-art" aria-hidden="true">FLAC</div>
        <div class="now-playing-copy">
          <span class="eyebrow">Now playing</span>
          <strong id="now-playing-title">Nothing selected</strong>
        </div>
      </div>

      <div class="player-center">
        <div class="transport-controls" aria-label="Playback controls">
          <button id="shuffle-button" class="control-button mode-button" type="button" aria-label="Shuffle: Off" title="Shuffle: Off">${iconMarkup('shuffle')}</button>
          <button id="previous-button" class="control-button" type="button" aria-label="Previous" title="Previous" disabled>${iconMarkup('previous')}</button>
          <button id="play-button" class="control-button control-button--primary" type="button" aria-label="Play" title="Play" disabled>${iconMarkup('play')}</button>
          <button id="next-button" class="control-button" type="button" aria-label="Next" title="Next" disabled>${iconMarkup('next')}</button>
          <button id="repeat-button" class="control-button mode-button" type="button" aria-label="Loop: Off" title="Loop: Off">${iconMarkup('repeat')}</button>
        </div>
        <div class="timeline-row">
          <span id="current-time" class="time-value">0:00</span>
          <input
            id="progress-input"
            class="range-input"
            type="range"
            min="0"
            max="0"
            value="0"
            step="0.1"
            aria-label="Playback position"
            disabled
          />
          <span id="duration" class="time-value">0:00</span>
        </div>
      </div>

      <div class="player-settings">
        <label class="speed-control" for="speed-select">
          <span>Speed</span>
          <select id="speed-select">
            <option value="0.5">0.5x</option>
            <option value="1" selected>1x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>
        </label>
        <label class="volume-control" for="volume-input">
          <span>Volume</span>
          <input id="volume-input" class="range-input" type="range" min="0" max="1" value="1" step="0.01" />
          <span id="volume-value" class="setting-value">100%</span>
        </label>
        <button id="mute-button" class="control-button control-button--compact" type="button" aria-label="Mute" title="Mute">${iconMarkup('volume')}</button>
        <p class="shortcut-hint">Space play/pause · N/P next/previous · Arrows seek/volume</p>
      </div>
    </section>
  </div>
`

const fileInput = getRequiredElement<HTMLInputElement>('#file-input')
const folderInput = getRequiredElement<HTMLInputElement>('#folder-input')
const folderInputLabel = getRequiredElement<HTMLElement>('#folder-input-label')
const folderAccessButton = getRequiredElement<HTMLButtonElement>('#folder-access-button')
const forgetFolderButton = getRequiredElement<HTMLButtonElement>('#forget-folder-button')
const dropZone = getRequiredElement<HTMLElement>('#drop-zone')
const playlistElement = getRequiredElement<HTMLElement>('#playlist')
const trackCountElement = getRequiredElement<HTMLElement>('#track-count')
const clearButton = getRequiredElement<HTMLButtonElement>('#clear-button')
const messageElement = getRequiredElement<HTMLElement>('#app-message')
const nowPlayingTitle = getRequiredElement<HTMLElement>('#now-playing-title')
const previousButton = getRequiredElement<HTMLButtonElement>('#previous-button')
const playButton = getRequiredElement<HTMLButtonElement>('#play-button')
const nextButton = getRequiredElement<HTMLButtonElement>('#next-button')
const progressInput = getRequiredElement<HTMLInputElement>('#progress-input')
const currentTimeElement = getRequiredElement<HTMLElement>('#current-time')
const durationElement = getRequiredElement<HTMLElement>('#duration')
const shuffleButton = getRequiredElement<HTMLButtonElement>('#shuffle-button')
const repeatButton = getRequiredElement<HTMLButtonElement>('#repeat-button')
const volumeInput = getRequiredElement<HTMLInputElement>('#volume-input')
const volumeValue = getRequiredElement<HTMLElement>('#volume-value')
const muteButton = getRequiredElement<HTMLButtonElement>('#mute-button')
const speedSelect = getRequiredElement<HTMLSelectElement>('#speed-select')

const playlist = new PlaylistManager()
const audioPlayer = new AudioPlayer()
const savedSettings = loadSettings()
let playbackRequestId = 0
let repeatMode: RepeatMode = savedSettings?.repeatMode ?? 'off'
let connectedDirectory: FileSystemDirectoryHandle | null = null
let directoryNeedsReconnect = false
let isScanningDirectory = false

const supportsDirectoryAccess = 'showDirectoryPicker' in window

audioPlayer.setVolume(savedSettings?.volume ?? 1)
audioPlayer.setPlaybackRate(savedSettings?.playbackRate ?? 1)
playlist.setShuffle(savedSettings?.shuffle ?? false)

function setMessage(message = '', tone?: MessageTone): void {
  messageElement.textContent = message

  if (tone) {
    messageElement.dataset.tone = tone
  } else {
    delete messageElement.dataset.tone
  }
}

function updateFolderControls(): void {
  folderAccessButton.classList.toggle('is-hidden', !supportsDirectoryAccess)
  folderInputLabel.classList.toggle('is-hidden', supportsDirectoryAccess)
  forgetFolderButton.classList.toggle('is-hidden', !connectedDirectory)
  folderAccessButton.disabled = isScanningDirectory
  const folderActionLabel = isScanningDirectory
    ? 'Scanning folder...'
    : directoryNeedsReconnect
      ? 'Reconnect folder'
      : connectedDirectory
        ? 'Change folder'
        : 'Choose folder'
  setLabeledIconButton(folderAccessButton, 'folder', folderActionLabel)
}

function persistSettings(): void {
  saveSettings({
    volume: audioPlayer.volume,
    playbackRate: audioPlayer.playbackRate,
    repeatMode,
    shuffle: playlist.shuffleEnabled,
  })
}

function stopAndUnload(): void {
  playbackRequestId += 1
  audioPlayer.unload()
}

function updateTimeline(): void {
  const duration = Number.isFinite(audioPlayer.duration) ? audioPlayer.duration : 0
  const currentTime = Number.isFinite(audioPlayer.currentTime) ? audioPlayer.currentTime : 0

  progressInput.max = String(duration)
  progressInput.value = String(Math.min(currentTime, duration))
  progressInput.disabled = duration <= 0
  currentTimeElement.textContent = formatTime(currentTime)
  durationElement.textContent = formatTime(duration)
}

function updateSettingsUi(): void {
  volumeInput.value = String(audioPlayer.volume)
  volumeValue.textContent = `${Math.round(audioPlayer.volume * 100)}%`
  setIconButton(
    muteButton,
    audioPlayer.muted ? 'volume-off' : 'volume',
    audioPlayer.muted ? 'Unmute' : 'Mute',
  )
  muteButton.setAttribute('aria-pressed', String(audioPlayer.muted))
  speedSelect.value = String(audioPlayer.playbackRate)
  const shuffleLabel = `Shuffle: ${playlist.shuffleEnabled ? 'On' : 'Off'}`
  setIconButton(shuffleButton, 'shuffle', shuffleLabel)
  shuffleButton.dataset.active = String(playlist.shuffleEnabled)
  shuffleButton.setAttribute('aria-pressed', String(playlist.shuffleEnabled))
  const repeatLabel = `Loop: ${repeatMode === 'off' ? 'Off' : repeatMode === 'all' ? 'All' : 'One'}`
  setIconButton(repeatButton, 'repeat', repeatLabel)
  repeatButton.dataset.active = String(repeatMode !== 'off')
  repeatButton.setAttribute('aria-pressed', String(repeatMode !== 'off'))
}

function updateUi(): void {
  const isPlaying = !audioPlayer.element.paused && !audioPlayer.element.ended
  renderPlaylist(playlistElement, playlist.tracks, playlist.currentTrack?.id ?? null, isPlaying)

  const count = playlist.tracks.length
  trackCountElement.textContent = `${count} ${count === 1 ? 'track' : 'tracks'}`
  nowPlayingTitle.textContent = playlist.currentTrack?.fileName ?? 'Nothing selected'

  playButton.disabled = count === 0
  setIconButton(playButton, isPlaying ? 'pause' : 'play', isPlaying ? 'Pause' : 'Play')
  playButton.setAttribute('aria-pressed', String(isPlaying))
  previousButton.disabled = !playlist.canMovePrevious(repeatMode === 'all')
  nextButton.disabled = !playlist.canMoveNext(repeatMode === 'all')
  clearButton.disabled = count === 0
  updateTimeline()
  updateSettingsUi()
}

async function playCurrentTrack(loadTrack: boolean): Promise<void> {
  const track = playlist.currentTrack

  if (!track) {
    return
  }

  const requestId = ++playbackRequestId

  try {
    if (loadTrack) {
      audioPlayer.load(track)
    }

    await audioPlayer.play()
    if (requestId === playbackRequestId) {
      setMessage()
    }
  } catch {
    if (requestId === playbackRequestId && playlist.currentTrack?.id === track.id) {
      audioPlayer.pause()
      setMessage(`Could not play "${track.fileName}".`, 'error')
      updateUi()
    }
  }
}

async function selectAndPlay(index: number): Promise<void> {
  if (!playlist.select(index)) {
    return
  }

  updateUi()
  await playCurrentTrack(true)
}

function replacePlaylistFromFiles(files: Iterable<File>, sourceLabel: string): void {
  const result = importFlacFiles(files)

  if (result.tracks.length === 0) {
    if (result.rejectedFiles.length > 0) {
      setMessage(`No FLAC files found in ${sourceLabel}.`, 'warning')
    }

    return
  }

  stopAndUnload()
  playlist.replace(result.tracks)
  updateUi()

  if (result.rejectedFiles.length > 0) {
    setMessage(
      `${result.tracks.length} FLAC file(s) loaded; ${result.rejectedFiles.length} other file(s) skipped.`,
      'warning',
    )
  } else {
    setMessage(`${result.tracks.length} FLAC file(s) loaded from ${sourceLabel}.`, 'success')
  }
}

async function scanDirectory(handle: FileSystemDirectoryHandle): Promise<void> {
  isScanningDirectory = true
  updateFolderControls()
  setMessage(`Scanning folder "${handle.name}"...`)

  try {
    const files = await getFlacFilesFromDirectory(handle)

    if (files.length === 0) {
      setMessage(`No FLAC files found in folder "${handle.name}".`, 'warning')
      return
    }

    replacePlaylistFromFiles(files, `folder "${handle.name}"`)
  } catch {
    setMessage(`Could not read folder "${handle.name}". Reconnect it and try again.`, 'error')
  } finally {
    isScanningDirectory = false
    updateFolderControls()
  }
}

async function chooseOrReconnectDirectory(): Promise<void> {
  if (connectedDirectory && directoryNeedsReconnect) {
    const permission = await connectedDirectory.requestPermission({ mode: 'read' })

    if (permission === 'granted') {
      directoryNeedsReconnect = false
      updateFolderControls()
      await scanDirectory(connectedDirectory)
      return
    }

    await clearDirectoryHandle().catch(() => undefined)
    connectedDirectory = null
    directoryNeedsReconnect = false
    updateFolderControls()
    setMessage('Folder access was not granted. Choose the folder again.', 'warning')
    return
  }

  try {
    const handle = await window.showDirectoryPicker({
      id: 'flac-library',
      mode: 'read',
      startIn: 'music',
    })

    connectedDirectory = handle
    directoryNeedsReconnect = false
    updateFolderControls()

    let handleWasSaved = true

    try {
      await saveDirectoryHandle(handle)
    } catch {
      handleWasSaved = false
    }

    await scanDirectory(handle)

    if (!handleWasSaved) {
      setMessage('Folder loaded, but the browser could not remember it for the next visit.', 'warning')
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return
    }

    setMessage('The folder picker could not be opened.', 'error')
  }
}

async function restoreSavedDirectory(): Promise<void> {
  if (!supportsDirectoryAccess) {
    updateFolderControls()
    return
  }

  try {
    connectedDirectory = await loadDirectoryHandle()

    if (!connectedDirectory) {
      updateFolderControls()
      return
    }

    const permission = await connectedDirectory.queryPermission({ mode: 'read' })

    if (permission === 'granted') {
      directoryNeedsReconnect = false
      updateFolderControls()
      await scanDirectory(connectedDirectory)
    } else {
      directoryNeedsReconnect = true
      updateFolderControls()
      setMessage(`Reconnect folder "${connectedDirectory.name}" to restore your playlist.`, 'warning')
    }
  } catch {
    connectedDirectory = null
    directoryNeedsReconnect = false
    updateFolderControls()
    setMessage('The saved folder could not be restored. Choose it again.', 'warning')
  }
}

fileInput.addEventListener('change', () => {
  replacePlaylistFromFiles(fileInput.files ?? [], 'file selection')
  fileInput.value = ''
})

folderInput.addEventListener('change', () => {
  replacePlaylistFromFiles(folderInput.files ?? [], 'folder')
  folderInput.value = ''
})

folderAccessButton.addEventListener('click', () => {
  void chooseOrReconnectDirectory()
})

forgetFolderButton.addEventListener('click', () => {
  void clearDirectoryHandle()
    .then(() => {
      connectedDirectory = null
      directoryNeedsReconnect = false
      updateFolderControls()
      setMessage('Saved folder forgotten. The current playlist is unchanged.', 'success')
    })
    .catch(() => setMessage('The saved folder could not be forgotten.', 'error'))
})

playlistElement.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) {
    return
  }

  const removeButton = event.target.closest<HTMLButtonElement>('[data-remove-track-index]')
  const removeIndex = Number(removeButton?.dataset.removeTrackIndex)

  if (removeButton && Number.isInteger(removeIndex)) {
    const removedCurrentTrack = playlist.currentIndex === removeIndex
    const removedTrack = playlist.remove(removeIndex)

    if (removedTrack) {
      if (removedCurrentTrack) {
        stopAndUnload()
      }

      setMessage(`Removed "${removedTrack.fileName}" from the playlist.`, 'success')
      updateUi()
    }

    return
  }

  const trackButton = event.target.closest<HTMLButtonElement>('[data-track-index]')
  const index = Number(trackButton?.dataset.trackIndex)

  if (trackButton && Number.isInteger(index)) {
    void selectAndPlay(index)
  }
})

clearButton.addEventListener('click', () => {
  stopAndUnload()
  playlist.clear()
  setMessage('Playlist cleared.', 'success')
  updateUi()
})

dropZone.addEventListener('dragover', (event) => {
  if (!Array.from(event.dataTransfer?.types ?? []).includes('Files')) {
    return
  }

  event.preventDefault()
  dropZone.classList.add('is-dragging')

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
})

dropZone.addEventListener('dragleave', (event) => {
  if (event.relatedTarget instanceof Node && dropZone.contains(event.relatedTarget)) {
    return
  }

  dropZone.classList.remove('is-dragging')
})

dropZone.addEventListener('drop', (event) => {
  event.preventDefault()
  dropZone.classList.remove('is-dragging')
  replacePlaylistFromFiles(event.dataTransfer?.files ?? [], 'drop')
})

playButton.addEventListener('click', () => {
  if (!playlist.currentTrack) {
    void selectAndPlay(0)
  } else if (audioPlayer.element.paused) {
    void playCurrentTrack(false)
  } else {
    audioPlayer.pause()
  }
})

previousButton.addEventListener('click', () => {
  if (playlist.movePrevious(repeatMode === 'all')) {
    updateUi()
    void playCurrentTrack(true)
  }
})

nextButton.addEventListener('click', () => {
  if (playlist.moveNext(repeatMode === 'all')) {
    updateUi()
    void playCurrentTrack(true)
  }
})

progressInput.addEventListener('input', () => {
  audioPlayer.seek(Number(progressInput.value))
  updateTimeline()
})

volumeInput.addEventListener('input', () => {
  audioPlayer.setVolume(Number(volumeInput.value))

  if (audioPlayer.muted && audioPlayer.volume > 0) {
    audioPlayer.toggleMuted()
  }

  persistSettings()
})

muteButton.addEventListener('click', () => audioPlayer.toggleMuted())

speedSelect.addEventListener('change', () => {
  audioPlayer.setPlaybackRate(Number(speedSelect.value))
  persistSettings()
})

shuffleButton.addEventListener('click', () => {
  playlist.setShuffle(!playlist.shuffleEnabled)
  persistSettings()
  updateUi()
})

repeatButton.addEventListener('click', () => {
  const modes: RepeatMode[] = ['off', 'all', 'one']
  const currentModeIndex = modes.indexOf(repeatMode)
  repeatMode = modes[(currentModeIndex + 1) % modes.length]!
  persistSettings()
  updateUi()
})

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement
    && Boolean(target.closest('input, select, textarea, button, [contenteditable="true"]'))
}

window.addEventListener('keydown', (event) => {
  if (isInteractiveTarget(event.target)) {
    return
  }

  const key = event.key.toLowerCase()

  if (event.repeat && (key === ' ' || key === 'n' || key === 'p')) {
    return
  }

  switch (key) {
    case ' ':
      event.preventDefault()
      playButton.click()
      break
    case 'arrowright':
      event.preventDefault()
      audioPlayer.seek(audioPlayer.currentTime + 5)
      updateTimeline()
      break
    case 'arrowleft':
      event.preventDefault()
      audioPlayer.seek(audioPlayer.currentTime - 5)
      updateTimeline()
      break
    case 'arrowup':
      event.preventDefault()
      audioPlayer.setVolume(audioPlayer.volume + 0.05)

      if (audioPlayer.muted && audioPlayer.volume > 0) {
        audioPlayer.toggleMuted()
      }

      persistSettings()
      updateSettingsUi()
      break
    case 'arrowdown':
      event.preventDefault()
      audioPlayer.setVolume(audioPlayer.volume - 0.05)
      persistSettings()
      updateSettingsUi()
      break
    case 'n':
      event.preventDefault()
      nextButton.click()
      break
    case 'p':
      event.preventDefault()
      previousButton.click()
      break
  }
})

audioPlayer.element.addEventListener('play', updateUi)
audioPlayer.element.addEventListener('pause', updateUi)
audioPlayer.element.addEventListener('timeupdate', updateTimeline)
audioPlayer.element.addEventListener('durationchange', updateTimeline)
audioPlayer.element.addEventListener('loadedmetadata', () => {
  if (!Number.isFinite(audioPlayer.duration) || audioPlayer.duration <= 0) {
    setMessage('Track metadata could not be read completely.', 'warning')
  }

  updateTimeline()
})
audioPlayer.element.addEventListener('volumechange', updateSettingsUi)
audioPlayer.element.addEventListener('ratechange', updateSettingsUi)
audioPlayer.element.addEventListener('ended', () => {
  if (repeatMode === 'one') {
    void playCurrentTrack(true)
  } else if (playlist.moveNext(repeatMode === 'all')) {
    updateUi()
    void playCurrentTrack(true)
  } else {
    updateUi()
  }
})
audioPlayer.element.addEventListener('error', () => {
  const track = playlist.currentTrack

  playbackRequestId += 1
  audioPlayer.pause()

  if (track) {
    setMessage(`The browser could not load "${track.fileName}".`, 'error')
  }

  updateUi()
})

window.addEventListener('beforeunload', () => {
  playbackRequestId += 1
  audioPlayer.destroy()
})

updateUi()
updateFolderControls()
void restoreSavedDirectory()
