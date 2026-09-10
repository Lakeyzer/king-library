export interface OpenLibraryEdition {
  key: string
  title: string
  coverId: number | null
  publisher: string | null
  publishYear: string | null
  physicalFormat: string | null
  editionName: string | null
  language: string | null
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
    physical_format?: string
    edition_name?: string
    languages?: { key: string }[]
  }[]
}

function extractYear(publishDate?: string): string | null {
  return publishDate?.match(/\d{4}/)?.[0] ?? null
}

// Open Library records languages by MARC code (mostly ISO 639-2/B, e.g. "ger"
// not "deu", "fre" not "fra") as a key like "/languages/eng" - this covers
// the languages King's editions actually show up in; an unrecognized code is
// left out entirely rather than showing a cryptic 3-letter code.
const LANGUAGE_NAMES: Record<string, string> = {
  eng: 'English',
  fre: 'French',
  fra: 'French',
  ger: 'German',
  deu: 'German',
  spa: 'Spanish',
  ita: 'Italian',
  por: 'Portuguese',
  dut: 'Dutch',
  nld: 'Dutch',
  rus: 'Russian',
  jpn: 'Japanese',
  chi: 'Chinese',
  zho: 'Chinese',
  kor: 'Korean',
  swe: 'Swedish',
  nor: 'Norwegian',
  dan: 'Danish',
  fin: 'Finnish',
  pol: 'Polish',
  cze: 'Czech',
  ces: 'Czech',
  hun: 'Hungarian',
  rum: 'Romanian',
  ron: 'Romanian',
  tur: 'Turkish',
  ara: 'Arabic',
  heb: 'Hebrew',
  hin: 'Hindi',
  gre: 'Greek',
  ell: 'Greek',
  ice: 'Icelandic',
  isl: 'Icelandic',
  cat: 'Catalan',
  ukr: 'Ukrainian',
  bul: 'Bulgarian',
  hrv: 'Croatian',
  srp: 'Serbian',
  slo: 'Slovak',
  slk: 'Slovak',
  slv: 'Slovenian',
  est: 'Estonian',
  lav: 'Latvian',
  lit: 'Lithuanian',
  tha: 'Thai',
  vie: 'Vietnamese',
  ind: 'Indonesian'
}

function resolveLanguage(languages?: { key: string }[]): string | null {
  const code = languages?.[0]?.key.split('/').pop()
  return (code && LANGUAGE_NAMES[code]) ?? null
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
        publishYear: extractYear(entry.publish_date),
        physicalFormat: entry.physical_format ?? null,
        editionName: entry.edition_name ?? null,
        language: resolveLanguage(entry.languages)
      }))

      return { editions, hasMore: offset + editions.length < data.size, total: data.size }
    } catch {
      return { editions: [], hasMore: false, total: 0 }
    }
  }

  return { fetchEditions }
}
