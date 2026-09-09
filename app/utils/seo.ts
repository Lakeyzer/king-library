const MAX_DESCRIPTION_LENGTH = 160

// Truncates at the last word boundary within budget rather than mid-word,
// reserving one character for the trailing ellipsis so the result never
// exceeds maxLength - see specs/seo-metadata/spec.md "Meta descriptions are
// capped to a safe length".
export function truncateDescription(description: string, maxLength = MAX_DESCRIPTION_LENGTH): string {
  if (description.length <= maxLength) return description

  const budget = maxLength - 1
  const truncated = description.slice(0, budget)
  const lastSpace = truncated.lastIndexOf(' ')
  const words = lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated

  return `${words.trimEnd()}…`
}

interface WorkFallbackInput {
  title: string
  type: string
  co_author: string | null
}

// Used when a work has no curated description - see specs/seo-metadata/spec.md
// "Work and short story descriptions fall back when curated content is missing".
export function generateWorkFallbackDescription(work: WorkFallbackInput): string {
  const author = work.co_author ? `Stephen King & ${work.co_author}` : 'Stephen King'
  return `${work.title}, a ${formatTypeLabel(work.type).toLowerCase()} by ${author} - part of the King Library collection.`
}

interface ShortStoryFallbackInput {
  title: string
  type: string
  original_publish_year: number | null
}

// Short stories have no description column of their own - this fallback is
// always used, never a curated override. See specs/seo-metadata/spec.md
// "Work and short story descriptions fall back when curated content is missing".
export function generateShortStoryFallbackDescription(story: ShortStoryFallbackInput): string {
  const year = story.original_publish_year ? ` (${story.original_publish_year})` : ''
  return `${story.title}${year}, a Stephen King ${formatTypeLabel(story.type).toLowerCase()} - part of the King Library collection.`
}

interface AdaptationFallbackInput {
  title: string
  release_year: number
  type: string
}

// Used when an adaptation has no linked TMDb overview - see
// specs/seo-metadata/spec.md "Adaptation descriptions fall back when no
// synopsis is available".
export function generateAdaptationFallbackDescription(adaptation: AdaptationFallbackInput): string {
  return `${adaptation.title} (${adaptation.release_year}), a Stephen King ${formatTypeLabel(adaptation.type).toLowerCase()} adaptation - part of the King Library collection.`
}
