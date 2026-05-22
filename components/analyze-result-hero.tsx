'use client'

import { Film } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  title: string
  titleId?: string
  description?: string
  thumbnailUrl?: string
  hint?: string
  actions?: React.ReactNode
  className?: string
}

export function AnalyzeResultHero({
  title,
  titleId,
  description,
  thumbnailUrl,
  hint,
  actions,
  className,
}: Props) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 gap-4">
        {thumbnailUrl ? (
          <div className="relative size-28 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-muted/30 shadow-md sm:size-36 md:size-40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnailUrl}
              alt=""
              className="size-full object-cover"
            />
          </div>
        ) : (
          <div className="flex size-28 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-primary/10 text-primary sm:size-36">
            <Film className="size-10" aria-hidden />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2
            id={titleId}
            className="text-lg font-semibold tracking-tight md:text-xl"
          >
            {title}
          </h2>
          {hint ? (
            <p className="mt-1 text-xs text-primary/80 md:text-sm">{hint}</p>
          ) : null}
          {description ? (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  )
}
