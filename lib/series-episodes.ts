import { classifyStreamingHost } from '@/lib/streaming-hosts'

export type SeriesEpisode = {
  id: string
  url: string
  label: string
  season?: number
  episode?: number
  version?: 'vf' | 'vostfr' | 'vo'
  /** Hébergeurs déjà connus (French-Stream /data/eps_*.txt). */
  sources?: import('@/lib/streaming-embeds').StreamingSource[]
  description?: string
  thumbnailUrl?: string
}

function absolutize(href: string, base: string): string | null {
  try {
    return new URL(
      href.trim().replace(/\\u0026/g, '&').replace(/\\\//g, '/'),
      base,
    ).href
  } catch {
    return null
  }
}

function decodeHtmlEscapes(html: string): string {
  return html
    .replace(/\\u0026/g, '&')
    .replace(/\\u002f/gi, '/')
    .replace(/\\u003a/gi, ':')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function stripTags(s: string): string {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function canonicalPageUrl(url: string): string {
  try {
    const u = new URL(url)
    u.hash = ''
    return u.href.replace(/\/$/, '')
  } catch {
    return url
  }
}

function episodeId(url: string): string {
  let h = 2166136261
  for (let i = 0; i < url.length; i++) {
    h ^= url.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return `ep-${(h >>> 0).toString(36)}`
}

/** Liens qui ressemblent à une page d’épisode (pas un genre / profil). */
const EPISODE_URL_RE =
  /(?:newsid=\d+.*(?:&|;)ep(?:isode)?=|(?:^|[/?&])ep(?:isode)?=\d+|\/episode[-_/]\d|s\d{1,2}e\d{1,3}|\/e\d{1,3}(?:[/?#]|$))/i

const WEAK_EPISODE_URL_RE =
  /(?:newsid=\d+|player\.php|affiche\.php|fsplayer)/i

const NON_EPISODE_RE =
  /(?:login|register|contact|privacy|dmca|javascript:|#|\.(?:jpg|png|gif|css|js)(?:\?|$)|\/tag\/|\/genre\/|\/acteur\/|xfsearch|\/user\/|\/membre\/|facebook|twitter|\/serie-[a-z]+-\/?$)/i

const GENRE_SLUG_RE =
  /^(?:horreur|action|comedie|drame|thriller|romance|animation|aventure|fantastique|documentaire)$/i

const EPISODE_LABEL_RE =
  /^(?:épisode|episode)\s*0*(\d{1,3})\b/i

function parseSeasonEpisode(
  text: string,
  href: string,
): { season?: number; episode?: number } {
  const combined = `${text} ${href}`
  const sxe = combined.match(
    /s(?:aison)?\s*0*(\d{1,2})\s*[^0-9a-z]*e(?:p(?:isode)?)?\s*0*(\d{1,3})/i,
  )
  if (sxe) return { season: Number(sxe[1]), episode: Number(sxe[2]) }

  const sx = combined.match(/\bS(\d{1,2})E(\d{1,3})\b/i)
  if (sx) return { season: Number(sx[1]), episode: Number(sx[2]) }

  const labelEp = text.match(EPISODE_LABEL_RE)
  if (labelEp) return { episode: Number(labelEp[1]) }

  const season = combined.match(/(?:saison|season)\s*0*(\d{1,2})/i)
  const ep = combined.match(
    /(?:épisode|episode|ep\.?)\s*0*(\d{1,3})|(?:^|[\s/])e(?:p)?[-_.]?0*(\d{1,3})\b/i,
  )
  const epNum = ep ? Number(ep[1] || ep[2]) : undefined
  const seasonNum = season ? Number(season[1]) : undefined

  const pathSeason = href.match(/(?:saison|season)[-_/]?(\d{1,2})/i)
  const pathEp = href.match(/(?:episode|ep)[-_/]?(\d{1,3})/i)

  return {
    season: seasonNum ?? (pathSeason ? Number(pathSeason[1]) : undefined),
    episode: epNum ?? (pathEp ? Number(pathEp[1]) : undefined),
  }
}

function isLikelyUsernameLabel(label: string): boolean {
  const t = label.trim()
  if (t.length < 3 || t.length > 24) return false
  if (/\s/.test(t)) return false
  if (EPISODE_LABEL_RE.test(t)) return false
  if (/^\d+$/.test(t)) return false
  if (GENRE_SLUG_RE.test(t)) return false
  return /^[A-Za-z][A-Za-z0-9_-]*\d*[A-Za-z0-9]*$/.test(t)
}

function scoreEpisodeLink(
  href: string,
  label: string,
  pageUrl: string,
): number {
  if (NON_EPISODE_RE.test(href) || NON_EPISODE_RE.test(label)) return 0
  if (isLikelyUsernameLabel(label)) return 0
  if (GENRE_SLUG_RE.test(label.trim())) return 0
  if (/\/[a-z]+-serie-\/?$/i.test(href)) return 0

  const { episode } = parseSeasonEpisode(label, href)
  const hasEpisodeLabel = EPISODE_LABEL_RE.test(label) || episode != null

  let score = 0
  if (EPISODE_URL_RE.test(href)) score += 12
  else if (WEAK_EPISODE_URL_RE.test(href) && hasEpisodeLabel) score += 6

  if (hasEpisodeLabel) score += 10
  if (/newsid=\d+/i.test(href) && hasEpisodeLabel) score += 4

  if (!hasEpisodeLabel && !EPISODE_URL_RE.test(href)) return 0

  try {
    const base = new URL(pageUrl)
    const target = new URL(href, pageUrl)
    if (target.origin !== base.origin) return 0
    if (target.pathname === '/' && !target.search) return 0
    if (classifyStreamingHost(href)) return 0
  } catch {
    return 0
  }

  if (canonicalPageUrl(href) === canonicalPageUrl(pageUrl)) score -= 3

  return score
}

function pickTitle(html: string): string | undefined {
  const og = html.match(
    /<meta\s+property=["']og:title["']\s+content=["']([^"']*)["']/i,
  )
  if (og?.[1]) return stripTags(og[1])
  const t = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  if (t?.[1]) return stripTags(t[1])
  return undefined
}

function parseEpisodeCountFromHtml(html: string): number | null {
  const m = html.match(
    /ep\s*0*(\d{1,3})\s*sur\s*0*(\d{1,3})/i,
  )
  if (m) return Number(m[2])
  return null
}

function extractSyntheticEpisodes(
  pageUrl: string,
  total: number,
): SeriesEpisode[] {
  const out: SeriesEpisode[] = []
  for (let n = 1; n <= total; n++) {
    const u = new URL(pageUrl)
    u.searchParams.set('xfile_ep', String(n))
    out.push({
      id: episodeId(u.href),
      url: u.href,
      label: `Épisode ${n}`,
      episode: n,
    })
  }
  return out
}

/** Extrait les liens d’épisodes depuis une page catalogue série. */
export function extractSeriesEpisodes(
  html: string,
  pageUrl: string,
): SeriesEpisode[] {
  const decoded = decodeHtmlEscapes(html)
  const candidates = new Map<
    string,
    {
      url: string
      label: string
      score: number
      season?: number
      episode?: number
    }
  >()

  const addCandidate = (rawHref: string, rawLabel: string) => {
    const abs = absolutize(rawHref, pageUrl)
    if (!abs || !/^https?:\/\//i.test(abs)) return
    const label = stripTags(rawLabel) || abs
    const score = scoreEpisodeLink(abs, label, pageUrl)
    if (score < 8) return

    const { season, episode } = parseSeasonEpisode(label, abs)
    const key = canonicalPageUrl(abs)
    const existing = candidates.get(key)
    if (!existing || score > existing.score) {
      candidates.set(key, { url: abs, label, score, season, episode })
    }
  }

  const anchorRe = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  let m: RegExpExecArray | null
  while ((m = anchorRe.exec(decoded)) !== null) {
    addCandidate(m[1], m[2])
  }

  const episodeLabelRe =
    /href=["']([^"']+)["'][^>]*>[\s\S]*?(?:Episode|Épisode)\s*0*(\d{1,2})/gi
  while ((m = episodeLabelRe.exec(decoded)) !== null) {
    addCandidate(m[1], `Épisode ${m[2]}`)
  }

  const reverseEpRe =
    /(?:Episode|Épisode)\s*0*(\d{1,2})[\s\S]{0,120}?href=["']([^"']+)["']/gi
  while ((m = reverseEpRe.exec(decoded)) !== null) {
    addCandidate(m[2], `Épisode ${m[1]}`)
  }

  const newsidBtnRe =
    /(?:épisode|episode|ep\.?)\s*0*(\d{1,3})[^"']*["'][^"']*href=["']([^"']+)["']/gi
  while ((m = newsidBtnRe.exec(decoded)) !== null) {
    addCandidate(m[2], `Épisode ${m[1]}`)
  }

  let results = [...candidates.values()].sort((a, b) => {
    const sa = a.season ?? 0
    const sb = b.season ?? 0
    if (sa !== sb) return sa - sb
    const ea = a.episode ?? 9999
    const eb = b.episode ?? 9999
    if (ea !== eb) return ea - eb
    return a.label.localeCompare(b.label, 'fr')
  })

  if (results.length < 2) {
    const total = parseEpisodeCountFromHtml(decoded)
    if (total != null && total >= 2 && isLikelySeriesCatalogUrl(pageUrl)) {
      results = extractSyntheticEpisodes(pageUrl, total).map((e) => ({
        url: e.url,
        label: e.label,
        score: 5,
        episode: e.episode,
      }))
    }
  }

  return results.map((c) => ({
    id: episodeId(c.url),
    url: c.url,
    label: c.label,
    season: c.season,
    episode: c.episode,
  }))
}

export function isLikelySeriesCatalogUrl(url: string): boolean {
  try {
    const u = new URL(url)
    const blob = `${u.pathname} ${u.search}`.toLowerCase()
    return /serie|série|series|saison|season|episodes?/i.test(blob)
  } catch {
    return false
  }
}

export function shouldReturnSeriesCatalog(
  pageUrl: string,
  html: string,
  hasStreamingOnPage: boolean,
): { catalog: boolean; episodes: SeriesEpisode[]; title?: string } {
  const episodes = extractSeriesEpisodes(html, pageUrl)
  if (episodes.length < 2) {
    return { catalog: false, episodes: [] }
  }

  const withEpisodeNumber = episodes.filter((e) => e.episode != null)
  if (withEpisodeNumber.length < 2) {
    return { catalog: false, episodes: [] }
  }

  const current = canonicalPageUrl(pageUrl)
  const otherEpisodes = episodes.filter(
    (e) => canonicalPageUrl(e.url) !== current,
  )

  if (otherEpisodes.length >= 2) {
    return { catalog: true, episodes, title: pickTitle(html) }
  }

  if (
    episodes.length >= 2 &&
    isLikelySeriesCatalogUrl(pageUrl) &&
    !hasStreamingOnPage &&
    withEpisodeNumber.length >= 2
  ) {
    return { catalog: true, episodes, title: pickTitle(html) }
  }

  return { catalog: false, episodes: [] }
}
