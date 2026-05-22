import type { StreamingSource } from '@/lib/streaming-embeds'
import { extractStreamingSources } from '@/lib/streaming-embeds'

export type DetectedVideo =
  | {
      kind: 'direct'
      videoUrl: string
      title?: string
      hint?: string
    }
  | {
      kind: 'hls'
      playlistUrl: string
      title?: string
      hint?: string
    }
  | {
      kind: 'embed-youtube'
      videoId: string
      title?: string
    }
  | {
      kind: 'embed-vimeo'
      videoId: string
      title?: string
    }
  | {
      kind: 'streaming'
      sources: StreamingSource[]
      title?: string
      hint?: string
    }

function absolutize(href: string, base: string): string | null {
  try {
    return new URL(href.trim(), base).href
  } catch {
    return null
  }
}

function pickTitle(html: string): string | undefined {
  const og = html.match(
    /<meta\s+property=["']og:title["']\s+content=["']([^"']*)["']/i,
  )
  if (og?.[1]) return decodeHtmlEntities(og[1].trim())
  const t = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  if (t?.[1]) return decodeHtmlEntities(t[1].trim())
  return undefined
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function extractMetaContent(html: string, prop: string): string[] {
  const re = new RegExp(
    `<meta\\s+property=["']${prop}["']\\s+content=["']([^"']*)["']`,
    'gi',
  )
  const out: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    if (m[1]) out.push(m[1])
  }
  const re2 = new RegExp(
    `<meta\\s+content=["']([^"']*)["']\\s+property=["']${prop}["']`,
    'gi',
  )
  while ((m = re2.exec(html)) !== null) {
    if (m[1]) out.push(m[1])
  }
  return out
}

const DIRECT_EXT = /\.(mp4|webm|ogg)(\?[^\s"'<>]*)?$/i
const HLS_EXT = /\.m3u8(\?[^\s"'<>]*)?$/i

function collectFromRegex(html: string, base: string): string[] {
  const urls = new Set<string>()
  const re =
    /https?:\/\/[^\s"'<>()]+?\.(?:mp4|webm|m3u8|ogg)(?:\?[^\s"'<>]*)?/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const abs = absolutize(m[0], base)
    if (abs) urls.add(abs)
  }
  return [...urls]
}

function collectVideoTags(html: string, base: string): string[] {
  const urls: string[] = []
  const srcRe =
    /<(?:video|src|source)[^>]+src=["']([^"']+)["'][^>]*>/gi
  let m: RegExpExecArray | null
  while ((m = srcRe.exec(html)) !== null) {
    const abs = absolutize(m[1], base)
    if (abs) urls.push(abs)
  }
  return urls
}

function jsonLdUrls(html: string, base: string): string[] {
  const urls: string[] = []
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    try {
      const data = JSON.parse(m[1]) as unknown
      const stack: unknown[] = [data]
      while (stack.length) {
        const cur = stack.pop()
        if (!cur) continue
        if (typeof cur === 'string' && /^https?:\/\//.test(cur)) {
          if (DIRECT_EXT.test(cur) || HLS_EXT.test(cur)) urls.push(cur)
        } else if (Array.isArray(cur)) {
          stack.push(...cur)
        } else if (typeof cur === 'object' && cur !== null) {
          const o = cur as Record<string, unknown>
          const c = o.contentUrl
          if (typeof c === 'string' && /^https?:\/\//.test(c)) {
            const abs = absolutize(c, base)
            if (abs && (DIRECT_EXT.test(abs) || HLS_EXT.test(abs))) urls.push(abs)
          }
          for (const v of Object.values(o)) stack.push(v)
        }
      }
    } catch {
      /* ignore invalid JSON-LD */
    }
  }
  return urls
}

export function detectYoutube(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.replace('www.', '') === 'youtu.be') {
      const id = u.pathname.slice(1).split('/')[0]
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null
    }
    if (/youtube\.com$/i.test(u.hostname.replace('www.', ''))) {
      const v = u.searchParams.get('v')
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v
      const m = u.pathname.match(/^\/embed\/([a-zA-Z0-9_-]{11})/)
      if (m) return m[1]
    }
  } catch {
    return null
  }
  return null
}

export function detectVimeo(url: string): string | null {
  try {
    const u = new URL(url)
    if (!/vimeo\.com$/i.test(u.hostname.replace('www.', ''))) return null
    const m = u.pathname.match(/^\/(\d{6,})/)
    return m ? m[1] : null
  } catch {
    return null
  }
}

/** Si l’URL pointe déjà vers un fichier média direct. */
export function detectDirectUrl(url: string): DetectedVideo | null {
  try {
    const u = new URL(url)
    const path = u.pathname.toLowerCase()
    if (HLS_EXT.test(path) || path.endsWith('.m3u8')) {
      return { kind: 'hls', playlistUrl: u.href, hint: 'Flux HLS' }
    }
    if (DIRECT_EXT.test(path)) {
      return { kind: 'direct', videoUrl: u.href, hint: 'Lien direct' }
    }
  } catch {
    return null
  }
  return null
}

export function extractVideoFromPage(html: string, pageUrl: string): DetectedVideo | null {
  const title = pickTitle(html)
  const candidates: string[] = []

  for (const p of [
    'og:video',
    'og:video:url',
    'og:video:secure_url',
  ]) {
    for (const c of extractMetaContent(html, p)) {
      const abs = absolutize(c, pageUrl)
      if (abs) candidates.push(abs)
    }
  }

  candidates.push(...collectVideoTags(html, pageUrl))
  candidates.push(...jsonLdUrls(html, pageUrl))
  candidates.push(...collectFromRegex(html, pageUrl))

  const unique = [...new Set(candidates)]

  const hls = unique.find((u) => HLS_EXT.test(u) || u.includes('.m3u8'))
  if (hls) {
    return { kind: 'hls', playlistUrl: hls, title, hint: 'Flux détecté dans la page' }
  }

  const direct = unique.find(
    (u) => DIRECT_EXT.test(u) || /\.(mp4|webm|ogg)(\?|$)/i.test(u),
  )
  if (direct) {
    return {
      kind: 'direct',
      videoUrl: direct,
      title,
      hint: 'Source extraite de la page',
    }
  }

  return null
}

export function mergeDetection(
  pageUrl: string,
  html: string | null,
): DetectedVideo | null {
  const yt = detectYoutube(pageUrl)
  if (yt) return { kind: 'embed-youtube', videoId: yt }
  const vm = detectVimeo(pageUrl)
  if (vm) return { kind: 'embed-vimeo', videoId: vm }

  const directPage = detectDirectUrl(pageUrl)
  if (directPage) {
    return directPage.kind === 'direct'
      ? { ...directPage, hint: 'URL directe' }
      : { ...directPage, hint: 'Playlist HLS' }
  }

  if (html) {
    const fromPage = extractVideoFromPage(html, pageUrl)
    if (fromPage) return fromPage

    const sources = extractStreamingSources(html, pageUrl)
    if (sources.length > 0) {
      return {
        kind: 'streaming',
        sources,
        title: pickTitle(html),
        hint: `${sources.length} hébergeur(s) détecté(s) — choisissez une source pour lire et télécharger.`,
      }
    }
  }
  return null
}
