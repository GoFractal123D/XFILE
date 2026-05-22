const origin = 'https://french-stream.one'
const queries = ['boys', 'the boys', 'boys saison 4']

for (const query of queries) {
  const searchRes = await fetch(
    `${origin}/index.php?do=search&subaction=search&story=${encodeURIComponent(query)}`,
    { headers: { 'User-Agent': 'Mozilla/5.0 Chrome/122' } },
  )
  const h = await searchRes.text()
  const ids = [...new Set([...h.matchAll(/newsid=(\d{6,})/g)].map((m) => m[1]))]
  console.log('\nquery', query, 'ids', ids.length)

  for (const id of ids.slice(0, 12)) {
    try {
      const eps = await fetch(`${origin}/data/eps_${id}.txt?v=1`, {
        headers: { 'User-Agent': 'Mozilla/5.0 Chrome/122' },
      })
      if (!eps.ok) continue
      const data = JSON.parse(await eps.text())
      const vf = Object.keys(data.vf || {})
      if (vf.length < 2) continue
      const t1 = data.info?.['1']?.title || ''
      const block = h.includes(id)
        ? h.slice(
            Math.max(0, h.indexOf(`newsid=${id}`) - 80),
            h.indexOf(`newsid=${id}`) + 200,
          )
        : ''
      if (/boys/i.test(t1 + block) || query === 'boys') {
        console.log('  id', id, 'vf', vf.length, 'ep1', t1, 'ctx', block.replace(/\s+/g, ' ').slice(0, 80))
      }
    } catch {
      /* ignore */
    }
  }
}
