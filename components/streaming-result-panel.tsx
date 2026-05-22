'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Hls from 'hls.js'
import { motion } from 'framer-motion'
import { Download, ExternalLink, Loader2, X } from 'lucide-react'
import type {
  AnalyzeSuccessResponse,
  ResolveResponse,
  StreamingSource,
} from '@/lib/analyze-types'
import { sortStreamingSources } from '@/lib/streaming-embeds'
import { Button } from '@/components/ui/button'
import { VideoDownloadButton } from '@/components/video-download-button'
import { SaveToPlaylistButton } from '@/components/save-to-playlist-button'
import { StreamingDownloadButton } from '@/components/streaming-download-button'
import { AnalyzeResultHero } from '@/components/analyze-result-hero'
import { useOfflinePlayback } from '@/lib/use-offline-playback'
import { cn } from '@/lib/utils'

type StreamingResult = Extract<AnalyzeSuccessResponse, { kind: 'streaming' }>

type Props = {
  result: StreamingResult
  onDismiss: () => void
}

type Playback =
  | { kind: 'direct'; videoUrl: string }
  | { kind: 'hls'; playlistUrl: string }

function StreamPlayer({
  playback,
  onPlaybackError,
}: {
  playback: Playback
  onPlaybackError: (message: string) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    onPlaybackError('')
  }, [playback, onPlaybackError])

  useEffect(() => {
    if (playback.kind !== 'hls') return
    const el = videoRef.current
    if (!el) return

    if (el.canPlayType('application/vnd.apple.mpegurl')) {
      el.src = playback.playlistUrl
      return
    }

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true })
      hls.loadSource(playback.playlistUrl)
      hls.attachMedia(el)
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          onPlaybackError(
            'Lecture impossible (flux HLS bloqué ou expiré). Essayez un autre hébergeur.',
          )
        }
      })
      return () => hls.destroy()
    }

    el.src = playback.playlistUrl
    return undefined
  }, [playback, onPlaybackError])

  const handleVideoError = () => {
    onPlaybackError(
      'Lecture impossible. Essayez un autre hébergeur (UQLOAD, DOOD, VOE…).',
    )
  }

  if (playback.kind === 'direct') {
    return (
      <video
        ref={videoRef}
        src={playback.videoUrl}
        controls
        autoPlay
        playsInline
        className="aspect-video w-full object-contain"
        preload="metadata"
        onError={handleVideoError}
      />
    )
  }

  return (
    <video
      ref={videoRef}
      controls
      autoPlay
      playsInline
      className="aspect-video w-full object-contain"
      preload="metadata"
      onError={handleVideoError}
    />
  )
}

