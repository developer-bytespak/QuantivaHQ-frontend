export {};

declare global {
  interface Window {
    fbq?: (
      command: "init" | "track" | "trackCustom" | "consent",
      eventOrPixelId: string,
      params?: Record<string, unknown>,
    ) => void;
    _fbq?: unknown;
  }
}
