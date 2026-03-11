/**
 * API error message extraction for consistent user-facing messages.
 * Handles axios-style errors and backend response shapes (string or array).
 */
export function getApiErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (err == null) return fallback;
  const anyErr = err as { response?: { data?: { message?: string | string[] } }; message?: string };
  const msg = anyErr.response?.data?.message;
  if (typeof msg === "string" && msg.trim()) return msg.trim();
  if (Array.isArray(msg) && msg.length > 0 && typeof msg[0] === "string") return msg[0].trim();
  if (typeof anyErr.message === "string" && anyErr.message.trim()) return anyErr.message.trim();
  return fallback;
}
