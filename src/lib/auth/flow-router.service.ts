/**
 * Flow Router Service
 *
 * Post-authentication routing helpers for the dashboard-first onboarding model.
 *
 * Old behavior (removed): march users through Personal Info → KYC →
 * Choose Plan → Exchange before letting them see the dashboard.
 *
 * New behavior: every authenticated user lands on /dashboard. The dashboard
 * widget reads /onboarding/progress and offers a CTA into the next incomplete
 * step. The onboarding pages are still used, but as deep-links — they accept
 * a ?return=/dashboard query so they jump back to the dashboard after
 * completion instead of advancing to the next gated step.
 *
 * The single exception is FINAL-rejected KYC, which still routes to
 * /onboarding/verification-status because the dashboard isn't usable without
 * the delete-account UX surfaced.
 */

import { getKycStatus } from "../api/kyc";

export type FlowRoute =
  | "/onboarding/personal-info"
  | "/onboarding/kyc-verification"
  | "/onboarding/verification-status"
  | "/onboarding/choose-plan"
  | "/onboarding/account-type"
  | "/dashboard";

/**
 * Validates a `?return=` query value. Only same-origin paths under /dashboard
 * are accepted, so a redirect can't be hijacked to point at an external host.
 * Returns the safe pathname or null. Safe to call during SSR (returns null).
 */
export function safeReturnPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (typeof window === "undefined") return null;
  try {
    const decoded = decodeURIComponent(raw);
    const url = new URL(decoded, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    if (!url.pathname.startsWith("/dashboard")) return null;
    return url.pathname + url.search + url.hash;
  } catch {
    return null;
  }
}

/**
 * After login / signup / 2FA, route to /dashboard unless the user is in
 * FINAL-rejected KYC, where the only legitimate destination is the
 * delete-account UX. Any other state (no KYC record, pending, RETRY) is
 * fine for the dashboard — the widget will surface the next action.
 *
 * Returns null on hard auth errors (caller should treat as "not logged in").
 */
export async function getDashboardEntryRoute(): Promise<FlowRoute> {
  try {
    const kyc = await getKycStatus().catch(() => null);
    if (
      kyc &&
      kyc.status === "rejected" &&
      ((kyc as any).review_reject_type === "FINAL")
    ) {
      return "/onboarding/verification-status";
    }
  } catch {
    // Any error reading KYC → assume the user can proceed to dashboard.
    // The dashboard widget polls /onboarding/progress and will surface the
    // FINAL-rejected state if it shows up later.
  }
  return "/dashboard";
}

/**
 * Pure function used by the dashboard widget's "Continue setup" CTA.
 * Given a progress payload, returns the route for the next incomplete step.
 * If everything is complete, returns null (widget should hide itself).
 *
 * Subscription is "complete" when the user has either upgraded (is_paid) or
 * explicitly clicked "Skip — stay on Free" (acknowledged).
 *
 * Important: this does NOT enforce ordering between steps — the user can
 * jump into any step from the widget. The order here is just the default
 * "Continue setup" target; individual step pills in the widget link
 * directly to their own routes.
 */
export interface OnboardingProgressShape {
  personal_info: { complete: boolean };
  kyc: {
    status: "pending" | "approved" | "rejected" | "review";
    review_reject_type: "RETRY" | "FINAL" | null;
    has_submission: boolean;
    rejection_reasons?: string[];
  };
  subscription: {
    tier: "FREE" | "PRO" | "ELITE" | "ELITE_PLUS";
    is_paid: boolean;
    acknowledged: boolean;
  };
  exchange: { connected: boolean; type: "crypto" | "stocks" | null };
}

export function getNextOnboardingStepRoute(
  progress: OnboardingProgressShape,
): FlowRoute | null {
  if (!progress.personal_info.complete) {
    return "/onboarding/personal-info";
  }
  if (progress.kyc.status === "rejected" && progress.kyc.review_reject_type === "FINAL") {
    return "/onboarding/verification-status";
  }
  if (progress.kyc.status !== "approved") {
    return "/onboarding/kyc-verification";
  }
  const subscriptionDone = progress.subscription.is_paid || progress.subscription.acknowledged;
  if (!subscriptionDone) {
    return "/onboarding/choose-plan";
  }
  if (!progress.exchange.connected) {
    return "/onboarding/account-type";
  }
  return null;
}

/**
 * Convenience for sign-up / login / 2FA / per-step pages: navigate to the
 * dashboard (or the FINAL-rejection route). Honors, in priority order:
 *   1. ?return=/dashboard query param on the current URL — used when a step
 *      page was opened from the dashboard widget and should jump back to it
 *      after completion.
 *   2. sessionStorage `quantivahq_return_to` — set by AuthGuard when an
 *      authenticated user gets bumped off a /dashboard route to login.
 *   3. Default: /dashboard (or /onboarding/verification-status for FINAL KYC).
 */
export async function navigateToDashboard(
  router: { push: (path: string) => void },
): Promise<void> {
  if (typeof window !== "undefined") {
    const queryReturn = new URLSearchParams(window.location.search).get("return");
    const queryPath = safeReturnPath(queryReturn);
    if (queryPath) {
      router.push(queryPath);
      return;
    }

    const returnTo = sessionStorage.getItem("quantivahq_return_to");
    if (returnTo) {
      const safePath = safeReturnPath(returnTo);
      if (safePath) {
        sessionStorage.removeItem("quantivahq_return_to");
        router.push(safePath);
        return;
      }
      sessionStorage.removeItem("quantivahq_return_to");
    }
  }
  const route = await getDashboardEntryRoute();
  router.push(route);
}
