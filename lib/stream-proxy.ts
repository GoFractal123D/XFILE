import { BROWSER_HEADERS } from '@/lib/fetch-page'

export function buildStreamProxyUrl(
  origin: string,
  targetUrl: string,
  referer?: string,
): string {
  const params = new URLSearchParams({ url: targetUrl })
  if (referer) params.set('referer', referer)
  return `${origin}/api/stream?${params.toString()}`
}

export function isHlsUrl(url: string): boolean {
  return /\.m3u8(\?|$)/i.test(url)
}

export async function fetchStreamUpstream(
  url: string,
  referer: string,
  extraHeaders?: HeadersInit,
): Promise<Response> {
  let origin: string | undefined
  try {
    origin = new URL(referer).origin
  } catch {
    origin = undefined
  }

  return fetch(url, {
    headers: {
      ...BROWSER_HEADERS,
      Accept: '*/*',
      Referer: referer,
      ...(origin ? { Origin: origin } : {}),
      ...extraHeaders,
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(90_000),
  })
}

export function rewriteHlsManifest(
  body: string,
  manifestUrl: string,
  origin: string,
  referer: string,
): string {
  const base = new URL(manifestUrl)
  return body
    .split('\n')
    .map((line) => {
      const trimmed = line.trim()
      if (!trimmed) return line
      if (trimmed.startsWith('#')) {
        return trimmed.replace(/URI="([^"]+)"/gi, (_, uri: string) => {
          try {
            const abs = new URL(uri, base).href
            return `URI="${buildStreamProxyUrl(origin, abs, referer)}"`
          } catch {
            return line
          }
        })
      }
      try {
        const abs = new URL(trimmed, base).href
        return buildStreamProxyUrl(origin, abs, referer)
      } catch {
        return line
      }
    })
    .join('\n')
}
