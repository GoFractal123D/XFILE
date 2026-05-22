import { NextResponse } from 'next/server'
import { clearBinaryCache } from '@/lib/find-bin'
import { clearFfmpegCache, isFfmpegAvailable } from '@/lib/ffmpeg-download'
import { clearYtDlpCache, isYtDlpAvailable } from '@/lib/ytdlp'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  if (new URL(req.url).searchParams.get('refresh') === '1') {
    clearBinaryCache()
    clearFfmpegCache()
    clearYtDlpCache()
  }

  const onVercel = Boolean(process.env.VERCEL)

  if (onVercel) {
    return NextResponse.json({
      available: false,
      ffmpeg: false,
      ytDlp: false,
      hostedOnVercel: true,
      hint:
        'Le téléchargement serveur (ffmpeg / yt-dlp) n’est pas disponible sur Vercel. Utilisez l’analyse et la lecture en ligne, ou téléchargez en local puis le mode hors ligne PWA.',
    })
  }

  const [ffmpeg, ytDlp] = await Promise.all([
    isFfmpegAvailable(),
    isYtDlpAvailable(),
  ])

  const available = ffmpeg || ytDlp

  let hint: string | undefined
  if (!ffmpeg) {
    hint =
      'Pour VIDZY / HLS : installez ffmpeg (winget install ffmpeg) puis redémarrez npm run dev.'
  } else if (!ytDlp) {
    hint = 'ffmpeg détecté — téléchargement HLS OK. yt-dlp optionnel pour d’autres hébergeurs.'
  }

  return NextResponse.json({
    available,
    ffmpeg,
    ytDlp,
    hostedOnVercel: false,
    hint,
  })
}
