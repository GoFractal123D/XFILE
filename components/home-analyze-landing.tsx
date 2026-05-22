'use client'

import { useMemo, useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { contents } from '@/lib/data'
import { Link2, Sparkles, Loader2 } from 'lucide-react'
import { ImportResultPanel } from '@/components/import-result-panel'
import type { AnalyzeResponse, AnalyzeSuccessResponse } from '@/lib/analyze-types'
import { useOnlineStatus } from '@/lib/use-online-status'
import Link from 'next/link'

const VIDEO_SRC =
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'

function FloatingParticles({ reduced }: { reduced: boolean | null }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => ({
        id: i,
        x: ((Math.sin(i * 1.7) + 1) / 2) * 100,
        y: ((Math.cos(i * 2.1) + 1) / 2) * 100,
        r: 1.5 + (i % 4) * 0.6,
        dur: 14 + (i % 9) * 2,
        delay: (i % 12) * 0.35,
      })),
    [],
  )

  if (reduced) {
    return null
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
      aria-hidden
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-primary/35 shadow-[0_0_12px_oklch(0.7_0.15_180_/_0.45)]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.r,
            height: p.r,
          }}
          animate={{
            y: [0, -28, 12, 0],
            x: [0, 10, -8, 0],
            opacity: [0.25, 0.85, 0.4, 0.25],
            scale: [1, 1.4, 0.9, 1],
          }}
          transition={{
            duration: p.dur,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: p.delay,
          }}
        />
      ))}
    </div>
  )
}

