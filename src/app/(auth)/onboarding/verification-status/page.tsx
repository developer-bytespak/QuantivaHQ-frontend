"use client";

import { useRouter } from "next/navigation";
import { QuantivaLogo } from "@/components/common/quantiva-logo";
import { useState, useEffect, useRef } from "react";
import { getKycStatus, submitVerification } from "@/lib/api/kyc";
import type { KycStatus } from "@/lib/api/types/kyc";

type VerificationStatus = KycStatus;

export default function VerificationStatusPage() {
  const router = useRouter();
  const [status, setStatus] = useState<VerificationStatus>("pending");
  const [isLoading, setIsLoading] = useState(false);
  const [kycData, setKycData] = useState<{
    kyc_id: string | null;
    decision_reason?: string;
    liveness_result?: string;
    liveness_confidence?: number;
    face_match_score?: number;
    doc_authenticity_score?: number;
  } | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxPollingAttempts = 60; // Poll for up to 5 minutes (60 * 5 seconds)
  const pollingAttemptsRef = useRef(0);

  const checkStatus = async () => {
    try {
      setIsLoading(true);
      const response = await getKycStatus();
      setStatus(response.status);
      setKycData({
        kyc_id: response.kyc_id,
        decision_reason: response.decision_reason,
        liveness_result: response.liveness_result,
        liveness_confidence: response.liveness_confidence,
        face_match_score: response.face_match_score,
        doc_authenticity_score: response.doc_authenticity_score,
      });

      // Stop polling if status is not pending
      if (response.status !== "pending") {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        pollingAttemptsRef.current = 0;
        
        // Auto-redirect when approved using flow router
        if (response.status === "approved") {
          setTimeout(async () => {
            const { navigateToNextRoute } = await import("@/lib/auth/flow-router.service");
            await navigateToNextRoute(router);
          }, 1500); // Small delay to show success message
        }
      }
    } catch (err) {
      console.error("Failed to fetch KYC status:", err);
      // On error, check localStorage as fallback
      const savedStatus = localStorage.getItem("quantivahq_verification_status") as VerificationStatus | null;
      if (savedStatus && ["pending", "approved", "rejected", "review"].includes(savedStatus)) {
        setStatus(savedStatus);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check if verification data exists
    const selfieData = localStorage.getItem("quantivahq_selfie");
    const proofData = localStorage.getItem("quantivahq_proof_upload");
    
    if (!selfieData || !proofData) {
      // If data is missing, redirect back to proof upload
      router.push("/onboarding/proof-upload");
      return;
    }

    // Initial status check
    checkStatus();

    // Set up polling for pending status
    const startPolling = () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      pollingIntervalRef.current = setInterval(() => {
        pollingAttemptsRef.current++;
        
        // Stop polling after max attempts
        if (pollingAttemptsRef.current >= maxPollingAttempts) {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          return;
        }

        // Only poll if status is still pending
        if (status === "pending") {
          checkStatus();
        } else {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
      }, 5000); // Poll every 5 seconds
    };

    // Start polling if status is pending
    if (status === "pending") {
      startPolling();
    }

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [router, status]);

  const handleRetry = () => {
    // Clear verification data and redirect to proof upload
    localStorage.removeItem("quantivahq_verification_status");
    localStorage.removeItem("quantivahq_proof_upload");
    localStorage.removeItem("quantivahq_selfie");
    
    // Stop polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    router.push("/onboarding/proof-upload");
  };

  const handleSubmitVerification = async () => {
    try {
      setIsLoading(true);
      await submitVerification();
      // Refresh status after submission
      await checkStatus();
    } catch (err) {
      console.error("Failed to submit verification:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusConfig = () => {
    switch (status) {
      case "approved":
        return {
          badge: "Verified",
          badgeColor: "bg-gradient-to-r from-[#10b981] to-[#34d399]",
          badgeText: "text-white",
          icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          message: "Your identity has been successfully verified!",
          description: "You can now proceed to set up your trading account.",
          progress: 100,
        };
      case "rejected":
        return {
          badge: "Rejected",
          badgeColor: "bg-gradient-to-r from-red-500 to-red-600",
          badgeText: "text-white",
          icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ),
          message: "Verification was not successful",
          description: kycData?.decision_reason || "Please review the requirements and try again with clearer documents.",
          progress: 0,
        };
      case "review":
        return {
          badge: "Under Review",
          badgeColor: "bg-gradient-to-r from-blue-500 to-blue-600",
          badgeText: "text-white",
          icon: (
            <svg className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ),
          message: "Your verification is under manual review",
          description: kycData?.decision_reason || "Our team is reviewing your documents. This may take longer.",
          progress: 75,
        };
      default: // pending
        return {
          badge: "Pending",
          badgeColor: "bg-gradient-to-r from-yellow-500 to-yellow-600",
          badgeText: "text-white",
          icon: (
            <svg className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ),
          message: "Your verification is under review",
          description: "We're processing your documents. This usually takes a few minutes.",
          progress: 50,
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      {/* Background matching Figma design */}
      <div className="absolute inset-0 bg-black">
        {/* Subtle gradient orbs for depth */}
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" style={{ animationDelay: "0.5s" }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center overflow-hidden px-4 pt-6 pb-6 sm:px-6 sm:pt-8 sm:pb-8 lg:px-8">
        <div className="w-full max-w-2xl">
          {/* Header Section */}
          <div className="mb-6 text-center">
            <div className="mb-3 flex justify-center animate-logo-enter">
              <QuantivaLogo className="h-12 w-12 md:h-14 md:w-14" />
            </div>
            <h1 className="mb-2 text-xl font-bold tracking-tight text-white md:text-2xl lg:text-3xl animate-text-enter" style={{ animationDelay: "0.2s" }}>
              Verification <span className="text-white">Status</span>
            </h1>
            <p className="mx-auto max-w-xl text-xs text-slate-400 md:text-sm animate-text-enter" style={{ animationDelay: "0.4s" }}>
              Track your KYC verification progress and status
            </p>
          </div>

          {/* Status Card */}
          <div className="animate-text-enter" style={{ animationDelay: "0.6s" }}>
            <div className="group relative rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 sm:p-8 backdrop-blur shadow-2xl shadow-blue-900/10 transition-all duration-300 hover:border-[#fc4f02]/30 hover:shadow-[#fc4f02]/10">
              <div className="absolute inset-0 bg-gradient-to-br from-[#fc4f02]/5 via-transparent to-[#fda300]/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              
              <div className="relative z-10">
                {/* Status Badge */}
                <div className="mb-6 flex justify-center">
                  <div className={`inline-flex items-center gap-2 rounded-full ${statusConfig.badgeColor} ${statusConfig.badgeText} px-4 py-2 shadow-lg`}>
                    {statusConfig.icon}
                    <span className="text-sm font-semibold">{statusConfig.badge}</span>
                  </div>
                </div>

                {/* Status Message */}
                <div className="mb-6 text-center">
                  <h2 className="mb-2 text-lg sm:text-xl font-semibold text-white">
                    {statusConfig.message}
                  </h2>
                  <p className="text-sm text-slate-400">
                    {statusConfig.description}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-400 font-medium">Verification Progress</span>
                    <span className="font-bold text-white">{statusConfig.progress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10 shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-[#fc4f02] to-[#fda300] transition-all duration-500 ease-out shadow-lg shadow-[#fc4f02]/50 rounded-full"
                      style={{ width: `${statusConfig.progress}%` }}
                    />
                  </div>
                </div>

                {/* Status Steps */}
                <div className="mb-6">
                  <div className="relative flex items-center justify-between">
                    {/* Progress line */}
                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-[--color-border] -z-10">
                      <div 
                        className={`h-full bg-gradient-to-r from-[#fc4f02] to-[#fda300] transition-all duration-500 ${
                          status === "approved" ? "w-full" : status === "pending" ? "w-0" : "w-1/2"
                        }`}
                      />
                    </div>
                    
                    {["Pending", "Reviewing", "Verified"].map((step, index) => {
                      const isActive = status === "approved" ? true :
                                       status === "rejected" ? index === 0 :
                                       status === "review" ? index <= 1 :
                                       index === 0;
                      const isCompleted = status === "approved" && index < 3;
                      
                      return (
                        <div key={step} className="flex flex-col items-center flex-1 relative z-10">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                            isActive || isCompleted
                              ? "border-[#fc4f02] bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/20" 
                              : "border-[--color-border] bg-[--color-surface]"
                          }`}>
                            {isCompleted ? (
                              <svg className="h-5 w-5 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <div className={`h-2 w-2 rounded-full ${isActive ? "bg-[#fc4f02]" : "bg-slate-500"}`} />
                            )}
                          </div>
                          <span className={`mt-2 text-xs font-medium ${isActive || isCompleted ? "text-white" : "text-slate-500"}`}>
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Verification Details */}
                {kycData && (status === "approved" || status === "rejected" || status === "review") && (
                  <div className="mb-6 rounded-lg border border-[--color-border] bg-[--color-surface]/50 p-4">
                    <h3 className="text-sm font-semibold text-white mb-3">Verification Details</h3>
                    <div className="space-y-2 text-xs text-slate-300">
                      {kycData.liveness_result && (
                        <div className="flex justify-between">
                          <span>Liveness:</span>
                          <span className="font-medium text-white capitalize">{kycData.liveness_result}</span>
                        </div>
                      )}
                      {kycData.liveness_confidence !== undefined && (
                        <div className="flex justify-between">
                          <span>Liveness Confidence:</span>
                          <span className="font-medium text-white">{(kycData.liveness_confidence * 100).toFixed(1)}%</span>
                        </div>
                      )}
                      {kycData.face_match_score !== undefined && (
                        <div className="flex justify-between">
                          <span>Face Match Score:</span>
                          <span className="font-medium text-white">{(kycData.face_match_score * 100).toFixed(1)}%</span>
                        </div>
                      )}
                      {kycData.doc_authenticity_score !== undefined && (
                        <div className="flex justify-between">
                          <span>Document Authenticity:</span>
                          <span className="font-medium text-white">{(kycData.doc_authenticity_score * 100).toFixed(1)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {status === "rejected" && (
                    <button
                      onClick={handleRetry}
                      className="flex-1 rounded-xl border-2 border-[--color-border] bg-[--color-surface] px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:border-[#fc4f02]/50 hover:bg-[--color-surface-alt]"
                    >
                      Retry Upload
                    </button>
                  )}
                  {status === "pending" && (
                    <button
                      onClick={handleSubmitVerification}
                      disabled={isLoading}
                      className="group relative overflow-hidden flex-1 rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#fc4f02]/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {isLoading ? "Submitting..." : "Submit Verification"}
                      </span>
                    </button>
                  )}
                  {status === "approved" && (
                    <button
                      onClick={async () => {
                        const { navigateToNextRoute } = await import("@/lib/auth/flow-router.service");
                        await navigateToNextRoute(router);
                      }}
                      className="group relative overflow-hidden flex-1 rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#fc4f02]/40"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        Continue
                        <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

