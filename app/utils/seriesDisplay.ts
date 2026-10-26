// Keyed by series name, since series ids are seed-generated UUIDs with no
// stable meaning (same lookup-by-name as useBooks().fetchNextDarkTowerBook).
// Presentation only, so it lives here rather than as columns on `series` -
// see add-series-progress design.md. Icon names stay full literals so the
// icon client bundle scan picks them up (nuxt-conventions "Icons"). Color is
// per section, not per series (every Series bar is `secondary`).
const SERIES_ICONS: Record<string, string> = {
  'Bachman Books': 'i-lucide-user-round',
  'Dark Tower': 'i-lucide-rose',
  'Gwendy\'s Trilogy': 'i-lucide-box',
  'Hodges & Holly': 'i-lucide-fingerprint',
  'Talisman': 'i-lucide-globe'
}

const DEFAULT_SERIES_ICON = 'i-lucide-library-big'

export function seriesIcon(name: string): string {
  return SERIES_ICONS[name] ?? DEFAULT_SERIES_ICON
}

// Display order everywhere series are listed (profile, compare, /works).
// The showcase's Series grid layout assumes Dark Tower and Bachman Books
// come first. A series not listed here goes after these, by name.
const SERIES_ORDER = ['Dark Tower', 'Bachman Books', 'Talisman', 'Hodges & Holly', 'Gwendy\'s Trilogy']

// Series card spans for a `grid-cols-1 md:grid-cols-2 lg:grid-cols-6` grid,
// shared by the profile's Series section and the compare page's Series
// group: on large screens the first two (Dark Tower, Bachman Books) share
// the first row and the rest go three to a row; on medium screens Dark
// Tower gets the first row to itself and the rest go two to a row.
export function seriesCardClass(index: number): string {
  if (index === 0) return 'md:col-span-2 lg:col-span-3'
  if (index === 1) return 'lg:col-span-3'
  return 'lg:col-span-2'
}

export function compareSeriesOrder(a: { name: string }, b: { name: string }): number {
  const rank = (name: string) => {
    const index = SERIES_ORDER.indexOf(name)
    return index === -1 ? SERIES_ORDER.length : index
  }
  return rank(a.name) - rank(b.name) || a.name.localeCompare(b.name)
}
