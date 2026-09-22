// Only accept an internal, single-leading-slash path - never a full URL - so a crafted
// ?next= query param can't be used to redirect a signed-in visitor off-site.
export function safeNextPath(value: unknown, fallback = '/'): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
    return fallback
  }

  return value
}
