import { loadSeed } from './loader.ts'

// King rows of the works table - see load-related-works.ts for the related rows.
await loadSeed('works', new URL('./king_works.json', import.meta.url))
