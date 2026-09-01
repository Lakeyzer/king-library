import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

interface KingWorkSeed {
  id: string;
  title: string;
  type: string;
  original_publish_year: number;
  open_library_work_key: string | null;
}

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment to run this script."
  );
}

const seedPath = fileURLToPath(new URL("./king_works.json", import.meta.url));
const works: KingWorkSeed[] = JSON.parse(readFileSync(seedPath, "utf-8"));

const supabase = createClient(supabaseUrl, serviceRoleKey);

const { data, error } = await supabase
  .from("king_works")
  .upsert(works, { onConflict: "id" })
  .select("id, title");

if (error) {
  throw error;
}

console.log(`Upserted ${data?.length ?? 0} king_works rows.`);
