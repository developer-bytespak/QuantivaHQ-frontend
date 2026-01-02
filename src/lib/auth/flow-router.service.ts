/**
 * Flow Router Service
 * Centralized logic for determining the next step in the onboarding/authentication flow
 * Single source of truth for post-authentication redirects
 */

import { getCurrentUser } from "../api/user";
import { getKycStatus } from "../api/kyc";
import { exchangesService } from "../api/exchanges.service";

export type FlowRoute =
  | "/onboarding/personal-info"
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
 *    - No KYC record → Check personal info, if missing go to /onboarding/personal-info
 *    - No KYC record + has personal info → /onboarding/proof-upload (start KYC)
 *    - KYC pending/review → /onboarding/verification-status
 *    - KYC approved → Continue to step 2
 * 2. Check exchange connection:
 *    - No connection → /onboarding/account-type
 *    - Has connection → /dashboard
 */
export async function determineNextRoute(): Promise<FlowCheckResult> {
  try {
    // Check if this is a new signup (always show personal-info for new signups)
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

    if (!isKycApproved) {
      // KYC is not approved, check if KYC record exists
      if (hasKycRecord && kycId) {
        // Check if documents have been uploaded
        try {
          const { getVerificationDetails } = await import("../api/kyc");
          const verification = await getVerificationDetails(kycId);
          
          const hasDocuments = verification.documents && verification.documents.length > 0;
          const hasFaceMatch = verification.face_matches && verification.face_matches.length > 0;
          
          if (!hasDocuments || !hasFaceMatch) {
            // KYC record exists but no documents uploaded yet
            return {
              route: "/onboarding/proof-upload",
              reason: "KYC record exists but documents not uploaded",
            };
          }
          
          // Documents uploaded, show verification status
          return {
            route: "/onboarding/verification-status",
            reason: "KYC documents uploaded, pending verification",
          };
        } catch (verifyError) {
          console.log("Error checking verification details:", verifyError);
          // If we can't get verification details, default to proof upload
          return {
            route: "/onboarding/proof-upload",
            reason: "Cannot verify document upload status",
          };
        }
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
        reason: "KYC approved but no exchange connection",
      };
    }

    // All checks passed - user is fully onboarded
    // Route to unified dashboard (adapts based on connection type)
    return {
      route: "/dashboard",
      reason: `User is fully onboarded with ${exchangeType || 'crypto'} exchange connected`,
    };
  } catch (error: any) {
    // If checks fail, default to proof-upload (KYC start)
    console.error("[FlowRouter] Could not verify user status:", error);
    
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
    
    return {
      route: "/onboarding/personal-info",
      reason: "Error checking user status, defaulting to personal info",
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

