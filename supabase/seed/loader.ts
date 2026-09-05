import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment to run this script."
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

export async function loadSeed(table: string, seedFileUrl: URL) {
  const seedPath = fileURLToPath(seedFileUrl);
  const rows: Record<string, unknown>[] = JSON.parse(
    readFileSync(seedPath, "utf-8")
  );

  if (rows.some((row) => "slug" in row)) {
    const seenSlugs = new Map<string, number>();
    rows.forEach((row, index) => {
      const slug = row.slug;
      if (typeof slug !== "string" || slug.length === 0) {
        throw new Error(`${table} row ${index} (id ${row.id}) is missing a slug.`);
      }
      const firstIndex = seenSlugs.get(slug);
      if (firstIndex !== undefined) {
        throw new Error(
          `${table} rows ${firstIndex} and ${index} both use slug "${slug}".`
        );
      }
      seenSlugs.set(slug, index);
    });
  }

  const { data, error } = await supabase
    .from(table)
    .upsert(rows, { onConflict: "id" })
    .select("id");

  if (error) {
    throw error;
  }

  console.log(`Upserted ${data?.length ?? 0} ${table} rows.`);
}
