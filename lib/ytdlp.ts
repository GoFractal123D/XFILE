import { spawn } from 'node:child_process'
import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { BROWSER_HEADERS } from '@/lib/fetch-page'
import { resolveBinaryCommand } from '@/lib/find-bin'
import type { ExtractedStream } from '@/lib/resolvers/extract-from-html'

export type YtDlpRunner = { cmd: string; baseArgs: string[] }

const EXTRACT_ARGS = ['-g', '--no-playlist', '--no-warnings'] as const

export const YT_DLP_RUNNERS: YtDlpRunner[] = [
  { cmd: 'yt-dlp', baseArgs: [...EXTRACT_ARGS] },
  { cmd: 'yt-dlp.exe', baseArgs: [...EXTRACT_ARGS] },
  { cmd: 'npx', baseArgs: ['--yes', 'yt-dlp', ...EXTRACT_ARGS] },
  { cmd: 'python', baseArgs: ['-m', 'yt_dlp', ...EXTRACT_ARGS] },
  { cmd: 'py', baseArgs: ['-m', 'yt_dlp', ...EXTRACT_ARGS] },
]

const DOWNLOAD_BASE = ['--no-playlist', '--no-warnings'] as const

/** Un seul fichier en priorité ; fusion seulement si nécessaire. */
const DOWNLOAD_FORMAT_STRATEGIES: string[][] = [
  ['-f', 'best'],
  ['-f', 'b'],
  ['-f', 'bestvideo*+bestaudio/best', '--merge-output-format', 'mp4'],
]

function formatStrategiesFor(url: string): string[][] {
  if (/\.m3u8(\?|$)/i.test(url)) {
    return [
      ['-f', 'best'],
      ['-f', 'b'],
      ...DOWNLOAD_FORMAT_STRATEGIES,
    ]
  }
  return DOWNLOAD_FORMAT_STRATEGIES
}

function cdnHeaderArgs(referer?: string): string[] {
  if (!referer) return []
  let origin = referer
  try {
    origin = new URL(referer).origin
  } catch {
    /* ignore */
  }
  const ua = BROWSER_HEADERS['User-Agent']
  return [
    '--referer',
    referer,
    '--add-header',
    `User-Agent:${ua}`,
    '--add-header',
    `Origin:${origin}`,
    '--add-header',
    `Referer:${referer}`,
  ]
}

function spawnYtDlp(
  runner: YtDlpRunner,
  extraArgs: string[],
  url: string,
  referer?: string,
  timeoutMs = 120_000,
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  const headerArgs = cdnHeaderArgs(referer)
  return new Promise((resolve) => {
    const useShell =
      process.platform === 'win32' &&
      !runner.cmd.includes('\\') &&
      !runner.cmd.includes('/')

    const proc = spawn(
      runner.cmd,
      [...runner.baseArgs, ...extraArgs, ...headerArgs, url],
      {
        shell: useShell,
        windowsHide: true,
      },
    )

    let stdout = ''
    let stderr = ''
    const timer = setTimeout(() => {
      proc.kill()
      resolve({ code: null, stdout, stderr: stderr + '\nTimeout' })
    }, timeoutMs)

    proc.stdout?.on('data', (d) => {
      stdout += String(d)
    })
    proc.stderr?.on('data', (d) => {
      stderr += String(d)
    })
    proc.on('error', () => {
      clearTimeout(timer)
      resolve({ code: -1, stdout, stderr })
    })
    proc.on('close', (code) => {
      clearTimeout(timer)
      resolve({ code, stdout, stderr })
    })
  })
}

function versionArgsFor(cmd: string): string[] {
  if (cmd === 'npx') return ['--yes', 'yt-dlp', '--version']
  if (cmd === 'python' || cmd === 'py') return ['-m', 'yt_dlp', '--version']
  return ['--version']
}

let cachedYtDlpPath: string | null | undefined

export function clearYtDlpCache(): void {
  cachedYtDlpPath = undefined
}

async function getYtDlpRunners(): Promise<YtDlpRunner[]> {
  if (cachedYtDlpPath === undefined) {
    cachedYtDlpPath = await resolveBinaryCommand(['yt-dlp', 'yt-dlp.exe'])
  }
  const runners = [...YT_DLP_RUNNERS]
  if (cachedYtDlpPath) {
    runners.unshift({
      cmd: cachedYtDlpPath,
      baseArgs: [...EXTRACT_ARGS],
    })
  }
  return runners
}

