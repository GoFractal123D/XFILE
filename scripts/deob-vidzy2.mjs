const page = await fetch('https://vidzy.cc/embed-12khguaeb16q.html', {
  headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://french-stream.one/' },
}).then((r) => r.text())

const start = page.indexOf('eval(function(p,a,c,k,e,d)')
const end = page.indexOf(".split('|')))", start) + ".split('|')))".length
const block = page.slice(start, end)
console.log('Block length', block.length)

// extract encoded, radix, count, dict
const inner = block.match(
  /return p\}\('([^']*(?:\\'[^']*)*)',(\d+),(\d+),'([^']*)'\.split\('\|'\)/,
)
if (!inner) {
  // try: dict is separate - encoded ends before ',digits,digits,'
  const m2 = block.match(/return p\}\('([\s\S]*?)',(\d+),(\d+),/)
  console.log('m2', !!m2, m2?.[1]?.slice(0, 80))
  const dictStart = block.lastIndexOf("'") 
  console.log('tail', block.slice(-200))
  process.exit(1)
}

const encoded = inner[1].replace(/\\'/g, "'")
const radix = parseInt(inner[2], 10)
const count = parseInt(inner[3], 10)
const dict = inner[4].split('|')

function unpack(p, a, c, k) {
  while (c--) {
    if (k[c]) {
      p = p.replace(new RegExp('\\b' + c.toString(a) + '\\b', 'g'), k[c])
    }
  }
  return p
}

const decoded = unpack(encoded, radix, count, dict)
console.log(decoded)

const m3u8 = decoded.match(/https?:\/\/[^\s"']+\.m3u8[^\s"']*/i)
console.log('\nM3U8:', m3u8?.[0])
