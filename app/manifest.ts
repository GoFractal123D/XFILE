import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'XFILE — Streaming & hors ligne',
    short_name: 'XFILE',
    description:
      'Analysez, sauvegardez et regardez vos vidéos — même sans connexion Internet.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#0a0a14',
    theme_color: '#0a0a14',
    lang: 'fr',
    categories: ['entertainment', 'video'],
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  }
}
