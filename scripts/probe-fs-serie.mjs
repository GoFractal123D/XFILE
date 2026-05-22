const pageUrl = process.argv[2] || 'https://french-stream.one/serie/the-boys-saison-4'

const res = await fetch(pageUrl, {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36',
    'Accept-Language': 'fr-FR,fr;q=0.9',
  },
  redirect: 'follow',
})
console.log('status', res.status, 'final', res.url)
const html = await res.text()
console.log('len', html.length)
console.log('serie-data', /serie-data/i.test(html))
const newsid = html.match(/data-newsid=["'](\d+)["']/i)
console.log('newsid', newsid?.[1])

if (newsid?.[1]) {
  const origin = new URL(res.url).origin
  const epsUrl = `${origin}/data/eps_${newsid[1]}.txt?v=1`
  const epsRes = await fetch(epsUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 Chrome/122' },
  })
  console.log('eps status', epsRes.status)
  const text = await epsRes.text()
  console.log('eps len', text.length)
}
