import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

interface AdaptationSeedRow {
  id: string
  title: string
  type: string
  release_year: number
  release_date?: string | null
  tmdb_id: number | null
  is_universe_only?: boolean
  notes?: string
  tmdb_media_type: 'movie' | 'tv' | null
  tmdb_poster_path?: string | null
}

const DELAY_MS = 250

const apiKey = process.env.TMDB_API_KEY
if (!apiKey) {
  throw new Error(
    'TMDB_API_KEY must be set in the environment to run this script (see .env).'
  )
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function todayIsoDate() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

// Movies expose `release_date`; TV shows expose `first_air_date`, the date of
// the first episode, which is what we treat as a series' release date.
async function fetchReleaseDate(
  tmdbId: number,
  mediaType: 'movie' | 'tv'
): Promise<string | null> {
  const response = await fetch(
    `https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=${apiKey}`
  )

  if (!response.ok) {
    console.warn(`  ${mediaType}/${tmdbId}: request failed (${response.status}), leaving release date unresolved`)
    return null
  }

  const data = (await response.json()) as { release_date?: string, first_air_date?: string }
  // TMDb returns an empty string, not null, when there's no date yet.
  return (mediaType === 'movie' ? data.release_date : data.first_air_date) || null
}

// A date already in the past is settled, so it's left alone. One still in the
// future (or missing) is (re)fetched, since TMDb dates for upcoming releases
// move around before they actually land.
async function main() {
  const seedPath = fileURLToPath(new URL('./adaptations_seed.json', import.meta.url))
  const rows: AdaptationSeedRow[] = JSON.parse(readFileSync(seedPath, 'utf-8'))
  const today = todayIsoDate()

  let resolved = 0
  let skipped = 0
  let mismatched = 0

  for (const row of rows) {
    if (row.release_date && row.release_date <= today) {
      skipped++
      continue
    }

    if (!row.tmdb_id || !row.tmdb_media_type) {
      row.release_date = null
      continue
    }

    console.log(`Fetching release date for ${row.title} (${row.tmdb_media_type}/${row.tmdb_id})...`)
    row.release_date = await fetchReleaseDate(row.tmdb_id, row.tmdb_media_type)
    if (row.release_date != null) resolved++
    await delay(DELAY_MS)

    // release_year is still curated by hand, so flag disagreements rather
    // than silently overwriting either side.
    if (row.release_date && Number(row.release_date.slice(0, 4)) !== row.release_year) {
      mismatched++
      console.warn(`  ${row.title}: release_year is ${row.release_year} but TMDb date is ${row.release_date}`)
    }
  }

  writeFileSync(seedPath, `${JSON.stringify(rows, null, 2)}\n`)

  console.log(`Done. Resolved ${resolved} release date(s), skipped ${skipped} already-settled row(s), ${mismatched} year mismatch(es).`)
}

await main()
