'use client'

import { useMemo, useState } from 'react'
import { Bookmark, BookmarkCheck, ListPlus } from 'lucide-react'
import type { AnalyzeSuccessResponse } from '@/lib/analyze-types'
import {
  PLAYLIST_SECTIONS,
  videoIdFromPageUrl,
  type PlaylistSection,
} from '@/lib/playlists'
import { usePlaylists } from '@/lib/playlist-context'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

type Props = {
  result: AnalyzeSuccessResponse
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'icon'
}

export function SaveToPlaylistButton({
  result,
  className,
  variant = 'outline',
  size = 'sm',
}: Props) {
  const {
    playlists,
    upsertVideoFromAnalysis,
    createPlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    getPlaylistsBySection,
    getPlaylistsContainingVideo,
  } = usePlaylists()

  const [open, setOpen] = useState(false)
  const [section, setSection] = useState<PlaylistSection>('videos')
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<string[]>([])

  const videoId = videoIdFromPageUrl(result.pageUrl)
  const inAnyPlaylist = getPlaylistsContainingVideo(videoId).length > 0

  const sectionPlaylists = useMemo(
    () => getPlaylistsBySection(section),
    [getPlaylistsBySection, section, playlists],
  )

  const openDialog = () => {
    upsertVideoFromAnalysis(result)
    const existing = getPlaylistsContainingVideo(videoId).map((p) => p.id)
    setSelectedPlaylistIds(existing)
    const firstSection =
      getPlaylistsContainingVideo(videoId)[0]?.section ?? 'videos'
    setSection(firstSection)
    setNewPlaylistName('')
    setOpen(true)
  }

  const togglePlaylist = (playlistId: string) => {
    setSelectedPlaylistIds((prev) =>
      prev.includes(playlistId)
        ? prev.filter((id) => id !== playlistId)
        : [...prev, playlistId],
    )
  }

  const handleCreateAndSelect = () => {
    const name = newPlaylistName.trim()
    if (!name) return
    const pl = createPlaylist(name, section)
    setSelectedPlaylistIds((prev) =>
      prev.includes(pl.id) ? prev : [...prev, pl.id],
    )
    setNewPlaylistName('')
  }

  const handleSave = () => {
    upsertVideoFromAnalysis(result)
    for (const pl of playlists) {
      if (selectedPlaylistIds.includes(pl.id)) {
        addVideoToPlaylist(pl.id, videoId)
      } else if (pl.videoIds.includes(videoId)) {
        removeVideoFromPlaylist(pl.id, videoId)
      }
    }
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={size}
          className={cn('gap-1.5', className)}
          onClick={(e) => {
            e.preventDefault()
            openDialog()
          }}
          title="Enregistrer dans une playlist"
        >
          {inAnyPlaylist ? (
            <BookmarkCheck className="size-4 text-primary" aria-hidden />
          ) : (
            <Bookmark className="size-4" aria-hidden />
          )}
          {size !== 'icon' && (
            <span className="hidden sm:inline">Enregistrer</span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md border-border/60 bg-background sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enregistrer dans une playlist</DialogTitle>
          <DialogDescription>
            Choisissez la page de destination (Films, Séries ou Videos), puis une
            ou plusieurs playlists — comme sur YouTube.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-3">
            <Label>Afficher sur la page</Label>
            <RadioGroup
              value={section}
              onValueChange={(v) => setSection(v as PlaylistSection)}
              className="grid grid-cols-3 gap-2"
            >
              {PLAYLIST_SECTIONS.map((s) => (
                <Label
                  key={s.id}
                  htmlFor={`section-${s.id}`}
                  className={cn(
                    'flex cursor-pointer flex-col items-center justify-center rounded-xl border px-3 py-3 text-center text-sm transition-colors',
                    section === s.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/60 hover:bg-muted/40',
                  )}
                >
                  <RadioGroupItem
                    id={`section-${s.id}`}
                    value={s.id}
                    className="sr-only"
                  />
                  {s.label}
                </Label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Playlists ({PLAYLIST_SECTIONS.find((s) => s.id === section)?.label})</Label>
            {sectionPlaylists.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune playlist sur cette page. Créez-en une ci-dessous.
              </p>
            ) : (
              <ul className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-border/50 p-2">
                {sectionPlaylists.map((pl) => {
                  const checked = selectedPlaylistIds.includes(pl.id)
                  return (
                    <li key={pl.id}>
                      <button
                        type="button"
                        onClick={() => togglePlaylist(pl.id)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                          checked
                            ? 'bg-primary/15 text-primary'
                            : 'hover:bg-muted/50',
                        )}
                      >
                        <ListPlus className="size-4 shrink-0 opacity-70" />
                        <span className="flex-1 font-medium">{pl.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {pl.videoIds.length} vidéo
                          {pl.videoIds.length !== 1 ? 's' : ''}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-playlist">Nouvelle playlist</Label>
            <div className="flex gap-2">
              <Input
                id="new-playlist"
                placeholder="Ma playlist…"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCreateAndSelect()
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={handleCreateAndSelect}>
                Créer
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button type="button" onClick={handleSave}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
