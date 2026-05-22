const DB_NAME = 'xfile-offline'
const DB_VERSION = 1
const STORE = 'videos'

export type OfflineVideoRecord = {
  id: string
  pageUrl: string
  title: string
  mimeType: string
  size: number
  savedAt: string
  blob: Blob
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB indisponible'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB'))
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
  })
}

export async function saveOfflineVideo(record: OfflineVideoRecord): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => reject(tx.error)
    tx.objectStore(STORE).put(record)
  })
}

export async function getOfflineVideo(
  id: string,
): Promise<OfflineVideoRecord | null> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(id)
    req.onsuccess = () => {
      db.close()
      resolve((req.result as OfflineVideoRecord | undefined) ?? null)
    }
    req.onerror = () => reject(req.error)
  })
}

export async function listOfflineVideos(): Promise<OfflineVideoRecord[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => {
      db.close()
      const rows = (req.result as OfflineVideoRecord[]) ?? []
      resolve(rows.sort((a, b) => b.savedAt.localeCompare(a.savedAt)))
    }
    req.onerror = () => reject(req.error)
  })
}

export async function deleteOfflineVideo(id: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => reject(tx.error)
    tx.objectStore(STORE).delete(id)
  })
}

export async function hasOfflineVideo(id: string): Promise<boolean> {
  const row = await getOfflineVideo(id)
  return row != null && row.blob.size > 0
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} Go`
}
