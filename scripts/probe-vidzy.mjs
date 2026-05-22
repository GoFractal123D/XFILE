const embedUrl =
  process.argv[2] || 'https://vidzy.cc/embed-12khguaeb16q.html'
const referer =
  process.argv[3] || 'https://french-stream.one/index.php?newsid=15125879'

const res = await fetch(embedUrl, {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36',
    Referer: referer,
    Accept: 'text/html,*/*',
  },
})
console.log('Embed status', res.status)
const html = await res.text()
console.log('Length', html.length)

const patterns = [
  [/\.m3u8/gi, 'm3u8 count'],
  [/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/gi, 'm3u8 urls'],
  [/sources\s*:\s*\[/i, 'jw sources'],
  [/atob\s*\(/gi, 'atob'],
  [/file\s*:\s*["']https?:\/\/[^"']+/gi, 'file fields'],
]

for (const [re, label] of patterns) {
  const m = html.match(re)
  console.log(label + ':', m ? (label.includes('urls') || label.includes('fields') ? m.slice(0, 3) : m.length) : 0)
}

const m3u8 = html.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/i)?.[0]
const mp4 = html.match(/https?:\/\/[^"'\s]+\.mp4[^"'\s]*/i)?.[0]
console.log('\nFirst m3u8:', m3u8)
console.log('First mp4:', mp4)

// atob decode
const atobRe = /atob\s*\(\s*['"]([A-Za-z0-9+/=]+)['"]\s*\)/g
let m
while ((m = atobRe.exec(html)) !== null) {
  try {
    const d = Buffer.from(m[1], 'base64').toString('utf8')
    if (d.includes('http')) console.log('atob decoded:', d.slice(0, 200))
  } catch {}
}
