/** URLs alternatives à tester pour un embed (chemins /e/, /embed/, etc.). */
export function embedUrlVariants(embedUrl: string): string[] {
  const out = new Set<string>([embedUrl])
  try {
    const u = new URL(embedUrl)
    const path = u.pathname

    if (/uqload/i.test(u.hostname)) {
      if (!path.includes('/embed')) {
        const code = path.split('/').filter(Boolean).pop()
        if (code && /\.html?$/i.test(code)) {
          out.add(`${u.origin}/embed-${code}`)
        }
      }
    }

    if (/dood|ds2play|d000d/i.test(u.hostname)) {
      if (!path.includes('/e/') && !path.includes('/d/')) {
        const id = path.split('/').filter(Boolean).pop()
        if (id) {
          out.add(`${u.origin}/e/${id}`)
          out.add(`${u.origin}/d/${id}`)
        }
      }
    }

    if (/voe/i.test(u.hostname) && !path.includes('/e/')) {
      const id = path.split('/').filter(Boolean).pop()
      if (id) out.add(`${u.origin}/e/${id}`)
    }

    if (/streamtape/i.test(u.hostname) && path.includes('/v/')) {
      out.add(embedUrl.replace('/v/', '/e/'))
    }

    if (/vidzy/i.test(u.hostname) && !path.includes('/e/')) {
      const id = path.split('/').filter(Boolean).pop()
      if (id) out.add(`${u.origin}/e/${id}`)
    }

    if (/filmoon/i.test(u.hostname) && !path.includes('/e/')) {
      const id = path.split('/').filter(Boolean).pop()
      if (id) out.add(`${u.origin}/e/${id}`)
    }
  } catch {
    /* ignore */
  }
  return [...out]
}
