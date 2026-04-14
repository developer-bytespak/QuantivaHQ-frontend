/**
 * Region-based subscription restrictions.
 * Binance.US does not support European Options trading,
 * so US users cannot subscribe to ELITE_PLUS.
 */

const US_NATIONALITY_VALUES = [
  "United States",
  "United States of America",
  "USA",
  "US",
];

/**
 * Check if a nationality string identifies a US resident.
 * Case-insensitive.
 */
export function isUSNationality(nationality: string | null | undefined): boolean {
  if (!nationality) return false;
  const normalized = nationality.trim().toLowerCase();
  return US_NATIONALITY_VALUES.some((v) => v.toLowerCase() === normalized);
}

/**
 * Check if user is from the US during onboarding (reads from localStorage).
 */
export function isUSUserFromOnboarding(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem("quantivahq_personal_info");
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return isUSNationality(parsed?.nationality);
  } catch {
    return false;
  }
}

/**
 * Standard error message shown when a US user tries to access ELITE_PLUS.
 */
export const ELITE_PLUS_US_BLOCK_MESSAGE =
  "ELITE Plus is not available in the United States. Binance.US does not support options trading.";
