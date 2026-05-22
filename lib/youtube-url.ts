const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/

export function extractYoutubeVideoId(raw: string): string | null {
  try {
    const u = new URL(raw.trim())
    const host = u.hostname.replace(/^www\./, '').toLowerCase()

    if (host === 'youtu.be') {
      const id = u.pathname.slice(1).split('/')[0]
      return VIDEO_ID_RE.test(id) ? id : null
    }

    if (host.includes('youtube.com') || host === 'youtube-nocookie.com') {
      const v = u.searchParams.get('v')
      if (v && VIDEO_ID_RE.test(v)) return v

      const pathMatch = u.pathname.match(
        /\/(?:embed|v|shorts|live)\/([a-zA-Z0-9_-]{11})/,
      )
      if (pathMatch?.[1] && VIDEO_ID_RE.test(pathMatch[1])) return pathMatch[1]
    }
  } catch {
    return null
  }
  return null
}

/** Vérifie que l’URL cible bien un domaine YouTube (anti-SSRF). */
export function assertYoutubePageUrl(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) {
    throw new Error('URL requise')
  }

  let u: URL
  try {
    u = new URL(trimmed)
  } catch {
    throw new Error('URL invalide')
  }

  if (u.protocol !== 'https:' && u.protocol !== 'http:') {
    throw new Error('Schéma non autorisé')
  }

  const host = u.hostname.toLowerCase()
  const allowed =
    host === 'youtu.be' ||
    host === 'youtube.com' ||
    host === 'www.youtube.com' ||
    host === 'm.youtube.com' ||
    host === 'youtube-nocookie.com' ||
    host.endsWith('.youtube.com')

  if (!allowed) {
    throw new Error('Seules les URL YouTube sont autorisées pour ce téléchargement.')
  }

  if (!extractYoutubeVideoId(trimmed)) {
    throw new Error("Cette URL YouTube n'est pas reconnue comme une vidéo valide.")
  }

  return trimmed
}

export function safeDownloadFilename(title: string, ext: string): string {
  const base =
    title
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
      .replace(/\s+/g, ' ')
      .trim() || 'video'
  const short = base.slice(0, 100)
  const e = ext.replace(/^\./, '') || 'mp4'
  return `${short}.${e}`
}
