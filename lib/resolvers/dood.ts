import { fetchPageHtml } from '@/lib/fetch-page'
import {
  extractStreamsFromHtml,
  pickBestStream,
  type ExtractedStream,
} from '@/lib/resolvers/extract-from-html'

function extractPassMd5(html: string): { path: string; token?: string } | null {
  const pass =
    html.match(/pass_md5['"]?\s*[:=]\s*['"]([^'"]+)['"]/i)?.[1] ||
    html.match(/['"](\/pass_md5\/[^'"]+)['"]/i)?.[1] ||
    html.match(/(\/pass_md5\/[a-zA-Z0-9/_-]+)/i)?.[1]

  if (!pass) return null

  const token =
    html.match(/['"]?token['"]?\s*[:=]\s*['"]([^'"]+)['"]/i)?.[1] ||
    html.match(/token=([a-zA-Z0-9%_=-]+)/i)?.[1]

  return { path: pass, token }
}

/** Résolution Doodstream / ds2play / variantes. */
export async function resolveDood(embedUrl: string): Promise<ExtractedStream | null> {
  const html = await fetchPageHtml(embedUrl, embedUrl)
  const passInfo = extractPassMd5(html)

  if (passInfo) {
    try {
      const base = new URL(embedUrl)
      const apiPath = passInfo.path.startsWith('http')
        ? passInfo.path
        : new URL(passInfo.path, base.origin).pathname
      const apiUrl = new URL(apiPath, base.origin)
      if (passInfo.token) {
        apiUrl.searchParams.set('token', passInfo.token)
      }

      const apiRes = await fetch(apiUrl.href, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Referer: embedUrl,
          'X-Requested-With': 'XMLHttpRequest',
          Accept: '*/*',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(20_000),
      })

      const apiBody = await apiRes.text()
      const fromApi = pickBestStream(extractStreamsFromHtml(apiBody))
      if (fromApi) return fromApi

      const trimmed = apiBody.trim().replace(/^["']|["']$/g, '')
      if (trimmed.startsWith('http') && /\.mp4|m3u8|video/i.test(trimmed)) {
        return {
          kind: trimmed.includes('.m3u8') ? 'hls' : 'direct',
          url: trimmed,
        }
      }
    } catch {
      /* fallback */
    }
  }

  const dlMatch = html.match(
    /download_url['"]?\s*[:=]\s*['"](https?:\/\/[^'"]+)['"]/i,
  )?.[1]
  if (dlMatch) return { kind: 'direct', url: dlMatch }

  return pickBestStream(extractStreamsFromHtml(html))
}
