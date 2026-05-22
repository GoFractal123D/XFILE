const q = 'the boys saison 4'
const url = `https://french-stream.one/index.php?do=search&subaction=search&story=${encodeURIComponent(q)}`
const res = await fetch(url, {
  headers: { 'User-Agent': 'Mozilla/5.0 Chrome/122' },
})
const h = await res.text()
console.log('len', h.length)
const links = [...h.matchAll(/href=["']([^"']*newsid=\d+[^"']*)["']/gi)].map((m) => m[1])
console.log('newsid links', [...new Set(links)].slice(0, 8))
const boys = [...h.matchAll(/boys[^<]{0,60}/gi)]
console.log('boys', boys?.slice(0, 5))
