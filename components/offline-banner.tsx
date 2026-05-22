'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { CloudOff, Download } from 'lucide-react'
import { useOnlineStatus } from '@/lib/use-online-status'
import { Button } from '@/components/ui/button'

export function OfflineBanner() {
  const online = useOnlineStatus()

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="fixed left-0 right-0 top-16 z-[60] border-b border-amber-500/30 bg-amber-950/90 px-4 py-2.5 text-amber-50 backdrop-blur-md md:top-20"
          role="status"
        >
          <motion.div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-center gap-3 text-center text-sm">
            <CloudOff className="size-4 shrink-0" aria-hidden />
            <span>
              Mode hors ligne — l&apos;analyse d&apos;URL est indisponible. Consultez
              vos playlists et vidéos téléchargées.
            </span>
            <Button
              asChild
              size="sm"
              variant="secondary"
              className="h-8 gap-1.5 border-amber-500/20 bg-amber-900/50 text-amber-50 hover:bg-amber-900/70"
            >
              <Link href="/offline">
                <Download className="size-3.5" aria-hidden />
                Bibliothèque hors ligne
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
