'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  Play,
  X,
} from 'lucide-react'
import type { AnalyzeResponse, AnalyzeSuccessResponse } from '@/lib/analyze-types'
import type { SeriesEpisode } from '@/lib/series-episodes'
import { pickBestSourcePerHost } from '@/lib/streaming-embeds'
import { AnalyzeResultHero } from '@/components/analyze-result-hero'
import { Button } from '@/components/ui/button'
import { ImportResultPanel } from '@/components/import-result-panel'
import { cn } from '@/lib/utils'

type SeriesCatalogResult = Extract<
  AnalyzeSuccessResponse,
  { kind: 'series-catalog' }
>

type Props = {
  result: SeriesCatalogResult
  onDismiss: () => void
}

const VERSION_GROUP_LABELS: Record<string, string> = {
  vf: 'VF — Version française',
  vostfr: 'VOSTFR — Version originale sous-titrée',
  vo: 'VO — Version originale',
}

function groupEpisodes(episodes: SeriesEpisode[]) {
  if (episodes.some((e) => e.version)) {
    const order = ['vf', 'vostfr', 'vo'] as const
    return order
      .map((v) => {
        const eps = episodes.filter((e) => e.version === v)
        if (eps.length === 0) return null
        return [VERSION_GROUP_LABELS[v] ?? v.toUpperCase(), eps] as const
      })
      .filter((g): g is [string, SeriesEpisode[]] => g != null)
  }

  const groups = new Map<string, SeriesEpisode[]>()
  for (const ep of episodes) {
    const key = ep.season != null ? `Saison ${ep.season}` : 'Épisodes'
    const list = groups.get(key) ?? []
    list.push(ep)
    groups.set(key, list)
  }
  return [...groups.entries()]
}

export function SeriesCatalogPanel({ result, onDismiss }: Props) {
  const [episodeResult, setEpisodeResult] =
    useState<AnalyzeSuccessResponse | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [episodeError, setEpisodeError] = useState<string | null>(null)

  const groups = useMemo(
    () => groupEpisodes(result.episodes),
    [result.episodes],
  )

  const title = result.title || 'Série'
  const catalogHint =
    result.hint ||
    `Choisissez un épisode — ${result.episodes.length} épisode${result.episodes.length !== 1 ? 's' : ''} détecté${result.episodes.length !== 1 ? 's' : ''}.`

  const analyzeEpisode = async (ep: SeriesEpisode) => {
    setLoadingId(ep.id)
    setEpisodeError(null)

    if (ep.sources && ep.sources.length > 0) {
      const sources = pickBestSourcePerHost(ep.sources)
      setEpisodeResult({
        ok: true,
        pageUrl: ep.url,
        kind: 'streaming',
        title: ep.label,
        description: ep.description ?? result.description,
        thumbnailUrl: ep.thumbnailUrl ?? result.thumbnailUrl,
        hint: `${sources.length} hébergeur(s) — choisissez une source pour lire et télécharger.`,
        sources,
        downloadable: true,
      })
      setLoadingId(null)
      return
    }

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: ep.url }),
      })
      const data = (await res.json()) as AnalyzeResponse

      if (!data.ok) {
        setEpisodeError(data.error)
        return
      }

      if (data.kind === 'series-catalog') {
        setEpisodeError(
          'Impossible d’ouvrir cet épisode automatiquement. Ouvrez le lien sur le site source puis copiez l’URL du lecteur.',
        )
        return
      }

      setEpisodeResult(data)
    } catch {
      setEpisodeError('Impossible de contacter le serveur.')
    } finally {
      setLoadingId(null)
    }
  }

  if (episodeResult) {
    return (
      <motion.section
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto mt-10 w-full max-w-4xl space-y-4"
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground"
          onClick={() => {
            setEpisodeResult(null)
            setEpisodeError(null)
          }}
        >
          <ArrowLeft className="size-4" />
          Retour à la liste · {title}
        </Button>
        <ImportResultPanel
          result={episodeResult}
          onDismiss={() => {
            setEpisodeResult(null)
            setEpisodeError(null)
          }}
        />
      </motion.section>
    )
  }

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto mt-10 w-full max-w-4xl"
      aria-labelledby="series-catalog-heading"
    >
      <motion.div className="relative overflow-hidden rounded-3xl border border-white/[0.1] bg-[oklch(0.1_0.02_270/0.75)] p-1 shadow-[0_0_0_1px_oklch(0.35_0.08_180/0.2),0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
        <motion.div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,oklch(0.7_0.15_180/0.12),transparent_60%)]" aria-hidden />
        <div className="relative rounded-[1.35rem] p-4 md:p-6">
          <AnalyzeResultHero
            title={title}
            titleId="series-catalog-heading"
            description={result.description}
            thumbnailUrl={result.thumbnailUrl}
            hint={catalogHint}
            actions={
              <>
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

          {episodeError && (
            <p
              role="alert"
              className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {episodeError}
            </p>
          )}

          <div className="max-h-[min(60vh,520px)] space-y-6 overflow-y-auto rounded-2xl border border-border/50 bg-muted/10 p-3 md:p-4">
            {groups.map(([seasonLabel, eps]) => (
              <div key={seasonLabel}>
                <h3 className="mb-3 sticky top-0 z-10 bg-muted/10 py-1 text-sm font-semibold uppercase tracking-wide text-primary">
                  {seasonLabel}
                </h3>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {eps.map((ep) => {
                    const busy = loadingId === ep.id
                    const displayLabel =
                      ep.episode != null && !ep.label.match(/épisode|episode/i)
                        ? `Épisode ${ep.episode} · ${ep.label}`
                        : ep.label

                    return (
                      <li key={ep.id}>
                        <button
                          type="button"
                          disabled={busy || loadingId != null}
                          onClick={() => void analyzeEpisode(ep)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-xl border border-border/50 bg-card/50 px-3 py-3 text-left text-sm transition-colors',
                            'hover:border-primary/40 hover:bg-primary/5',
                            'disabled:pointer-events-none disabled:opacity-60',
                            busy && 'border-primary/50 bg-primary/10',
                          )}
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                            {busy ? (
                              <Loader2
                                className="size-4 animate-spin"
                                aria-hidden
                              />
                            ) : (
                              <Play className="size-4" aria-hidden />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="line-clamp-2 font-medium">
                              {displayLabel}
                            </span>
                            {busy && (
                              <span className="text-xs text-muted-foreground">
                                Analyse en cours…
                              </span>
                            )}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Si un épisode ne se lance pas, ouvrez-le sur le site source puis
            collez son URL directement sur l&apos;accueil.
          </p>
        </div>
      </motion.div>
    </motion.section>
  )
}
