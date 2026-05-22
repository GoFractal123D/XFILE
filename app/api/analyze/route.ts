import { NextResponse } from 'next/server'
import { assertFetchablePublicUrl } from '@/lib/ssrf-guard'
import {
  mergeDetection,
  detectYoutube,
  detectVimeo,
  type DetectedVideo,
} from '@/lib/video-extract'
import {
  detectionToResponse,
  type AnalyzeSuccessResponse,
} from '@/lib/analyze-types'
import { enrichStreamingSources } from '@/lib/catalog-scraper'
import { pickBestSourcePerHost } from '@/lib/streaming-embeds'
import {
  isLikelySeriesCatalogUrl,
  shouldReturnSeriesCatalog,
} from '@/lib/series-episodes'
import {
  isFrenchStreamSeriesPage,
  loadFrenchStreamSeriesCatalog,
} from '@/lib/french-stream-episodes'
import {
  extractPageMetadata,
  fetchPageMetadata,
  fetchYoutubeMetadata,
  fetchVimeoMetadata,
  mergeMetadata,
  type PageMetadata,
} from '@/lib/page-metadata'

export const runtime = 'nodejs'
export const maxDuration = 60

function normalizeInput(raw: string): string {
  const t = raw.trim()
  if (!t) return t
  return /^https?:\/\//i.test(t) ? t : `https://${t}`
}

async function resolvePageMetadata(
  pageUrl: string,
  pageHtml: string | null,
  detected: DetectedVideo | null,
): Promise<PageMetadata> {
  if (pageHtml) return extractPageMetadata(pageHtml, pageUrl)

  const yt = detectYoutube(pageUrl)
  if (yt) return fetchYoutubeMetadata(pageUrl, yt)

  if (detectVimeo(pageUrl)) return fetchVimeoMetadata(pageUrl)

  if (detected?.kind === 'embed-youtube') {
    return fetchYoutubeMetadata(pageUrl, detected.videoId)
  }
  if (detected?.kind === 'embed-vimeo') {
    return fetchVimeoMetadata(pageUrl)
  }

  return fetchPageMetadata(pageUrl)
}

function finalizeResponse(
  response: AnalyzeSuccessResponse,
  meta: PageMetadata,
): AnalyzeSuccessResponse {
  return mergeMetadata(response, meta) as AnalyzeSuccessResponse
}

export async function POST(req: Request) {
  try {
    // Désactiver la vérification SSL pour contourner le problème de certificat
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

    const body = (await req.json()) as { url?: string }
    const raw = typeof body.url === 'string' ? body.url : ''
    if (!raw.trim()) {
      return NextResponse.json(
        { ok: false, error: 'URL requise' } as const,
        { status: 400 },
      )
    }

    const normalized = normalizeInput(raw)
    const pageUrl = assertFetchablePublicUrl(normalized).href

    let detected = mergeDetection(pageUrl, null)
    let pageHtml: string | null = null
    const needsHtml = !detected || isLikelySeriesCatalogUrl(pageUrl)

    if (needsHtml) {
      const res = await fetch(pageUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(25000),
      })

      if (!res.ok) {
        return NextResponse.json(
          {
            ok: false,
            error: `Impossible de charger la page (code ${res.status}).`,
            pageUrl,
          } as const,
          { status: 422 },
        )
      }

      pageHtml = await res.text()
      if (!detected) {
        detected = mergeDetection(pageUrl, pageHtml)
      }
    }

    if (pageHtml) {
      const fsCatalog = await loadFrenchStreamSeriesCatalog(pageUrl, pageHtml)
      if (fsCatalog && fsCatalog.episodes.length > 0) {
        const vfCount = fsCatalog.episodes.filter((e) => e.version === 'vf').length
        const vostfrCount = fsCatalog.episodes.filter(
          (e) => e.version === 'vostfr',
        ).length
        const langs = [
          vfCount > 0 ? `${vfCount} VF` : '',
          vostfrCount > 0 ? `${vostfrCount} VOSTFR` : '',
        ]
          .filter(Boolean)
          .join(' · ')

        return NextResponse.json(
          finalizeResponse(
            {
              ok: true,
              pageUrl,
              kind: 'series-catalog',
              title: fsCatalog.title,
              description: fsCatalog.description,
              thumbnailUrl: fsCatalog.thumbnailUrl,
              hint: `${fsCatalog.episodes.length} épisode(s) (${langs}) — choisissez un épisode pour lire et télécharger.`,
              episodes: fsCatalog.episodes,
              downloadable: false,
            },
            { title: fsCatalog.title, description: fsCatalog.description, thumbnailUrl: fsCatalog.thumbnailUrl },
          ),
        )
      }

      if (!fsCatalog?.episodes.length && isFrenchStreamSeriesPage(pageHtml)) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Page série French-Stream détectée, mais la liste des épisodes n’a pas pu être chargée. Ouvrez la page avec une URL contenant newsid=… ou réessayez.',
            pageUrl,
          } as const,
          { status: 404 },
        )
      }

      const hasStreaming =
        detected?.kind === 'streaming' && detected.sources.length > 0
      const catalog = shouldReturnSeriesCatalog(
        pageUrl,
        pageHtml,
        hasStreaming,
      )
      if (catalog.catalog) {
        const meta = extractPageMetadata(pageHtml, pageUrl)
        return NextResponse.json(
          finalizeResponse(
            {
              ok: true,
              pageUrl,
              kind: 'series-catalog',
              title: catalog.title,
              hint: `${catalog.episodes.length} épisode(s) détecté(s) — sélectionnez un épisode pour l’analyser et le lire.`,
              episodes: catalog.episodes,
              downloadable: false,
            },
            { ...meta, title: catalog.title ?? meta.title },
          ),
        )
      }
    }

    if (!detected) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Aucune source vidéo détectée. Pour les sites de streaming, la page doit contenir des liens vers des hébergeurs (UQLOAD, DOOD, VOE…). Sinon essayez YouTube ou une URL .mp4 directe.',
          pageUrl,
        } as const,
        { status: 404 },
      )
    }

    const meta = await resolvePageMetadata(pageUrl, pageHtml, detected)

    if (detected.kind === 'streaming') {
      const enriched = await enrichStreamingSources(pageUrl, detected.sources)
      const sources = pickBestSourcePerHost(enriched)
      if (sources.length === 0) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Aucun hébergeur vidéo trouvé sur cette page. Les lecteurs sont peut‑être chargés uniquement en JavaScript.',
            pageUrl,
          } as const,
          { status: 404 },
        )
      }
      detected = {
        ...detected,
        sources,
        hint: `${sources.length} hébergeur(s) — lecture automatique du meilleur flux.`,
      }
    }

    let response = detectionToResponse(detected, pageUrl)
    if (response.kind === 'embed-youtube') {
      response = {
        ...response,
        embedUrl: `${response.embedUrl}&autoplay=1&mute=0`,
      }
    }

    return NextResponse.json(finalizeResponse(response, meta))
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur serveur'
    return NextResponse.json({ ok: false, error: msg } as const, {
      status: 400,
    })
  }
}
