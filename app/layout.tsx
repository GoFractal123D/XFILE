import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { PwaProvider } from '@/components/pwa-provider'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'XFILE | Premium Streaming',
  description: 'Experience cinema like never before. Premium streaming platform with exclusive films and series.',
  generator: 'v0.app',
  keywords: ['streaming', 'movies', 'series', 'cinema', 'premium', 'entertainment'],
  authors: [{ name: 'XFILE' }],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'XFILE',
  },
  applicationName: 'XFILE',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0a14',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className="bg-background">
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-background text-foreground`}>
        <PwaProvider>{children}</PwaProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
