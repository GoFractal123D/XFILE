import { createReadStream } from 'node:fs'
import { mkdir, rm, stat } from 'node:fs/promises'
import { basename } from 'node:path'
import { randomUUID } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { NextResponse } from 'next/server'
import { assertFetchablePublicUrl } from '@/lib/ssrf-guard'
import { resolveEmbedUrl } from '@/lib/resolvers'
import { downloadResolvedStream } from '@/lib/download-stream'
import { isFfmpegAvailable } from '@/lib/ffmpeg-download'
import { isYtDlpAvailable } from '@/lib/ytdlp'

export const runtime = 'nodejs'
export const maxDuration = 60

function safeFilename(title: string | undefined, fallback: string): string {
  const base = (title || fallback)
    .replace(/[^\w.\-()+\s]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 100)
  return base.endsWith('.mp4') ? base : `${base}.mp4`
}

function errorHint(message: string): string | undefined {
  if (/ffmpeg/i.test(message) && /install|winget/i.test(message)) {
    return undefined
  }
  if (/403|forbidden|unsupported url/i.test(message)) {
    return 'Installez ffmpeg (winget install ffmpeg), redémarrez npm run dev, puis réessayez.'
  }
  if (/yt-dlp/i.test(message)) {
    return 'winget install yt-dlp'
  }
  return 'Essayez un autre hébergeur ou ouvrez la page embed dans le navigateur.'
}

export async function POST(req: Request) {
  // Désactiver la vérification SSL pour contourner le problème de certificat
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

  const [ffmpegOk, ytDlpOk] = await Promise.all([
    isFfmpegAvailable(),
    isYtDlpAvailable(),
  ])

  if (!ffmpegOk && !ytDlpOk) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Aucun outil de téléchargement disponible sur ce serveur.',
        hint: 'Installez ffmpeg : winget install ffmpeg (recommandé pour VIDZY).',
      },
      { status: 503 },
    )
  }

  let body: {
    embedUrl?: string
    pageUrl?: string
    title?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Corps JSON invalide.' },
      { status: 400 },
    )
  }

  const embedRaw = typeof body.embedUrl === 'string' ? body.embedUrl : ''
  if (!embedRaw.trim()) {
    return NextResponse.json(
      { ok: false, error: 'URL de l’hébergeur requise.' },
      { status: 400 },
    )
  }

  let embedUrl: string
  let pageReferer: string | undefined
  try {
    embedUrl = assertFetchablePublicUrl(embedRaw).href
    if (typeof body.pageUrl === 'string' && body.pageUrl.trim()) {
      pageReferer = assertFetchablePublicUrl(body.pageUrl).href
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'URL refusée'
    return NextResponse.json({ ok: false, error: msg }, { status: 400 })
  }

  const workDir = join(tmpdir(), `xfile-dl-${randomUUID()}`)
  await mkdir(workDir, { recursive: true })

  const appOrigin = new URL(req.url).origin
  const title = typeof body.title === 'string' ? body.title : 'video-streaming'

  try {
    const stream = await resolveEmbedUrl(embedUrl, pageReferer)

    const { filePath } = await downloadResolvedStream({
      stream,
      workDir,
      embedReferer: embedUrl,
      appOrigin,
      title,
    })

    const fileStat = await stat(filePath)
    const filename = safeFilename(body.title, basename(filePath))
    const ext = filePath.match(/\.(\w+)$/i)?.[1]?.toLowerCase()
    const contentType =
      ext === 'webm'
        ? 'video/webm'
        : ext === 'mkv'
          ? 'video/x-matroska'
          : 'video/mp4'

    const nodeStream = createReadStream(filePath)
    nodeStream.on('close', () => {
      void rm(workDir, { recursive: true, force: true }).catch(() => {})
    })
    nodeStream.on('error', () => {
      void rm(workDir, { recursive: true, force: true }).catch(() => {})
    })

    return new NextResponse(nodeStream as any, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(fileStat.size),
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    await rm(workDir, { recursive: true, force: true }).catch(() => {})
    const msg = e instanceof Error ? e.message : 'Téléchargement impossible'
    const hint = errorHint(msg)
    return NextResponse.json(
      { ok: false, error: msg, ...(hint ? { hint } : {}) },
      { status: 422 },
    )
  }
}
