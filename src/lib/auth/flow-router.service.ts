/**
 * Flow Router Service
 * Centralized logic for determining the next step in the onboarding/authentication flow
 * Single source of truth for post-authentication redirects
 */

import { getCurrentUser } from "../api/user";
import { getKycStatus } from "../api/kyc";
import { exchangesService } from "../api/exchanges.service";
import { apiRequest } from "../api/client";

export type FlowRoute =
  | "/onboarding/personal-info"
  | "/onboarding/kyc-verification"
  | "/onboarding/verification-status"
  | "/onboarding/choose-plan"
  | "/onboarding/account-type"
  | "/dashboard";

export interface FlowCheckResult {
  route: FlowRoute;
  reason: string;
}

/**
 * Determines the next route after authentication based on user state
 * Flow logic:
 * 1. Check KYC status:
 *    - No KYC record → Check personal info, if missing go to /onboarding/personal-info
 *    - No KYC record + has personal info → /onboarding/kyc-verification (start KYC)
 *    - KYC pending/review → /onboarding/verification-status
 *    - KYC approved → Continue to step 2
 * 2. Check exchange connection:
 *    - No connection → /onboarding/account-type
 *    - Has connection → /dashboard
 */
export async function determineNextRoute(): Promise<FlowCheckResult> {
  try {
    // Check if this is a new signup (isNewUser: true → personal-info)
    const isNewSignup = typeof window !== "undefined" && 
                        localStorage.getItem("quantivahq_is_new_signup") === "true";
    
    if (isNewSignup) {
      // Clear the flag after checking
      localStorage.removeItem("quantivahq_is_new_signup");
      return {
        route: "/onboarding/personal-info",
        reason: "New signup - collecting personal info",
      };
    }

    // Step 1: Check KYC status
    const currentUser = await getCurrentUser();
    
    // Check if personal info is complete (required before KYC)
    if (!currentUser.full_name || !currentUser.dob || !currentUser.nationality) {
      return {
        route: "/onboarding/personal-info",
        reason: "Personal information not completed",
      };
    }

    // Step 1: Check KYC status
    let kycStatus: "pending" | "approved" | "rejected" | "review" | null =
      currentUser.kyc_status || null;
    let hasKycRecord = false;
    let kycId: string | null = null;

    // If kyc_status is not available, try to get it from KYC endpoint
    if (!kycStatus || kycStatus === null) {
      try {
        const kycResponse = await getKycStatus();
        kycStatus = kycResponse.status;
        kycId = kycResponse.kyc_id;
        hasKycRecord = true;
      } catch (kycError: any) {
        // If KYC endpoint returns 404 or error, user hasn't started KYC
        if (
          kycError.message?.includes("404") ||
          kycError.message?.includes("not found")
        ) {
          hasKycRecord = false;
          kycStatus = null;
        } else {
          console.log("Error checking KYC status:", kycError);
          // On error, assume no KYC record
          kycStatus = null;
        }
      }
    } else {
      // If we have kyc_status, assume KYC record exists
      hasKycRecord = true;
    }

    const isKycApproved = kycStatus === "approved";
    const isKycUnderReview = kycStatus === "review"; // Sumsub onHold — manual review

    // onHold users are allowed to continue onboarding. Trading/withdrawals are
    // gated separately on the dashboard so they can set up their plan + exchange
    // while Sumsub's review team finishes their check (can take hours).
    if (!isKycApproved && !isKycUnderReview) {
      // pending → still in automated review; lock them on status page
      if (hasKycRecord && kycStatus === "pending") {
        return {
          route: "/onboarding/verification-status",
          reason: "KYC submitted, awaiting automated verification result",
        };
      }

      // rejected → show rejection screen (retry or delete-account UI)
      if (hasKycRecord && kycStatus === "rejected") {
        return {
          route: "/onboarding/verification-status",
          reason: "KYC rejected — show retry or delete-account UI",
        };
      }

      // No KYC record yet → launch the Sumsub SDK
      return {
        route: "/onboarding/kyc-verification",
        reason: "KYC not started, launching SDK verification",
      };
    }

    // Step 2: Subscription GET API – use hasPlan: true = skip choose-plan, hasPlan false/missing = show choose-plan
    let shouldShowChoosePlan = true;
    try {
      const subsData: any = await apiRequest({ path: "/subscriptions" });
      if (subsData?.hasPlan === true) {
        shouldShowChoosePlan = false;
      }
    } catch {
      // API fail – show choose-plan
    }
    if (shouldShowChoosePlan) {
      return {
        route: "/onboarding/choose-plan",
        reason: "KYC approved – hasPlan false, show choose-plan",
      };
    }

    // Step 3: Check exchange connection (only if KYC approved and plan chosen)
    let hasActiveConnection = false;
    let exchangeType: "crypto" | "stocks" | null = null;
    try {
      const connectionResponse = await exchangesService.getActiveConnection();
      hasActiveConnection =
        connectionResponse.success &&
        connectionResponse.data !== null &&
        connectionResponse.data.status === "active";
      
      // Get exchange type from the active connection
      if (hasActiveConnection && connectionResponse.data?.exchange) {
        exchangeType = connectionResponse.data.exchange.type;
      }
    } catch (connectionError) {
      // No active connection found
      console.log("No active exchange connection found");
    }

    if (!hasActiveConnection) {
      return {
        route: "/onboarding/account-type",
        reason: "Plan chosen but no exchange connection",
      };
    }

    // All checks passed - user is fully onboarded
    // Route to unified dashboard (adapts based on connection type)
    return {
      route: "/dashboard",
      reason: `User is fully onboarded with ${exchangeType || 'crypto'} exchange connected`,
    };
  } catch (error: any) {
    // If checks fail, provide detailed error info
    console.error("[FlowRouter] Error determining next route:", error);
    console.error("[FlowRouter] Error details:", {
      message: error?.message,
      status: error?.status || error?.statusCode,
      stack: error?.stack,
    });
    
    // If it's a 401/unauthorized error, user needs to re-authenticate
    if (error?.status === 401 || error?.statusCode === 401 || 
        error?.message?.includes("401") || error?.message?.includes("Unauthorized")) {
      console.error("[FlowRouter] User not authenticated - cookies may not be set properly");
      console.error("[FlowRouter] This may be due to:");
      console.error("  - Cookies not being sent (check sameSite/secure settings)");
      console.error("  - CORS credentials not enabled");
      console.error("  - Backend cookie settings mismatch with frontend");
      // Re-throw the error so calling code knows authentication failed
      throw error;
    }
    
    // For network errors or API failures, default to personal-info as safest starting point
    // This won't cause issues for KYC-approved users since personal-info page will redirect them
    console.warn("[FlowRouter] Defaulting to personal-info due to error checking user status");
    return {
      route: "/onboarding/personal-info",
      reason: `Error checking user status: ${error?.message || 'Unknown error'}`,
    };
  }
}

/**
 * Navigate to the next route in the flow
 * This is a convenience function that can be used with Next.js router
 * If a return path is stored (from AuthGuard redirect), it will be used instead
 */
export async function navigateToNextRoute(
  router: { push: (path: string) => void }
): Promise<void> {
  // Check if there's a stored return path (from AuthGuard redirect)
  // This happens when user was on a protected page, got redirected to login, and now is authenticated
  if (typeof window !== "undefined") {
    const returnTo = sessionStorage.getItem('quantivahq_return_to');
    if (returnTo) {
      try {
        const decodedPath = decodeURIComponent(returnTo);
        // Validate the path is same-origin and starts with /dashboard
        const url = new URL(decodedPath, window.location.origin);
        if (url.origin === window.location.origin && url.pathname.startsWith('/dashboard')) {
          sessionStorage.removeItem('quantivahq_return_to'); // Clear after use
          router.push(url.pathname);
          return;
        }
      } catch (e) {
        // Invalid path — ignore
        sessionStorage.removeItem('quantivahq_return_to');
      }
    }
  }

  // No stored return path, use normal flow logic
  const result = await determineNextRoute();
  router.push(result.route);
}