function AmbientOrbs({ reduced }: { reduced: boolean | null }) {
  if (reduced) {
    return (
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,oklch(0.7_0.15_180/0.18),transparent_55%)]"
        aria-hidden
      />
    )
  }

  return (
    <>
      <motion.div
        className="pointer-events-none absolute -left-[20%] top-[10%] z-0 h-[55vmin] w-[55vmin] rounded-full bg-primary/25 blur-[100px]"
        animate={{ scale: [1, 1.12, 1], opacity: [0.35, 0.55, 0.38] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden
      />
      <motion.div
        className="pointer-events-none absolute -right-[15%] bottom-[5%] z-0 h-[60vmin] w-[60vmin] rounded-full bg-chart-3/30 blur-[110px]"
        animate={{ scale: [1.08, 1, 1.1], opacity: [0.28, 0.48, 0.32] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        aria-hidden
      />
      <motion.div
        className="pointer-events-none absolute left-1/2 top-[40%] z-0 h-[40vmin] w-[70vmin] -translate-x-1/2 rounded-full bg-chart-2/20 blur-[90px]"
        animate={{ rotate: [0, 8, -6, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_90%_50%_at_50%_0%,oklch(0.7_0.15_180/0.12),transparent_60%),radial-gradient(ellipse_70%_45%_at_80%_90%,oklch(0.65_0.12_220/0.1),transparent_55%)]"
        aria-hidden
      />
    </>
  )
}

const previewItems = contents.slice(0, 6)

export function HomeAnalyzeLanding() {
  const [url, setUrl] = useState('')
  const [focused, setFocused] = useState(false)
  const [shake, setShake] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalyzeSuccessResponse | null>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q')
    if (q) setUrl(q)
  }, [])

  const intensity = Math.min(url.length / 80, 1)
  const borderGlow =
    focused || url.length > 0
      ? `0 0 ${24 + intensity * 40}px oklch(0.7 0.2 180 / ${0.35 + intensity * 0.35}), 0 0 ${60 + intensity * 50}px oklch(0.65 0.12 220 / ${0.15 + intensity * 0.2})`
      : '0 0 32px oklch(0.7 0.15 180 / 0.2)'

  const online = useOnlineStatus()

  const analyze = async () => {
    if (!online) {
      setError(
        'Vous êtes hors ligne. Consultez vos playlists ou la bibliothèque hors ligne.',
      )
      return
    }

    const raw = url.trim()
    let ok = false
    let normalized = ''
    if (raw) {
      try {
        normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
        // eslint-disable-next-line no-new
        new URL(normalized)
        ok = true
      } catch {
        ok = false
      }
    }
    if (!ok) {
      setShake(true)
      setError(null)
      window.setTimeout(() => setShake(false), 480)
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalized }),
      })
      const data = (await res.json()) as AnalyzeResponse
      if (!data.ok) {
        setError(data.error)
        setShake(true)
        window.setTimeout(() => setShake(false), 480)
        return
      }
      setResult(data)
    } catch {
      setError('Impossible de contacter le serveur. Réessayez dans un instant.')
      setShake(true)
      window.setTimeout(() => setShake(false), 480)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-[calc(100dvh-4rem)] w-full overflow-x-hidden md:min-h-[calc(100dvh-5rem)]">
      {/* Cinematic backdrop */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-background">
        <video
          className="absolute inset-0 h-[130%] w-full -translate-y-[10%] scale-105 object-cover opacity-[0.14] blur-[72px] saturate-125 mix-blend-screen"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
        >
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>
        <div
          className="absolute inset-0 bg-gradient-to-b from-background via-background/92 to-background"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:48px_48px] opacity-[0.35] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_35%,black,transparent)]"
          aria-hidden
        />
        <AmbientOrbs reduced={reducedMotion} />
        <FloatingParticles reduced={reducedMotion} />
      </div>

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col px-4 pb-20 pt-28 md:px-8 md:pt-32">
        {/* Hero copy */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 text-center"
        >
          <motion.div
            className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium tracking-wide text-primary backdrop-blur-md"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Sparkles className="size-3.5" aria-hidden />
            Analyse intelligente · 2026
          </motion.div>
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl lg:text-[2.75rem] lg:leading-[1.08]">
            Collez l’URL d’un site.
            <span className="block bg-gradient-to-r from-primary via-chart-2 to-primary bg-clip-text text-transparent">
              Obtenez une analyse instantanée.
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-sm text-muted-foreground md:text-base">
            Collez l’URL d’un site de streaming ou d’une vidéo : nous détectons les
            hébergeurs (UQLOAD, DOOD, VOE…), YouTube, ou les fichiers directs — lecture et
            téléchargement quand c’est possible.
          </p>
        </motion.div>

        {/* Glass URL field */}
        <motion.div
          animate={
            reducedMotion || !shake
              ? { x: 0 }
              : { x: [0, -8, 8, -5, 5, -3, 3, 0] }
          }
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          className="mx-auto w-full max-w-3xl"
        >
          <label htmlFor="analyze-url" className="sr-only">
            URL du site à analyser
          </label>
          <div
            className="analyze-input-glow rounded-[1.35rem] p-[2px] transition-[filter] duration-300"
            style={{
              boxShadow: borderGlow,
              filter: focused ? 'saturate(1.08)' : undefined,
            }}
          >
            <div className="analyze-border-rotate rounded-[1.28rem] p-[1px]">
              <div className="flex flex-col gap-2 rounded-[1.22rem] bg-[oklch(0.12_0.02_270/0.55)] p-2 shadow-[inset_0_1px_0_oklch(1_0_0/0.06)] backdrop-blur-2xl sm:flex-row sm:items-stretch sm:gap-2 sm:px-3 sm:py-2 md:px-4 md:py-3">
                <div className="flex min-h-[3rem] flex-1 items-center gap-3 sm:min-h-0">
                  <span className="hidden shrink-0 sm:flex">
                    <Link2
                      className="size-[1.35rem] text-primary/80"
                      aria-hidden
                    />
                  </span>
                  <input
                    id="analyze-url"
                    type="url"
                    inputMode="url"
                    autoComplete="url"
                    placeholder={
                      online
                        ? 'https://exemple.com'
                        : 'Hors ligne — analyse indisponible'
                    }
                    value={url}
                    disabled={!online}
                    onChange={(e) => setUrl(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && !loading && online && void analyze()
                    }
                    className="analyze-input-field w-full min-w-0 border-0 bg-transparent py-3 text-base text-foreground placeholder:text-muted-foreground/55 outline-none disabled:opacity-50 md:py-3.5 md:text-lg"
                  />
                </div>
                <motion.button
                  type="button"
                  onClick={analyze}
                  disabled={loading || !online}
                  aria-busy={loading}
                  className="analyze-cta group relative w-full shrink-0 overflow-hidden rounded-xl px-5 py-3.5 text-sm font-semibold tracking-wide text-primary-foreground shadow-[0_0_0_1px_oklch(0.55_0.12_180/0.35)_inset,0_4px_24px_oklch(0.7_0.15_180/0.35)] disabled:pointer-events-none disabled:opacity-60 sm:w-auto md:px-7 md:text-[0.9375rem]"
                  whileHover={
                    reducedMotion ? undefined : { scale: 1.03, y: -1 }
                  }
                  whileTap={reducedMotion ? undefined : { scale: 0.97, y: 0 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                >
                  <span className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-chart-2 opacity-95 transition-opacity group-hover:opacity-100" />
                  <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_-20%,oklch(1_0_0/0.35),transparent_55%)] opacity-70" />
                  <span className="absolute -inset-8 translate-y-12 bg-[conic-gradient(from_180deg_at_50%_50%,transparent,oklch(1_0_0/0.15),transparent)] opacity-0 blur-md transition duration-500 group-hover:translate-y-0 group-hover:opacity-100" />
                  <span className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                        Analyse…
                      </>
                    ) : (
                      <>
                        Analyser
                        <motion.span
                          aria-hidden
                          className="inline-block"
                          animate={
                            reducedMotion
                              ? undefined
                              : { x: [0, 3, 0], opacity: [1, 0.85, 1] }
                          }
                          transition={{
                            duration: 2.2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                        >
                          →
                        </motion.span>
                      </>
                    )}
                  </span>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.p
            role="alert"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mt-4 max-w-3xl text-center text-sm text-destructive"
          >
            {error}
            {!online && (
              <>
                {' '}
                <Link href="/offline" className="underline text-primary">
                  Ouvrir la bibliothèque hors ligne
                </Link>
              </>
            )}
          </motion.p>
        )}

        {result && (
          <ImportResultPanel
            result={result}
            onDismiss={() => {
              setResult(null)
              setError(null)
            }}
          />
        )}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-16 w-full max-w-6xl"
        >
          <div className="mb-6 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-lg font-semibold tracking-tight md:text-xl">
                Aperçus cinéma
              </h2>
              <p className="text-sm text-muted-foreground">
                Fictions immersives · cartes interactives
              </p>
            </div>
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-primary/80">
              Démo
            </span>
          </div>

          <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
            {previewItems.map((item, index) => (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  delay: index * 0.06,
                  duration: 0.45,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <motion.article
                  className="group relative aspect-[2/3] cursor-default overflow-hidden rounded-2xl border border-white/[0.08] bg-card/40 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-sm"
                  whileHover={
                    reducedMotion
                      ? undefined
                      : { y: -6, scale: 1.03 }
                  }
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                >
                  <div className="absolute inset-0 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.thumbnail}
                      alt=""
                      className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-90 transition duration-500 group-hover:opacity-95" />
                    <div className="absolute inset-0 opacity-0 mix-blend-screen transition duration-500 group-hover:opacity-100">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,oklch(0.7_0.15_180/0.35),transparent_65%)]" />
                    </div>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground drop-shadow-md">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.year}
                      <span className="mx-1.5 opacity-40">·</span>
                      <span className="text-primary/90">
                        {item.type === 'movie' ? 'Film' : 'Série'}
                      </span>
                    </p>
                  </div>
                  <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-primary/0 transition-[box-shadow] duration-500 group-hover:shadow-[0_0_36px_oklch(0.7_0.15_180/0.35)] group-hover:ring-primary/35" />
                </motion.article>
              </motion.li>
            ))}
          </ul>
        </motion.section>
      </div>
    </div>
  )
}
