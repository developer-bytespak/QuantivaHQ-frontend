/**
 * Validates that a URL is safe to use as an image source.
 * Prevents XSS via javascript:, data:text/html, or other dangerous protocols.
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url, window.location.origin);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validates a redirect path is same-origin and matches an expected prefix.
 * Prevents open-redirect attacks via protocol-relative URLs or path confusion.
 */
export function getSafeRedirect(
  returnTo: string | null,
  fallback: string,
  allowedPrefix: string
): string {
  if (!returnTo) return fallback;
  try {
    const url = new URL(returnTo, window.location.origin);
    // Must be same origin and start with expected prefix
    if (url.origin !== window.location.origin) return fallback;
    if (!url.pathname.startsWith(allowedPrefix)) return fallback;
    // Return only the pathname to prevent protocol-relative redirects
    return url.pathname;
  } catch {
    return fallback;
  }
}
