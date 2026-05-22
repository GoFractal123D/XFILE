const m3u8 =
  'https://u14.vidzy.cc/hls2/03/00046/12khguaeb16q_n/master.m3u8?t=z3unr4OT5tNA8DbQh4RQzcueSbWzspATqlsMQe9HbSo&s=1778955879&e=172800&f=234752&i=0.0&sp=0'

for (const referer of [
  'https://french-stream.one/',
  'https://vidzy.cc/embed-12khguaeb16q.html',
]) {
  const res = await fetch(m3u8, {
    headers: { 'User-Agent': 'Mozilla/5.0', Referer: referer },
  })
  console.log(referer.slice(0, 40), res.status)
}
