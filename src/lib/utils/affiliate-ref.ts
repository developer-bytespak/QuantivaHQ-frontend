/**
 * Affiliate referral cookie helpers.
 *
 * Cookie name and max-age must match `middleware.ts` (the only writer) and the
 * backend's expected payload field on `/auth/register` (`referralCode`).
 */

export const AFFILIATE_REF_COOKIE = "quantivahq_affiliate_ref";
export const AFFILIATE_REF_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

/**
 * Read the affiliate referral code from the browser's cookie jar. Returns
 * `undefined` when there is no cookie, when the value is empty, or when called
 * during SSR (no `document`).
 */
export function getAffiliateRef(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const row = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${AFFILIATE_REF_COOKIE}=`));
  if (!row) return undefined;
  const value = decodeURIComponent(row.split("=")[1] ?? "").trim();
  return value || undefined;
}

/**
 * Clear the affiliate ref cookie. Call after successful signup so the same
 * cookie does not silently re-attribute future signups from the same browser.
 */
export function clearAffiliateRef(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${AFFILIATE_REF_COOKIE}=; max-age=0; path=/; sameSite=lax`;
}
