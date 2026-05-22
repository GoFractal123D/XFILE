const embedUrl = 'https://vidzy.cc/embed-12khguaeb16q.html'
const res = await fetch(embedUrl, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122',
    Referer: 'https://french-stream.one/',
  },
})
const html = await res.text()

const keywords = [
  'm3u8',
  'mp4',
  'hls',
  'source',
  'player',
  'ajax',
  'api',
  'get_video',
  'embed',
  'file:',
  'manifest',
]
for (const kw of keywords) {
  const idx = html.toLowerCase().indexOf(kw)
  if (idx >= 0) {
    console.log(`\n--- ${kw} @ ${idx} ---`)
    console.log(html.slice(Math.max(0, idx - 80), idx + 120).replace(/\s+/g, ' '))
  }
}

const scriptSrcs = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(
  (m) => m[1],
)
console.log('\nScripts:', scriptSrcs.slice(0, 10))
