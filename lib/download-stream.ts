import { createWriteStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import {
  buildStreamProxyUrl,
  fetchStreamUpstream,
  isHlsUrl,
} from '@/lib/stream-proxy'
import { downloadHlsToFile, isFfmpegAvailable } from '@/lib/ffmpeg-download'
import { downloadWithYtDlp, isYtDlpAvailable } from '@/lib/ytdlp'
import type { ExtractedStream } from '@/lib/resolvers/extract-from-html'
import { join } from 'node:path'

export type DownloadStreamOptions = {
  stream: ExtractedStream
  workDir: string
  embedReferer: string
  /** Origin de l’app (ex. http://localhost:3000) pour proxifier le HLS. */
  appOrigin: string
  title: string
}

export type DownloadStreamResult = {
  filePath: string
  method: 'ffmpeg-proxy' | 'ffmpeg-direct' | 'direct-fetch' | 'yt-dlp'
}

/** Télécharge un MP4 direct depuis le CDN avec les en-têtes navigateur. */
export async function downloadDirectToFile(
  url: string,
  referer: string,
  outputFile: string,
): Promise<void> {
  const res = await fetchStreamUpstream(url, referer)
  if (!res.ok || !res.body) {
    throw new Error(`Fichier inaccessible (HTTP ${res.status})`)
  }
  await pipeline(
    Readable.fromWeb(res.body as ReadableStream<Uint8Array>),
    createWriteStream(outputFile),
  )
}

export async function downloadResolvedStream(
  opts: DownloadStreamOptions,
): Promise<DownloadStreamResult> {
  const { stream, workDir, embedReferer, appOrigin, title } = opts
  const outputFile = join(workDir, 'xfile.mp4')
  const hls = stream.kind === 'hls' || isHlsUrl(stream.url)

  if (hls) {
    const ffmpegOk = await isFfmpegAvailable()
    if (!ffmpegOk) {
      throw new Error(
        'Pour télécharger les flux HLS (VIDZY, etc.), installez ffmpeg : winget install ffmpeg',
      )
    }

    const proxiedPlaylist = buildStreamProxyUrl(
      appOrigin,
      stream.url,
      embedReferer,
    )

    await downloadHlsToFile(proxiedPlaylist, outputFile, embedReferer, {
      skipCdnHeaders: true,
    })
    return { filePath: outputFile, method: 'ffmpeg-proxy' }
  }

  try {
    await downloadDirectToFile(stream.url, embedReferer, outputFile)
    return { filePath: outputFile, method: 'direct-fetch' }
  } catch {
    /* fallback yt-dlp */
  }

  const ytDlpOk = await isYtDlpAvailable()
  if (!ytDlpOk) {
    throw new Error(
      'Téléchargement direct impossible. Installez yt-dlp : winget install yt-dlp',
    )
  }

  const { filePath } = await downloadWithYtDlp(
    stream.url,
    workDir,
    title,
    embedReferer,
  )
  return { filePath, method: 'yt-dlp' }
}
