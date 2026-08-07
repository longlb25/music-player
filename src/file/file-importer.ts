import type { Track } from '../types/track.ts'

export interface FileImportResult {
  tracks: Track[]
  rejectedFiles: File[]
}

export function isFlacFile(file: File): boolean {
  return file.name.toLowerCase().endsWith('.flac')
}

export function importFlacFiles(files: Iterable<File>): FileImportResult {
  const acceptedFiles: File[] = []
  const rejectedFiles: File[] = []

  for (const file of files) {
    if (isFlacFile(file)) {
      acceptedFiles.push(file)
    } else {
      rejectedFiles.push(file)
    }
  }

  return {
    tracks: acceptedFiles.map((file) => ({
      id: crypto.randomUUID(),
      title: file.name.replace(/\.flac$/i, ''),
      fileName: file.name,
      source: file,
    })),
    rejectedFiles,
  }
}

export async function getFlacFilesFromDirectory(
  directoryHandle: FileSystemDirectoryHandle,
): Promise<File[]> {
  const files: File[] = []

  for await (const entry of directoryHandle.values()) {
    if (entry.kind === 'directory') {
      files.push(...await getFlacFilesFromDirectory(entry))
    } else if (entry.name.toLowerCase().endsWith('.flac')) {
      files.push(await entry.getFile())
    }
  }

  return files
}
