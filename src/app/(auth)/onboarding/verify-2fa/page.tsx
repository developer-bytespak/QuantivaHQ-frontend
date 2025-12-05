"use client";

import { useRouter } from "next/navigation";
import { QuantivaLogo } from "@/components/common/quantiva-logo";
import { BackButton } from "@/components/common/back-button";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api/client";
import { getKycStatus } from "@/lib/api/kyc";
import { exchangesService } from "@/lib/api/exchanges.service";
import { getUserProfile } from "@/lib/api/user";

export default function Verify2FAPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    // Get email/username from localStorage (set during login)
    const email = localStorage.getItem("quantivahq_pending_email");
    if (email) {
      setEmailOrUsername(email);
    }
  }, []);

  useEffect(() => {
    // Resend cooldown timer
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!code || code.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    if (!emailOrUsername) {
      setError("Email or username is required");
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiRequest<{
        emailOrUsername: string;
        code: string;
      }>({
        path: "/auth/verify-2fa",
        method: "POST",
        body: {
          emailOrUsername,
          code,
        },
        credentials: "include",
      });

      // Store user info
      const userData = (response as any).user;
      localStorage.setItem("quantivahq_user_email", userData.email);
      localStorage.setItem("quantivahq_user_name", userData.username);
      localStorage.setItem("quantivahq_user_id", userData.user_id);
      localStorage.setItem("quantivahq_is_authenticated", "true");
      localStorage.removeItem("quantivahq_pending_email");

      // Determine where to redirect based on user's onboarding status
      try {
        // Get user info from auth/me endpoint (includes kyc_status)
        const { getCurrentUser } = await import("@/lib/api/user");
        const currentUser = await getCurrentUser();
        
        // Get full user profile to check personal info
        const userProfile = await getUserProfile();
        
        // Check if personal info is complete (required fields: full_name, dob, nationality)
        const hasPersonalInfo = !!(userProfile.full_name && userProfile.dob && userProfile.nationality);
        
        // Check KYC status - first from currentUser (auth/me), then from KYC endpoint if needed
        let kycStatus: "pending" | "approved" | "rejected" | "review" | null = currentUser.kyc_status || null;
        let hasKycRecord = false;
        
        // If kyc_status is not available or is null, try to get it from KYC endpoint
        if (!kycStatus || kycStatus === null) {
          try {
            const kycResponse = await getKycStatus();
            kycStatus = kycResponse.status;
            hasKycRecord = true;
          } catch (kycError: any) {
            // If KYC endpoint returns 404 or error, user hasn't started KYC
            if (kycError.message?.includes("404") || kycError.message?.includes("not found")) {
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
        
        // Debug logging
        console.log("KYC Status Check:", {
          fromProfile: currentUser.kyc_status,
          finalStatus: kycStatus,
          hasKycRecord,
          hasPersonalInfo,
        });
        
        // Check exchange connection
        let hasActiveConnection = false;
        try {
          const connectionResponse = await exchangesService.getActiveConnection();
          hasActiveConnection = connectionResponse.success && 
                                connectionResponse.data !== null && 
                                connectionResponse.data.status === "active";
        } catch (connectionError) {
          // No active connection found
          console.log("No active exchange connection found");
        }

        // Redirect logic:
        // 1. If personal info is missing → personal-info page
        if (!hasPersonalInfo) {
          console.log("Redirecting: Personal info missing");
          router.push("/onboarding/personal-info");
          return;
        }

        // 2. Check KYC status and redirect accordingly
        const isKycApproved = kycStatus === "approved";
        
        if (isKycApproved) {
          // KYC is approved, check exchange connection
          if (hasActiveConnection) {
            console.log("Redirecting: KYC approved + Exchange connected → Dashboard");
            router.push("/dashboard");
            return;
          } else {
            console.log("Redirecting: KYC approved but no exchange → Account type");
            router.push("/onboarding/account-type");
            return;
          }
        } else {
          // KYC is not approved, check if KYC record exists
          if (hasKycRecord) {
            console.log("Redirecting: KYC record exists but not approved → Verification status");
            router.push("/onboarding/verification-status");
            return;
          } else {
            // No KYC record, start KYC flow (document upload comes before selfie)
            console.log("Redirecting: No KYC record → Proof upload");
            router.push("/onboarding/proof-upload");
            return;
          }
        }
      } catch (checkError) {
        // If checks fail, assume new user and go to personal-info
        console.log("Could not verify user status, redirecting to personal-info:", checkError);
        router.push("/onboarding/personal-info");
      }
    } catch (error: any) {
      setError(error.message || "Invalid verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || !emailOrUsername) return;

    setError("");
    setIsLoading(true);

    try {
      // Re-login to trigger new 2FA code
      const password = localStorage.getItem("quantivahq_pending_password");
      if (!password) {
        setError("Please go back and login again");
        setIsLoading(false);
        return;
      }

      await apiRequest<{
        emailOrUsername: string;
        password: string;
      }>({
        path: "/auth/login",
        method: "POST",
        body: {
          emailOrUsername,
          password,
        },
      });

      setResendCooldown(60); // 60 second cooldown
      setError(""); // Clear any previous errors
    } catch (error: any) {
      setError(error.message || "Failed to resend code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      <BackButton />
      {/* Background */}
      <div className="absolute inset-0 bg-black">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full w-full items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center">
              <QuantivaLogo className="h-12 w-12 md:h-14 md:w-14" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-white">Verify Your Email</h1>
            <p className="text-sm text-slate-400">
              Enter the 6-digit code sent to <span className="text-white font-medium">{emailOrUsername}</span>
            </p>
          </div>

          <div className="rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="code" className="mb-2 block text-sm font-medium text-white">
                  Verification Code
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setCode(value);
                  }}
                  className="w-full rounded-xl border-2 border-[--color-border] bg-[--color-surface] px-4 py-3 text-center text-2xl font-bold tracking-widest text-white placeholder-slate-500 focus:border-[#fc4f02] focus:outline-none focus:ring-4 focus:ring-[#fc4f02]/20"
                  placeholder="000000"
                  maxLength={6}
                  required
                  autoFocus
                />
                <p className="mt-2 text-xs text-slate-400">
                  Check your email for the verification code
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-3 rounded-xl border border-red-500/50 bg-gradient-to-r from-red-500/10 to-red-500/5 px-4 py-3 backdrop-blur">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-500/20">
                    <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || code.length !== 6}
                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#fc4f02]/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify Code
                      <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </span>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || isLoading}
                  className="text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : "Didn't receive code? Resend"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

