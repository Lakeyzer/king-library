// Wishlist tags are stored as normalized slugs (e.g. `first-printing`). The
// predefined set lives only here, not in the database - users can also add
// custom tags, so the DB can't hold an allow-list. It enforces the slug shape
// instead (valid_wishlist_tags() in the add_user_wishlist_items migration),
// and normalizeWishlistTag() below produces exactly that shape.
export const WISHLIST_PRESET_TAGS = [
  'any',
  'paperback',
  'trade-paperback',
  'mass-market-paperback',
  'hardcover',
  'first-edition',
  'first-printing',
  'signed',
  'limited-edition',
  'better-condition',
  'dust-jacket',
  'audiobook',
  'ebook',
  'foreign-edition',
  'book-club-edition'
] as const

export type WishlistPresetTag = (typeof WISHLIST_PRESET_TAGS)[number]

// Mirrors the DB constraints on user_wishlist_items.
export const WISHLIST_TAG_MAX_LENGTH = 30
export const WISHLIST_MAX_TAGS = 10
export const WISHLIST_NOTE_MAX_LENGTH = 1000

const PRESET_LABELS: Record<WishlistPresetTag, string> = {
  'any': 'Any',
  'paperback': 'Paperback',
  'trade-paperback': 'Trade paperback',
  'mass-market-paperback': 'Mass-market paperback',
  'hardcover': 'Hardcover',
  'first-edition': 'First edition',
  'first-printing': 'First printing',
  'signed': 'Signed',
  'limited-edition': 'Limited edition',
  'better-condition': 'Better condition',
  'dust-jacket': 'Dust jacket',
  'audiobook': 'Audiobook',
  'ebook': 'Ebook',
  'foreign-edition': 'Foreign edition',
  'book-club-edition': 'Book club edition'
}

export type NormalizedWishlistTag
  = | { ok: true, tag: string }
    | { ok: false, reason: 'empty' | 'too-long' }

// Lowercase, collapse every run of non-alphanumerics to one hyphen, trim
// hyphens. "First Printing" -> `first-printing`, so typing a preset's name
// lands on the preset instead of a near-duplicate custom tag.
export function normalizeWishlistTag(input: string): NormalizedWishlistTag {
  const tag = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (!tag) return { ok: false, reason: 'empty' }
  if (tag.length > WISHLIST_TAG_MAX_LENGTH) return { ok: false, reason: 'too-long' }
  return { ok: true, tag }
}

// Normalizes and dedupes a whole tag list, dropping anything invalid - the
// last line of defense before a write, so the DB check never fires on
// input the UI already accepted.
export function normalizeWishlistTags(tags: string[]): string[] {
  const normalized = tags
    .map(normalizeWishlistTag)
    .filter(result => result.ok)
    .map(result => result.tag)
  return [...new Set(normalized)]
}

export function isWishlistPresetTag(tag: string): tag is WishlistPresetTag {
  return (WISHLIST_PRESET_TAGS as readonly string[]).includes(tag)
}

// Presets get hand-written labels; a custom tag is shown with its hyphens as
// spaces and the first letter capitalized (`cemetery-dance` -> "Cemetery dance").
export function wishlistTagLabel(tag: string): string {
  if (isWishlistPresetTag(tag)) return PRESET_LABELS[tag]
  const spaced = tag.replace(/-/g, ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}
