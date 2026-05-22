const page = await fetch('https://vidzy.cc/embed-12khguaeb16q.html', {
  headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://french-stream.one/' },
}).then((r) => r.text())

const idx = page.indexOf('eval(function')
console.log('eval at', idx)
console.log(page.slice(idx, idx + 500))

const splitIdx = page.indexOf(".split('|')")
console.log('split at', splitIdx)
console.log(page.slice(splitIdx - 100, splitIdx + 50))
