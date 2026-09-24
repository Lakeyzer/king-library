/** True when a book's publish date (ISO YYYY-MM-DD) is still in the future, by the browser's local date. A missing date counts as released. */
export function isUnreleasedDate(publishDate?: string | null) {
  return !!publishDate && publishDate > todayLocalDate()
}

/** True when an adaptation hasn't been released yet: by its full release date (TMDb's release date, or first air date for a series) when it has one, otherwise by its release year being after the current year - a year alone can't tell that one releasing later this year is still to come. */
export function isUnreleasedAdaptation(releaseDate?: string | null, releaseYear?: number | null) {
  if (releaseDate) return isUnreleasedDate(releaseDate)
  return releaseYear != null && releaseYear > new Date().getFullYear()
}

export function todayLocalDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
