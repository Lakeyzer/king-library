import { loadSeed } from "./loader.ts";

// Parent before join: series must exist before series_works can reference it.
await loadSeed("series", new URL("./series_seed.json", import.meta.url));
await loadSeed("series_works", new URL("./series_works_seed.json", import.meta.url));