export function StreamingResultPanel({ result, onDismiss }: Props) {
  const { objectUrl: offlineUrl, hasOffline } = useOfflinePlayback(result.pageUrl)
  const orderedSources = useMemo(
    () => sortStreamingSources(result.sources),
    [result.sources],
  )

  const [selected, setSelected] = useState<StreamingSource | null>(null)
  const [playback, setPlayback] = useState<Playback | null>(null)
  const [activeLabel, setActiveLabel] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [playbackError, setPlaybackError] = useState<string | null>(null)
  const autoResolvedRef = useRef(false)

  const handlePlaybackError = useCallback((message: string) => {
    setPlaybackError(message || null)
  }, [])

  const resolveSource = useCallback(
    async (source: StreamingSource) => {
      setSelected(source)
      setLoading(true)
      setError(null)
      setPlaybackError(null)
      setPlayback(null)

      try {
        const res = await fetch('/api/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embedUrl: source.embedUrl,
            pageUrl: result.pageUrl,
            sourceLabel: source.label,
          }),
        })
        const data = (await res.json()) as ResolveResponse
        if (!data.ok) {
          setError([data.error, data.hint].filter(Boolean).join(' '))
          return
        }
        setActiveLabel(data.sourceLabel)
        if (data.kind === 'direct') {
          setPlayback({ kind: 'direct', videoUrl: data.videoUrl })
        } else {
          setPlayback({ kind: 'hls', playlistUrl: data.playlistUrl })
        }
      } catch {
        setError('Impossible de contacter le serveur.')
      } finally {
        setLoading(false)
      }
    },
    [result.pageUrl],
  )

  useEffect(() => {
    autoResolvedRef.current = false
    setSelected(null)
    setPlayback(null)
    setError(null)
    setPlaybackError(null)
  }, [result.pageUrl])

  useEffect(() => {
    if (autoResolvedRef.current) return
    const first = orderedSources[0]
    if (!first) return
    autoResolvedRef.current = true
    void resolveSource(first)
  }, [result.pageUrl, orderedSources, resolveSource])

  const downloadHref =
    playback?.kind === 'direct' ? playback.videoUrl : null

  if (hasOffline && offlineUrl) {
    return (
      <motion.section
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto mt-10 w-full max-w-4xl"
        aria-labelledby="streaming-result-heading"
      >
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.1] bg-[oklch(0.1_0.02_270/0.75)] p-1 shadow-[0_0_0_1px_oklch(0.35_0.08_180/0.2),0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          <div className="relative rounded-[1.35rem] p-4 md:p-6">
            <AnalyzeResultHero
              title={result.title || 'Page streaming'}
              description={result.description}
              thumbnailUrl={result.thumbnailUrl}
              hint="Lecture hors ligne — fichier local."
              actions={
                <>
                  <SaveToPlaylistButton result={result} />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onDismiss}
                    aria-label="Fermer"
                  >
                    <X className="size-4" />
                  </Button>
                </>
              }
            />
            <div
              id="streaming-result-heading"
              className="overflow-hidden rounded-2xl border border-border/50 bg-black/40"
            >
              <video
                src={offlineUrl}
                controls
                autoPlay
                playsInline
                className="aspect-video w-full object-contain"
              />
            </div>
          </div>
        </div>
      </motion.section>
    )
  }

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto mt-10 w-full max-w-4xl"
      aria-labelledby="streaming-result-heading"
    >
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.1] bg-[oklch(0.1_0.02_270/0.75)] p-1 shadow-[0_0_0_1px_oklch(0.35_0.08_180/0.2),0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
        <div className="relative rounded-[1.35rem] p-4 md:p-6">
          <AnalyzeResultHero
            title={result.title || 'Page streaming'}
            description={result.description}
            thumbnailUrl={result.thumbnailUrl}
            hint={result.hint}
            actions={
              <>
                <SaveToPlaylistButton result={result} />
                <Button variant="outline" size="sm" className="gap-1.5" asChild>
                  <a
                    href={result.pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="size-3.5" aria-hidden />
                    Page source
                  </a>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onDismiss}
                  aria-label="Fermer"
                >
                  <X className="size-4" />
                </Button>
              </>
            }
          />

          <div
            id="streaming-result-heading"
            className="mb-4 overflow-hidden rounded-2xl border border-border/50 bg-black/40"
          >
            {playback ? (
              <StreamPlayer
                playback={playback}
                onPlaybackError={handlePlaybackError}
              />
            ) : (
              <div className="flex aspect-video flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
                <Loader2
                  className={cn(
                    'size-10 text-primary',
                    loading ? 'animate-spin' : 'opacity-40',
                  )}
                  aria-hidden
                />
                <p className="text-sm">
                  {loading
                    ? `Extraction du flux ${selected?.label ?? ''}…`
                    : 'Chargement de la vidéo…'}
                </p>
              </div>
            )}
          </div>

          {error && (
            <p className="mb-4 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          {playbackError && !error && (
            <p className="mb-4 text-sm text-amber-400" role="alert">
              {playbackError}
            </p>
          )}

          <div className="mb-4 flex flex-wrap gap-2">
            {orderedSources.map((source) => {
              const isActive = selected?.embedUrl === source.embedUrl
              return (
                <Button
                  key={source.id}
                  type="button"
                  size="sm"
                  variant={isActive ? 'default' : 'outline'}
                  className={
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'border-border/60'
                  }
                  disabled={loading}
                  title={source.embedUrl}
                  onClick={() => resolveSource(source)}
                >
                  {source.label}
                </Button>
              )
            })}
          </div>

          {playbackError && selected && (
            <div className="mt-4 rounded-xl border border-border/50 bg-muted/20 p-4">
              <p className="mb-2 text-sm text-muted-foreground">
                Le lecteur intégré n’a pas pu charger ce flux. Ouvrez l’hébergeur
                directement :
              </p>
              <Button variant="outline" size="sm" className="gap-1.5" asChild>
                <a
                  href={selected.embedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="size-3.5" aria-hidden />
                  Ouvrir {selected.label} dans un nouvel onglet
                </a>
              </Button>
            </div>
          )}

          {playback && (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Source active : <span className="text-primary">{activeLabel}</span>
                {playback.kind === 'hls' &&
                  ' — flux HLS : téléchargement via yt-dlp (fusion en MP4).'}
              </p>
              <div className="flex gap-2">
                {downloadHref ? (
                  <VideoDownloadButton
                    href={downloadHref}
                    offlinePageUrl={result.pageUrl}
                    offlineTitle={result.title}
                  />
                ) : selected ? (
                  <StreamingDownloadButton
                    embedUrl={selected.embedUrl}
                    pageUrl={result.pageUrl}
                    title={result.title}
                  />
                ) : (
                  <Button type="button" variant="secondary" disabled className="gap-2">
                    <Download className="size-4 opacity-50" aria-hidden />
                    Téléchargement indisponible
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  )
}
