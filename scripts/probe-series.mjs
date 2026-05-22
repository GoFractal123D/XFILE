const url =
  process.argv[2] || 'https://french-stream.one/index.php?newsid=15127038'
const headers = { 'User-Agent': 'Mozilla/5.0 Chrome/122' }

const html = await fetch(url, { headers }).then((r) => r.text())

const serieData = html.match(/<[^>]*id=["']serie-data["'][^>]*>/i)?.[0]
console.log('serie-data tag:', serieData)

const block = html.match(/id=["']serie-data["'][\s\S]{0,3000}/i)?.[0]
if (block) console.log('\nblock:', block.slice(0, 1500).replace(/\s+/g, ' '))

const epNav = html.match(/prevEpisode[\s\S]{0,2000}/i)?.[0]
console.log('\nnav:', epNav?.slice(0, 800).replace(/\s+/g, ' '))
