'use client'

import { useEffect, useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cacheVideoBlob, triggerFileDownload } from '@/lib/offline-media'
import { useOnlineStatus } from '@/lib/use-online-status'

type Props = {
  embedUrl: string
  pageUrl: string
  title?: string
  label?: string
  className?: string
}

export function StreamingDownloadButton({
  embedUrl,
  pageUrl,
  title,
  label = 'Télécharger',
  className,
}: Props) {
  const online = useOnlineStatus()
  const [ytDlpReady, setYtDlpReady] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!online) {
      setYtDlpReady(false)
      return
    }
    let cancelled = false
    fetch('/api/streaming-download/status')
      .then((r) => r.json())
      .then((d: { available?: boolean }) => {
        if (!cancelled) setYtDlpReady(Boolean(d.available))
      })
      .catch(() => {
        if (!cancelled) setYtDlpReady(false)
      })
    return () => {
      cancelled = true
    }
  }, [online])

  const handleDownload = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/streaming-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embedUrl,
          pageUrl,
          title: title || undefined,
        }),
      })

      const contentType = res.headers.get('content-type') ?? ''

      if (!res.ok || contentType.includes('application/json')) {
        let message = 'Le téléchargement a échoué.'
        try {
          const data = (await res.json()) as {
            error?: string
            hint?: string
          }
          message = [data.error, data.hint].filter(Boolean).join(' ') || message
        } catch {
          message = `Erreur serveur (${res.status}).`
        }
        setError(message)
        return
      }

      const blob = await res.blob()
      if (blob.size < 1024) {
        setError('Fichier reçu trop petit — le téléchargement a probablement échoué.')
        return
      }

      const disposition = res.headers.get('content-disposition') ?? ''
      const filenameMatch =
        /filename\*=UTF-8''([^;]+)|filename="([^"]+)"/i.exec(disposition)
      const rawName = filenameMatch
        ? decodeURIComponent(filenameMatch[1] || filenameMatch[2] || '')
        : ''
      const filename = rawName || `${(title || 'video').replace(/\s+/g, '_')}.mp4`

      try {
        await cacheVideoBlob({
          pageUrl,
          title: title || filename.replace(/\.[^.]+$/, ''),
          blob,
          mimeType: blob.type || contentType,
        })
        toast.success('Vidéo enregistrée pour lecture hors ligne')
      } catch {
        toast.warning('Téléchargement OK, mais l’enregistrement local a échoué.')
      }

      triggerFileDownload(blob, filename)
    } catch {
      setError('Impossible de contacter le serveur. Réessayez dans quelques instants.')
    } finally {
      setLoading(false)
    }
  }

  if (!online) {
    return (
      <p className="text-xs text-muted-foreground">
        Hors ligne — utilisez une vidéo déjà téléchargée.
      </p>
    )
  }

  if (ytDlpReady === null) {
    return (
      <Button type="button" variant="secondary" disabled className="gap-2">
        <Loader2 className="size-4 animate-spin opacity-50" aria-hidden />
        Vérification…
      </Button>
    )
  }

  if (!ytDlpReady) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button type="button" variant="secondary" disabled className="gap-2">
          <Download className="size-4 opacity-50" aria-hidden />
          Téléchargement (yt-dlp requis)
        </Button>
        <p className="max-w-xs text-right text-[10px] text-muted-foreground">
          Installez ffmpeg (VIDZY) :{' '}
          <code className="rounded bg-muted px-1">winget install ffmpeg</code>
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        type="button"
        disabled={loading}
        onClick={handleDownload}
        className={
          className ??
          'gap-2 bg-primary text-primary-foreground shadow-[0_0_24px_oklch(0.7_0.15_180/0.35)] hover:bg-primary/90'
        }
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Téléchargement…
          </>
        ) : (
          <>
            <Download className="size-4" aria-hidden />
            {label}
          </>
        )}
      </Button>
      {loading && (
        <p className="max-w-xs text-right text-[10px] text-muted-foreground">
          Peut prendre plusieurs minutes (HLS / VIDZY).
        </p>
      )}
      {!loading && (
        <p className="max-w-xs text-right text-[10px] text-muted-foreground">
          Conservée sur cet appareil pour le mode hors ligne.
        </p>
      )}
      {error && (
        <p className="max-w-sm text-right text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
