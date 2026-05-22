const embedUrl = 'https://vidzy.cc/embed-12khguaeb16q.html'
const page = await fetch(embedUrl, {
  headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://french-stream.one/' },
}).then((r) => r.text())

const re =
  /eval\(function\(p,a,c,k,e,d\)\{[\s\S]*?\}\('([^']*)',(\d+),(\d+),'([^']*)'\.split\('\|'\)\)\)/

const m = page.match(re)
if (!m) {
  console.log('packer not found')
  process.exit(1)
}

const encoded = m[1]
const radix = parseInt(m[2], 10)
const count = parseInt(m[3], 10)
const dict = m[4].split('|')

function unpack(p, a, c, k) {
  const e = function (n) {
    return (n < a ? '' : e(parseInt(n / a, 10))) +
      ((n = n % a) > 35 ? String.fromCharCode(n + 29) : n.toString(36))
  }
  const d = {}
  let i = c
  while (i--) d[e(i)] = k[i] || e(i)
  const repl = function (n) {
    return d[n]
  }
  return p.replace(/\b\w+\b/g, (word) => (d[word] !== undefined ? d[word] : word))
}

const decoded = unpack(encoded, radix, count, dict)
console.log(decoded.slice(0, 2000))

const urls = [...decoded.matchAll(/https?:\/\/[^\s"'<>]+/g)].map((x) => x[0])
console.log('\nURLs:', [...new Set(urls)])

const api = decoded.match(/api\/[^"'\s]+/g)
console.log('API paths:', api)
