# Local FLAC Player

A lightweight browser-based player for local FLAC files. The app uses Vite,
TypeScript, native browser audio APIs, and no backend.

## Requirements

- Node.js 24 LTS
- npm 11 or newer
- A modern desktop browser such as Chrome or Edge

## Development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## Current status

Implemented:

- Multi-file and folder FLAC import
- Remembered folder access through File System Access API and IndexedDB
- Drag-and-drop import
- Playlist playback with previous, next, and automatic track advance
- Timeline seeking, volume, mute, and playback speed controls
- Individual track removal and full playlist clearing
- Persistent volume and playback-speed settings
- Shuffle playback without repeating a track until the queue is exhausted
- Loop modes for off, all tracks, or the current track
- User-visible playback and file-import errors
- Responsive desktop and mobile layouts
- Keyboard shortcuts

## Keyboard shortcuts

- `Space`: play or pause
- `ArrowLeft` / `ArrowRight`: seek backward or forward 5 seconds
- `ArrowUp` / `ArrowDown`: change volume by 5%
- `N` / `P`: next or previous track

Shortcuts are ignored while an input, select, textarea, or button has focus.

## Known limitations

- The selected folder is remembered, but the browser may require one click on
  `Reconnect folder` after a restart before files can be read again.
- Persistent folder access uses File System Access API on Chrome or Edge;
  unsupported browsers fall back to `webkitdirectory` without persistence.
- FLAC playback depends on the browser's codec support.
- Metadata tags and artwork are outside the current MVP.

## Remembered music folder

On Chrome or Edge, choose a folder once with `Choose folder`. The app stores the
directory handle in IndexedDB. On later visits it reloads the folder
automatically when permission is still granted, or shows `Reconnect folder`
when the browser requires permission again. `Forget folder` removes the saved
handle without deleting any files from disk.

The development server uses a fixed `http://localhost:5173` origin because
folder handles are stored per origin.
