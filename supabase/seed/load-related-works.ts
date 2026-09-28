import { loadSeed } from './loader.ts'

// Related (By Other Hands) rows of the works table. The King rows must
// already be seeded (see seed:king-works / seed:bibliography), since both
// link tables below reference King works as well as related ones.
await loadSeed('works', new URL('./related_works.json', import.meta.url))
// King and related omnibus links share one table and one seed file, so it's
// loaded here, once both kinds of works exist.
await loadSeed(
  'work_omnibus_works',
  new URL('./work_omnibus_works_seed.json', import.meta.url)
)
await loadSeed(
  'related_work_king_works',
  new URL('./related_work_king_works_seed.json', import.meta.url)
)
