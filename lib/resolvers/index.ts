import { assertFetchablePublicUrl } from '@/lib/ssrf-guard'
import { resolveDood } from '@/lib/resolvers/dood'
import { resolveUqload } from '@/lib/resolvers/uqload'
import { resolveVoe } from '@/lib/resolvers/voe'
import { resolveVidzy } from '@/lib/resolvers/vidzy'
import { resolveFilmoon } from '@/lib/resolvers/filmoon'
import { embedUrlVariants } from '@/lib/resolvers/embed-variants'
import { fetchPageHtml } from '@/lib/fetch-page'
import {
  extractStreamsFromHtml,
  pickBestStream,
  type ExtractedStream,
} from '@/lib/resolvers/extract-from-html'
import { tryYtDlpExtract } from '@/lib/ytdlp'

export type ResolvedStream = ExtractedStream & {
  title?: string
}

function isPlayableStreamUrl(url: string): boolean {
  return /\.m3u8(\?|$)|\.mp4(\?|$)|\.webm(\?|$)|\/hls\d*\//i.test(url)
}

function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase()
  } catch {
    return ''
  }
}

async function resolveByHost(
  embedUrl: string,
  host: string,
  referer?: string,
): Promise<ExtractedStream | null> {
  const ref = referer || embedUrl
  if (/dood|ds2play|d000d/.test(host)) {
    return resolveDood(embedUrl)
  }
  if (/uqload/.test(host)) {
    return resolveUqload(embedUrl)
  }
  if (/voe/.test(host)) {
    return resolveVoe(embedUrl)
  }
  if (/vidzy/.test(host)) {
    return resolveVidzy(embedUrl, ref)
  }
  if (/filmoon/.test(host)) {
    return resolveFilmoon(embedUrl)
  }
  const html = await fetchPageHtml(embedUrl, ref)
  return pickBestStream(extractStreamsFromHtml(html))
}

async function resolveWithVariants(
  embedUrl: string,
  referer?: string,
): Promise<ExtractedStream | null> {
  const variants = embedUrlVariants(embedUrl)
  for (const variant of variants) {
    try {
      const host = hostFromUrl(variant)
      const stream = await resolveByHost(variant, host, referer)
      if (stream) return stream
    } catch {
      /* try next variant */
    }
  }
  return null
}

export async function resolveEmbedUrl(
  rawEmbedUrl: string,
  pageReferer?: string,
): Promise<ResolvedStream> {
  const embedUrl = assertFetchablePublicUrl(rawEmbedUrl).href

  const referer = pageReferer || embedUrl

  let stream =
    (await resolveWithVariants(embedUrl, referer)) ||
    (await tryYtDlpExtract(embedUrl, referer))

  if (!stream && pageReferer) {
    stream = await tryYtDlpExtract(pageReferer, pageReferer)
  }

  if (!stream && pageReferer) {
    try {
      const html = await fetchPageHtml(embedUrl, pageReferer)
      stream = pickBestStream(extractStreamsFromHtml(html))
    } catch {
      /* ignore */
    }
  }

  if (!stream || !isPlayableStreamUrl(stream.url)) {
    throw new Error(
      'Impossible d’extraire le flux depuis cet hébergeur. Essayez une autre source (UQLOAD, DOOD, etc.).',
    )
  }

  return stream
}
