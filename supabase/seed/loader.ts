import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment to run this script.'
  )
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

// `prune` deletes rows whose id is no longer in the seed file, so a link
// removed from the seed is also removed from the database (upsert alone
// never deletes). Only use it on curated join tables nothing else references.
export async function loadSeed(
  table: string,
  seedFileUrl: URL,
  { prune = false }: { prune?: boolean } = {}
) {
  const seedPath = fileURLToPath(seedFileUrl)
  const rows: Record<string, unknown>[] = JSON.parse(
    readFileSync(seedPath, 'utf-8')
  )

  if (rows.some(row => 'slug' in row)) {
    const seenSlugs = new Map<string, number>()
    rows.forEach((row, index) => {
      const slug = row.slug
      if (typeof slug !== 'string' || slug.length === 0) {
        throw new Error(`${table} row ${index} (id ${row.id}) is missing a slug.`)
      }
      const firstIndex = seenSlugs.get(slug)
      if (firstIndex !== undefined) {
        throw new Error(
          `${table} rows ${firstIndex} and ${index} both use slug "${slug}".`
        )
      }
      seenSlugs.set(slug, index)
    })
  }

  const { data, error } = await supabase
    .from(table)
    .upsert(rows, { onConflict: 'id' })
    .select('id')

  if (error) {
    throw error
  }

  console.log(`Upserted ${data?.length ?? 0} ${table} rows.`)

  if (prune) {
    await pruneStaleRows(table, rows)
  }
}

// Seed ids are written both with and without dashes, so compare them
// normalized rather than as raw strings.
const normalizeId = (id: unknown) => String(id).replace(/-/g, '').toLowerCase()

async function pruneStaleRows(table: string, rows: Record<string, unknown>[]) {
  const seedIds = new Set(rows.map(row => normalizeId(row.id)))
  const staleIds: string[] = []
  const pageSize = 1000

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from(table)
      .select('id')
      .order('id')
      .range(from, from + pageSize - 1)

    if (error) {
      throw error
    }

    for (const { id } of data ?? []) {
      if (!seedIds.has(normalizeId(id))) {
        staleIds.push(id)
      }
    }

    if (!data || data.length < pageSize) {
      break
    }
  }

  if (staleIds.length === 0) {
    return
  }

  const { error } = await supabase.from(table).delete().in('id', staleIds)

  if (error) {
    throw error
  }

  console.log(`Pruned ${staleIds.length} ${table} rows no longer in the seed.`)
}
