export interface TmdbDetails {
  overview: string | null
  rating: number | null
  genres: string[]
  runtimeMinutes: number | null
  numberOfSeasons: number | null
  numberOfEpisodes: number | null
  directedBy: string[]
}

interface TmdbRawResponse {
  overview?: string
  vote_average?: number
  genres?: { name: string }[]
  runtime?: number
  number_of_seasons?: number
  number_of_episodes?: number
  credits?: { crew?: { job: string, name: string }[] }
  created_by?: { name: string }[]
}

export function useTmdb() {
  const fetchTmdbDetails = async (mediaType: string, id: number): Promise<TmdbDetails | null> => {
    try {
      const data = await $fetch<TmdbRawResponse>(`/api/tmdb/${mediaType}/${id}`)

      const directedBy = mediaType === 'movie'
        ? (data.credits?.crew ?? []).filter((member) => member.job === 'Director').map((member) => member.name)
        : (data.created_by ?? []).map((creator) => creator.name)

      return {
        overview: data.overview ?? null,
        rating: data.vote_average ?? null,
        genres: (data.genres ?? []).map((genre) => genre.name),
        runtimeMinutes: data.runtime ?? null,
        numberOfSeasons: data.number_of_seasons ?? null,
        numberOfEpisodes: data.number_of_episodes ?? null,
        directedBy
      }
    } catch {
      return null
    }
  }

  return { fetchTmdbDetails }
}
