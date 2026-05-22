const embedUrl = 'https://vidzy.cc/embed-12khguaeb16q.html'
const id = '12khguaeb16q'
const referer = 'https://french-stream.one/'

const candidates = [
  `https://vidzy.cc/hls2/${id}/master.m3u8`,
  `https://vidzy.cc/hls/${id}/master.m3u8`,
  `https://vidzy.cc/${id}/master.m3u8`,
  `https://vidzy.cc/hls2/${id}_n/master.m3u8`,
  `https://vidzy.cc/hls2/${id}_n/index.m3u8`,
  `https://vidzy.cc/player/hls2/${id}/master.m3u8`,
  `https://vidzy.cc/api/source/${id}`,
  `https://vidzy.cc/ajax/embed.php?id=${id}`,
]

for (const url of candidates) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 Chrome/122',
        Referer: embedUrl,
        Origin: 'https://vidzy.cc',
      },
    })
    const ct = res.headers.get('content-type') || ''
    const preview =
      ct.includes('json') || ct.includes('mpegurl') || ct.includes('text')
        ? (await res.text()).slice(0, 120)
        : `[binary ${res.headers.get('content-length')}]`
    console.log(res.status, url.split('/').slice(-2).join('/'), '-', preview.replace(/\n/g, ' '))
  } catch (e) {
    console.log('ERR', url, e.message)
  }
}

// extract packed array from page
const page = await fetch(embedUrl, {
  headers: { 'User-Agent': 'Mozilla/5.0', Referer: referer },
}).then((r) => r.text())

const packMatch = page.match(/'([^']{200,})'\.split\('\|'\)/)
if (packMatch) {
  const parts = packMatch[1].split('|')
  console.log('\nPacked parts count:', parts.length)
  const interesting = parts.filter((p) =>
    /m3u8|hls|http|master|\.cc/i.test(p),
  )
  console.log('Interesting parts:', interesting.slice(0, 20))
}
