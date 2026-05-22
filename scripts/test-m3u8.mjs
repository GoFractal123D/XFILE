const m3u8 =
  'https://u14.vidzy.cc/hls2/03/00046/12khguaeb16q_n/master.m3u8?t=z3unr4OT5tNA8DbQh4RQzcueSbWzspATqlsMQe9HbSo&s=1778955879&e=172800&f=234752&i=0.0&sp=0'
const referer = 'https://vidzy.cc/embed-12khguaeb16q.html'

const res = await fetch(m3u8, {
  headers: {
    'User-Agent': 'Mozilla/5.0',
    Referer: referer,
    Origin: 'https://vidzy.cc',
  },
})
console.log('Status', res.status, res.headers.get('content-type'))
const text = await res.text()
console.log(text.slice(0, 500))
