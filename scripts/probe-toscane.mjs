const search = await fetch('https://french-stream.one/?s=Toi+Moi+et+la+Toscane', {
  headers: { 'User-Agent': 'Mozilla/5.0' },
}).then((r) => r.text())

const links = [...search.matchAll(/href=["']([^"']*newsid=[^"']*)["']/gi)]
  .map((m) => m[1])
  .filter((h) => /toscane/i.test(h) || true)

for (const href of links.slice(0, 5)) {
  const url = href.startsWith('http') ? href : new URL(href, 'https://french-stream.one').href
  const html = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then((r) =>
    r.text(),
  )
  const title = html.match(/<title>([^<]+)/i)?.[1]
  console.log('\n', title?.trim().slice(0, 60))
  console.log(' url:', url)
  for (const h of ['vidzy', 'uqload', 'dood', 'voe', 'filmoon']) {
    const n = (html.match(new RegExp(h, 'gi')) || []).length
    if (n) console.log(' ', h, n)
  }
}
