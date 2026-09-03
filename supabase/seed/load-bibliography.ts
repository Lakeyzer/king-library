import { loadSeed } from "./loader.ts";

// Parents before joins: short stories and adaptations must exist before
// the tables that link them to king_works and to each other.
await loadSeed(
  "king_short_stories",
  new URL("./king_short_stories_seed.json", import.meta.url)
);
await loadSeed("adaptations", new URL("./adaptations_seed.json", import.meta.url));

await loadSeed(
  "king_short_story_collections",
  new URL("./king_short_story_collections_seed.json", import.meta.url)
);
await loadSeed(
  "adaptation_works",
  new URL("./adaptation_works_seed.json", import.meta.url)
);
await loadSeed(
  "adaptation_short_stories",
  new URL("./adaptation_short_stories_seed.json", import.meta.url)
);
