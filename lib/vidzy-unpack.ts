/** Désobfusque le packer JS des pages embed Vidzy pour extraire l’URL HLS. */
export function unpackVidzyEmbedScript(html: string): string | null {
  const start = html.indexOf('eval(function(p,a,c,k,e,d)')
  if (start === -1) return null

  const end = html.indexOf(".split('|')))", start)
  if (end === -1) return null

  const block = html.slice(start, end + ".split('|')))".length)
  const inner = block.match(
    /return p\}\('((?:\\'|[^'])*)',(\d+),(\d+),'([^']*)'\.split\('\|'\)/,
  )
  if (!inner) return null

  const encoded = inner[1].replace(/\\'/g, "'")
  const radix = parseInt(inner[2], 10)
  let count = parseInt(inner[3], 10)
  const dict = inner[4].split('|')

  let packed = encoded
  while (count--) {
    if (dict[count]) {
      packed = packed.replace(
        new RegExp(`\\b${count.toString(radix)}\\b`, 'g'),
        dict[count],
      )
    }
  }
  return packed
}

export function extractStreamFromVidzyScript(decoded: string): {
  kind: 'hls' | 'direct'
  url: string
} | null {
  const srcQuoted = decoded.match(
    /src\s*:\s*["'](https?:\/\/[^"']+)["']/i,
  )?.[1]
  if (srcQuoted) {
    return {
      kind: srcQuoted.includes('.m3u8') ? 'hls' : 'direct',
      url: srcQuoted,
    }
  }

  const m3u8 = decoded.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/i)?.[0]
  if (m3u8) return { kind: 'hls', url: m3u8 }

  const mp4 = decoded.match(/https?:\/\/[^"'\s]+\.mp4[^"'\s]*/i)?.[0]
  if (mp4) return { kind: 'direct', url: mp4 }

  return null
}
