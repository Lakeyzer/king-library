import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

interface AdaptationSeedRow {
  id: string;
  title: string;
  type: string;
  release_year: number;
  tmdb_id: number | null;
  is_universe_only?: boolean;
  notes?: string;
  tmdb_media_type: "movie" | "tv" | null;
  tmdb_poster_path?: string | null;
}

const DELAY_MS = 250;

const apiKey = process.env.TMDB_API_KEY;
if (!apiKey) {
  throw new Error(
    "TMDB_API_KEY must be set in the environment to run this script (see .env)."
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPosterPath(
  tmdbId: number,
  mediaType: "movie" | "tv"
): Promise<string | null> {
  const response = await fetch(
    `https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=${apiKey}`
  );

  if (!response.ok) {
    console.warn(`  ${mediaType}/${tmdbId}: request failed (${response.status}), leaving poster path unresolved`);
    return null;
  }

  const data = (await response.json()) as { poster_path?: string | null };
  return data.poster_path ?? null;
}

async function main() {
  const seedPath = fileURLToPath(new URL("./adaptations_seed.json", import.meta.url));
  const rows: AdaptationSeedRow[] = JSON.parse(readFileSync(seedPath, "utf-8"));

  let resolved = 0;
  let skipped = 0;

  for (const row of rows) {
    if (row.tmdb_poster_path != null) {
      skipped++;
      continue;
    }

    if (!row.tmdb_id || !row.tmdb_media_type) {
      row.tmdb_poster_path = null;
      continue;
    }

    console.log(`Fetching poster for ${row.title} (${row.tmdb_media_type}/${row.tmdb_id})...`);
    row.tmdb_poster_path = await fetchPosterPath(row.tmdb_id, row.tmdb_media_type);
    if (row.tmdb_poster_path != null) resolved++;
    await delay(DELAY_MS);
  }

  writeFileSync(seedPath, `${JSON.stringify(rows, null, 2)}\n`);

  console.log(`Done. Resolved ${resolved} poster path(s), skipped ${skipped} already-resolved row(s).`);
}

await main();
