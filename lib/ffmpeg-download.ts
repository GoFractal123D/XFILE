import { spawn } from 'node:child_process'
import { BROWSER_HEADERS } from '@/lib/fetch-page'
import { resolveBinaryCommand } from '@/lib/find-bin'

let cachedFfmpeg: string | null | undefined

export function clearFfmpegCache(): void {
  cachedFfmpeg = undefined
}

async function getFfmpegCommand(): Promise<string | null> {
  if (cachedFfmpeg !== undefined) return cachedFfmpeg
  cachedFfmpeg = await resolveBinaryCommand(['ffmpeg', 'ffmpeg.exe'])
  return cachedFfmpeg
}

export async function isFfmpegAvailable(): Promise<boolean> {
  const cmd = await getFfmpegCommand()
  if (!cmd) return false

  return new Promise<boolean>((resolve) => {
    const proc = spawn(cmd, ['-version'], {
      shell: false,
      windowsHide: true,
    })
    const timer = setTimeout(() => {
      proc.kill()
      resolve(false)
    }, 8_000)
    proc.on('error', () => {
      clearTimeout(timer)
      resolve(false)
    })
    proc.on('close', (code) => {
      clearTimeout(timer)
      resolve(code === 0)
    })
  })
}

function buildFfmpegHeaderBlock(referer: string): string {
  let origin = referer
  try {
    origin = new URL(referer).origin
  } catch {
    /* ignore */
  }
  const ua = BROWSER_HEADERS['User-Agent']
  return `Referer: ${referer}\r\nOrigin: ${origin}\r\nUser-Agent: ${ua}\r\nAccept: */*\r\n`
}

type HlsDownloadOpts = {
  skipCdnHeaders?: boolean
}

/** Télécharge un flux HLS (.m3u8) vers un fichier MP4 via ffmpeg. */
export async function downloadHlsToFile(
  playlistUrl: string,
  outputFile: string,
  referer: string,
  opts?: HlsDownloadOpts,
): Promise<void> {
  const ffmpeg = await getFfmpegCommand()
  if (!ffmpeg) {
    throw new Error(
      'ffmpeg introuvable. Installez-le : winget install ffmpeg — puis redémarrez Cursor et npm run dev.',
    )
  }

  const headerBlock = opts?.skipCdnHeaders
    ? undefined
    : buildFfmpegHeaderBlock(referer)

  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-loglevel',
      'error',
      ...(headerBlock ? ['-headers', headerBlock] : []),
      '-i',
      playlistUrl,
      '-c',
      'copy',
      '-bsf:a',
      'aac_adtstoasc',
      '-movflags',
      '+faststart',
      outputFile,
    ]

    const proc = spawn(ffmpeg, args, {
      shell: false,
      windowsHide: true,
    })

    let stderr = ''
    const timer = setTimeout(() => {
      proc.kill()
      reject(new Error('ffmpeg : délai dépassé (10 min).'))
    }, 600_000)

    proc.stderr?.on('data', (d) => {
      stderr += String(d)
    })
    proc.on('error', () => {
      clearTimeout(timer)
      reject(
        new Error(
          'Impossible de lancer ffmpeg. Redémarrez le terminal après winget install ffmpeg.',
        ),
      )
    })
    proc.on('close', (code) => {
      clearTimeout(timer)
      if (code === 0) {
        resolve()
        return
      }
      reject(
        new Error(
          stderr.trim().slice(-400) ||
            `ffmpeg a échoué (code ${code ?? '?'})`,
        ),
      )
    })
  })
}
