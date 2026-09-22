import type { ReadFormat } from '~/composables/useBooks'

// Shared between the reading timeline (label only) and the Currently
// Reading card (icon only) - one source of truth for how each format is
// presented, rather than each component inventing its own copy/icon.
export const READ_FORMAT_LABEL: Record<ReadFormat, string> = {
  physical: 'Physical',
  audiobook: 'Audiobook',
  ebook: 'Ebook'
}

export const READ_FORMAT_ICON: Record<ReadFormat, string> = {
  physical: 'i-lucide-book',
  audiobook: 'i-lucide-headphones',
  ebook: 'i-lucide-tablet'
}

// Shared USelect items list - used wherever a user picks a format (starting
// a read, or logging one via ReadDetailsFields). Derived from the label/icon
// maps above rather than repeating the three formats a third time, so all
// three stay in sync automatically.
const READ_FORMATS: ReadFormat[] = ['physical', 'audiobook', 'ebook']

export const READ_FORMAT_OPTIONS: { label: string, value: ReadFormat, icon: string }[] = READ_FORMATS.map(
  format => ({
    label: READ_FORMAT_LABEL[format],
    value: format,
    icon: READ_FORMAT_ICON[format]
  })
)
