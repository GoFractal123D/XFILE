import { readFileSync } from 'fs'
import { fetchPageHtml } from '../lib/fetch-page.ts'
import { resolveVidzy } from '../lib/resolvers/vidzy.ts'
import { extractStreamsFromHtml, pickBestStream } from '../lib/resolvers/extract-from-html.ts'

const embedUrl = 'https://vidzy.cc/embed-12khguaeb16q.html'
const pageUrl = 'https://french-stream.one/index.php?newsid=15125879'

const html = await fetchPageHtml(embedUrl, pageUrl)
const stream = await resolveVidzy(embedUrl, pageUrl)
console.log('resolveVidzy:', stream)

const picked = pickBestStream(extractStreamsFromHtml(html))
console.log('pickBest from html:', picked)
