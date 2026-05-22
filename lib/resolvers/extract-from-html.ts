export type ExtractedStream =
  | { kind: 'direct'; url: string }
  | { kind: 'hls'; url: string }

function cleanUrl(raw: string): string {
  return raw
    .replace(/\\u0026/g, '&')
    .replace(/\\u002f/gi, '/')
    .replace(/\\u003a/gi, ':')
    .replace(/\\\//g, '/')
    .replace(/&amp;/g, '&')
}

export function extractStreamsFromHtml(html: string): ExtractedStream[] {
  const found: ExtractedStream[] = []
  const seen = new Set<string>()

  const push = (kind: 'direct' | 'hls', url: string) => {
    const clean = cleanUrl(url)
    if (!clean.startsWith('http') || seen.has(clean)) return
    seen.add(clean)
    found.push({ kind, url: clean })
  }

  const m3u8Re = /https?:\/\/[^\s"'<>\\]+\.m3u8[^\s"'<>\\]*/gi
  let m: RegExpExecArray | null
  while ((m = m3u8Re.exec(html)) !== null) {
    push('hls', m[0])
  }

  const mp4Re = /https?:\/\/[^\s"'<>\\]+\.mp4[^\s"'<>\\]*/gi
  while ((m = mp4Re.exec(html)) !== null) {
    push('direct', m[0])
  }

  const fileField =
    /(?:file|src|source|url|download_url)["']?\s*[:=]\s*["'](https?:\/\/[^"']+)["']/gi
  while ((m = fileField.exec(html)) !== null) {
    const u = m[1]
    if (/\.m3u8/i.test(u)) push('hls', u)
    else if (/\.mp4|\.webm|video|googlevideo|cdn/i.test(u)) push('direct', u)
  }

  const hlsQuoted = /["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi
  while ((m = hlsQuoted.exec(html)) !== null) {
    push('hls', m[1])
  }

  const escapedJson = /https?:\\\/\\\/[^"\\]+/gi
  while ((m = escapedJson.exec(html)) !== null) {
    const u = cleanUrl(m[0])
    if (/\.m3u8/i.test(u)) push('hls', u)
    else if (/\.mp4|\.webm/i.test(u)) push('direct', u)
  }

  return found
}

export function pickBestStream(streams: ExtractedStream[]): ExtractedStream | null {
  const direct = streams.find((s) => s.kind === 'direct')
  if (direct) return direct
  return streams.find((s) => s.kind === 'hls') ?? null
}
