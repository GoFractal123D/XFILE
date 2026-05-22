const embedUrl = 'https://vidzy.cc/embed-12khguaeb16q.html'
const page = await fetch(embedUrl, {
  headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://french-stream.one/' },
}).then((r) => r.text())

// find api/source calls
const apiCalls = [...page.matchAll(/api\/[^"'`\s]+/gi)].map((m) => m[0])
console.log('api paths:', [...new Set(apiCalls)])

const fetchCalls = [...page.matchAll(/fetch\s*\(\s*["']([^"']+)["']/gi)].map((m) => m[1])
console.log('fetch:', fetchCalls)

// find key/token params
for (const kw of ['key', 'token', 'hash', 'sig', 'api']) {
  const re = new RegExp(`${kw}['"\\s]*[:=]['"\\s]*([^'"\\s]{8,80})`, 'gi')
  const m = [...page.matchAll(re)].slice(0, 5)
  if (m.length) console.log(kw, m.map((x) => x[0].slice(0, 100)))
}

// unpack and find index references to hls2
const packMatch = page.match(/'([^']{200,})'\.split\('\|'\)\)\)/)
if (!packMatch) {
  console.log('no pack')
  process.exit(0)
}
const parts = packMatch[1].split('|')

// find script that uses parts - look for eval pattern
const evalBlock = page.match(/eval\(function\(p,a,c,k,e,d\)[\s\S]{0,500}/)?.[0]
console.log('eval block start:', evalBlock?.slice(0, 200))

// Search for /api/source in full page
const idx = page.indexOf('api/source')
console.log('api/source context:', page.slice(idx - 200, idx + 300).replace(/\s+/g, ' '))

// try api with keys from packed string
const id = '12khguaeb16q'
const keys = parts.filter((p) => /^[a-f0-9]{16,64}$/i.test(p) || /^[A-Za-z0-9]{20,40}$/.test(p))
console.log('candidate keys:', keys.slice(0, 15))

for (const key of keys.slice(0, 8)) {
  for (const param of ['key', 'hash', 'token', 'k']) {
    const url = `https://vidzy.cc/api/source/${id}?${param}=${encodeURIComponent(key)}`
    const res = await fetch(url, {
      headers: { Referer: embedUrl, 'User-Agent': 'Mozilla/5.0' },
    })
    const body = await res.text()
    if (!body.includes('Invalid key') && body.length < 500) {
      console.log('HIT', param, key.slice(0, 20), body.slice(0, 200))
    }
  }
}
