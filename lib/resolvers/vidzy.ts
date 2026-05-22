import { fetchPageHtml } from '@/lib/fetch-page'
import {
  extractStreamFromVidzyScript,
  unpackVidzyEmbedScript,
} from '@/lib/vidzy-unpack'
import {
  extractStreamsFromHtml,
  pickBestStream,
  type ExtractedStream,
} from '@/lib/resolvers/extract-from-html'

export async function resolveVidzy(
  embedUrl: string,
  referer?: string,
): Promise<ExtractedStream | null> {
  const ref = referer || embedUrl
  const html = await fetchPageHtml(embedUrl, ref)

  const decoded = unpackVidzyEmbedScript(html)
  if (decoded) {
    const fromScript = extractStreamFromVidzyScript(decoded)
    if (fromScript) return fromScript
  }

  const m3u8 = html.match(/["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/i)?.[1]
  if (m3u8) return { kind: 'hls', url: m3u8 }

  const file = html.match(
    /(?:file|source|src)\s*:\s*["'](https?:\/\/[^"']+)["']/i,
  )?.[1]
  if (file) {
    return {
      kind: file.includes('.m3u8') ? 'hls' : 'direct',
      url: file,
    }
  }

  return pickBestStream(extractStreamsFromHtml(html))
}
