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

async function fetchWorkCoverId(workKey: string): Promise<number | null> {
  const response = await fetch(`https://openlibrary.org/works/${workKey}.json`);

  if (!response.ok) {
    console.warn(`  ${workKey}: request failed (${response.status}), leaving cover_id unresolved`);
    return null;
  }

  const data = (await response.json()) as { covers?: number[] };

  // Open Library uses -1 as a "no cover" sentinel, and it can appear
  // ahead of legitimate cover ids in the array — don't stop at index 0.
  const coverId = data.covers?.find((id) => id !== -1);

  return coverId ?? null;
}

// Very recent releases sometimes have no cover set on the work record yet,
// even though an edition of it does — fall back to the first edition with one.
async function fetchEditionCoverId(workKey: string): Promise<number | null> {
  const response = await fetch(`https://openlibrary.org/works/${workKey}/editions.json?limit=20`);

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { entries?: { covers?: number[] }[] };

  for (const entry of data.entries ?? []) {
    const coverId = entry.covers?.find((id) => id !== -1);
    if (coverId != null) return coverId;
  }

  return null;
}

async function fetchCoverId(workKey: string): Promise<number | null> {
  const workCoverId = await fetchWorkCoverId(workKey);
  if (workCoverId != null) return workCoverId;

  return fetchEditionCoverId(workKey);
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
