const pageUrl = process.argv[2] || 'https://www.french-stream.one/'

const res = await fetch(pageUrl, {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36',
    'Accept-Language': 'fr-FR,fr;q=0.9',
  },
  redirect: 'follow',
})
console.log('Status', res.status, res.url)
const html = await res.text()
console.log('Length', html.length)

for (const h of ['vidzy', 'uqload', 'dood', 'voe', 'filmoon', 'ds2play']) {
  const re = new RegExp(`https?:[^"'\\s<>]*${h}[^"'\\s<>]*`, 'gi')
  const found = [...new Set(html.match(re) || [])].slice(0, 5)
  console.log(`\n${h} (${found.length}):`)
  found.forEach((u) => console.log(' ', u))
}
