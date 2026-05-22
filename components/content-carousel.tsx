'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Content } from '@/lib/data'
import { ContentCard, ContentCardSkeleton } from './content-card'

interface ContentCarouselProps {
  title: string
  contents: Content[]
  size?: 'default' | 'large' | 'wide'
  showIndex?: boolean
  isLoading?: boolean
}

export function ContentCarousel({
  title,
  contents,
  size = 'default',
  showIndex = false,
  isLoading = false,
}: ContentCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const scrollAmount = scrollRef.current.clientWidth * 0.8
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setShowLeftArrow(scrollLeft > 10)
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10)
  }

  if (contents.length === 0 && !isLoading) return null

  return (
    <section className="relative group/carousel">
      {/* Title */}
      <div className="px-4 md:px-8 mb-3 md:mb-4">
        <h2 className="text-lg md:text-xl font-semibold">{title}</h2>
      </div>

      {/* Carousel Container */}
      <div className="relative">
        {/* Left Arrow */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: showLeftArrow ? 1 : 0 }}
          whileHover={{ scale: 1.1 }}
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-10 w-12 md:w-16 bg-gradient-to-r from-background via-background/80 to-transparent flex items-center justify-start pl-2 opacity-0 group-hover/carousel:opacity-100 transition-opacity"
          style={{ display: showLeftArrow ? 'flex' : 'none' }}
        >
          <div className="p-2 bg-secondary/80 rounded-full backdrop-blur-sm">
            <ChevronLeft className="w-5 h-5" />
          </div>
        </motion.button>

        {/* Scrollable Content */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-3 md:gap-4 overflow-x-auto hide-scrollbar px-4 md:px-8 pb-4"
        >
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <ContentCardSkeleton key={i} size={size} />
              ))
            : contents.map((content, index) => (
                <div key={content.id} className="relative">
                  {showIndex && (
                    <div className="absolute -left-4 bottom-0 text-[120px] md:text-[160px] font-bold leading-none text-foreground/10 -z-10 select-none">
                      {index + 1}
                    </div>
                  )}
                  <ContentCard content={content} index={index} size={size} />
                </div>
              ))}
        </div>

        {/* Right Arrow */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: showRightArrow ? 1 : 0 }}
          whileHover={{ scale: 1.1 }}
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-10 w-12 md:w-16 bg-gradient-to-l from-background via-background/80 to-transparent flex items-center justify-end pr-2 opacity-0 group-hover/carousel:opacity-100 transition-opacity"
          style={{ display: showRightArrow ? 'flex' : 'none' }}
        >
          <div className="p-2 bg-secondary/80 rounded-full backdrop-blur-sm">
            <ChevronRight className="w-5 h-5" />
          </div>
        </motion.button>
      </div>
    </section>
  )
}
