/**
 * Production-safe logger that only outputs in development mode.
 * Replaces direct console.log/warn/error calls to prevent sensitive data leakage in production.
 */
const isDev = process.env.NODE_ENV === "development";

export const logger = {
  info: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    if (isDev) console.error(...args);
  },
  debug: (...args: unknown[]) => {
    if (isDev) console.debug(...args);
  },
};
