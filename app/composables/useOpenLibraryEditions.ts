export interface OpenLibraryEdition {
  key: string
  title: string
  coverId: number | null
  publisher: string | null
  publishYear: string | null
}

export interface FetchEditionsResult {
  editions: OpenLibraryEdition[]
  hasMore: boolean
  total: number
}

interface OpenLibraryEditionsResponse {
  size: number
  entries: {
    key: string
    title: string
    covers?: number[]
    publishers?: string[]
    publish_date?: string
  }[]
}

function extractYear(publishDate?: string): string | null {
  return publishDate?.match(/\d{4}/)?.[0] ?? null
}

export function useOpenLibraryEditions() {
  const fetchEditions = async (workKey: string, offset: number, limit: number): Promise<FetchEditionsResult> => {
    try {
      const data = await $fetch<OpenLibraryEditionsResponse>(
        `https://openlibrary.org/works/${workKey}/editions.json`,
        { query: { limit, offset } }
      )

      const editions = data.entries.map((entry) => ({
        key: entry.key,
        title: entry.title,
        // Open Library uses -1 as a "no cover" sentinel within the covers array,
        // not just omitting the field - filter it out rather than treating it as an id.
        coverId: entry.covers?.find((id) => id > 0) ?? null,
        publisher: entry.publishers?.[0] ?? null,
        publishYear: extractYear(entry.publish_date)
      }))

      return { editions, hasMore: offset + editions.length < data.size, total: data.size }
    } catch {
      return { editions: [], hasMore: false, total: 0 }
    }
  }

  return { fetchEditions }
}
