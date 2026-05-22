'use client'

import { useEffect, useState } from 'react'
import { getOfflineVideoByPageUrl } from '@/lib/offline-media'

export function useOfflinePlayback(pageUrl: string | undefined) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [hasOffline, setHasOffline] = useState(false)
  const [loading, setLoading] = useState(Boolean(pageUrl))

  useEffect(() => {
    if (!pageUrl) {
      setObjectUrl(null)
      setHasOffline(false)
      setLoading(false)
      return
    }

    let revoked = false
    let url: string | null = null
    setLoading(true)

    void getOfflineVideoByPageUrl(pageUrl).then((record) => {
      if (revoked) return
      if (record?.blob.size) {
        url = URL.createObjectURL(record.blob)
        setObjectUrl(url)
        setHasOffline(true)
      } else {
        setObjectUrl(null)
        setHasOffline(false)
      }
      setLoading(false)
    })

    return () => {
      revoked = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [pageUrl])

  return { objectUrl, hasOffline, loading }
}
