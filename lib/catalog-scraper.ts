import { fetchPageHtml } from '@/lib/fetch-page'
import {
  extractStreamingSources,
  dedupeStreamingSources,
  type StreamingSource,
} from '@/lib/streaming-embeds'

function absolutize(href: string, base: string): string | null {
  try {
    return new URL(href.trim().replace(/\\u0026/g, '&').replace(/\\\//g, '/'), base)
      .href
  } catch {
    return null
  }
}

function decodeHtmlEscapes(html: string): string {
  return html
    .replace(/\\u0026/g, '&')
    .replace(/\\u002f/gi, '/')
    .replace(/\\u003a/gi, ':')
    .replace(/\\u003d/gi, '=')
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
}

function extractInternalPlayerLinks(html: string, pageUrl: string): string[] {
  const decoded = decodeHtmlEscapes(html)
  const found = new Set<string>()

  const patterns = [
    /(?:href|src|data-src|data-url)=["']([^"']*(?:player|embed|iframe|link|affiche|fshd|archi|fsplayer|servers?)[^"']*)["']/gi,
    /["']([^"']*\/(?:player|embed|iframe|link|affiche|archi)\.php[^"']*)["']/gi,
    /["']([^"']*index\.php\?[^"']*(?:newsid|id)=)[^"']*["']/gi,
  ]

  for (const re of patterns) {
    let m: RegExpExecArray | null
    while ((m = re.exec(decoded)) !== null) {
      const abs = absolutize(m[1], pageUrl)
      if (abs) found.add(abs)
    }
  }

  return [...found]
}

function mergeSources(
  target: Map<string, StreamingSource>,
  incoming: StreamingSource[],
) {
  for (const s of incoming) {
    target.set(s.embedUrl, s)
  }
}

/** Complète les sources en parcourant iframes / players internes. */
export async function enrichStreamingSources(
  pageUrl: string,
  initial: StreamingSource[],
): Promise<StreamingSource[]> {
  const map = new Map<string, StreamingSource>()
  mergeSources(map, initial)

  let html: string
  try {
    html = await fetchPageHtml(pageUrl)
  } catch {
    return dedupeStreamingSources(initial)
  }

  const decoded = decodeHtmlEscapes(html)
  mergeSources(map, extractStreamingSources(decoded, pageUrl))

  const internal = extractInternalPlayerLinks(decoded, pageUrl).slice(0, 6)
  for (const link of internal) {
    try {
      const nestedHtml = await fetchPageHtml(link, pageUrl)
      const nestedDecoded = decodeHtmlEscapes(nestedHtml)
      mergeSources(map, extractStreamingSources(nestedDecoded, link))

      const iframeSrc =
        /<iframe[^>]+(?:src|data-src)=["']([^"']+)["']/i.exec(nestedDecoded)
      if (iframeSrc?.[1]) {
        const iframeUrl = absolutize(iframeSrc[1], link)
        if (iframeUrl) {
          try {
            const iframeHtml = await fetchPageHtml(iframeUrl, link)
            mergeSources(
              map,
              extractStreamingSources(decodeHtmlEscapes(iframeHtml), iframeUrl),
            )
          } catch {
            /* ignore */
          }
        }
      }
    } catch {
      /* ignore */
    }
  }

  return dedupeStreamingSources([...map.values()])
}
