import { fetchPageHtml } from '@/lib/fetch-page'
import {
  extractStreamsFromHtml,
  pickBestStream,
  type ExtractedStream,
} from '@/lib/resolvers/extract-from-html'

export async function resolveFilmoon(
  embedUrl: string,
): Promise<ExtractedStream | null> {
  const html = await fetchPageHtml(embedUrl, embedUrl)

  const iframe = html.match(
    /<iframe[^>]+src=["'](https?:\/\/[^"']+)["']/i,
  )?.[1]
  if (iframe && !/filmoon/i.test(iframe)) {
    const nested = await fetchPageHtml(iframe, embedUrl)
    const stream = pickBestStream(extractStreamsFromHtml(nested))
    if (stream) return stream
  }

  return pickBestStream(extractStreamsFromHtml(html))
}
