/**
 * Flow Router Service
 * Centralized logic for determining the next step in the onboarding/authentication flow
 * Single source of truth for post-authentication redirects
 */

import { getCurrentUser } from "../api/user";
import { getKycStatus } from "../api/kyc";
import { exchangesService } from "../api/exchanges.service";

export type FlowRoute =
  | "/onboarding/proof-upload"
  | "/onboarding/verification-status"
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
 *    - No KYC record → /onboarding/proof-upload (start KYC)
 *    - KYC pending/review → /onboarding/verification-status
 *    - KYC approved → Continue to step 2
 * 2. Check exchange connection:
 *    - No connection → /onboarding/account-type
 *    - Has connection → /dashboard
 */
export async function determineNextRoute(): Promise<FlowCheckResult> {
  try {
    // Step 1: Check KYC status
    const currentUser = await getCurrentUser();
    let kycStatus: "pending" | "approved" | "rejected" | "review" | null =
      currentUser.kyc_status || null;
    let hasKycRecord = false;

    // If kyc_status is not available, try to get it from KYC endpoint
    if (!kycStatus || kycStatus === null) {
      try {
        const kycResponse = await getKycStatus();
        kycStatus = kycResponse.status;
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

    if (!isKycApproved) {
      // KYC is not approved, check if KYC record exists
      if (hasKycRecord) {
        return {
          route: "/onboarding/verification-status",
          reason: "KYC record exists but not approved",
        };
      } else {
        // No KYC record, start KYC flow
        return {
          route: "/onboarding/proof-upload",
          reason: "No KYC record found, starting KYC process",
        };
      }
    }

    // Step 2: Check exchange connection (only if KYC is approved)
    let hasActiveConnection = false;
    try {
      const connectionResponse = await exchangesService.getActiveConnection();
      hasActiveConnection =
        connectionResponse.success &&
        connectionResponse.data !== null &&
        connectionResponse.data.status === "active";
    } catch (connectionError) {
      // No active connection found
      console.log("No active exchange connection found");
    }

    if (!hasActiveConnection) {
      return {
        route: "/onboarding/account-type",
        reason: "KYC approved but no exchange connection",
      };
    }

    // All checks passed - user is fully onboarded
    return {
      route: "/dashboard",
      reason: "User is fully onboarded with KYC approved and exchange connected",
    };
  } catch (error: any) {
    // If checks fail, default to proof-upload (KYC start)
    console.error("[FlowRouter] Could not verify user status:", error);
    
    // If it's a 401/unauthorized error, user needs to re-authenticate
    if (error?.status === 401 || error?.statusCode === 401 || 
        error?.message?.includes("401") || error?.message?.includes("Unauthorized")) {
      console.error("[FlowRouter] User not authenticated - cookies may not be set properly");
    }
    
    return {
      route: "/onboarding/proof-upload",
      reason: "Error checking user status, defaulting to proof upload",
    };
  }
}

/**
 * Navigate to the next route in the flow
 * This is a convenience function that can be used with Next.js router
 */
export async function navigateToNextRoute(
  router: { push: (path: string) => void }
): Promise<void> {
  const result = await determineNextRoute();
  console.log(`Flow router: ${result.reason} → ${result.route}`);
  router.push(result.route);
}

