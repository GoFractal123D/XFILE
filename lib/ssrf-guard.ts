/** Bloque les hôtes évidents pour limiter les abus (SSRF). */

function isIpv4Private(hostname: string): boolean {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname)
  if (!m) return false
  const a = Number(m[1])
  const b = Number(m[2])
  if (a === 10) return true
  if (a === 127) return true
  if (a === 0) return true
  if (a === 169 && b === 254) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 100 && b >= 64 && b <= 127) return true
  return false
}

export function assertFetchablePublicUrl(raw: string): URL {
  let u: URL
  try {
    u = new URL(raw)
  } catch {
    throw new Error('URL invalide')
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error('Seuls les schémas http et https sont autorisés')
  }
  const host = u.hostname.toLowerCase()
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host === '0.0.0.0' ||
    host.endsWith('.internal') ||
    host.endsWith('.local')
  ) {
    throw new Error('Hôte non autorisé')
  }
  if (isIpv4Private(host)) {
    throw new Error('Adresse non routable sur Internet')
  }
  return u
}
