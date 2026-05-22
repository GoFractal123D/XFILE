import { NextResponse } from 'next/server'
import { assertFetchablePublicUrl } from '@/lib/ssrf-guard'
import { resolveEmbedUrl } from '@/lib/resolvers'
import { buildStreamProxyUrl } from '@/lib/stream-proxy'
import type { ResolveResponse } from '@/lib/analyze-types'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      embedUrl?: string
      pageUrl?: string
      sourceLabel?: string
    }

    const embedRaw = typeof body.embedUrl === 'string' ? body.embedUrl : ''
    if (!embedRaw.trim()) {
      return NextResponse.json(
        { ok: false, error: 'URL de l’hébergeur requise.' } satisfies ResolveResponse,
        { status: 400 },
      )
    }

    const embedUrl = assertFetchablePublicUrl(embedRaw).href
    let pageReferer: string | undefined
    if (typeof body.pageUrl === 'string' && body.pageUrl.trim()) {
      pageReferer = assertFetchablePublicUrl(body.pageUrl).href
    }

    const label =
      typeof body.sourceLabel === 'string' ? body.sourceLabel : 'Source'

    const stream = await resolveEmbedUrl(embedUrl, pageReferer)
    const origin = new URL(req.url).origin
    const proxyReferer = embedUrl

    if (stream.kind === 'hls') {
      return NextResponse.json({
        ok: true,
        kind: 'hls',
        playlistUrl: buildStreamProxyUrl(origin, stream.url, proxyReferer),
        title: stream.title,
        sourceLabel: label,
        downloadable: false,
      } satisfies ResolveResponse)
    }

    return NextResponse.json({
      ok: true,
      kind: 'direct',
      videoUrl: buildStreamProxyUrl(origin, stream.url, proxyReferer),
      title: stream.title,
      sourceLabel: label,
      downloadable: true,
    } satisfies ResolveResponse)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Résolution impossible'
    return NextResponse.json(
      {
        ok: false,
        error: msg,
        hint:
          'Changez d’hébergeur (UQLOAD, DOOD, VOE…). Sur PC : installez yt-dlp (pip install yt-dlp ou winget install yt-dlp) puis redémarrez npm run dev.',
      } satisfies ResolveResponse,
      { status: 422 },
    )
  }
}
