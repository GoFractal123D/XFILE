import { NextResponse } from 'next/server'
import { assertFetchablePublicUrl } from '@/lib/ssrf-guard'
import {
  fetchStreamUpstream,
  isHlsUrl,
  rewriteHlsManifest,
} from '@/lib/stream-proxy'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  // Désactiver la vérification SSL pour contourner le problème de certificat
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

  const requestUrl = new URL(req.url)
  const raw = requestUrl.searchParams.get('url')
  const refererRaw = requestUrl.searchParams.get('referer')

  if (!raw?.trim()) {
    return NextResponse.json({ error: 'Paramètre url manquant' }, { status: 400 })
  }

  let target: string
  let referer: string
  try {
    target = assertFetchablePublicUrl(raw).href
    referer = refererRaw?.trim()
      ? assertFetchablePublicUrl(refererRaw).href
      : target
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'URL refusée'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const origin = requestUrl.origin

  if (isHlsUrl(target)) {
    let upstream: Response
    try {
      upstream = await fetchStreamUpstream(target, referer)
    } catch {
      return NextResponse.json({ error: 'Playlist inaccessible' }, { status: 502 })
    }
    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Playlist inaccessible (${upstream.status})` },
        { status: 502 },
      )
    }
    const text = await upstream.text()
    const rewritten = rewriteHlsManifest(text, target, origin, referer)
    return new NextResponse(rewritten, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Cache-Control': 'no-store',
      },
    })
  }

  const range = req.headers.get('range')
  const headers: HeadersInit = {}
  if (range) headers.Range = range

  let upstream: Response
  try {
    upstream = await fetchStreamUpstream(target, referer, headers)
  } catch {
    return NextResponse.json({ error: 'Flux inaccessible' }, { status: 502 })
  }

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: `Flux inaccessible (${upstream.status})` },
      { status: upstream.status === 416 ? 416 : 502 },
    )
  }

  const outHeaders = new Headers()
  const pass = [
    'content-type',
    'content-length',
    'content-range',
    'accept-ranges',
  ] as const
  for (const key of pass) {
    const v = upstream.headers.get(key)
    if (v) outHeaders.set(key, v)
  }
  if (!outHeaders.has('content-type')) {
    outHeaders.set('content-type', 'application/octet-stream')
  }
  outHeaders.set('Cache-Control', 'no-store')

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: outHeaders,
  })
}
