'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Film, ListVideo, Play, Plus, Trash2, Tv, Video } from 'lucide-react'
import { usePlaylists } from '@/lib/playlist-context'
import type { PlaylistSection } from '@/lib/playlists'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

const sectionMeta: Record<
  PlaylistSection,
  { title: string; description: string; icon: typeof Film }
> = {
  films: {
    title: 'Films',
    description: 'Playlists de films importés et analysés.',
    icon: Film,
  },
  series: {
    title: 'Séries',
    description: 'Playlists de séries et épisodes sauvegardés.',
    icon: Tv,
  },
  videos: {
    title: 'Videos',
    description: 'Toutes vos vidéos analysées, regroupées en playlists.',
    icon: Video,
  },
}

type Props = {
  section: PlaylistSection
}

export function PlaylistLibraryView({ section }: Props) {
  const { getPlaylistsBySection, createPlaylist, deletePlaylist, getVideoById } =
    usePlaylists()
  const [newName, setNewName] = useState('')

  const meta = sectionMeta[section]
  const Icon = meta.icon
  const playlists = getPlaylistsBySection(section)

  const handleCreate = () => {
    const name = newName.trim()
    if (!name) return
    createPlaylist(name, section)
    setNewName('')
  }

  return (
    <div className="min-h-screen pt-24 md:pt-28 pb-16">
      <div className="mx-auto max-w-[1800px] px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="mb-3 flex items-center gap-3 text-3xl font-bold md:text-4xl">
            <Icon className="size-8 text-primary" aria-hidden />
            {meta.title}
          </h1>
          <p className="max-w-2xl text-muted-foreground">{meta.description}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1 space-y-2">
            <label htmlFor="new-pl" className="text-sm font-medium">
              Nouvelle playlist
            </label>
            <div className="flex gap-2">
              <Input
                id="new-pl"
                placeholder="Nom de la playlist…"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCreate()
                  }
                }}
              />
              <Button type="button" onClick={handleCreate} className="gap-1.5 shrink-0">
                <Plus className="size-4" />
                Créer
              </Button>
            </div>
          </div>
        </motion.div>

        {playlists.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-dashed border-border/60 bg-muted/10 px-6 py-16 text-center"
          >
            <ListVideo className="mx-auto mb-4 size-12 text-muted-foreground/50" />
            <h2 className="text-lg font-semibold">Aucune playlist</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Analysez une vidéo sur l&apos;accueil, puis appuyez sur l&apos;icône
              marqueur pour l&apos;ajouter à une playlist sur cette page.
            </p>
            <Link href="/" className="mt-6 inline-block">
              <Button type="button" variant="outline">
                Analyser une vidéo
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {playlists.map((pl, index) => (
              <motion.article
                key={pl.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/40 p-5 backdrop-blur-sm"
              >
                <div className="mb-4 flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold">{pl.name}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {pl.videoIds.length} vidéo{pl.videoIds.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label="Supprimer la playlist"
                    onClick={() => deletePlaylist(pl.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                <ul className="mb-4 max-h-48 space-y-2 overflow-y-auto">
                  {pl.videoIds.length === 0 ? (
                    <li className="text-sm text-muted-foreground">Playlist vide</li>
                  ) : (
                    pl.videoIds.slice(0, 8).map((vid) => {
                      const video = getVideoById(vid)
                      if (!video) return null
                      return (
                        <li
                          key={vid}
                          className="flex items-center gap-2 rounded-lg bg-muted/30 px-2 py-1.5 text-sm"
                        >
                          <Play className="size-3.5 shrink-0 text-primary" />
                          <span className="line-clamp-1 flex-1">{video.title}</span>
                        </li>
                      )
                    })
                  )}
                  {pl.videoIds.length > 8 && (
                    <li className="text-xs text-muted-foreground">
                      +{pl.videoIds.length - 8} autres…
                    </li>
                  )}
                </ul>

                <Link href={`/playlist/${pl.id}`}>
                  <Button type="button" variant="secondary" className="w-full">
                    Ouvrir la playlist
                  </Button>
                </Link>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
