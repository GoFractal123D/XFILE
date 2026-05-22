const newsId = process.argv[2] || '15127038'
const base = 'https://french-stream.one'
const url = `${base}/data/eps_${newsId}.txt?v=1`
const res = await fetch(url, {
  headers: { 'User-Agent': 'Mozilla/5.0 Chrome/122' },
})
console.log('status', res.status)
const text = await res.text()
console.log('len', text.length, 'head:', text.slice(0, 200))

let data
try {
  data = JSON.parse(text)
} catch {
  try {
    data = Function('"use strict";return (' + text + ')')()
  } catch (e) {
    console.log('parse fail', e.message)
    process.exit(1)
  }
}

console.log('keys', Object.keys(data))
for (const ver of ['vf', 'vostfr', 'vo']) {
  if (data[ver]) console.log(ver, 'eps', Object.keys(data[ver]).join(','))
}
if (data.info) console.log('info sample', Object.entries(data.info).slice(0, 3))

const ep1 = data.vf?.['1'] || data.vf?.[1]
if (ep1) console.log('vf ep1', JSON.stringify(ep1).slice(0, 400))
