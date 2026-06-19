"use client";

import { useEffect, useState } from "react";

// ── Config ────────────────────────────────────────────────────────────────────
// Deep-link scheme + store targets. The custom scheme `quantivahq://` is
// registered on both platforms (Android: AndroidManifest VIEW intent-filter,
// iOS: CFBundleURLSchemes). Android package + iOS App Store id come from the
// published builds.
//
// NOTE: the App Store numeric id is NOT in the repo — set it via
// NEXT_PUBLIC_APP_STORE_URL (e.g. https://apps.apple.com/app/id1234567890)
// or replace the placeholder below.
const APP_SCHEME_URL = "quantivahq://";
const ANDROID_PACKAGE = "com.quantivahq";

const PLAY_STORE_URL =
  process.env.NEXT_PUBLIC_PLAY_STORE_URL ||
  `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;

const APP_STORE_URL =
  process.env.NEXT_PUBLIC_APP_STORE_URL ||
  "https://apps.apple.com/app/idXXXXXXXXXX"; // TODO: set real App Store id

// Android intent URL: Chrome opens the app if installed (scheme + package),
// and auto-redirects to `browser_fallback_url` (Play Store) if it isn't —
// no timers needed on Android.
const ANDROID_INTENT_URL =
  `intent://open#Intent;scheme=quantivahq;package=${ANDROID_PACKAGE};` +
  `S.browser_fallback_url=${encodeURIComponent(PLAY_STORE_URL)};end`;

// Don't nag: once dismissed, stay quiet for this long.
const DISMISS_KEY = "qhq_app_banner_dismissed_at";
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type Platform = "ios" | "android";

// ── Component ──────────────────────────────────────────────────────────────────

export function SmartAppBanner() {
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || "";
    const isIOS =
      /iphone|ipad|ipod/i.test(ua) ||
      // iPadOS 13+ reports as MacIntel but has touch
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isAndroid = /android/i.test(ua);

    // Desktop → never show.
    if (!isIOS && !isAndroid) return;

    // Already running as an installed PWA → no point nudging to the app.
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    // Recently dismissed → respect the user's choice.
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_TTL_MS) return;

    setPlatform(isAndroid ? "android" : "ios");
    // Slide up shortly after load so it doesn't fight the first paint.
    const t = window.setTimeout(() => setVisible(true), 700);
    return () => window.clearTimeout(t);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* private mode — fine, banner just reappears next visit */
    }
    setVisible(false);
  };

  const openApp = () => {
    if (platform === "android") {
      // Opens the app, or falls back to the Play Store automatically.
      window.location.href = ANDROID_INTENT_URL;
      dismiss();
      return;
    }

    // iOS: try the scheme; if the app doesn't take over (not installed), the
    // page stays visible and we send the user to the App Store. If the app
    // DOES open, the tab is backgrounded → cancel the store redirect.
    const fallbackTimer = window.setTimeout(() => {
      window.location.href = APP_STORE_URL;
    }, 1600);
    const cancelOnHide = () => {
      if (document.hidden) window.clearTimeout(fallbackTimer);
    };
    document.addEventListener("visibilitychange", cancelOnHide, { once: true });
    window.location.href = APP_SCHEME_URL;
    dismiss();
  };

  if (!platform) return null;

  return (
    <div
      role="dialog"
      aria-label="Open in the Quantiva app"
      className={`fixed inset-x-0 bottom-0 z-[9990] px-3 pb-[calc(env(safe-area-inset-bottom)_+_12px)] pt-3 transition-transform duration-300 ease-out ${
        visible ? "translate-y-0" : "translate-y-[120%]"
      }`}
    >
      <div className="relative mx-auto max-w-md overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 to-black p-4 shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.6)]">
        {/* Soft brand glow */}
        <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-[rgba(var(--primary-rgb),0.18)] blur-2xl" />

        {/* Close */}
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-slate-200"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {/* Header: icon + copy */}
        <div className="flex items-center gap-3.5 pr-7">
          <img
            src="/icon.svg"
            alt="Quantiva"
            className="h-12 w-12 shrink-0 rounded-xl border border-white/10 bg-white/[0.04] p-1.5"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight text-white">
              Quantiva is better in the app
            </p>
            <p className="mt-1 text-xs leading-snug text-slate-400">
              Faster trading, instant alerts &amp; a smoother experience.
            </p>
          </div>
        </div>

        {/* Actions */}
        <button
          onClick={openApp}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] px-4 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-[rgba(var(--primary-rgb),0.35)] transition-all active:scale-[0.99]"
        >
          Open in the app
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
        <button
          onClick={dismiss}
          className="mt-2 w-full py-1 text-center text-xs font-medium text-slate-500 transition-colors hover:text-slate-300"
        >
          Continue on browser
        </button>
      </div>
    </div>
  );
}
