const VALID_MEDIA_TYPES = ['movie', 'tv']

function parseEpisodePart(value: unknown): number | null {
  if (value === undefined) return null
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid season or episode number' })
  }
  return parsed
}

export default defineEventHandler(async (event) => {
  const mediaType = getRouterParam(event, 'mediaType')
  const id = getRouterParam(event, 'id')

  if (!mediaType || !VALID_MEDIA_TYPES.includes(mediaType)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid media type' })
  }

  // A single anthology episode: `id` is the parent series, and these say which episode.
  const query = getQuery(event)
  const season = parseEpisodePart(query.season)
  const episode = parseEpisodePart(query.episode)
  const isEpisode = season !== null && episode !== null
  if ((season !== null || episode !== null) && (!isEpisode || mediaType !== 'tv')) {
    throw createError({ statusCode: 400, statusMessage: 'Season and episode must be given together, for tv only' })
  }

  const { tmdbApiKey } = useRuntimeConfig(event)
  if (!tmdbApiKey) {
    throw createError({ statusCode: 500, statusMessage: 'TMDb API key is not configured' })
  }

  const path = isEpisode
    ? `tv/${id}/season/${season}/episode/${episode}`
    : `${mediaType}/${id}`

  try {
    return await $fetch(`https://api.themoviedb.org/3/${path}`, {
      query: {
        api_key: tmdbApiKey,
        // Movies: pull crew alongside the base details to find the director.
        // TV shows already expose their creator(s) via `created_by`, and a TV
        // episode its own `crew`, with no append needed.
        ...(mediaType === 'movie' && { append_to_response: 'credits' })
      }
    })
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number }).statusCode ?? 502
    throw createError({ statusCode, statusMessage: 'Failed to fetch TMDb details' })
  }
})
