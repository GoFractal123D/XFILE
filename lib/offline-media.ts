import {
  deleteOfflineVideo,
  getOfflineVideo,
  hasOfflineVideo,
  listOfflineVideos,
  saveOfflineVideo,
  type OfflineVideoRecord,
} from '@/lib/offline-db'
import { videoIdFromPageUrl } from '@/lib/playlists'

export { formatBytes, hasOfflineVideo, listOfflineVideos, deleteOfflineVideo }
export type { OfflineVideoRecord }

export async function cacheVideoBlob(opts: {
  pageUrl: string
  title: string
  blob: Blob
  mimeType?: string
}): Promise<OfflineVideoRecord> {
  const id = videoIdFromPageUrl(opts.pageUrl)
  const record: OfflineVideoRecord = {
    id,
    pageUrl: opts.pageUrl,
    title: opts.title.trim() || 'Vidéo',
    mimeType: opts.mimeType || opts.blob.type || 'video/mp4',
    size: opts.blob.size,
    savedAt: new Date().toISOString(),
    blob: opts.blob,
  }
  await saveOfflineVideo(record)
  return record
}

export async function getOfflineVideoByPageUrl(
  pageUrl: string,
): Promise<OfflineVideoRecord | null> {
  return getOfflineVideo(videoIdFromPageUrl(pageUrl))
}

export function triggerFileDownload(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(objectUrl)
}
