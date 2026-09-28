// Every book lives in the one `works` table, labelled by `kind` - see
// merge-related-works-into-works's design.md. 'king' is the canonical Stephen
// King bibliography, 'related' a By Other Hands (Works by Others) work.
export type WorkKind = 'king' | 'related'

// A work's detail page: King works live under /works, related works under
// /works-by-others. Lists that mix both kinds (reading timeline, bookshelf,
// read list, Currently Reading) link through this rather than branching
// per kind themselves.
export function workPath(kind: WorkKind, slug: string) {
  return kind === 'related' ? `/works-by-others/${slug}` : `/works/${slug}`
}
