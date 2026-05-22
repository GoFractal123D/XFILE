import { fetchPageHtml } from '@/lib/fetch-page'

export type PageMetadata = {
  title?: string
  description?: string
  thumbnailUrl?: string
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&nbsp;/g, ' ')
}

function stripTags(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function absolutize(url: string, base: string): string | undefined {
  try {
    return new URL(url.trim(), base).href
  } catch {
    return undefined
  }
}

function metaContent(html: string, prop: string): string | undefined {
  const patterns = [
    new RegExp(
      `<meta\\s+property=["']${prop}["']\\s+content=["']([^"']*)["']`,
      'i',
    ),
    new RegExp(
      `<meta\\s+content=["']([^"']*)["']\\s+property=["']${prop}["']`,
      'i',
    ),
    new RegExp(
      `<meta\\s+name=["']${prop}["']\\s+content=["']([^"']*)["']`,
      'i',
    ),
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m?.[1]?.trim()) return decodeHtmlEntities(m[1].trim())
  }
  return undefined
}

/** Extrait titre, synopsis et affiche depuis le HTML d'une page source. */
export function extractPageMetadata(
  html: string,
  pageUrl: string,
): PageMetadata {
  const title =
    metaContent(html, 'og:title') ||
    html.match(/data-title=["']([^"']+)["']/i)?.[1]?.trim() ||
    html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim()

  let description =
    metaContent(html, 'og:description') ||
    metaContent(html, 'description') ||
    metaContent(html, 'twitter:description')

  const newsId = html.match(/data-newsid=["'](\d+)["']/i)?.[1]
  if (!description && newsId) {
    const hiddenDesc = html.match(
      new RegExp(
        `id=["']desc-${newsId}["'][^>]*>([\\s\\S]*?)<\\/span>`,
        'i',
      ),
    )
    if (hiddenDesc?.[1]) {
      description = stripTags(decodeHtmlEntities(hiddenDesc[1]))
    }
  }

  const posterRaw =
    metaContent(html, 'og:image') ||
    html.match(/data-affiche=["']([^"']+)["']/i)?.[1] ||
    metaContent(html, 'twitter:image')

  const thumbnailUrl = posterRaw
    ? absolutize(decodeHtmlEntities(posterRaw), pageUrl)
    : undefined

  return {
    title: title ? decodeHtmlEntities(title) : undefined,
    description: description ? description.slice(0, 2000) : undefined,
    thumbnailUrl,
  }
}

export async function fetchPageMetadata(
  pageUrl: string,
): Promise<PageMetadata> {
  try {
    const html = await fetchPageHtml(pageUrl)
    return extractPageMetadata(html, pageUrl)
  } catch {
    return {}
  }
}

export async function fetchYoutubeMetadata(
  pageUrl: string,
  videoId: string,
): Promise<PageMetadata> {
  const meta: PageMetadata = {
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  }

  try {
    const o = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(pageUrl)}&format=json`,
      { signal: AbortSignal.timeout(8000) },
    )
    if (o.ok) {
      const j = (await o.json()) as {
        title?: string
        thumbnail_url?: string
      }
      if (j.title) meta.title = j.title
      if (j.thumbnail_url) meta.thumbnailUrl = j.thumbnail_url
    }
  } catch {
    /* ignore */
  }

  try {
    const watch = await fetch(
      `https://www.youtube.com/watch?v=${videoId}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36',
          'Accept-Language': 'fr-FR,fr;q=0.9',
        },
        signal: AbortSignal.timeout(10000),
      },
    )
    if (watch.ok) {
      const html = await watch.text()
      const short = html.match(
        /"shortDescription":"((?:\\.|[^"\\])*)"/,
      )?.[1]
      if (short) {
        meta.description = short
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\u0026/g, '&')
          .slice(0, 2000)
      }
    }
  } catch {
    /* ignore */
  }

  return meta
}

export async function fetchVimeoMetadata(
  pageUrl: string,
): Promise<PageMetadata> {
  try {
    const o = await fetch(
      `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(pageUrl)}`,
      { signal: AbortSignal.timeout(8000) },
    )
    if (!o.ok) return {}
    const j = (await o.json()) as {
      title?: string
      description?: string
      thumbnail_url?: string
    }
    return {
      title: j.title,
      description: j.description?.slice(0, 2000),
      thumbnailUrl: j.thumbnail_url,
    }
  } catch {
    return {}
  }
}

export function mergeMetadata<T extends { title?: string }>(
  response: T,
  meta: PageMetadata,
): T & { description?: string; thumbnailUrl?: string } {
  return {
    ...response,
    title: response.title ?? meta.title,
    description: meta.description,
    thumbnailUrl: meta.thumbnailUrl,
  }
}
