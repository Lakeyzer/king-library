const VALID_MEDIA_TYPES = ['movie', 'tv']

export default defineEventHandler(async (event) => {
  const mediaType = getRouterParam(event, 'mediaType')
  const id = getRouterParam(event, 'id')

  if (!mediaType || !VALID_MEDIA_TYPES.includes(mediaType)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid media type' })
  }

  const { tmdbApiKey } = useRuntimeConfig(event)
  if (!tmdbApiKey) {
    throw createError({ statusCode: 500, statusMessage: 'TMDb API key is not configured' })
  }

  try {
    return await $fetch(`https://api.themoviedb.org/3/${mediaType}/${id}`, {
      query: {
        api_key: tmdbApiKey,
        // Movies: pull crew alongside the base details to find the director.
        // TV shows already expose their creator(s) via `created_by` with no append needed.
        ...(mediaType === 'movie' && { append_to_response: 'credits' })
      }
    })
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number }).statusCode ?? 502
    throw createError({ statusCode, statusMessage: 'Failed to fetch TMDb details' })
  }
})
