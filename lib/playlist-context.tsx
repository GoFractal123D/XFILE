'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AnalyzeSuccessResponse } from '@/lib/analyze-types'
import {
  loadPlaylists,
  loadSavedVideos,
  persistPlaylists,
  persistSavedVideos,
  titleFromAnalyzeResult,
  videoIdFromPageUrl,
  type PlaylistSection,
  type SavedAnalyzedVideo,
  type UserPlaylist,
} from '@/lib/playlists'

type PlaylistContextValue = {
  savedVideos: SavedAnalyzedVideo[]
  playlists: UserPlaylist[]
  upsertVideoFromAnalysis: (result: AnalyzeSuccessResponse) => SavedAnalyzedVideo
  createPlaylist: (name: string, section: PlaylistSection) => UserPlaylist
  addVideoToPlaylist: (playlistId: string, videoId: string) => void
  removeVideoFromPlaylist: (playlistId: string, videoId: string) => void
  deletePlaylist: (playlistId: string) => void
  getPlaylistsBySection: (section: PlaylistSection) => UserPlaylist[]
  getVideoById: (id: string) => SavedAnalyzedVideo | undefined
  getPlaylistById: (id: string) => UserPlaylist | undefined
  isVideoInPlaylist: (playlistId: string, videoId: string) => boolean
  getPlaylistsContainingVideo: (videoId: string) => UserPlaylist[]
}

const PlaylistContext = createContext<PlaylistContextValue | undefined>(undefined)

export function PlaylistProvider({ children }: { children: ReactNode }) {
  const [savedVideos, setSavedVideos] = useState<SavedAnalyzedVideo[]>([])
  const [playlists, setPlaylists] = useState<UserPlaylist[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setSavedVideos(loadSavedVideos())
    setPlaylists(loadPlaylists())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    persistSavedVideos(savedVideos)
  }, [savedVideos, hydrated])

  useEffect(() => {
    if (!hydrated) return
    persistPlaylists(playlists)
  }, [playlists, hydrated])

  const upsertVideoFromAnalysis = useCallback(
    (result: AnalyzeSuccessResponse): SavedAnalyzedVideo => {
      const id = videoIdFromPageUrl(result.pageUrl)
      const entry: SavedAnalyzedVideo = {
        id,
        title: titleFromAnalyzeResult(result),
        pageUrl: result.pageUrl,
        result,
        savedAt: new Date().toISOString(),
      }
      setSavedVideos((prev) => {
        const idx = prev.findIndex((v) => v.id === id)
        if (idx === -1) return [entry, ...prev]
        const next = [...prev]
        next[idx] = entry
        return next
      })
      return entry
    },
    [],
  )

  const createPlaylist = useCallback((name: string, section: PlaylistSection) => {
    const trimmed = name.trim() || 'Nouvelle playlist'
    const now = new Date().toISOString()
    const playlist: UserPlaylist = {
      id: `pl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      name: trimmed,
      section,
      videoIds: [],
      createdAt: now,
      updatedAt: now,
    }
    setPlaylists((prev) => [playlist, ...prev])
    return playlist
  }, [])

  const addVideoToPlaylist = useCallback((playlistId: string, videoId: string) => {
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id !== playlistId) return p
        if (p.videoIds.includes(videoId)) return p
        return {
          ...p,
          videoIds: [...p.videoIds, videoId],
          updatedAt: new Date().toISOString(),
        }
      }),
    )
  }, [])

  const removeVideoFromPlaylist = useCallback(
    (playlistId: string, videoId: string) => {
      setPlaylists((prev) =>
        prev.map((p) =>
          p.id === playlistId
            ? {
                ...p,
                videoIds: p.videoIds.filter((id) => id !== videoId),
                updatedAt: new Date().toISOString(),
              }
            : p,
        ),
      )
    },
    [],
  )

  const deletePlaylist = useCallback((playlistId: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId))
  }, [])

  const getPlaylistsBySection = useCallback(
    (section: PlaylistSection) =>
      playlists
        .filter((p) => p.section === section)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        ),
    [playlists],
  )

  const getVideoById = useCallback(
    (id: string) => savedVideos.find((v) => v.id === id),
    [savedVideos],
  )

  const getPlaylistById = useCallback(
    (id: string) => playlists.find((p) => p.id === id),
    [playlists],
  )

  const isVideoInPlaylist = useCallback(
    (playlistId: string, videoId: string) => {
      const pl = playlists.find((p) => p.id === playlistId)
      return pl?.videoIds.includes(videoId) ?? false
    },
    [playlists],
  )

  const getPlaylistsContainingVideo = useCallback(
    (videoId: string) => playlists.filter((p) => p.videoIds.includes(videoId)),
    [playlists],
  )

  const value = useMemo(
    () => ({
      savedVideos,
      playlists,
      upsertVideoFromAnalysis,
      createPlaylist,
      addVideoToPlaylist,
      removeVideoFromPlaylist,
      deletePlaylist,
      getPlaylistsBySection,
      getVideoById,
      getPlaylistById,
      isVideoInPlaylist,
      getPlaylistsContainingVideo,
    }),
    [
      savedVideos,
      playlists,
      upsertVideoFromAnalysis,
      createPlaylist,
      addVideoToPlaylist,
      removeVideoFromPlaylist,
      deletePlaylist,
      getPlaylistsBySection,
      getVideoById,
      getPlaylistById,
      isVideoInPlaylist,
      getPlaylistsContainingVideo,
    ],
  )

  return (
    <PlaylistContext.Provider value={value}>{children}</PlaylistContext.Provider>
  )
}

export function usePlaylists() {
  const ctx = useContext(PlaylistContext)
  if (!ctx) {
    throw new Error('usePlaylists must be used within PlaylistProvider')
  }
  return ctx
}
