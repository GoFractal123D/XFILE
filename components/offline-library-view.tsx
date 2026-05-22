'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  CloudOff,
  Download,
  Film,
  HardDrive,
  Play,
  Trash2,
  Tv,
  Video,
} from 'lucide-react'
import {
  deleteOfflineVideo,
  formatBytes,
  listOfflineVideos,
  type OfflineVideoRecord,
} from '@/lib/offline-media'
import { PLAYLIST_SECTIONS } from '@/lib/playlists'
import { usePlaylists } from '@/lib/playlist-context'
import { ImportResultPanel } from '@/components/import-result-panel'
import { Button } from '@/components/ui/button'
import { useOnlineStatus } from '@/lib/use-online-status'

export function OfflineLibraryView() {
  const online = useOnlineStatus()
  const { playlists, savedVideos } = usePlaylists()
  const [offlineVideos, setOfflineVideos] = useState<OfflineVideoRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setOfflineVideos(await listOfflineVideos())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const active = offlineVideos.find((v) => v.id === activeId)
  const activeSaved = active
    ? savedVideos.find((v) => v.id === active.id)
    : null

  const handleDelete = async (id: string) => {
    await deleteOfflineVideo(id)
    if (activeId === id) setActiveId(null)
    await refresh()
  }

  return (
    <div className="min-h-screen pb-16 pt-24 md:pt-28">
      <div className="mx-auto max-w-4xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="mb-3 flex items-center gap-3 text-3xl font-bold md:text-4xl">
            <HardDrive className="size-8 text-primary" aria-hidden />
            Bibliothèque hors ligne
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Vidéos enregistrées sur cet appareil et contenus sauvegardés accessibles
            sans Internet.
          </p>
          {!online && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              <CloudOff className="size-4" aria-hidden />
              Vous êtes hors ligne — seul le contenu local est disponible.
            </p>
          )}
        </motion.div>

        {active && (
          <div className="mb-10">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mb-3"
              onClick={() => setActiveId(null)}
            >
              ← Retour à la liste
            </Button>
            {activeSaved ? (
              <ImportResultPanel
                result={activeSaved.result}
                onDismiss={() => setActiveId(null)}
              />
            ) : (
              <OfflineOnlyPlayer record={active} onDismiss={() => setActiveId(null)} />
            )}
          </div>
        )}

        <section className="mb-12" aria-labelledby="offline-videos-heading">
          <h2
            id="offline-videos-heading"
            className="mb-4 flex items-center gap-2 text-lg font-semibold"
          >
            <Download className="size-5 text-primary" aria-hidden />
            Vidéos téléchargées ({offlineVideos.length})
          </h2>

          {loading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : offlineVideos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
              <p className="mb-2">Aucune vidéo enregistrée localement.</p>
              <p>
                Utilisez « Télécharger » sur une vidéo analysée : le fichier sera
                aussi conservé pour la lecture hors ligne.
              </p>
              {online && (
                <Button asChild className="mt-4" variant="outline">
                  <Link href="/">Analyser une URL</Link>
                </Button>
              )}
            </div>
          ) : (
            <ul className="space-y-2">
              {offlineVideos.map((video) => (
                <li
                  key={video.id}
                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/40 p-3"
                >
                  <button
                    type="button"
                    onClick={() => setActiveId(video.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <Play className="size-4" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{video.title}</span>
                      <span className="block text-xs text-muted-foreground">
                        {formatBytes(video.size)} ·{' '}
                        {new Date(video.savedAt).toLocaleDateString('fr-FR')}
                      </span>
                    </span>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Supprimer le fichier local"
                    onClick={() => void handleDelete(video.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="offline-playlists-heading">
          <h2
            id="offline-playlists-heading"
            className="mb-4 text-lg font-semibold"
          >
            Playlists sauvegardées ({playlists.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {PLAYLIST_SECTIONS.map((section) => {
              const Icon =
                section.id === 'films'
                  ? Film
                  : section.id === 'series'
                    ? Tv
                    : Video
              const count = playlists.filter((p) => p.section === section.id).length
              return (
                <Link
                  key={section.id}
                  href={section.href}
                  className="rounded-xl border border-border/50 bg-card/30 p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <Icon className="mb-2 size-6 text-primary" aria-hidden />
                  <p className="font-medium">{section.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {count} playlist{count !== 1 ? 's' : ''}
                  </p>
                </Link>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}

function OfflineOnlyPlayer({
  record,
  onDismiss,
}: {
  record: OfflineVideoRecord
  onDismiss: () => void
}) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    const objectUrl = URL.createObjectURL(record.blob)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [record.blob])

  return (
    <div className="rounded-3xl border border-border/50 bg-card/30 p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{record.title}</h2>
          <p className="text-xs text-primary/80">Lecture hors ligne</p>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onDismiss}>
          ×
        </Button>
      </div>
      {url && (
        <video
          src={url}
          controls
          autoPlay
          playsInline
          className="aspect-video w-full rounded-xl bg-black object-contain"
        />
      )}
    </div>
  )
}
