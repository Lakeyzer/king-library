import { execSync, spawn, spawnSync } from "node:child_process";

const DOCKER_DESKTOP_PATH = "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe";
const DOCKER_READY_TIMEOUT_MS = 120_000;
const POLL_INTERVAL_MS = 3000;

function isDockerReady() {
  try {
    execSync("docker version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

async function ensureDockerRunning() {
  if (isDockerReady()) return;

  console.log("Docker isn't running — starting Docker Desktop...");
  try {
    spawn(DOCKER_DESKTOP_PATH, [], { detached: true, stdio: "ignore" }).unref();
  } catch (err) {
    console.error(
      `Could not launch Docker Desktop automatically (${err.message}). Start it manually and re-run "pnpm dev".`
    );
    process.exit(1);
  }

  const start = Date.now();
  while (Date.now() - start < DOCKER_READY_TIMEOUT_MS) {
    if (isDockerReady()) {
      console.log("Docker is ready.");
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  console.error(
    'Timed out waiting for Docker to start. Start Docker Desktop manually and re-run "pnpm dev".'
  );
  process.exit(1);
}

await ensureDockerRunning();

console.log("Starting local Supabase...");
const SUPABASE_START_MAX_ATTEMPTS = 5;
const SUPABASE_START_RETRY_DELAY_MS = 5000;

let supabaseStart;
for (let attempt = 1; attempt <= SUPABASE_START_MAX_ATTEMPTS; attempt++) {
  supabaseStart = spawnSync("npx supabase start", {
    stdio: "inherit",
    shell: true,
  });
  if (supabaseStart.status === 0) break;

  if (attempt < SUPABASE_START_MAX_ATTEMPTS) {
    // Right after Docker Desktop finishes booting, its containers (e.g. the
    // DB) can still be starting up even though the daemon already responds
    // to `docker version` — `supabase start` fails transiently in that
    // window, so retry a few times before giving up.
    console.log(
      `Supabase containers not ready yet (attempt ${attempt}/${SUPABASE_START_MAX_ATTEMPTS}) — retrying in ${SUPABASE_START_RETRY_DELAY_MS / 1000}s...`
    );
    await new Promise((resolve) => setTimeout(resolve, SUPABASE_START_RETRY_DELAY_MS));
  }
}
if (supabaseStart.status !== 0) {
  console.error("`supabase start` failed after multiple attempts — see output above.");
  process.exit(supabaseStart.status ?? 1);
}

const nuxtDev = spawn("npx nuxi dev --dotenv .env.development.local", {
  stdio: "inherit",
  shell: true,
});
nuxtDev.on("exit", (code) => process.exit(code ?? 0));
