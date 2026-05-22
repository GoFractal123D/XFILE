import { fetchPageHtml } from '@/lib/fetch-page'
import {
  extractStreamsFromHtml,
  pickBestStream,
  type ExtractedStream,
} from '@/lib/resolvers/extract-from-html'

export async function resolveUqload(embedUrl: string): Promise<ExtractedStream | null> {
  const html = await fetchPageHtml(embedUrl, embedUrl)

  const sourcesBlock = html.match(
    /sources\s*:\s*\[\s*\{\s*file\s*:\s*["'](https?:\/\/[^"']+)["']/i,
  )?.[1]
  if (sourcesBlock) {
    return { kind: 'direct', url: sourcesBlock }
  }

  const urlplay = html.match(
    /urlplay\s*=\s*["'](https?:\/\/[^"']+)["']/i,
  )?.[1]
  if (urlplay) return { kind: 'direct', url: urlplay }

  const vidMatch = html.match(
    /https?:\/\/[^"'\s]*uqload[^"'\s]*\/[^"'\s]+\.mp4[^"'\s]*/i,
  )?.[0]
  if (vidMatch) return { kind: 'direct', url: vidMatch }

  return pickBestStream(extractStreamsFromHtml(html))
}
