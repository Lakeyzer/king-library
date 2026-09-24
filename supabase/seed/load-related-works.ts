import { loadSeed } from './loader.ts'

await loadSeed('related_works', new URL('./related_works.json', import.meta.url))
await loadSeed(
  'related_work_omnibus_works',
  new URL('./related_work_omnibus_works_seed.json', import.meta.url)
)
// References king_works too, so king_works must already be seeded (see
// seed:king-works / seed:bibliography).
await loadSeed(
  'related_work_king_works',
  new URL('./related_work_king_works_seed.json', import.meta.url)
)
