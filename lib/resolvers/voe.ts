import { fetchPageHtml } from '@/lib/fetch-page'
import {
  extractStreamsFromHtml,
  pickBestStream,
  type ExtractedStream,
} from '@/lib/resolvers/extract-from-html'

function decodeAtobUrls(html: string): string[] {
  const urls: string[] = []
  const re = /atob\s*\(\s*['"]([A-Za-z0-9+/=]+)['"]\s*\)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    try {
      const decoded = Buffer.from(m[1], 'base64').toString('utf8')
      if (decoded.startsWith('http')) urls.push(decoded)
      const inner = extractStreamsFromHtml(decoded)
      urls.push(...inner.map((s) => s.url))
    } catch {
      /* ignore */
    }
  }
  return urls
}

export async function resolveVoe(embedUrl: string): Promise<ExtractedStream | null> {
  const html = await fetchPageHtml(embedUrl, embedUrl)

  for (const url of decodeAtobUrls(html)) {
    if (/\.m3u8/i.test(url)) return { kind: 'hls', url }
    if (/\.mp4|\.webm/i.test(url)) return { kind: 'direct', url }
  }

  const hlsMatch = html.match(
    /hls\s*:\s*['"](https?:\/\/[^'"]+)['"]/i,
  )?.[1]
  if (hlsMatch) return { kind: 'hls', url: hlsMatch }

  return pickBestStream(extractStreamsFromHtml(html))
}
