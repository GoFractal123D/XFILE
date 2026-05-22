'use client'

import { motion } from 'framer-motion'
import { Clock, Play, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useApp } from '@/lib/context'
import { Button } from '@/components/ui/button'

export default function HistoryPage() {
  const { getHistoryContents, isAuthenticated, history } = useApp()
  const historyContents = getHistoryContents()

  const formatProgress = (progress: number, duration: number) => {
    if (duration === 0) return '0%'
    const percent = Math.round((progress / duration) * 100)
    return `${percent}%`
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}min`
    }
    return `${minutes}min`
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-24 md:pt-28 pb-12 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Clock className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-4">Connectez-vous pour voir votre historique</h1>
          <p className="text-muted-foreground mb-6">
            Reprenez là où vous vous êtes arrêté avec votre historique de lecture.
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
            <Clock className="w-8 h-8 text-primary" />
            Historique
          </h1>
          <p className="text-muted-foreground">
            {historyContents.length} titre{historyContents.length !== 1 ? 's' : ''} dans votre historique
          </p>
        </motion.div>

        {historyContents.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            {historyContents.map((content, index) => (
              <motion.div
                key={content.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group"
              >
                <Link href={`/watch/${content.id}`}>
                  <div className="flex gap-4 p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors">
                    {/* Thumbnail */}
                    <div className="relative w-32 md:w-48 aspect-video rounded overflow-hidden shrink-0">
                      <img
                        src={content.backdrop}
                        alt={content.title}
                        className="w-full h-full object-cover"
                      />
                      {/* Progress Bar */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: content.duration > 0
                              ? `${(content.progress / content.duration) * 100}%`
                              : '0%',
                          }}
                        />
                      </div>
                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 flex items-center justify-center bg-primary rounded-full">
                          <Play className="w-5 h-5 fill-primary-foreground text-primary-foreground ml-0.5" />
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                        {content.title}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                        <span>{content.year}</span>
                        <span>{content.type === 'movie' ? 'Film' : 'Série'}</span>
                        <span className="px-1 border border-muted-foreground/50 rounded text-xs">
                          {content.rating}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {content.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-primary font-medium">
                          {content.duration > 0
                            ? `${formatTime(content.progress)} regardé`
                            : 'Commencé'}
                        </span>
                        {content.duration > 0 && (
                          <span className="text-muted-foreground">
                            {formatProgress(content.progress, content.duration)} terminé
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Clock className="w-16 h-16 mx-auto mb-6 text-muted-foreground/50" />
            <h2 className="text-xl font-semibold mb-2">Votre historique est vide</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Commencez à regarder des films et séries pour les retrouver ici.
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
