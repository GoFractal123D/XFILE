export const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
}

export async function fetchPageHtml(
  url: string,
  referer?: string,
): Promise<string> {
  const res = await fetch(url, {
    headers: {
      ...BROWSER_HEADERS,
      ...(referer ? { Referer: referer } : {}),
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(25_000),
  })
  if (!res.ok) {
    throw new Error(`Page inaccessible (${res.status})`)
  }
  return res.text()
}
