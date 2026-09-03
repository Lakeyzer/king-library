import { loadSeed } from "./loader.ts";

await loadSeed("king_works", new URL("./king_works.json", import.meta.url));
