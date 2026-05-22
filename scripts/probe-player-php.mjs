const pageUrl = 'https://french-stream.one/index.php?newsid=15125879'
const html = await fetch(pageUrl, {
  headers: { 'User-Agent': 'Mozilla/5.0 Chrome/122' },
}).then((r) => r.text())

const players = [
  ...new Set(
    [...html.matchAll(/["']([^"']*(?:player|affiche|link|embed)[^"']*\.php[^"']*)["']/gi)].map(
      (m) => m[1],
    ),
  ),
].slice(0, 15)

console.log('Player links:')
for (const p of players) {
  const url = p.startsWith('http') ? p : new URL(p, pageUrl).href
  console.log(url)
}

// fetch first player page
const first = players[0]
if (first) {
  const u = first.startsWith('http') ? first : new URL(first, pageUrl).href
  const ph = await fetch(u, {
    headers: { 'User-Agent': 'Mozilla/5.0', Referer: pageUrl },
  }).then((r) => r.text())
  console.log('\nPlayer page length', ph.length)
  for (const h of ['vidzy', 'uqload', 'dood', 'voe', 'filmoon']) {
    const found = [...new Set(ph.match(new RegExp(`https?:[^"'\\s<>]*${h}[^"'\\s<>]*`, 'gi')) || [])]
    if (found.length) console.log(h, found.slice(0, 2))
  }
}
