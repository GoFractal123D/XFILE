import {
  classifyStreamingHost,
  sortStreamingSources,
  PRIMARY_STREAMING_HOSTS,
} from '@/lib/streaming-hosts'

export type StreamingSource = {
  id: string
  label: string
  embedUrl: string
  host: string
}

export {
  classifyStreamingHost,
  sortStreamingSources,
  PRIMARY_STREAMING_HOSTS,
} from '@/lib/streaming-hosts'

/** Identifiant React stable et unique par URL d’embed. */
export function stableSourceId(embedUrl: string): string {
  let h = 2166136261
  for (let i = 0; i < embedUrl.length; i++) {
    h ^= embedUrl.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return `src-${(h >>> 0).toString(36)}`
}

function absolutize(href: string, base: string): string | null {
  try {
    return new URL(href.trim().replace(/\\u0026/g, '&'), base).href
  } catch {
    return null
  }
}

function isLikelyEmbedPage(url: string): boolean {
  if (/\.(js|css|png|jpe?g|gif|svg|ico|woff2?|ttf)(\?|$)/i.test(url)) {
    return false
  }
  try {
    const u = new URL(url)
    if (u.pathname === '/' || u.pathname === '') return false
    return u.pathname.length > 1
  } catch {
    return false
  }
}

function addUrl(
  map: Map<string, StreamingSource>,
  raw: string,
  base: string,
  labelOverride?: string,
  hostCounts?: Map<string, number>,
) {
  const abs = absolutize(raw, base)
  if (!abs || !/^https?:\/\//i.test(abs) || !isLikelyEmbedPage(abs)) return
  const info = classifyStreamingHost(abs)
  if (!info) return

  if (map.has(abs)) return

  const count = (hostCounts.get(info.host) ?? 0) + 1
  hostCounts.set(info.host, count)
  const label =
    labelOverride ||
    (count > 1 ? `${info.label} ${count}` : info.label)

  map.set(abs, {
    id: stableSourceId(abs),
    label,
    embedUrl: abs,
    host: info.host,
  })
}

function collectFromHtml(
  html: string,
  pageUrl: string,
  map: Map<string, StreamingSource>,
) {
  const hostCounts = new Map<string, number>()

  const iframeRe =
    /<iframe[^>]+(?:src|data-src)=["']([^"']+)["'][^>]*>/gi
  let m: RegExpExecArray | null
  while ((m = iframeRe.exec(html)) !== null) {
    addUrl(map, m[1], pageUrl, undefined, hostCounts)
  }

  const hrefRe = /href=["'](https?:\/\/[^"']+)["']/gi
  while ((m = hrefRe.exec(html)) !== null) {
    addUrl(map, m[1], pageUrl, undefined, hostCounts)
  }

  const decoded = html
    .replace(/\\u0026/g, '&')
    .replace(/\\u002f/gi, '/')
    .replace(/\\u003a/gi, ':')

  const hostPattern = PRIMARY_STREAMING_HOSTS.map((h) => h.id).join('|')
  const urlInScript = new RegExp(
    `https?:\\/\\/[a-z0-9.-]*(?:${hostPattern}|ds2play|d000d|streamtape|mixdrop|filemoon)[a-z0-9./?=&%-]*`,
    'gi',
  )
  while ((m = urlInScript.exec(decoded)) !== null) {
    addUrl(map, m[0], pageUrl, undefined, hostCounts)
  }

  const protocolRelative = new RegExp(
    `\\/\\/[a-z0-9.-]*(?:${hostPattern}|ds2play)[a-z0-9./?=&%-]*`,
    'gi',
  )
  while ((m = protocolRelative.exec(decoded)) !== null) {
    addUrl(map, `https:${m[0]}`, pageUrl, undefined, hostCounts)
  }

  const labeledTabRe =
    /(?:VIDZY|UQLOAD|DOOD|VOE|FILMOON)[^"'<>]{0,80}?(https?:\/\/[^"'\\s<>]+)/gi
  while ((m = labeledTabRe.exec(decoded)) !== null) {
    const labelMatch = m[0].match(/^(VIDZY|UQLOAD|DOOD|VOE|FILMOON)/i)
    addUrl(map, m[1], pageUrl, labelMatch?.[1]?.toUpperCase(), hostCounts)
  }

  const dataLinkRe =
    /data-(?:link|url|file|embed|video)=["'](https?:\/\/[^"']+)["']/gi
  while ((m = dataLinkRe.exec(html)) !== null) {
    addUrl(map, m[1], pageUrl, undefined, hostCounts)
  }

  const onclickHostRe =
    /(?:VIDZY|UQLOAD|DOOD|VOE|FILMOON)[^"']*["'](https?:\/\/[^"']+)["']/gi
  while ((m = onclickHostRe.exec(decoded)) !== null) {
    const labelMatch = m[0].match(/(VIDZY|UQLOAD|DOOD|VOE|FILMOON)/i)
    addUrl(map, m[1], pageUrl, labelMatch?.[1]?.toUpperCase(), hostCounts)
  }

  const dataEmbedRe =
    /data-(?:url|embed|file|src)=["'](https?:\/\/[^"']+)["']/gi
  while ((m = dataEmbedRe.exec(html)) !== null) {
    addUrl(map, m[1], pageUrl, undefined, hostCounts)
  }
}

/** Extrait les liens / iframes vers hébergeurs vidéo connus. */
export function extractStreamingSources(
  html: string,
  pageUrl: string,
): StreamingSource[] {
  const map = new Map<string, StreamingSource>()
  collectFromHtml(html, pageUrl, map)
  return sortStreamingSources([...map.values()])
}

export function dedupeStreamingSources(
  sources: StreamingSource[],
): StreamingSource[] {
  const map = new Map<string, StreamingSource>()
  for (const s of sources) {
    const key = s.embedUrl
    if (!map.has(key)) {
      map.set(key, { ...s, id: stableSourceId(key) })
    }
  }
  return sortStreamingSources([...map.values()])
}

function embedUrlScore(url: string): number {
  let score = 0
  if (/\/e\//i.test(url)) score += 12
  if (/\/embed[-/]/i.test(url)) score += 10
  if (/\.html?$/i.test(url)) score += 4
  if (/\/v\//i.test(url)) score += 2
  return score
}

/** Garde la meilleure URL par hébergeur (priorité /e/, /embed/). */
export function pickBestSourcePerHost(
  sources: StreamingSource[],
): StreamingSource[] {
  const byHost = new Map<string, StreamingSource[]>()
  for (const s of sources) {
    const list = byHost.get(s.host) ?? []
    list.push(s)
    byHost.set(s.host, list)
  }
  const picked: StreamingSource[] = []
  for (const list of byHost.values()) {
    list.sort((a, b) => embedUrlScore(b.embedUrl) - embedUrlScore(a.embedUrl))
    picked.push(list[0])
  }
  return sortStreamingSources(picked)
}

export function isLikelyStreamingCatalog(url: string): boolean {
  try {
    const u = new URL(url)
    const path = u.pathname.toLowerCase()
    const host = u.hostname.toLowerCase()
    if (
      /french-stream|stream|film|serie|anime|voir|wawacity|cpasmieux|papadustream/i.test(
        host,
      )
    ) {
      return true
    }
    if (/newsid=|id=|film|serie|episode|watch/i.test(u.search + path)) {
      return /stream|film|serie|voir|play/i.test(host)
    }
  } catch {
    return false
  }
  return false
}
