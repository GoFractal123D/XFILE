'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Play, Plus, Check, Info } from 'lucide-react'
import { Content } from '@/lib/data'
import { useApp } from '@/lib/context'
import { Button } from '@/components/ui/button'

interface ContentCardProps {
  content: Content
  index?: number
  size?: 'default' | 'large' | 'wide'
}

export function ContentCard({ content, index = 0, size = 'default' }: ContentCardProps) {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist, isAuthenticated } = useApp()
  const inWatchlist = isInWatchlist(content.id)

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      window.location.href = '/login'
      return
    }
    if (inWatchlist) {
      removeFromWatchlist(content.id)
    } else {
      addToWatchlist(content.id)
    }
  }

  const sizeClasses = {
    default: 'w-[160px] md:w-[200px] aspect-[2/3]',
    large: 'w-[200px] md:w-[280px] aspect-[2/3]',
    wide: 'w-[280px] md:w-[400px] aspect-video',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className={`relative group shrink-0 ${sizeClasses[size]}`}
    >
      <Link href={`/watch/${content.id}`} className="block h-full">
        <div className="relative h-full rounded-lg overflow-hidden video-card-hover">
          {/* Image */}
          <img
            src={size === 'wide' ? content.backdrop : content.thumbnail}
            alt={content.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex gap-1">
            {content.isNew && (
              <span className="px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-semibold rounded">
                NOUVEAU
              </span>
            )}
            {content.isTrending && (
              <span className="px-2 py-0.5 bg-destructive text-destructive-foreground text-[10px] font-semibold rounded">
                TENDANCE
              </span>
            )}
          </div>

          {/* Hover Content */}
          <div className="absolute inset-0 p-3 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {/* Quick Actions */}
            <div className="flex items-center gap-2 mb-2">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full bg-foreground text-background hover:bg-foreground/90"
                >
                  <Play className="w-4 h-4 fill-current" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 rounded-full border-foreground/50 hover:border-foreground bg-background/50"
                  onClick={handleWatchlistClick}
                >
                  {inWatchlist ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Link href={`/watch/${content.id}`}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 rounded-full border-foreground/50 hover:border-foreground bg-background/50"
                  >
                    <Info className="w-4 h-4" />
                  </Button>
                </Link>
              </motion.div>
            </div>

            {/* Info */}
            <h3 className="font-semibold text-sm line-clamp-1 text-foreground">{content.title}</h3>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
              {content.matchScore && (
                <span className="text-primary font-medium">{content.matchScore}% Match</span>
              )}
              <span>{content.year}</span>
              <span className="px-1 border border-muted-foreground/50 rounded text-[9px]">
                {content.rating}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
              {content.genres.slice(0, 2).map((genre, i) => (
                <span key={genre}>
                  {genre}
                  {i < 1 && content.genres.length > 1 && ' •'}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export function ContentCardSkeleton({ size = 'default' }: { size?: 'default' | 'large' | 'wide' }) {
  const sizeClasses = {
    default: 'w-[160px] md:w-[200px] aspect-[2/3]',
    large: 'w-[200px] md:w-[280px] aspect-[2/3]',
    wide: 'w-[280px] md:w-[400px] aspect-video',
  }

  return (
    <div className={`shrink-0 ${sizeClasses[size]} rounded-lg skeleton`} />
  )
}
