import type { AnalyzeSuccessResponse } from '@/lib/analyze-types'

export type PlaylistSection = 'films' | 'series' | 'videos'

export const PLAYLIST_SECTIONS: {
  id: PlaylistSection
  label: string
  href: string
}[] = [
  { id: 'films', label: 'Films', href: '/films' },
  { id: 'series', label: 'Séries', href: '/series' },
  { id: 'videos', label: 'Videos', href: '/videos' },
]

export type SavedAnalyzedVideo = {
  id: string
  title: string
  pageUrl: string
  result: AnalyzeSuccessResponse
  savedAt: string
}

export type UserPlaylist = {
  id: string
  name: string
  section: PlaylistSection
  videoIds: string[]
  createdAt: string
  updatedAt: string
}

const VIDEOS_KEY = 'xfile_saved_videos'
const PLAYLISTS_KEY = 'xfile_playlists'

export function videoIdFromPageUrl(pageUrl: string): string {
  let h = 2166136261
  for (let i = 0; i < pageUrl.length; i++) {
    h ^= pageUrl.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return `vid-${(h >>> 0).toString(36)}`
}

export function titleFromAnalyzeResult(result: AnalyzeSuccessResponse): string {
  if (result.title?.trim()) return result.title.trim()
  try {
    const u = new URL(result.pageUrl)
    const slug = u.pathname.split('/').filter(Boolean).pop()
    if (slug) return decodeURIComponent(slug.replace(/[-_]/g, ' '))
    return u.hostname
  } catch {
    return 'Vidéo importée'
  }
}

export function loadSavedVideos(): SavedAnalyzedVideo[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(VIDEOS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as SavedAnalyzedVideo[]
  } catch {
    return []
  }
}

export function loadPlaylists(): UserPlaylist[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(PLAYLISTS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as UserPlaylist[]
  } catch {
    return []
  }
}

export function persistSavedVideos(videos: SavedAnalyzedVideo[]) {
  localStorage.setItem(VIDEOS_KEY, JSON.stringify(videos))
}

export function persistPlaylists(playlists: UserPlaylist[]) {
  localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists))
}
