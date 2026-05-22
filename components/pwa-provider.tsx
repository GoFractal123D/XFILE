'use client'

import { useEffect } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { OfflineBanner } from '@/components/offline-banner'

export function PwaProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      } catch {
        // Registration can fail on insecure origins or unsupported browsers.
      }
    }

    if (document.readyState === 'complete') {
      void register()
    } else {
      window.addEventListener('load', register, { once: true })
    }
  }, [])

  return (
    <>
      {children}
      <OfflineBanner />
      <Toaster richColors position="top-center" />
    </>
  )
}
