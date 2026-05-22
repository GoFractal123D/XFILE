import type { DetectedVideo } from '@/lib/video-extract'
import type { StreamingSource } from '@/lib/streaming-embeds'
import type { SeriesEpisode } from '@/lib/series-episodes'

export type { StreamingSource, SeriesEpisode }

/** Métadonnées affichées (affiche + synopsis) quand disponibles. */
export type AnalyzeMediaFields = {
  title?: string
  description?: string
  thumbnailUrl?: string
  hint?: string
}

export type AnalyzeSuccessResponse =
  | ({
      ok: true
      pageUrl: string
      kind: 'direct'
      videoUrl: string
      downloadable: true
    } & AnalyzeMediaFields)
  | ({
      ok: true
      pageUrl: string
      kind: 'hls'
      playlistUrl: string
      downloadable: false
    } & AnalyzeMediaFields)
  | ({
      ok: true
      pageUrl: string
      kind: 'embed-youtube'
      embedUrl: string
      downloadable: true
    } & AnalyzeMediaFields)
  | ({
      ok: true
      pageUrl: string
      kind: 'embed-vimeo'
      embedUrl: string
      downloadable: false
    } & AnalyzeMediaFields)
  | ({
      ok: true
      pageUrl: string
      kind: 'streaming'
      sources: StreamingSource[]
      downloadable: true
    } & AnalyzeMediaFields)
  | ({
      ok: true
      pageUrl: string
      kind: 'series-catalog'
      episodes: SeriesEpisode[]
      downloadable: false
    } & AnalyzeMediaFields)

export type ResolveSuccessResponse =
  | {
      ok: true
      kind: 'direct'
      videoUrl: string
      title?: string
      sourceLabel: string
      downloadable: true
    }
  | {
      ok: true
      kind: 'hls'
      playlistUrl: string
      title?: string
      sourceLabel: string
      downloadable: false
    }

export type ResolveErrorResponse = {
  ok: false
  error: string
  hint?: string
}

export type ResolveResponse = ResolveSuccessResponse | ResolveErrorResponse

export type AnalyzeErrorResponse = {
  ok: false
  error: string
  pageUrl?: string
}

export type AnalyzeResponse = AnalyzeSuccessResponse | AnalyzeErrorResponse

export function detectionToResponse(
  d: DetectedVideo,
  pageUrl: string,
): AnalyzeSuccessResponse {
  switch (d.kind) {
    case 'direct':
      return {
        ok: true,
        pageUrl,
        kind: 'direct',
        videoUrl: d.videoUrl,
        title: d.title,
        hint: d.hint,
        downloadable: true,
      }
    case 'hls':
      return {
        ok: true,
        pageUrl,
        kind: 'hls',
        playlistUrl: d.playlistUrl,
        title: d.title,
        hint: d.hint,
        downloadable: false,
      }
    case 'embed-youtube':
      return {
        ok: true,
        pageUrl,
        kind: 'embed-youtube',
        embedUrl: `https://www.youtube.com/embed/${d.videoId}?rel=0`,
        title: d.title,
        downloadable: true,
      }
    case 'embed-vimeo':
      return {
        ok: true,
        pageUrl,
        kind: 'embed-vimeo',
        embedUrl: `https://player.vimeo.com/video/${d.videoId}`,
        title: d.title,
        downloadable: false,
      }
    case 'streaming':
      return {
        ok: true,
        pageUrl,
        kind: 'streaming',
        title: d.title,
        hint: d.hint,
        sources: d.sources,
        downloadable: true,
      }
    case 'series-catalog':
      return {
        ok: true,
        pageUrl,
        kind: 'series-catalog',
        title: d.title,
        hint: d.hint,
        episodes: d.episodes,
        downloadable: false,
      }
    default:
      throw new Error('Type de détection inconnu')
  }
}
