import {
  sortStreamingSources,
  stableSourceId,
  type StreamingSource,
} from '@/lib/streaming-embeds'
import { classifyStreamingHost } from '@/lib/streaming-hosts'
import type { SeriesEpisode } from '@/lib/series-episodes'
import { BROWSER_HEADERS } from '@/lib/fetch-page'
import { extractPageMetadata } from '@/lib/page-metadata'

export type FrenchStreamEpsFile = {
  vf?: Record<string, Record<string, string>>
  vostfr?: Record<string, Record<string, string>>
  vo?: Record<string, Record<string, string>>
  info?: Record<string, { title?: string; synopsis?: string; poster?: string }>
}

const VERSION_LABELS: Record<string, string> = {
  vf: 'VF',
  vostfr: 'VOSTFR',
  vo: 'VO',
}

export function extractFrenchStreamNewsId(html: string): string | null {
  const serieData =
    html.match(
      /id=["']serie-data["'][^>]*\sdata-newsid=["'](\d+)["']/i,
    ) ||
    html.match(
      /data-newsid=["'](\d+)["'][^>]*\sid=["']serie-data["']/i,
    )
  if (serieData?.[1]) return serieData[1]

  const epsInScript = html.match(/eps_(\d{6,})\.txt/i)
  if (epsInScript?.[1]) return epsInScript[1]

  const linkNews = html.match(
    /<link[^>]+rel=["']canonical["'][^>]+href=["'][^"']*newsid=(\d+)/i,
  )
  if (linkNews?.[1]) return linkNews[1]

  return html.match(/data-newsid=["'](\d+)["']/i)?.[1] ?? null
}

export function isFrenchStreamSeriesPage(html: string): boolean {
  return (
    /id=["']serie-data["']/i.test(html) ||
    /class=["'][^"']*episodes-wrapper/i.test(html) ||
    /(?:vf|vostfr)-column/i.test(html)
  )
}

/** Identifiants newsid candidats présents dans le HTML (French-Stream). */
export function collectFrenchStreamNewsIdCandidates(html: string): string[] {
  const ids = new Set<string>()
  const patterns = [
    /data-newsid=["'](\d{6,})["']/gi,
    /eps_(\d{6,})\.txt/gi,
    /newsid=(\d{6,})/gi,
    /openModal\(['"](\d{6,})['"]\)/gi,
  ]
  for (const re of patterns) {
    let m: RegExpExecArray | null
    while ((m = re.exec(html)) !== null) {
      if (m[1]) ids.add(m[1])
    }
  }
  const primary = extractFrenchStreamNewsId(html)
  if (primary) {
    const ordered = [primary, ...ids]
    return [...new Set(ordered)]
  }
  return [...ids]
}

function slugToSearchQuery(pageUrl: string): string | null {
  try {
    const u = new URL(pageUrl)
    const parts = u.pathname.split('/').filter(Boolean)
    const last = parts[parts.length - 1]
    if (!last || last.length < 4) return null
    if (!/serie|saison|season|series/i.test(u.pathname)) return null
    return decodeURIComponent(last)
      .replace(/\.html?$/i, '')
      .replace(/-serie$/i, '')
      .replace(/-/g, ' ')
      .trim()
  } catch {
    return null
  }
}

async function fetchSearchHtml(origin: string, query: string): Promise<string | null> {
  const url = `${origin.replace(/\/$/, '')}/index.php?do=search&subaction=search&story=${encodeURIComponent(query)}`
  try {
    const res = await fetch(url, {
      headers: {
        ...BROWSER_HEADERS,
        Referer: `${origin}/`,
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) return null
    return res.text()
  } catch {
    return null
  }
}

function pickNewsIdFromSearchHtml(
  searchHtml: string,
  query: string,
): string | null {
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2)
  if (tokens.length === 0) return null

  const linkRe = /newsid=(\d{6,})[\s\S]{0,500}?>([^<]{4,120})</gi
  let best: { id: string; score: number } | null = null

  let m: RegExpExecArray | null
  while ((m = linkRe.exec(searchHtml)) !== null) {
    const id = m[1]
    const label = m[2].toLowerCase()
    let score = 0
    for (const t of tokens) {
      if (label.includes(t)) score += 4
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { id, score }
    }
  }

  return best?.id ?? null
}

async function catalogFromNewsId(
  origin: string,
  newsId: string,
  pageUrl: string,
  pageTitle?: string,
): Promise<SeriesEpisode[] | null> {
  const data = await fetchFrenchStreamEpsFile(origin, newsId, pageUrl)
  if (!data) return null
  const episodes = buildEpisodesFromFrenchStream(data, pageUrl, pageTitle)
  return episodes.length > 0 ? episodes : null
}

function pickTitle(html: string): string | undefined {
  const og = html.match(
    /<meta\s+property=["']og:title["']\s+content=["']([^"']*)["']/i,
  )
  if (og?.[1]) return og[1].trim()
  const dataTitle = html.match(/data-title=["']([^"']+)["']/i)
  if (dataTitle?.[1]) return dataTitle[1].trim()
  const t = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  return t?.[1]?.trim()
}

export function playersRecordToSources(
  players: Record<string, string>,
  pageUrl: string,
): StreamingSource[] {
  const map = new Map<string, StreamingSource>()
  for (const [key, rawUrl] of Object.entries(players)) {
    if (!rawUrl?.trim() || rawUrl.includes('[xfvalue_')) continue
    let url = rawUrl.trim()
    if (!/^https?:\/\//i.test(url)) continue

    const info = classifyStreamingHost(url)
    const host = info?.host ?? key.toLowerCase()
    const label = info?.label ?? key.toUpperCase()

    if (!map.has(url)) {
      map.set(url, {
        id: stableSourceId(url),
        label,
        embedUrl: url,
        host,
      })
    }
  }
  return sortStreamingSources([...map.values()])
}

export async function fetchFrenchStreamEpsFile(
  origin: string,
  newsId: string,
  referer?: string,
): Promise<FrenchStreamEpsFile | null> {
  const base = origin.replace(/\/$/, '')
  const url = `${base}/data/eps_${newsId}.txt?v=${Math.floor(Date.now() / 30_000)}`

  try {
    const res = await fetch(url, {
      headers: {
        ...BROWSER_HEADERS,
        ...(referer ? { Referer: referer } : { Referer: `${base}/` }),
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) return null

    const text = await res.text()
    if (!text.trim()) return null

    try {
      return JSON.parse(text) as FrenchStreamEpsFile
    } catch {
      try {
        return Function(`"use strict";return (${text})`)() as FrenchStreamEpsFile
      } catch {
        return null
      }
    }
  } catch {
    return null
  }
}

export function buildEpisodesFromFrenchStream(
  data: FrenchStreamEpsFile,
  pageUrl: string,
  pageTitle?: string,
): SeriesEpisode[] {
  const episodes: SeriesEpisode[] = []
  const versions = ['vf', 'vostfr', 'vo'] as const

  for (const version of versions) {
    const bucket = data[version]
    if (!bucket) continue

    const nums = Object.keys(bucket)
      .map((k) => parseInt(k, 10))
      .filter((n) => !Number.isNaN(n))
      .sort((a, b) => a - b)

    for (const num of nums) {
      const players = bucket[String(num)]
      if (!players || typeof players !== 'object') continue

      const sources = playersRecordToSources(players, pageUrl)
      if (sources.length === 0) continue

      const info = data.info?.[String(num)]
      const epTitle =
        info?.title?.trim() ||
        `Épisode ${num}`
      const versionLabel = VERSION_LABELS[version] ?? version.toUpperCase()

      episodes.push({
        id: `${version}-${num}-${episodeIdFromParts(pageUrl, version, num)}`,
        url: pageUrl,
        label: `${epTitle} (${versionLabel})`,
        episode: num,
        version,
        sources,
        description: info?.synopsis?.trim() || undefined,
        thumbnailUrl: info?.poster?.trim() || undefined,
      })
    }
  }

  return episodes
}

function episodeIdFromParts(
  pageUrl: string,
  version: string,
  num: number,
): string {
  return stableSourceId(`${pageUrl}|${version}|${num}`).replace('src-', '')
}

export async function loadFrenchStreamSeriesCatalog(
  pageUrl: string,
  html: string,
): Promise<{
  title?: string
  description?: string
  thumbnailUrl?: string
  episodes: SeriesEpisode[]
} | null> {
  let origin: string
  try {
    origin = new URL(pageUrl).origin
  } catch {
    return null
  }

  const pageTitle = pickTitle(html)
  const tryIds = collectFrenchStreamNewsIdCandidates(html)

  if (isFrenchStreamSeriesPage(html) || tryIds.length > 0) {
    for (const newsId of tryIds) {
      const episodes = await catalogFromNewsId(
        origin,
        newsId,
        pageUrl,
        pageTitle,
      )
      if (episodes && episodes.length >= 2) {
        const meta = extractPageMetadata(html, pageUrl)
        return {
          title: pageTitle ?? meta.title,
          description: meta.description,
          thumbnailUrl: meta.thumbnailUrl,
          episodes,
        }
      }
    }
  }

  const searchQuery = slugToSearchQuery(pageUrl)
  if (searchQuery) {
    const fromSearch = await discoverCatalogViaSearch(
      origin,
      searchQuery,
      pageUrl,
      pageTitle,
    )
    if (fromSearch) return fromSearch
  }

  return null
}

async function discoverCatalogViaSearch(
  origin: string,
  query: string,
  pageUrl: string,
  pageTitle?: string,
): Promise<{
  title?: string
  description?: string
  thumbnailUrl?: string
  episodes: SeriesEpisode[]
} | null> {
  const searchHtml = await fetchSearchHtml(origin, query)
  if (!searchHtml) return null

  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2)

  const ids = [...new Set([...searchHtml.matchAll(/newsid=(\d{6,})/g)].map((m) => m[1]))]
  const preferred = pickNewsIdFromSearchHtml(searchHtml, query)
  const ordered = preferred
    ? [preferred, ...ids.filter((id) => id !== preferred)]
    : ids

  let best: {
    episodes: SeriesEpisode[]
    score: number
    title?: string
    newsId: string
  } | null = null

  for (const newsId of ordered.slice(0, 30)) {
    const episodes = await catalogFromNewsId(origin, newsId, pageUrl, pageTitle)
    if (!episodes || episodes.length < 2) continue

    const vfCount = episodes.filter((e) => e.version === 'vf').length
    let score = vfCount * 2 + episodes.length

    const ctxIdx = searchHtml.indexOf(`newsid=${newsId}`)
    const ctx =
      ctxIdx >= 0
        ? searchHtml.slice(ctxIdx - 250, ctxIdx + 350).toLowerCase()
        : ''
    for (const t of tokens) {
      if (ctx.includes(t)) score += 6
    }

    const titleFromCtx = searchHtml
      .slice(ctxIdx, ctxIdx + 500)
      .match(/alt=["']([^"']{4,100})["']/i)?.[1]

    if (!best || score > best.score) {
      best = {
        episodes,
        score,
        title: titleFromCtx?.trim() || pageTitle,
        newsId,
      }
    }
  }

  if (!best) return null

  const meta = await fetchFrenchStreamSeriesPageMeta(
    origin,
    best.newsId,
    pageUrl,
  )
  return {
    title: best.title ?? meta?.title,
    description: meta?.description,
    thumbnailUrl: meta?.thumbnailUrl,
    episodes: best.episodes,
  }
}

async function fetchFrenchStreamSeriesPageMeta(
  origin: string,
  newsId: string | undefined,
  referer: string,
): Promise<{
  title?: string
  description?: string
  thumbnailUrl?: string
} | null> {
  if (!newsId) return null
  const url = `${origin.replace(/\/$/, '')}/index.php?newsid=${newsId}`
  try {
    const res = await fetch(url, {
      headers: {
        ...BROWSER_HEADERS,
        Referer: referer,
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) return null
    const html = await res.text()
    return extractPageMetadata(html, url)
  } catch {
    return null
  }
}
