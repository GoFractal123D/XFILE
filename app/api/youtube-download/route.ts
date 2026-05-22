import { NextResponse } from 'next/server'
import {
  assertYoutubePageUrl,
  extractYoutubeVideoId,
  safeDownloadFilename,
} from '@/lib/youtube-url'
import { getInnertube } from '@/lib/youtube-client'

export const runtime = 'nodejs'
export const maxDuration = 60

const DOWNLOAD_ATTEMPTS = [
  { type: 'video+audio' as const, quality: 'best' as const, format: 'mp4' as const },
  { type: 'video+audio' as const, quality: 'best' as const },
  { type: 'video+audio' as const, quality: 'bestefficiency' as const, format: 'mp4' as const },
  { type: 'video' as const, quality: 'best' as const, format: 'mp4' as const },
]

export async function GET(req: Request) {
  const param = new URL(req.url).searchParams.get('url')
  if (!param) {
    return NextResponse.json({ error: 'Paramètre url manquant.' }, { status: 400 })
  }

  let pageUrl: string
  try {
    pageUrl = assertYoutubePageUrl(param)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'URL refusée'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const videoId = extractYoutubeVideoId(pageUrl)
  if (!videoId) {
    return NextResponse.json(
      { error: 'Identifiant vidéo YouTube introuvable.' },
      { status: 400 },
    )
  }

  try {
    console.log('[youtube-download] Initializing Innertube client...')
    const yt = await getInnertube()
    console.log('[youtube-download] Fetching video info for:', videoId)
    const info = await yt.getInfo(videoId)

    const title =
      info.basic_info.title ||
      info.basic_info.short_description?.slice(0, 80) ||
      'video'

    if (info.playability_status?.status === 'UNPLAYABLE') {
      return NextResponse.json(
        {
          error:
            info.playability_status.reason ||
            'Cette vidéo ne peut pas être lue (restriction ou indisponible).',
          playability_status: info.playability_status,
        },
        { status: 422 },
      )
    }

    let stream: ReadableStream<Uint8Array> | null = null
    let lastError: Error | null = null

    console.log('[youtube-download] Attempting download with', DOWNLOAD_ATTEMPTS.length, 'strategies')
    for (const options of DOWNLOAD_ATTEMPTS) {
      try {
        console.log('[youtube-download] Trying download with options:', options)
        stream = await info.download(options)
        if (stream) {
          console.log('[youtube-download] Download successful with options:', options)
          break
        }
      } catch (e) {
        console.log('[youtube-download] Download attempt failed:', e)
        lastError = e instanceof Error ? e : new Error(String(e))
      }
    }

    if (!stream) {
      console.log('[youtube-download] Trying fallback download method')
      try {
        stream = await yt.download(videoId, {
          type: 'video+audio',
          quality: 'best',
          format: 'mp4',
        })
      } catch (e) {
        console.log('[youtube-download] Fallback download failed:', e)
        lastError = e instanceof Error ? e : lastError
      }
    }

    if (!stream) {
      return NextResponse.json(
        {
          error:
            lastError?.message ||
            'Aucun format téléchargeable trouvé pour cette vidéo.',
          hint: 'Essayez une autre vidéo (courte, publique, sans restriction d’âge).',
        },
        { status: 422 },
      )
    }

    const filename = safeDownloadFilename(title, 'mp4')
    const asciiName = filename.replace(/[^\x20-\x7E]/g, '_')
    const utf8Name = encodeURIComponent(filename)

    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${asciiName}"; filename*=UTF-8''${utf8Name}`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error('[youtube-download] Error occurred:', e)
    const msg =
      e instanceof Error
        ? e.message
        : 'Impossible de préparer le téléchargement YouTube.'
    const errorDetails = e instanceof Error ? {
      message: e.message,
      name: e.name,
      stack: e.stack?.split('\n').slice(0, 3).join('\n')
    } : { error: String(e) }

    return NextResponse.json(
      {
        error: msg,
        details: errorDetails,
        hint:
          'Vérifiez que la vidéo est publique. Les vidéos privées, live ou très protégées peuvent échouer.',
      },
      { status: 502 },
    )
  }
}
