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

  // Helper function to convert face match score to status word
  const getFaceMatchStatus = (score?: number): { text: string; color: string } => {
    if (score === undefined) return { text: "Pending", color: "text-yellow-400" };
    if (score >= 0.95) return { text: "Excellent Match", color: "text-[#10b981]" };
    if (score >= 0.85) return { text: "Strong Match", color: "text-[#10b981]" };
    if (score >= 0.75) return { text: "Good Match", color: "text-blue-400" };
    if (score >= 0.60) return { text: "Acceptable", color: "text-yellow-400" };
    return { text: "Low Match", color: "text-red-400" };
  };

  // Helper function to convert liveness to status word
  const getLivenessStatus = (result?: string, confidence?: number): { text: string; color: string } => {
    if (!result) return { text: "Pending", color: "text-yellow-400" };
    if (result.toLowerCase() === "real" || result.toLowerCase() === "live") {
      if (confidence && confidence >= 0.9) return { text: "Verified Live", color: "text-[#10b981]" };
      if (confidence && confidence >= 0.7) return { text: "Likely Live", color: "text-blue-400" };
      return { text: "Live Detected", color: "text-[#10b981]" };
    }
    return { text: "Review Needed", color: "text-red-400" };
  };

  // Helper function to convert document authenticity to status word  
  const getDocumentStatus = (score?: number): { text: string; color: string } => {
    if (score === undefined) return { text: "Pending", color: "text-yellow-400" };
    if (score >= 0.90) return { text: "Authentic", color: "text-[#10b981]" };
    if (score >= 0.75) return { text: "Verified", color: "text-[#10b981]" };
    if (score >= 0.60) return { text: "Acceptable", color: "text-blue-400" };
    return { text: "Review Needed", color: "text-yellow-400" };
  };

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
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center overflow-y-auto px-3 py-4 sm:px-4 sm:py-5 lg:px-6">
        <div className="w-full max-w-2xl">
          {/* Header Section */}
          <div className="mb-4 sm:mb-5 text-center">
            <div className="mb-2 flex justify-center animate-logo-enter">
              <QuantivaLogo className="h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12" />
            </div>
            <h1 className="mb-1 text-lg sm:text-xl font-bold tracking-tight text-white md:text-2xl animate-text-enter" style={{ animationDelay: "0.2s" }}>
              Verification <span className="text-white">Status</span>
            </h1>
            <p className="mx-auto max-w-xl text-[10px] sm:text-xs text-slate-400 animate-text-enter" style={{ animationDelay: "0.4s" }}>
              Track your KYC verification progress
            </p>
          </div>

          {/* Status Card */}
          <div className="animate-text-enter" style={{ animationDelay: "0.6s" }}>
            <div className="group relative rounded-xl sm:rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-4 sm:p-5 backdrop-blur shadow-2xl shadow-blue-900/10 transition-all duration-300 hover:border-[#fc4f02]/30 hover:shadow-[#fc4f02]/10">
              <div className="absolute inset-0 bg-gradient-to-br from-[#fc4f02]/5 via-transparent to-[#fda300]/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              
              <div className="relative z-10">
                {/* Status Badge */}
                <div className="mb-3 sm:mb-4 flex justify-center">
                  <div className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-full ${statusConfig.badgeColor} ${statusConfig.badgeText} px-3 py-1.5 sm:px-4 sm:py-2 shadow-lg`}>
                    {statusConfig.icon}
                    <span className="text-xs sm:text-sm font-semibold">{statusConfig.badge}</span>
                  </div>
                </div>

                {/* Status Message */}
                <div className="mb-3 sm:mb-4 text-center">
                  <h2 className="mb-1 text-sm sm:text-base md:text-lg font-semibold text-white">
                    {statusConfig.message}
                  </h2>
                  <p className="text-[10px] sm:text-xs text-slate-400">
                    {statusConfig.description}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="mb-3 sm:mb-4">
                  <div className="flex items-center justify-between text-[10px] sm:text-xs mb-1.5">
                    <span className="text-slate-400 font-medium">Progress</span>
                    <span className="font-bold text-white">{statusConfig.progress}%</span>
                  </div>
                  <div className="h-1.5 sm:h-2 w-full overflow-hidden rounded-full bg-white/10 shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-[#fc4f02] to-[#fda300] transition-all duration-500 ease-out shadow-lg shadow-[#fc4f02]/50 rounded-full"
                      style={{ width: `${statusConfig.progress}%` }}
                    />
                  </div>
                </div>

                {/* Status Steps */}
                <div className="mb-3 sm:mb-4">
                  <div className="relative flex items-center justify-between">
                    {/* Progress line */}
                    <div className="absolute top-3.5 sm:top-4 left-0 right-0 h-0.5 bg-[--color-border] -z-10">
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
                          <div className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                            isActive || isCompleted
                              ? "border-[#fc4f02] bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/20" 
                              : "border-[--color-border] bg-[--color-surface]"
                          }`}>
                            {isCompleted ? (
                              <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <div className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-[#fc4f02]" : "bg-slate-500"}`} />
                            )}
                          </div>
                          <span className={`mt-1.5 text-[10px] sm:text-xs font-medium ${isActive || isCompleted ? "text-white" : "text-slate-500"}`}>
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Verification Details */}
                {kycData && (status === "approved" || status === "rejected" || status === "review") && (
                  <div className="mb-3 sm:mb-4">
                    <h3 className="text-xs sm:text-sm font-semibold text-white mb-2 sm:mb-3 flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      Verification Results
                    </h3>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {/* Face Match Card */}
                      {kycData.face_match_score !== undefined && (
                        <div className={`relative overflow-hidden rounded-lg sm:rounded-xl border p-2 sm:p-3 transition-all duration-300 ${
                          getFaceMatchStatus(kycData.face_match_score).color.includes('10b981') 
                            ? 'border-[#10b981]/30 bg-gradient-to-br from-[#10b981]/10 to-[#10b981]/5' 
                            : getFaceMatchStatus(kycData.face_match_score).color.includes('red')
                            ? 'border-red-500/30 bg-gradient-to-br from-red-500/10 to-red-500/5'
                            : getFaceMatchStatus(kycData.face_match_score).color.includes('blue')
                            ? 'border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-blue-500/5'
                            : 'border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5'
                        }`}>
                          <div className="flex flex-col items-center text-center">
                            <div className={`mb-1.5 sm:mb-2 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full ${
                              getFaceMatchStatus(kycData.face_match_score).color.includes('10b981')
                                ? 'bg-[#10b981]/20'
                                : getFaceMatchStatus(kycData.face_match_score).color.includes('red')
                                ? 'bg-red-500/20'
                                : getFaceMatchStatus(kycData.face_match_score).color.includes('blue')
                                ? 'bg-blue-500/20'
                                : 'bg-yellow-500/20'
                            }`}>
                              <svg className={`h-4 w-4 sm:h-5 sm:w-5 ${getFaceMatchStatus(kycData.face_match_score).color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <span className="text-[8px] sm:text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Face</span>
                            <span className={`text-[10px] sm:text-xs font-bold ${getFaceMatchStatus(kycData.face_match_score).color}`}>
                              {getFaceMatchStatus(kycData.face_match_score).text}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Liveness Card */}
                      {(kycData.liveness_result || kycData.liveness_confidence !== undefined) && (
                        <div className={`relative overflow-hidden rounded-lg sm:rounded-xl border p-2 sm:p-3 transition-all duration-300 ${
                          getLivenessStatus(kycData.liveness_result, kycData.liveness_confidence).color.includes('10b981') 
                            ? 'border-[#10b981]/30 bg-gradient-to-br from-[#10b981]/10 to-[#10b981]/5' 
                            : getLivenessStatus(kycData.liveness_result, kycData.liveness_confidence).color.includes('red')
                            ? 'border-red-500/30 bg-gradient-to-br from-red-500/10 to-red-500/5'
                            : getLivenessStatus(kycData.liveness_result, kycData.liveness_confidence).color.includes('blue')
                            ? 'border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-blue-500/5'
                            : 'border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5'
                        }`}>
                          <div className="flex flex-col items-center text-center">
                            <div className={`mb-1.5 sm:mb-2 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full ${
                              getLivenessStatus(kycData.liveness_result, kycData.liveness_confidence).color.includes('10b981')
                                ? 'bg-[#10b981]/20'
                                : getLivenessStatus(kycData.liveness_result, kycData.liveness_confidence).color.includes('red')
                                ? 'bg-red-500/20'
                                : getLivenessStatus(kycData.liveness_result, kycData.liveness_confidence).color.includes('blue')
                                ? 'bg-blue-500/20'
                                : 'bg-yellow-500/20'
                            }`}>
                              <svg className={`h-4 w-4 sm:h-5 sm:w-5 ${getLivenessStatus(kycData.liveness_result, kycData.liveness_confidence).color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                            </div>
                            <span className="text-[8px] sm:text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Liveness</span>
                            <span className={`text-[10px] sm:text-xs font-bold ${getLivenessStatus(kycData.liveness_result, kycData.liveness_confidence).color}`}>
                              {getLivenessStatus(kycData.liveness_result, kycData.liveness_confidence).text}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Document Card */}
                      {kycData.doc_authenticity_score !== undefined && (
                        <div className={`relative overflow-hidden rounded-lg sm:rounded-xl border p-2 sm:p-3 transition-all duration-300 ${
                          getDocumentStatus(kycData.doc_authenticity_score).color.includes('10b981') 
                            ? 'border-[#10b981]/30 bg-gradient-to-br from-[#10b981]/10 to-[#10b981]/5' 
                            : getDocumentStatus(kycData.doc_authenticity_score).color.includes('red')
                            ? 'border-red-500/30 bg-gradient-to-br from-red-500/10 to-red-500/5'
                            : getDocumentStatus(kycData.doc_authenticity_score).color.includes('blue')
                            ? 'border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-blue-500/5'
                            : 'border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5'
                        }`}>
                          <div className="flex flex-col items-center text-center">
                            <div className={`mb-1.5 sm:mb-2 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full ${
                              getDocumentStatus(kycData.doc_authenticity_score).color.includes('10b981')
                                ? 'bg-[#10b981]/20'
                                : getDocumentStatus(kycData.doc_authenticity_score).color.includes('red')
                                ? 'bg-red-500/20'
                                : getDocumentStatus(kycData.doc_authenticity_score).color.includes('blue')
                                ? 'bg-blue-500/20'
                                : 'bg-yellow-500/20'
                            }`}>
                              <svg className={`h-4 w-4 sm:h-5 sm:w-5 ${getDocumentStatus(kycData.doc_authenticity_score).color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <span className="text-[8px] sm:text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Document</span>
                            <span className={`text-[10px] sm:text-xs font-bold ${getDocumentStatus(kycData.doc_authenticity_score).color}`}>
                              {getDocumentStatus(kycData.doc_authenticity_score).text}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  {status === "rejected" && (
                    <button
                      onClick={handleRetry}
                      className="flex-1 rounded-lg sm:rounded-xl border-2 border-[--color-border] bg-[--color-surface] px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white transition-all duration-300 hover:border-[#fc4f02]/50 hover:bg-[--color-surface-alt]"
                    >
                      Retry Upload
                    </button>
                  )}
                  {status === "pending" && (
                    <button
                      onClick={handleSubmitVerification}
                      disabled={isLoading}
                      className="group relative overflow-hidden flex-1 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#fc4f02]/40 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className="group relative overflow-hidden flex-1 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#fc4f02]/40"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        Continue
                        <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

