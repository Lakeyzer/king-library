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

  const { data, error } = await supabase
    .from(table)
    .upsert(rows, { onConflict: "id" })
    .select("id");

  if (error) {
    throw error;
  }

  console.log(`Upserted ${data?.length ?? 0} ${table} rows.`);
}