async function getYtDlpDownloadRunners(): Promise<YtDlpRunner[]> {
  const extractRunners = await getYtDlpRunners()
  return extractRunners.map((r) => {
    if (r.cmd === 'npx') {
      return { cmd: 'npx', baseArgs: ['--yes', 'yt-dlp', ...DOWNLOAD_BASE] }
    }
    if (r.cmd === 'python' || r.cmd === 'py') {
      return { cmd: r.cmd, baseArgs: ['-m', 'yt_dlp', ...DOWNLOAD_BASE] }
    }
    if (r.cmd.includes('\\') || r.cmd.includes('/')) {
      return { cmd: r.cmd, baseArgs: [...DOWNLOAD_BASE] }
    }
    return { cmd: r.cmd, baseArgs: [...DOWNLOAD_BASE] }
  })
}

/** Vérifie si yt-dlp est installé (première commande qui répond). */
export async function isYtDlpAvailable(): Promise<boolean> {
  for (const runner of await getYtDlpRunners()) {
    const args = versionArgsFor(runner.cmd)
    const useShell =
      process.platform === 'win32' &&
      !runner.cmd.includes('\\') &&
      !runner.cmd.includes('/')

    const ok = await new Promise<boolean>((resolve) => {
      const proc = spawn(runner.cmd, args, {
        shell: useShell,
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
    if (ok) return true
  }
  return false
}

/** Extrait l’URL directe ou HLS (mode lecture). */
export async function tryYtDlpExtract(
  url: string,
  referer?: string,
): Promise<ExtractedStream | null> {
  for (const runner of YT_DLP_RUNNERS) {
    const { code, stdout } = await spawnYtDlp(runner, [], url, referer)
    if (code !== 0) continue

    const lines = stdout
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.startsWith('http'))
    const video =
      lines.find((l) => /\.mp4|\.webm/i.test(l)) ||
      lines.find((l) => !/\.m3u8/i.test(l)) ||
      lines[lines.length - 1]
    const hls = lines.find((l) => /\.m3u8/i.test(l))
    const pick = video || hls
    if (!pick) continue

    return {
      kind: pick.includes('.m3u8') ? 'hls' : 'direct',
      url: pick,
    }
  }
  return null
}

async function walkVideoFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const out: string[] = []
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...(await walkVideoFiles(path)))
      continue
    }
    if (
      /\.(mp4|webm|mkv|mov)(\.\d+)?$/i.test(entry.name) &&
      !/\.part$/i.test(entry.name)
    ) {
      out.push(path)
    }
  }
  return out
}

async function findDownloadedFile(dir: string): Promise<string | null> {
  const files = await walkVideoFiles(dir)
  if (files.length === 0) return null

  let best = files[0]
  let bestSize = 0
  for (const path of files) {
    const s = await stat(path)
    if (s.isFile() && s.size > bestSize) {
      bestSize = s.size
      best = path
    }
  }
  return bestSize > 0 ? best : null
}

function parseYtDlpError(stderr: string): string {
  const line = stderr
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => /^ERROR:/i.test(l))
  if (line) return line.replace(/^ERROR:\s*/i, '').trim()
  const tail = stderr.trim().slice(-400)
  return tail || 'yt-dlp a échoué'
}

export type YtDlpDownloadResult = {
  filePath: string
  runner: YtDlpRunner
}

/**
 * Télécharge la vidéo dans outputDir via yt-dlp.
 * Le nom du fichier final est choisi côté API (Content-Disposition), pas dans -o.
 */
export async function downloadWithYtDlp(
  url: string,
  outputDir: string,
  _outputBaseName: string,
  referer?: string,
): Promise<YtDlpDownloadResult> {
  const outputTemplate = join(outputDir, 'xfile.%(ext)s')

  let lastError = 'yt-dlp introuvable sur ce serveur.'

  for (const downloadRunner of await getYtDlpDownloadRunners()) {
    for (const formatArgs of formatStrategiesFor(url)) {
      const { code, stderr } = await spawnYtDlp(
        downloadRunner,
        ['-o', outputTemplate, ...formatArgs],
        url,
        referer,
        600_000,
      )

      if (code !== 0) {
        lastError = parseYtDlpError(stderr)
        continue
      }

      const filePath = await findDownloadedFile(outputDir)
      if (filePath) {
        return { filePath, runner: downloadRunner }
      }
      lastError = 'yt-dlp a terminé sans produire de fichier vidéo.'
    }
  }

  throw new Error(lastError)
}
