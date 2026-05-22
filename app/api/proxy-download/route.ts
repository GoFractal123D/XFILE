import { NextResponse } from 'next/server'
import { assertFetchablePublicUrl } from '@/lib/ssrf-guard'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get('url')
  if (!raw) {
    return NextResponse.json({ error: 'Paramètre url manquant' }, { status: 400 })
  }

  let target: URL
  try {
    target = assertFetchablePublicUrl(raw)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'URL refusée'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const path = target.pathname.toLowerCase()
  if (!/\.(mp4|webm|ogg)(\?|$)/i.test(path)) {
    return NextResponse.json(
      {
        error:
          'Seuls les téléchargements directs (.mp4, .webm, .ogg) sont pris en charge.',
      },
      { status: 400 },
    )
  }

  let upstream: Response
  try {
    upstream = await fetch(target.href, {
      headers: {
        'User-Agent': 'XFILE-Download/1.0',
        Accept: '*/*',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(120_000),
    })
  } catch {
    return NextResponse.json({ error: 'Échec de la connexion au fichier' }, { status: 502 })
  }

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: 'Fichier inaccessible' }, { status: 502 })
  }

  const segment = target.pathname.split('/').filter(Boolean).pop() || 'video.mp4'
  const safeName = segment.replace(/[^\w.\-()+]/g, '_').slice(0, 120) || 'video.mp4'

  const contentType =
    upstream.headers.get('content-type') || 'application/octet-stream'

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${safeName}"`,
      'Cache-Control': 'no-store',
    },
  })
}
