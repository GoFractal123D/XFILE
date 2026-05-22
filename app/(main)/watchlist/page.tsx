'use client'

import { motion } from 'framer-motion'
import { Heart, Trash2 } from 'lucide-react'
import { useApp } from '@/lib/context'
import { ContentCard } from '@/components/content-card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function WatchlistPage() {
  const { getWatchlistContents, removeFromWatchlist, isAuthenticated } = useApp()
  const watchlistContents = getWatchlistContents()

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-24 md:pt-28 pb-12 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Heart className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-4">Connectez-vous pour voir votre liste</h1>
          <p className="text-muted-foreground mb-6">
            Créez votre liste personnalisée de films et séries à regarder plus tard.
          </p>
          <Link href="/login">
            <Button size="lg" className="bg-primary text-primary-foreground">
              Se connecter
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 md:pt-28 pb-12">
      <div className="max-w-[1800px] mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-4 flex items-center gap-3">
            <Heart className="w-8 h-8 text-primary" />
            Ma Liste
          </h1>
          <p className="text-muted-foreground">
            {watchlistContents.length} titre{watchlistContents.length !== 1 ? 's' : ''} dans votre liste
          </p>
        </motion.div>

        {watchlistContents.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6"
          >
            {watchlistContents.map((content, index) => (
              <div key={content.id} className="relative group">
                <ContentCard content={content} index={index} />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => removeFromWatchlist(content.id)}
                  className="absolute top-2 right-2 p-2 bg-destructive/80 hover:bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Heart className="w-16 h-16 mx-auto mb-6 text-muted-foreground/50" />
            <h2 className="text-xl font-semibold mb-2">Votre liste est vide</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Ajoutez des films et séries à votre liste pour les retrouver facilement et les regarder plus tard.
            </p>
            <Link href="/">
              <Button variant="outline">Retour à l&apos;accueil</Button>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  )
}
