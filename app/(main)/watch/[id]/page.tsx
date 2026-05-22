'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Play,
  Plus,
  Check,
  Share2,
  ThumbsUp,
  Calendar,
  Clock,
  Star,
  Tv,
  Film,
  Users,
} from 'lucide-react'
import { getContentById, contents, Content } from '@/lib/data'
import { useApp } from '@/lib/context'
import { VideoPlayer } from '@/components/video-player'
import { ContentCarousel } from '@/components/content-carousel'
import { Button } from '@/components/ui/button'

interface WatchPageProps {
  params: Promise<{ id: string }>
}

export default function WatchPage({ params }: WatchPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [content, setContent] = useState<Content | null>(null)
  const [isPlayerOpen, setIsPlayerOpen] = useState(false)
  const [selectedSeason, setSelectedSeason] = useState(1)
  const { isInWatchlist, addToWatchlist, removeFromWatchlist, addToHistory, isAuthenticated } = useApp()

  useEffect(() => {
    const found = getContentById(id)
    if (found) {
      setContent(found)
    }
  }, [id])

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full skeleton" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  const inWatchlist = isInWatchlist(content.id)

  const handleWatchlistClick = () => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    if (inWatchlist) {
      removeFromWatchlist(content.id)
    } else {
      addToWatchlist(content.id)
    }
  }

  const handlePlay = () => {
    if (content.videoUrl) {
      setIsPlayerOpen(true)
      if (isAuthenticated) {
        addToHistory({
          contentId: content.id,
          progress: 0,
          duration: 0,
        })
      }
    }
  }

  const handlePlayerProgress = (progress: number, duration: number) => {
    if (isAuthenticated && progress > 0) {
      addToHistory({
        contentId: content.id,
        progress,
        duration,
      })
    }
  }

  const similarContent = contents
    .filter(
      (c) =>
        c.id !== content.id &&
        c.genres.some((g) => content.genres.includes(g))
    )
    .slice(0, 10)

  // Generate mock episodes for series
  const episodes = content.type === 'series' && content.episodes
    ? Array.from({ length: Math.ceil(content.episodes / (content.seasons || 1)) }, (_, i) => ({
        number: i + 1,
        title: `Épisode ${i + 1}`,
        duration: `${45 + Math.floor(Math.random() * 20)}min`,
        description: `Un épisode captivant de ${content.title} qui vous tiendra en haleine.`,
        thumbnail: content.thumbnail,
      }))
    : []

  if (isPlayerOpen && content.videoUrl) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <VideoPlayer
          src={content.videoUrl}
          poster={content.backdrop}
          title={content.title}
          onBack={() => setIsPlayerOpen(false)}
          onProgress={handlePlayerProgress}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section with Backdrop */}
      <div className="relative h-[70vh] md:h-[80vh]">
        <div className="absolute inset-0">
          <img
            src={content.backdrop}
            alt={content.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        </div>

        {/* Content */}
        <div className="absolute inset-0 flex items-end pb-12 md:pb-20">
          <div className="max-w-[1800px] mx-auto px-4 md:px-8 w-full">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Poster */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="hidden md:block w-64 shrink-0"
              >
                <img
                  src={content.thumbnail}
                  alt={content.title}
                  className="w-full rounded-lg shadow-2xl"
                />
              </motion.div>

              {/* Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex-1 max-w-2xl"
              >
                {/* Badges */}
                <div className="flex items-center gap-2 mb-4">
                  {content.isNew && (
                    <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded">
                      NOUVEAU
                    </span>
                  )}
                  {content.isTrending && (
                    <span className="px-3 py-1 bg-destructive text-destructive-foreground text-xs font-semibold rounded">
                      TENDANCE
                    </span>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-balance">
                  {content.title}
                </h1>

                {content.originalTitle && content.originalTitle !== content.title && (
                  <p className="text-lg text-muted-foreground mb-4">{content.originalTitle}</p>
                )}

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
                  {content.matchScore && (
                    <div className="flex items-center gap-1 text-primary">
                      <ThumbsUp className="w-4 h-4" />
                      <span className="font-semibold">{content.matchScore}% Match</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{content.year}</span>
                  </div>
                  {content.duration && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{content.duration}</span>
                    </div>
                  )}
                  {content.seasons && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Tv className="w-4 h-4" />
                      <span>{content.seasons} saison{content.seasons > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  <span className="px-2 py-0.5 border border-muted-foreground/50 rounded text-xs">
                    {content.rating}
                  </span>
                </div>

                {/* Genres */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {content.genres.map((genre) => (
                    <span
                      key={genre}
                      className="px-3 py-1.5 bg-secondary/70 text-sm rounded-full"
                    >
                      {genre}
                    </span>
                  ))}
                </div>

                {/* Description */}
                <p className="text-base md:text-lg text-muted-foreground mb-8 leading-relaxed">
                  {content.description}
                </p>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      size="lg"
                      onClick={handlePlay}
                      className="gap-2 bg-foreground text-background hover:bg-foreground/90 font-semibold px-8"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      Regarder
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      size="lg"
                      variant="secondary"
                      onClick={handleWatchlistClick}
                      className="gap-2"
                    >
                      {inWatchlist ? (
                        <>
                          <Check className="w-5 h-5" />
                          Dans ma liste
                        </>
                      ) : (
                        <>
                          <Plus className="w-5 h-5" />
                          Ma liste
                        </>
                      )}
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                    <Button size="lg" variant="outline" className="w-12 h-12 p-0 rounded-full">
                      <Share2 className="w-5 h-5" />
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-12 space-y-12">
        {/* Cast & Crew */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Distribution
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {content.cast.map((actor, index) => (
              <div
                key={index}
                className="p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                <p className="font-medium text-sm">{actor}</p>
              </div>
            ))}
            {content.director && (
              <div className="p-4 bg-card rounded-lg border border-border">
                <p className="text-xs text-muted-foreground mb-1">Réalisateur</p>
                <p className="font-medium text-sm">{content.director}</p>
              </div>
            )}
          </div>
        </motion.section>

        {/* Episodes (for series) */}
        {content.type === 'series' && episodes.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Épisodes</h2>
              {content.seasons && content.seasons > 1 && (
                <div className="flex items-center gap-2">
                  {Array.from({ length: content.seasons }, (_, i) => (
                    <Button
                      key={i}
                      variant={selectedSeason === i + 1 ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedSeason(i + 1)}
                    >
                      Saison {i + 1}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-3">
              {episodes.map((episode) => (
                <motion.div
                  key={episode.number}
                  whileHover={{ scale: 1.01 }}
                  className="flex gap-4 p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer group"
                  onClick={handlePlay}
                >
                  <div className="relative w-40 aspect-video rounded overflow-hidden shrink-0">
                    <img
                      src={episode.thumbnail}
                      alt={episode.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-8 h-8 fill-white text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium">
                        {episode.number}. {episode.title}
                      </h3>
                      <span className="text-sm text-muted-foreground">{episode.duration}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{episode.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Similar Content */}
        {similarContent.length > 0 && (
          <ContentCarousel title="Titres similaires" contents={similarContent} />
        )}
      </div>
    </div>
  )
}
