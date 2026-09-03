import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

interface KingWorkSeedRow {
  id: string;
  title: string;
  type: string;
  original_publish_year: number;
  open_library_work_key: string | null;
  dark_tower: boolean;
  bachman: boolean;
  dark_tower_relation: string | null;
  cover_id?: number | null;
}

const DELAY_MS = 250;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchCoverId(workKey: string): Promise<number | null> {
  const response = await fetch(`https://openlibrary.org/works/${workKey}.json`);

  if (!response.ok) {
    console.warn(`  ${workKey}: request failed (${response.status}), leaving cover_id unresolved`);
    return null;
  }

  const data = (await response.json()) as { covers?: number[] };
  const coverId = data.covers?.[0];

  // Open Library uses -1 as a "no cover" sentinel.
  if (coverId === undefined || coverId === -1) {
    return null;
  }

  return coverId;
}

async function main() {
  const seedPath = fileURLToPath(new URL("./king_works.json", import.meta.url));
  const rows: KingWorkSeedRow[] = JSON.parse(readFileSync(seedPath, "utf-8"));

  let resolved = 0;
  let skipped = 0;

  for (const row of rows) {
    if (row.cover_id != null) {
      skipped++;
      continue;
    }

    if (!row.open_library_work_key) {
      row.cover_id = null;
      continue;
    }

    console.log(`Fetching cover for ${row.title} (${row.open_library_work_key})...`);
    row.cover_id = await fetchCoverId(row.open_library_work_key);
    if (row.cover_id != null) resolved++;
    await delay(DELAY_MS);
  }

  writeFileSync(seedPath, `${JSON.stringify(rows, null, 2)}\n`);

  console.log(`Done. Resolved ${resolved} cover id(s), skipped ${skipped} already-resolved row(s).`);
}

await main();
