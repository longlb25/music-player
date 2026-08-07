const DATABASE_NAME = 'flac-player'
const DATABASE_VERSION = 1
const STORE_NAME = 'file-system-handles'
const DIRECTORY_HANDLE_KEY = 'music-directory'

function isDirectoryHandle(value: unknown): value is FileSystemDirectoryHandle {
  return Boolean(
    value
    && typeof value === 'object'
    && 'kind' in value
    && value.kind === 'directory'
    && 'values' in value,
  )
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)

    request.addEventListener('upgradeneeded', () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME)
      }
    })
    request.addEventListener('success', () => resolve(request.result))
    request.addEventListener('error', () => reject(request.error))
  })
}

function waitForTransaction(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.addEventListener('complete', () => resolve())
    transaction.addEventListener('abort', () => reject(transaction.error))
    transaction.addEventListener('error', () => reject(transaction.error))
  })
}

export async function saveDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).put(handle, DIRECTORY_HANDLE_KEY)
    await waitForTransaction(transaction)
  } finally {
    database.close()
  }
}

export async function loadDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(STORE_NAME, 'readonly')
    const request = transaction.objectStore(STORE_NAME).get(DIRECTORY_HANDLE_KEY)

    return await new Promise((resolve, reject) => {
      request.addEventListener('success', () => {
        const value: unknown = request.result
        resolve(isDirectoryHandle(value) ? value : null)
      })
      request.addEventListener('error', () => reject(request.error))
    })
  } finally {
    database.close()
  }
}

export async function clearDirectoryHandle(): Promise<void> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).delete(DIRECTORY_HANDLE_KEY)
    await waitForTransaction(transaction)
  } finally {
    database.close()
  }
}
