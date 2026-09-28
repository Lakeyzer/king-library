// The viewer's own locale, so date inputs show fields in the order they're
// used to (dd-mm-yyyy vs mm-dd-yyyy). Only meant for client-only UI like
// modals - the server has no browser locale, so it falls back to the app's
// usual fixed 'en-US', which would mismatch on hydration if server-rendered.
export function useDateLocale(): string {
  return import.meta.client ? navigator.language : 'en-US'
}
