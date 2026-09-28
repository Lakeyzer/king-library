const UNITS: { unit: Intl.RelativeTimeFormatUnit, seconds: number }[] = [
  { unit: 'day', seconds: 60 * 60 * 24 },
  { unit: 'hour', seconds: 60 * 60 },
  { unit: 'minute', seconds: 60 }
]

// Fixed locale, like the app's other date formatting, so server- and
// client-rendered text match.
const relativeFormatter = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' })
const dateFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

// "just now", "5 minutes ago", "yesterday", "3 days ago" - and a plain date
// once something is more than a week old, where a relative time stops
// being easier to read than the date itself.
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const date = new Date(iso)
  const secondsAgo = Math.round((now - date.getTime()) / 1000)

  if (secondsAgo < 60) return 'just now'
  if (secondsAgo > 60 * 60 * 24 * 7) return dateFormatter.format(date)

  const { unit, seconds } = UNITS.find(({ seconds }) => secondsAgo >= seconds)!
  return relativeFormatter.format(-Math.floor(secondsAgo / seconds), unit)
}
