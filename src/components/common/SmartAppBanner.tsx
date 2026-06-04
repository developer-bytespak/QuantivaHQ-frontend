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
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 to-black p-3 shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.6)]">
        {/* App icon */}
        <img
          src="/icon.svg"
          alt="Quantiva"
          className="h-11 w-11 shrink-0 rounded-xl border border-white/10 bg-white/[0.04] p-1.5"
        />

        {/* Copy */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            Quantiva is better in the app
          </p>
          <p className="truncate text-[11px] text-slate-400">
            Faster trading, alerts &amp; a smoother experience.
          </p>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 flex-col gap-1.5">
          <button
            onClick={openApp}
            className="rounded-lg bg-gradient-to-r from-orange-500 via-orange-400 to-amber-300 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-lg shadow-orange-500/30 transition-all hover:shadow-orange-500/50"
          >
            Go to Quantiva app
          </button>
          <button
            onClick={dismiss}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-slate-200"
          >
            Continue on browser
          </button>
        </div>
      </div>
    </div>
  );
}
