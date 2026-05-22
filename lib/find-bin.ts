import { access, readdir } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { constants } from 'node:fs'
import { join } from 'node:path'

const cache = new Map<string, string | null>()

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK)
    return true
  } catch {
    return false
  }
}

async function resolveViaWhere(command: string): Promise<string | null> {
  if (process.platform !== 'win32') return null

  return new Promise((resolve) => {
    const proc = spawn('where.exe', [command], {
      shell: false,
      windowsHide: true,
    })
    let out = ''
    proc.stdout?.on('data', (d) => {
      out += String(d)
    })
    proc.on('error', () => resolve(null))
    proc.on('close', (code) => {
      if (code !== 0) {
        resolve(null)
        return
      }
      const first = out
        .split(/\r?\n/)
        .map((l) => l.trim())
        .find((l) => l.length > 0)
      resolve(first ?? null)
    })
  })
}

/** Parcourt WinGet\Packages (winget install Gyan.FFmpeg / yt-dlp). */
async function findInWinGetPackages(
  exeName: string,
  maxDepth = 6,
): Promise<string[]> {
  const local = process.env.LOCALAPPDATA
  if (!local || process.platform !== 'win32') return []

  const packagesDir = join(local, 'Microsoft', 'WinGet', 'Packages')
  const found: string[] = []
  const target = exeName.toLowerCase()

  async function walk(dir: string, depth: number) {
    if (depth > maxDepth) return
    let entries
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      const full = join(dir, entry.name)
      if (entry.isFile() && entry.name.toLowerCase() === target) {
        found.push(full)
      } else if (entry.isDirectory()) {
        await walk(full, depth + 1)
      }
    }
  }

  await walk(packagesDir, 0)
  return found
}

function pickFfmpegPath(paths: string[]): string | null {
  if (paths.length === 0) return null
  return (
    paths.find((p) => /Gyan\.FFmpeg/i.test(p)) ??
    paths.find((p) => /full_build/i.test(p)) ??
    paths.find((p) => !/yt-dlp\.FFmpeg/i.test(p)) ??
    paths[0]
  )
}

function pickYtDlpPath(paths: string[]): string | null {
  if (paths.length === 0) return null
  return (
    paths.find((p) => /yt-dlp\.yt-dlp/i.test(p)) ??
    paths.find((p) => /yt-dlp/i.test(p) && !/FFmpeg/i.test(p)) ??
    paths[0]
  )
}

async function discoverFfmpeg(): Promise<string | null> {
  const links = process.env.LOCALAPPDATA
    ? join(process.env.LOCALAPPDATA, 'Microsoft', 'WinGet', 'Links', 'ffmpeg.exe')
    : ''

  const staticCandidates = [links].filter(Boolean)

  for (const p of staticCandidates) {
    if (await fileExists(p)) return p
  }

  const fromWhere = await resolveViaWhere('ffmpeg')
  if (fromWhere && (await fileExists(fromWhere))) return fromWhere

  const fromPackages = pickFfmpegPath(
    await findInWinGetPackages('ffmpeg.exe'),
  )
  if (fromPackages) return fromPackages

  return null
}

async function discoverYtDlp(): Promise<string | null> {
  const links = process.env.LOCALAPPDATA
    ? join(process.env.LOCALAPPDATA, 'Microsoft', 'WinGet', 'Links', 'yt-dlp.exe')
    : ''

  if (links && (await fileExists(links))) return links

  const fromWhere = await resolveViaWhere('yt-dlp')
  if (fromWhere && (await fileExists(fromWhere))) return fromWhere

  const fromPackages = pickYtDlpPath(
    await findInWinGetPackages('yt-dlp.exe'),
  )
  if (fromPackages) return fromPackages

  return null
}

/**
 * Retourne le chemin absolu vers l’exécutable, ou le nom s’il est dans le PATH.
 */
export async function resolveBinaryCommand(
  names: string[],
): Promise<string | null> {
  const key = names.join('|')
  if (cache.has(key)) return cache.get(key) ?? null

  let result: string | null = null

  const wantsFfmpeg = names.some((n) => /ffmpeg/i.test(n))
  const wantsYtDlp = names.some((n) => /yt-dlp/i.test(n))

  if (wantsFfmpeg) {
    result = await discoverFfmpeg()
  }
  if (!result && wantsYtDlp) {
    result = await discoverYtDlp()
  }

  if (!result) {
    for (const name of names) {
      if (name.includes('\\') || name.includes('/')) {
        if (await fileExists(name)) {
          result = name
          break
        }
        continue
      }
      const fromWhere = await resolveViaWhere(name.replace(/\.exe$/i, ''))
      if (fromWhere && (await fileExists(fromWhere))) {
        result = fromWhere
        break
      }
    }
  }

  cache.set(key, result)
  return result
}

/** Réinitialise le cache (utile après installation winget sans redémarrage). */
export function clearBinaryCache(): void {
  cache.clear()
}
