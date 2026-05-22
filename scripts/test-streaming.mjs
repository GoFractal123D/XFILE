import { mergeDetection } from '../lib/video-extract.ts'
import { enrichStreamingSources } from '../lib/catalog-scraper.ts'
import { pickBestSourcePerHost } from '../lib/streaming-embeds.ts'
import { resolveEmbedUrl } from '../lib/resolvers/index.ts'
import { fetchStreamUpstream, isHlsUrl } from '../lib/stream-proxy.ts'
import { fetchPageHtml } from '../lib/fetch-page.ts'

const pageUrl =
  process.argv[2] ||
  'https://french-stream.one/index.php?newsid=12345'

async function main() {
  console.log('Page:', pageUrl)
  const html = await fetchPageHtml(pageUrl)
  let detected = mergeDetection(pageUrl, html)
  if (!detected || detected.kind !== 'streaming') {
    console.log('Not streaming:', detected?.kind)
    return
  }
  const enriched = await enrichStreamingSources(pageUrl, detected.sources)
  const sources = pickBestSourcePerHost(enriched)
  console.log('Sources:', sources.length)
  for (const s of sources) {
    console.log(' -', s.label, s.embedUrl)
  }

  for (const s of sources.slice(0, 3)) {
    console.log('\n=== Resolve', s.label, '===')
    try {
      const stream = await resolveEmbedUrl(s.embedUrl, pageUrl)
      console.log('Stream:', stream.kind, stream.url.slice(0, 120))
      const ref = pageUrl
      const res = await fetchStreamUpstream(stream.url, ref)
      console.log('Upstream:', res.status, res.headers.get('content-type'))
      if (isHlsUrl(stream.url)) {
        const text = (await res.text()).slice(0, 300)
        console.log('M3U8 head:', text)
      }
    } catch (e) {
      console.log('FAIL:', e.message)
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
