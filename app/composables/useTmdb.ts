export interface TmdbDetails {
  overview: string | null
  rating: number | null
  genres: string[]
  runtimeMinutes: number | null
  numberOfSeasons: number | null
  numberOfEpisodes: number | null
  directedBy: string[]
}

export interface TmdbEpisodeRef {
  season: number
  episode: number
}

interface TmdbCrewMember {
  job: string
  name: string
}

interface TmdbRawResponse {
  overview?: string
  vote_average?: number
  genres?: { name: string }[]
  runtime?: number
  number_of_seasons?: number
  number_of_episodes?: number
  credits?: { crew?: TmdbCrewMember[] }
  // TV episodes only - an episode lists its crew directly, not under `credits`.
  crew?: TmdbCrewMember[]
  created_by?: { name: string }[]
}

function directorsOf(crew: TmdbCrewMember[] | undefined): string[] {
  return (crew ?? []).filter(member => member.job === 'Director').map(member => member.name)
}

export function useTmdb() {
  // Pass `episode` for a single anthology episode: `id` is then the parent
  // series, and the details returned are that one episode's.
  const fetchTmdbDetails = async (
    mediaType: string,
    id: number,
    episode?: TmdbEpisodeRef
  ): Promise<TmdbDetails | null> => {
    try {
      const data = await $fetch<TmdbRawResponse>(`/api/tmdb/${mediaType}/${id}`, {
        query: episode ? { season: episode.season, episode: episode.episode } : undefined
      })

      let directedBy: string[]
      if (episode) directedBy = directorsOf(data.crew)
      else if (mediaType === 'movie') directedBy = directorsOf(data.credits?.crew)
      else directedBy = (data.created_by ?? []).map(creator => creator.name)

      return {
        overview: data.overview ?? null,
        rating: data.vote_average ?? null,
        genres: (data.genres ?? []).map(genre => genre.name),
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
