'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Info, Plus, Check, Volume2, VolumeX, ChevronLeft, ChevronRight } from 'lucide-react'
import { Content } from '@/lib/data'
import { useApp } from '@/lib/context'
import { Button } from '@/components/ui/button'

interface HeroBannerProps {
  contents: Content[]
  autoPlay?: boolean
  interval?: number
}

export function HeroBanner({ contents, autoPlay = true, interval = 8000 }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isMuted, setIsMuted] = useState(true)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const { isInWatchlist, addToWatchlist, removeFromWatchlist, isAuthenticated } = useApp()

  const currentContent = contents[currentIndex]
  const inWatchlist = currentContent ? isInWatchlist(currentContent.id) : false

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % contents.length)
    setIsVideoLoaded(false)
  }, [contents.length])

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + contents.length) % contents.length)
    setIsVideoLoaded(false)
  }, [contents.length])

  useEffect(() => {
    if (!autoPlay) return
    const timer = setInterval(goToNext, interval)
    return () => clearInterval(timer)
  }, [autoPlay, interval, goToNext])

  const handleWatchlistClick = () => {
    if (!isAuthenticated) {
      window.location.href = '/login'
      return
    }
    if (inWatchlist) {
      removeFromWatchlist(currentContent.id)
    } else {
      addToWatchlist(currentContent.id)
    }
  }

  if (!currentContent) return null

  return (
    <section className="relative h-[70vh] md:h-[85vh] lg:h-screen overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentContent.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          {/* Background Video or Image */}
          {currentContent.trailerUrl && isVideoLoaded ? (
            <video
              src={currentContent.trailerUrl}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              onLoadedData={() => setIsVideoLoaded(true)}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <img
              src={currentContent.backdrop}
              alt={currentContent.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Load video in background */}
          {currentContent.trailerUrl && !isVideoLoaded && (
            <video
              src={currentContent.trailerUrl}
              muted
              preload="auto"
              onCanPlay={() => setIsVideoLoaded(true)}
              className="hidden"
            />
          )}

          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="max-w-[1800px] mx-auto px-4 md:px-8 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentContent.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-2xl"
            >
              {/* Badges */}
              <div className="flex items-center gap-2 mb-4">
                {currentContent.isNew && (
                  <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded">
                    NOUVEAU
                  </span>
                )}
                {currentContent.isTrending && (
                  <span className="px-3 py-1 bg-destructive/80 text-destructive-foreground text-xs font-semibold rounded">
                    #1 TENDANCE
                  </span>
                )}
                <span className="text-sm text-muted-foreground">
                  {currentContent.type === 'movie' ? 'Film' : 'Série'}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-balance">
                {currentContent.title}
              </h1>

              {/* Meta */}
              <div className="flex items-center gap-3 mb-4 text-sm">
                {currentContent.matchScore && (
                  <span className="text-primary font-semibold">{currentContent.matchScore}% Match</span>
                )}
                <span>{currentContent.year}</span>
                {currentContent.duration && <span>{currentContent.duration}</span>}
                {currentContent.seasons && (
                  <span>
                    {currentContent.seasons} saison{currentContent.seasons > 1 ? 's' : ''}
                  </span>
                )}
                <span className="px-1.5 border border-muted-foreground/50 rounded text-xs">
                  {currentContent.rating}
                </span>
              </div>

              {/* Description */}
              <p className="text-base md:text-lg text-muted-foreground mb-6 line-clamp-3 text-pretty">
                {currentContent.description}
              </p>

              {/* Genres */}
              <div className="flex flex-wrap gap-2 mb-6">
                {currentContent.genres.map((genre) => (
                  <span
                    key={genre}
                    className="px-3 py-1 bg-secondary/50 text-sm rounded-full"
                  >
                    {genre}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Link href={`/watch/${currentContent.id}`}>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="lg" className="gap-2 bg-foreground text-background hover:bg-foreground/90 font-semibold px-8">
                      <Play className="w-5 h-5 fill-current" />
                      Regarder
                    </Button>
                  </motion.div>
                </Link>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link href={`/watch/${currentContent.id}`}>
                    <Button size="lg" variant="secondary" className="gap-2 bg-secondary/80 hover:bg-secondary">
                      <Info className="w-5 h-5" />
                      Plus d&apos;infos
                    </Button>
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-12 h-12 p-0 rounded-full border-foreground/30 hover:border-foreground bg-background/20"
                    onClick={handleWatchlistClick}
                  >
                    {inWatchlist ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-8 right-4 md:right-8 flex items-center gap-3">
        {/* Volume Toggle */}
        {currentContent.trailerUrl && (
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="sm"
              variant="outline"
              className="w-10 h-10 p-0 rounded-full border-foreground/30 bg-background/20"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
          </motion.div>
        )}

        {/* Navigation Arrows */}
        <div className="flex items-center gap-2">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="sm"
              variant="outline"
              className="w-10 h-10 p-0 rounded-full border-foreground/30 bg-background/20"
              onClick={goToPrev}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="sm"
              variant="outline"
              className="w-10 h-10 p-0 rounded-full border-foreground/30 bg-background/20"
              onClick={goToNext}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>

        {/* Rating Badge */}
        <div className="px-3 py-1 border border-foreground/30 bg-background/20 text-sm">
          {currentContent.rating}
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {contents.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentIndex(index)
              setIsVideoLoaded(false)
            }}
            className={`h-1 rounded-full transition-all ${
              index === currentIndex
                ? 'w-8 bg-primary'
                : 'w-2 bg-foreground/30 hover:bg-foreground/50'
            }`}
          />
        ))}
      </div>
    </section>
  )
}
