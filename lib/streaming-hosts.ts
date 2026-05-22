/** Hébergeurs affichés sur la plupart des sites de streaming FR. */
export const PRIMARY_STREAMING_HOSTS = [
  {
    id: 'vidzy',
    label: 'VIDZY',
    patterns: [/vidzy\./i, /vidzy\.net/i],
  },
  {
    id: 'uqload',
    label: 'UQLOAD',
    patterns: [/uqload\./i, /uqload\.io/i, /uqload\.cx/i],
  },
  {
    id: 'dood',
    label: 'DOOD',
    patterns: [/dood(?:stream)?\./i, /ds2play/i, /d000d/i, /dood\.wf/i],
  },
  {
    id: 'voe',
    label: 'VOE',
    patterns: [/\bvoe\./i, /voe\.sx/i, /jilliandescribe/i],
  },
  {
    id: 'filmoon',
    label: 'FILMOON',
    patterns: [/filmoon\./i, /filmoon\.online/i],
  },
] as const

export type PrimaryHostId = (typeof PRIMARY_STREAMING_HOSTS)[number]['id']

const EXTRA_HOST_RULES: { pattern: RegExp; label: string; host: string }[] = [
  { pattern: /streamtape\./i, label: 'STREAMTAPE', host: 'streamtape' },
  { pattern: /mixdrop\./i, label: 'MIXDROP', host: 'mixdrop' },
  { pattern: /vidmoly\./i, label: 'VIDMOLY', host: 'vidmoly' },
  { pattern: /filemoon\./i, label: 'FILEMOON', host: 'filemoon' },
  { pattern: /supervideo\./i, label: 'SUPERVIDEO', host: 'supervideo' },
]

export function classifyStreamingHost(url: string): {
  label: string
  host: string
} | null {
  for (const h of PRIMARY_STREAMING_HOSTS) {
    if (h.patterns.some((p) => p.test(url))) {
      return { label: h.label, host: h.id }
    }
  }
  for (const rule of EXTRA_HOST_RULES) {
    if (rule.pattern.test(url)) {
      return { label: rule.label, host: rule.host }
    }
  }
  return null
}

export function hostOrderIndex(host: string): number {
  const i = PRIMARY_STREAMING_HOSTS.findIndex((h) => h.id === host)
  return i === -1 ? 99 : i
}

export function sortStreamingSources<
  T extends { host: string; label: string },
>(sources: T[]): T[] {
  return [...sources].sort(
    (a, b) => hostOrderIndex(a.host) - hostOrderIndex(b.host),
  )
}

export function primaryHostLabels(): string[] {
  return PRIMARY_STREAMING_HOSTS.map((h) => h.label)
}
