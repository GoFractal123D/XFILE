// Copie légère du flux resolve Vidzy pour validation
function unpackVidzyEmbedScript(html) {
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

const embedUrl = 'https://vidzy.cc/embed-12khguaeb16q.html'
const html = await fetch(embedUrl, {
  headers: {
    'User-Agent': 'Mozilla/5.0',
    Referer: 'https://french-stream.one/',
  },
}).then((r) => r.text())

const decoded = unpackVidzyEmbedScript(html)
const m3u8 = decoded?.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/i)?.[0]
console.log('Extracted:', m3u8?.slice(0, 100))

if (m3u8) {
  const proxyUrl = `https://xfile-production.up.railway.app/api/stream?url=${encodeURIComponent(m3u8)}&referer=${encodeURIComponent(embedUrl)}`
  console.log('Proxy URL ready (needs dev server):', proxyUrl.slice(0, 80))
}
