"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { affiliateMe } from "@/lib/api/affiliate";

// Where the affiliate logs into their newly-created platform (trading) account.
const LOGIN_URL = "/onboarding/sign-up?tab=login";

/**
 * Shown on the affiliate dashboard once the affiliate is APPROVED and the
 * approval flow has provisioned their platform user account (linked_user_id is
 * set). Tells them the account was created with the same email/password and
 * upgraded to Elite Plus, and points them at login to finish onboarding.
 *
 * Self-fetches the affiliate profile so the dashboard page needs no changes
 * beyond rendering it. Dismissible (persisted per-affiliate in localStorage).
 */
export function AccountProvisionedBanner() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [dismissKey, setDismissKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    affiliateMe()
      .then((me) => {
        if (cancelled) return;
        if (me.status === "APPROVED" && me.linked_user_id) {
          const key = `affiliate_acct_banner_dismissed_${me.affiliate_id}`;
          setDismissKey(key);
          setEmail(me.email);
          if (
            typeof window !== "undefined" &&
            localStorage.getItem(key) !== "1"
          ) {
            setShow(true);
          }
        }
      })
      .catch(() => {
        // Non-critical — if the profile fetch fails we simply don't show it.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!show) return null;

  const dismiss = () => {
    if (dismissKey && typeof window !== "undefined") {
      localStorage.setItem(dismissKey, "1");
    }
    setShow(false);
  };

  return (
    <div className="space-y-3">
      <div className="relative rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 sm:p-5">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute right-3 top-3 text-emerald-300/70 transition hover:text-emerald-200"
        >
          ✕
        </button>
        <div className="flex items-start gap-3 pr-6">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
            ✓
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-emerald-100">
              Your QuantivaHQ trading account is ready
            </p>
            <p className="text-sm leading-relaxed text-emerald-200/90">
              We&apos;ve created a platform account for you using the same email
              {email ? ` (${email})` : ""} and password you signed up with, and
              upgraded it to{" "}
              <span className="font-semibold text-emerald-100">Elite Plus</span>{" "}
              for 30 days. Log in and complete the onboarding to start using it.
            </p>
            <div className="pt-1">
              <Link
                href={LOGIN_URL}
                className="inline-block rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Log in &amp; finish onboarding
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-300">
            !
          </div>
          <p className="text-sm leading-relaxed text-amber-200/90">
            <span className="font-semibold text-amber-100">Note:</span>{" "}
            Update your payment information in the{" "}
            <Link
              href="/affiliate/settings"
              className="font-semibold text-amber-100 underline underline-offset-2 hover:text-white"
            >
              settings
            </Link>{" "}
            section.
          </p>
        </div>
      </div>
    </div>
  );
}
