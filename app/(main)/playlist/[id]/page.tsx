'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Play, Trash2 } from 'lucide-react'
import { usePlaylists } from '@/lib/playlist-context'
import { PLAYLIST_SECTIONS } from '@/lib/playlists'
import { ImportResultPanel } from '@/components/import-result-panel'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { hasOfflineVideo } from '@/lib/offline-media'

export default function PlaylistDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = typeof params.id === 'string' ? params.id : ''

  const {
    getPlaylistById,
    getVideoById,
    removeVideoFromPlaylist,
    deletePlaylist,
  } = usePlaylists()

  const playlist = getPlaylistById(id)
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null)
  const [offlineIds, setOfflineIds] = useState<Set<string>>(new Set())

  const videos =
    playlist?.videoIds
      .map((vid) => getVideoById(vid))
      .filter((v): v is NonNullable<typeof v> => v != null) ?? []

  useEffect(() => {
    if (videos.length === 0) {
      setOfflineIds(new Set())
      return
    }
    let cancelled = false
    void Promise.all(
      videos.map(async (v) => {
        const ok = await hasOfflineVideo(v.id)
        return ok ? v.id : null
      }),
    ).then((ids) => {
      if (!cancelled) {
        setOfflineIds(new Set(ids.filter((id): id is string => id != null)))
      }
    })
    return () => {
      cancelled = true
    }
  }, [videos])

  if (!playlist) {
    return (
      <motion.div className="flex min-h-screen flex-col items-center justify-center gap-4 pt-24">
        <p className="text-muted-foreground">Playlist introuvable.</p>
        <Button type="button" variant="outline" onClick={() => router.push('/videos')}>
          Retour
        </Button>
      </motion.div>
    )
  }

  const sectionInfo = PLAYLIST_SECTIONS.find((s) => s.id === playlist.section)
  const activeVideo = activeVideoId ? getVideoById(activeVideoId) : null

  return (
    <div className="min-h-screen pb-16 pt-24 md:pt-28">
      <div className="mx-auto max-w-4xl px-4 md:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href={sectionInfo?.href ?? '/videos'}
              className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              {sectionInfo?.label ?? 'Retour'}
            </Link>
            <h1 className="text-2xl font-bold md:text-3xl">{playlist.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {videos.length} vidéo{videos.length !== 1 ? 's' : ''} · Page{' '}
              {sectionInfo?.label}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              deletePlaylist(playlist.id)
              router.push(sectionInfo?.href ?? '/videos')
            }}
          >
            <Trash2 className="mr-2 size-4" />
            Supprimer la playlist
          </Button>
        </div>

        {activeVideo && (
          <div className="mb-10">
            <ImportResultPanel
              result={activeVideo.result}
              onDismiss={() => setActiveVideoId(null)}
            />
          </div>
        )}

        <ul className="space-y-2">
          {videos.length === 0 ? (
            <li className="rounded-xl border border-dashed border-border/60 py-12 text-center text-muted-foreground">
              Cette playlist est vide.
            </li>
          ) : (
            videos.map((video, index) => (
              <motion.li
                key={video.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/30 p-3"
              >
                <button
                  type="button"
                  onClick={() => setActiveVideoId(video.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Play className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {video.title}
                      {offlineIds.has(video.id) && (
                        <span className="ml-2 text-[10px] font-normal text-primary">
                          Hors ligne
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {video.pageUrl}
                    </span>
                  </span>
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Retirer de la playlist"
                  onClick={() => {
                    removeVideoFromPlaylist(playlist.id, video.id)
                    if (activeVideoId === video.id) setActiveVideoId(null)
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </motion.li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
