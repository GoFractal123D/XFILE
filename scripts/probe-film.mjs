const q = process.argv[2] || 'toscane'
const searchUrl = `https://french-stream.one/?s=${encodeURIComponent(q)}`

const res = await fetch(searchUrl, {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122' },
})
const html = await res.text()
const links = [
  ...new Set(
    [...html.matchAll(/href=["']([^"']+)["']/gi)]
      .map((m) => m[1])
      .filter((h) => /toscane|newsid/i.test(h)),
  ),
].slice(0, 10)

console.log('Film links:')
for (const link of links) {
  const abs = link.startsWith('http')
    ? link
    : new URL(link, 'https://french-stream.one').href
  console.log(abs)
}

const filmUrl = links.find((l) => l.includes('newsid')) || links[0]
if (!filmUrl) {
  console.log('No film found')
  process.exit(0)
}

const pageUrl = filmUrl.startsWith('http')
  ? filmUrl
  : new URL(filmUrl, 'https://french-stream.one').href

console.log('\nFetching', pageUrl)
const pageRes = await fetch(pageUrl, {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122' },
})
const pageHtml = await pageRes.text()
console.log('Page length', pageHtml.length)

for (const h of ['vidzy', 'uqload', 'dood', 'voe', 'filmoon', 'ds2play']) {
  const re = new RegExp(`https?:[^"'\\s<>]*${h}[^"'\\s<>]*`, 'gi')
  const found = [...new Set(pageHtml.match(re) || [])].slice(0, 3)
  console.log(`\n${h}:`, found.length ? found.join('\n  ') : 'none')
}

// escaped urls
const esc = [...pageHtml.matchAll(/https?:\\\/\\\/[^"\\]+/gi)].map((m) =>
  m[0].replace(/\\\//g, '/'),
)
const hosts = esc.filter((u) => /vidzy|uqload|dood|voe|filmoon/i.test(u))
console.log('\nEscaped host urls:', [...new Set(hosts)].slice(0, 8))
