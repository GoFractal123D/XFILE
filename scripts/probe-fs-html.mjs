import { writeFileSync } from 'fs'

const pageUrl = 'https://french-stream.one/index.php?newsid=15127038'
const res = await fetch(pageUrl, {
  headers: { 'User-Agent': 'Mozilla/5.0 Chrome/122' },
})
const h = await res.text()

const patterns = [
  'serie-data',
  'loadEpisodes',
  'eps_',
  'newsid',
  'episode-list',
  'episodes',
  'data-eps',
]
for (const p of patterns) {
  const i = h.indexOf(p)
  if (i >= 0) console.log(p, h.slice(i, i + 120).replace(/\s+/g, ' '))
}

writeFileSync('scripts/out-newsid.html', h)
console.log('saved', h.length)
