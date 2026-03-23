/**
 * API error message extraction for consistent user-facing messages.
 * Handles axios-style errors and backend response shapes (string or array).
 * Checks all common backend error fields: message, error, detail, msg.
 */
export function getApiErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (err == null) return fallback;
  const anyErr = err as {
    response?: { data?: { message?: string | string[]; error?: string; detail?: string | { msg: string }[]; msg?: string } };
    message?: string;
  };
  const data = anyErr.response?.data;
  if (data) {
    // message field (string or array)
    if (typeof data.message === "string" && data.message.trim()) return data.message.trim();
    if (Array.isArray(data.message) && data.message.length > 0 && typeof data.message[0] === "string")
      return (data.message[0] as string).trim();
    // error field
    if (typeof data.error === "string" && data.error.trim()) return data.error.trim();
    // detail field (FastAPI / DRF style — can be a string or array of validation objects)
    if (typeof data.detail === "string" && data.detail.trim()) return data.detail.trim();
    if (Array.isArray(data.detail) && data.detail.length > 0) {
      const first = data.detail[0];
      if (typeof first === "object" && first !== null && typeof (first as { msg: string }).msg === "string")
        return (first as { msg: string }).msg.trim();
    }
    // msg field
    if (typeof data.msg === "string" && data.msg.trim()) return data.msg.trim();
  }
  if (typeof anyErr.message === "string" && anyErr.message.trim()) return anyErr.message.trim();
  return fallback;
}
