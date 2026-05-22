'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cacheVideoBlob, triggerFileDownload } from '@/lib/offline-media'

type Props = {
  href: string
  label?: string
  className?: string
  /** Si fourni, enregistre aussi la vidéo pour lecture hors ligne. */
  offlinePageUrl?: string
  offlineTitle?: string
}

export function VideoDownloadButton({
  href,
  label = 'Télécharger',
  className,
  offlinePageUrl,
  offlineTitle,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(href)
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
        setError(
          'Fichier reçu trop petit — la vidéo n’a probablement pas pu être récupérée.',
        )
        return
      }

      const disposition = res.headers.get('content-disposition') ?? ''
      const filenameMatch =
        /filename\*=UTF-8''([^;]+)|filename="([^"]+)"/i.exec(disposition)
      const rawName = filenameMatch
        ? decodeURIComponent(filenameMatch[1] || filenameMatch[2] || '')
        : ''

      let filename = rawName || 'video.mp4'
      if (!/\.(mp4|webm|ogg)$/i.test(filename)) {
        const ext = contentType.includes('webm') ? 'webm' : 'mp4'
        filename = `video.${ext}`
      }

      if (offlinePageUrl) {
        try {
          await cacheVideoBlob({
            pageUrl: offlinePageUrl,
            title: offlineTitle || filename.replace(/\.[^.]+$/, ''),
            blob,
            mimeType: blob.type || contentType,
          })
          toast.success('Vidéo enregistrée pour lecture hors ligne')
        } catch {
          toast.warning('Téléchargement OK, mais l’enregistrement local a échoué.')
        }
      }

      triggerFileDownload(blob, filename)
    } catch {
      setError(
        'Impossible de contacter le serveur. Vérifiez votre connexion et réessayez.',
      )
    } finally {
      setLoading(false)
    }
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
            Préparation…
          </>
        ) : (
          <>
            <Download className="size-4" aria-hidden />
            {label}
          </>
        )}
      </Button>
      {offlinePageUrl && !loading && (
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
