import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment to run this script."
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Only ever targets rows with shuffle_position still null, so re-running this
// script is a no-op for works already assigned a position - see design.md
// "Risks / Trade-offs".
async function main() {
  const { data: unassigned, error: fetchError } = await supabase
    .from("king_works")
    .select("id")
    .is("shuffle_position", null);

  if (fetchError) throw fetchError;

  if (!unassigned || unassigned.length === 0) {
    console.log("No king_works rows need a shuffle_position. Nothing to do.");
    return;
  }

  const { data: assigned, error: maxError } = await supabase
    .from("king_works")
    .select("shuffle_position")
    .not("shuffle_position", "is", null)
    .order("shuffle_position", { ascending: false })
    .limit(1);

  if (maxError) throw maxError;

  const startingPosition = (assigned?.[0]?.shuffle_position ?? -1) + 1;

  const ids = unassigned.map((row) => row.id as string);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j]!, ids[i]!];
  }

  // Plain per-row updates, not upsert: an upsert's ON CONFLICT DO UPDATE still
  // validates the proposed insert row's NOT NULL constraints (title, etc.)
  // before conflict resolution kicks in, even though only shuffle_position is
  // being set here - a genuine Postgres gotcha, not a supabase-js quirk.
  for (const [index, id] of ids.entries()) {
    const { error: updateError } = await supabase
      .from("king_works")
      .update({ shuffle_position: startingPosition + index })
      .eq("id", id);

    if (updateError) throw updateError;
  }

  console.log(`Assigned shuffle_position to ${ids.length} king_works row(s).`);
}

await main();
