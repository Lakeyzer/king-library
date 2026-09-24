// Supabase's client-side OAuth code-exchange (triggered automatically by
// createBrowserClient's detectSessionInUrl) rewrites/strips this tab's URL -
// including any `next` query param - before /confirm's own script gets a
// chance to read it, since it runs during the supabase client plugin's
// (enforce: "pre") setup, ahead of the page component mounting. A `next`
// query param on the OAuth redirectTo URL is therefore not a reliable way
// to carry the intended post-sign-in destination through that round trip.
//
// sessionStorage survives it instead - this is a full-page redirect through
// the OAuth provider and back to this same tab/origin, not a reload of an
// unrelated context, so it's still there once Supabase finishes stripping
// the URL. Used by AuthModal (write, right before starting the OAuth
// redirect) and /confirm (read once, then cleared).
export const OAUTH_NEXT_PATH_KEY = 'king-library:oauth-next-path'
