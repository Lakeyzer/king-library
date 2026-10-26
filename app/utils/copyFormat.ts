// The format of a copy someone owns - distinct from ReadFormat
// (readFormat.ts), which is the format a read was done in. Paperback vs
// Hardcover matters here (shelf marks, filters), where a read only cares
// that it was "physical".
export type CopyFormat = 'paperback' | 'hardcover' | 'audiobook' | 'ebook'

// Same column names on user_book_editions (an edition tile) and user_books
// (an edition-less owned work) - see supabase-conventions "Copy details".
// The database enforces which fields apply to which format:
// - edition, printing, signed and limited: physical formats only
//   (*_copy_physical_only)
// - dust jacket and book club: hardcover only (*_copy_hardcover_only)
// - limited number and size: limited copies only (*_copy_limited_details)
export interface CopyDetails {
  copy_format: CopyFormat | null
  copy_edition: number | null
  copy_printing: number | null
  copy_signed: boolean
  copy_dust_jacket: boolean
  copy_book_club: boolean
  copy_limited: boolean
  /** A numbered ("123") or lettered ("AA") copy, uppercase, 1-6 characters. */
  copy_limited_number: string | null
  /** How many copies the limited edition ran to, e.g. 750 (or 26 for a lettered run). */
  copy_limited_size: number | null
}

export const COPY_DETAILS_COLUMNS = 'copy_format, copy_edition, copy_printing, copy_signed, copy_dust_jacket, copy_book_club, copy_limited, copy_limited_number, copy_limited_size'

export const EMPTY_COPY_DETAILS: CopyDetails = {
  copy_format: null,
  copy_edition: null,
  copy_printing: null,
  copy_signed: false,
  copy_dust_jacket: false,
  copy_book_club: false,
  copy_limited: false,
  copy_limited_number: null,
  copy_limited_size: null
}

export const LIMITED_NUMBER_PATTERN = /^[A-Z0-9]{1,6}$/

const COPY_DETAIL_KEYS = Object.keys(EMPTY_COPY_DETAILS) as (keyof CopyDetails)[]

// Just the copy fields of a row, exactly as stored (unlike
// normalizeCopyDetails, nothing is dropped) - driven by EMPTY_COPY_DETAILS'
// keys so a new copy field can't be forgotten here.
export function pickCopyDetails(row: CopyDetails): CopyDetails {
  return Object.fromEntries(COPY_DETAIL_KEYS.map(key => [key, row[key]])) as unknown as CopyDetails
}

export const COPY_FORMAT_LABEL: Record<CopyFormat, string> = {
  paperback: 'Paperback',
  hardcover: 'Hardcover',
  audiobook: 'Audiobook',
  ebook: 'Ebook'
}

export const COPY_FORMAT_ICON: Record<CopyFormat, string> = {
  paperback: 'i-lucide-book-open',
  hardcover: 'i-lucide-book',
  audiobook: 'i-lucide-headphones',
  ebook: 'i-lucide-tablet'
}

const COPY_FORMATS: CopyFormat[] = ['paperback', 'hardcover', 'audiobook', 'ebook']

export const COPY_FORMAT_OPTIONS: { label: string, value: CopyFormat, icon: string }[] = COPY_FORMATS.map(
  format => ({
    label: COPY_FORMAT_LABEL[format],
    value: format,
    icon: COPY_FORMAT_ICON[format]
  })
)

export function isPhysicalCopyFormat(format: CopyFormat | null): format is 'paperback' | 'hardcover' {
  return format === 'paperback' || format === 'hardcover'
}

// Picks just the copy fields (so a whole user_books or edition row can be
// passed in safely) and drops whatever the format or the limited flag rules
// out, matching the database's checks (see CopyDetails), so a write never
// trips them. An invalid limited number is dropped rather than sent.
export function normalizeCopyDetails(details: CopyDetails): CopyDetails {
  if (!isPhysicalCopyFormat(details.copy_format)) {
    return { ...EMPTY_COPY_DETAILS, copy_format: details.copy_format }
  }
  const isHardcover = details.copy_format === 'hardcover'
  const limitedNumber = details.copy_limited_number?.trim().toUpperCase() || null
  return {
    copy_format: details.copy_format,
    copy_edition: details.copy_edition,
    copy_printing: details.copy_printing,
    copy_signed: details.copy_signed,
    copy_dust_jacket: isHardcover && details.copy_dust_jacket,
    copy_book_club: isHardcover && details.copy_book_club,
    copy_limited: details.copy_limited,
    copy_limited_number:
      details.copy_limited && limitedNumber && LIMITED_NUMBER_PATTERN.test(limitedNumber) ? limitedNumber : null,
    copy_limited_size: details.copy_limited ? details.copy_limited_size : null
  }
}

