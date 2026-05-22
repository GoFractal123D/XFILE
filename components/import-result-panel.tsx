'use client'

import { useEffect, useRef } from 'react'
import Hls from 'hls.js'
import { motion } from 'framer-motion'
import { Download, ExternalLink, X } from 'lucide-react'
import type { AnalyzeSuccessResponse } from '@/lib/analyze-types'
import { Button } from '@/components/ui/button'
import { VideoDownloadButton } from '@/components/video-download-button'
import { StreamingResultPanel } from '@/components/streaming-result-panel'
import { SaveToPlaylistButton } from '@/components/save-to-playlist-button'
import { SeriesCatalogPanel } from '@/components/series-catalog-panel'
import { AnalyzeResultHero } from '@/components/analyze-result-hero'
import { useOfflinePlayback } from '@/lib/use-offline-playback'

type Props = {
  result: AnalyzeSuccessResponse
  onDismiss: () => void
}

export function ImportResultPanel({ result, onDismiss }: Props) {
  const pageUrl =
    result.kind !== 'series-catalog' ? result.pageUrl : undefined
  const { objectUrl: offlineUrl, hasOffline } = useOfflinePlayback(pageUrl)

  if (result.kind === 'series-catalog') {
    return <SeriesCatalogPanel result={result} onDismiss={onDismiss} />
  }

  if (result.kind === 'streaming') {
    return <StreamingResultPanel result={result} onDismiss={onDismiss} />
  }

  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (hasOffline || result.kind !== 'hls') return
    const el = videoRef.current
    if (!el) return

    if (el.canPlayType('application/vnd.apple.mpegurl')) {
      el.src = result.playlistUrl
      return
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      })
      hls.loadSource(result.playlistUrl)
      hls.attachMedia(el)
      return () => {
        hls.destroy()
      }
    }

    el.src = result.playlistUrl
    return undefined
  }, [result, hasOffline])

  const downloadHref =
    result.kind === 'direct'
      ? `/api/proxy-download?url=${encodeURIComponent(result.videoUrl)}`
      : result.kind === 'embed-youtube'
        ? `/api/youtube-download?url=${encodeURIComponent(result.pageUrl)}`
        : null

  const title =
    result.title ||
    (result.kind === 'direct'
      ? 'Vidéo importée'
      : result.kind === 'hls'
        ? 'Flux HLS'
        : 'Lecture intégrée')

  const hintText = hasOffline
    ? 'Lecture hors ligne — fichier enregistré sur cet appareil.'
    : result.kind === 'direct'
      ? result.hint || 'Source directe — lecture et téléchargement disponibles.'
      : result.kind === 'hls'
        ? result.hint ||
          'Flux adaptatif — téléchargement indisponible pour ce format.'
        : result.kind === 'embed-youtube'
          ? 'YouTube — lecture automatique.'
          : 'Vimeo — lecture intégrée.'

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto mt-10 w-full max-w-4xl"
      aria-labelledby="import-result-heading"
    >
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.1] bg-[oklch(0.1_0.02_270/0.75)] p-1 shadow-[0_0_0_1px_oklch(0.35_0.08_180/0.2),0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,oklch(0.7_0.15_180/0.12),transparent_60%)]" />
        <div className="relative rounded-[1.35rem] p-4 md:p-6">
          <AnalyzeResultHero
            title={title}
            description={result.description}
            thumbnailUrl={result.thumbnailUrl}
            hint={hintText}
            actions={
              <>
                <SaveToPlaylistButton result={result} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-border/60 bg-background/40"
                  asChild
                >
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
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={onDismiss}
                  aria-label="Fermer le résultat"
                >
                  <X className="size-4" />
                </Button>
              </>
            }
          />

          <div
            id="import-result-heading"
            className="overflow-hidden rounded-2xl border border-border/50 bg-black/40 shadow-inner"
          >
            {hasOffline && offlineUrl && (
              <video
                src={offlineUrl}
                controls
                autoPlay
                playsInline
                className="aspect-video w-full object-contain"
                preload="metadata"
              />
            )}
            {!hasOffline && result.kind === 'direct' && (
              <video
                ref={videoRef}
                src={result.videoUrl}
                controls
                autoPlay
                playsInline
                className="aspect-video w-full object-contain"
                preload="metadata"
              >
                Votre navigateur ne supporte pas la lecture vidéo.
              </video>
            )}
            {!hasOffline && result.kind === 'hls' && (
              <video
                ref={videoRef}
                controls
                autoPlay
                playsInline
                className="aspect-video w-full object-contain"
                preload="metadata"
              >
                Votre navigateur ne supporte pas la lecture HLS.
              </video>
            )}
            {!hasOffline &&
              (result.kind === 'embed-youtube' ||
                result.kind === 'embed-vimeo') && (
              <div className="aspect-video w-full bg-black">
                <iframe
                  title={title}
                  src={result.embedUrl}
                  className="size-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Import fourni à titre expérimental. Respectez les droits d&apos;auteur et
              les conditions des sites sources.
            </p>
            <div className="flex flex-wrap gap-2">
              {downloadHref && !hasOffline ? (
                <VideoDownloadButton
                  href={downloadHref}
                  offlinePageUrl={result.pageUrl}
                  offlineTitle={title}
                />
              ) : hasOffline ? (
                <p className="text-xs text-primary/80">
                  Disponible hors ligne sur cet appareil.
                </p>
              ) : (
                <Button type="button" variant="secondary" disabled className="gap-2">
                  <Download className="size-4 opacity-50" aria-hidden />
                  Téléchargement indisponible
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  )
}