// The one thing a form can hold that normalizeCopyDetails would silently
// drop - so Save stays disabled until it's fixed.
export function hasValidLimitedNumber(details: CopyDetails): boolean {
  return !details.copy_limited_number || LIMITED_NUMBER_PATTERN.test(details.copy_limited_number)
}

export function hasCopyDetails(details: CopyDetails): boolean {
  return details.copy_format !== null
}

// Open Library's physical_format is free text ("Mass Market Paperback",
// "Hardcover with dust jacket", "Audio CD", ...), often not in English
// ("Taschenbuch", "Rustica") and sometimes misspelled ("Hardover") - the
// keywords below come from a sample of King editions' actual values.
// Checked in this order, so hardcover wins over anything that also mentions
// paper (e.g. "hardcover, acid-free paper"). No match means no guess - an
// unset format is better than a wrong one the user doesn't notice.
const FORMAT_KEYWORDS: [CopyFormat, string[]][] = [
  ['hardcover', [
    'hardcover', 'hard cover', 'hardback', 'hardover', 'library binding', 'leather', 'turtleback',
    'gebunden', 'relié', 'relie', 'tapa dura', 'capa dura'
  ]],
  ['paperback', [
    'paperback', 'mass market', 'trade paper', 'softcover', 'soft cover', 'pocket',
    'taschenbuch', 'rustica', 'rústica', 'rsutica', 'brochura', 'broché', 'broche', 'poche', 'tapa blanda'
  ]],
  ['audiobook', ['audio', 'cassette', 'mp3', 'sound recording']],
  ['ebook', ['ebook', 'e-book', 'electronic', 'kindle', 'epub']]
]

export function inferCopyFormat(physicalFormat: string | null): CopyFormat | null {
  const text = physicalFormat?.trim().toLowerCase()
  if (!text) return null

  // "Audio CD" is caught by "audio"; a bare "CD" is checked as a whole word
  // so it doesn't match inside other words.
  if (/\bcd\b/.test(text) && !text.includes('rom')) return 'audiobook'

  return FORMAT_KEYWORDS.find(([, keywords]) => keywords.some(keyword => text.includes(keyword)))?.[0] ?? null
}

export type CopyMark = 'gold' | 'silver'

// The only place the shelf-mark rule lives: a physical first edition, gold
// for a first printing, silver for anything else - a later printing or an
// unknown one. A book club edition never gets a mark, since collectors don't
// count it as a true first even when it reads "first edition".
export function copyMark(details: CopyDetails): CopyMark | null {
  if (!isPhysicalCopyFormat(details.copy_format) || details.copy_edition !== 1) return null
  if (details.copy_book_club) return null
  return details.copy_printing === 1 ? 'gold' : 'silver'
}

// A silver mark with no printing recorded can't claim "later printing".
export function copyMarkLabel(details: CopyDetails): string | null {
  const mark = copyMark(details)
  if (mark === 'gold') return 'First edition, first printing'
  if (mark === 'silver') return details.copy_printing === null ? 'First edition' : 'First edition, later printing'
  return null
}

// "Limited edition, #123 of 750", "Lettered copy AA of 26", or as much of
// that as is known. Null for a copy that isn't limited.
export function limitedEditionLabel(details: CopyDetails): string | null {
  if (!details.copy_limited) return null
  const number = details.copy_limited_number
  const size = details.copy_limited_size ? ` of ${details.copy_limited_size}` : ''
  if (number && /^[0-9]+$/.test(number)) return `Limited edition, #${number}${size}`
  if (number) return `Lettered copy ${number}${size}`
  return size ? `Limited edition${size}` : 'Limited edition'
}
