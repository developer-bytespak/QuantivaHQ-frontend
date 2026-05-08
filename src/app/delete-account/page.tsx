"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DeleteAccountPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string>("your email");

  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteTwoFactorCode, setDeleteTwoFactorCode] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteIsGoogleUser, setDeleteIsGoogleUser] = useState<boolean | null>(null);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("quantivahq_access_token");
    if (!token) {
      setIsLoggedIn(false);
      return;
    }
    setIsLoggedIn(true);

    (async () => {
      try {
        const { verifyGoogleEmail } = await import("@/lib/api/auth");
        const res = await verifyGoogleEmail();
        setDeleteIsGoogleUser(res.google_email);
      } catch {
        setDeleteIsGoogleUser(false);
      }
    })();

    (async () => {
      try {
        const { getUserProfile } = await import("@/lib/api/user");
        const profile = await getUserProfile();
        if (profile?.email) setUserEmail(profile.email);
      } catch {
        // ignore — fallback label is fine
      }
    })();
  }, []);

  const handleSendVerificationCode = async () => {
    setDeleteError("");

    const isGoogleUser = deleteIsGoogleUser === true;
    if (!isGoogleUser) {
      if (!deletePassword) {
        setDeleteError("Password is required");
        return;
      }
      if (deletePassword.length < 8) {
        setDeleteError("Password must be at least 8 characters");
        return;
      }
    }

    try {
      setIsLoading(true);

      if (!isGoogleUser) {
        const { verifyPassword } = await import("@/lib/api/auth");
        const verifyResult = await verifyPassword(deletePassword);
        if (!verifyResult.success) {
          setDeleteError("Please enter your correct password.");
          return;
        }
      }

      const { requestDeleteAccountCode } = await import("@/lib/api/user");
      await requestDeleteAccountCode();

      setIsCodeSent(true);
      setDeleteStep(2);
      setNotificationMessage("Verification code sent to your email");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } catch (error: any) {
      console.error("Failed to verify password or send verification code:", error);
      const errorMessage = error.message || error.toString();

      if (errorMessage.includes("Invalid password") || errorMessage.includes("correct password")) {
        setDeleteError("Please enter your correct password.");
      } else if (errorMessage.includes("Session expired") || errorMessage.includes("Unauthorized")) {
        setDeleteError("Your session has expired. Please log in again.");
        setTimeout(() => {
          router.push("/onboarding/sign-up?tab=login");
        }, 2000);
      } else {
        setDeleteError(errorMessage || "Failed to verify. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    setDeleteError("");

    const isGoogleUser = deleteIsGoogleUser === true;
    if (!isGoogleUser) {
      if (!deletePassword) {
        setDeleteError("Password is required");
        return;
      }
      if (deletePassword.length < 8) {
        setDeleteError("Password must be at least 8 characters");
        return;
      }
    }

    if (!deleteTwoFactorCode) {
      setDeleteError("Verification code is required");
      return;
    }
    if (deleteTwoFactorCode.length !== 6 || !/^\d+$/.test(deleteTwoFactorCode)) {
      setDeleteError("Verification code must be exactly 6 digits");
      return;
    }

    try {
      setIsLoading(true);
      const { deleteAccount } = await import("@/lib/api/user");
      const passwordToSend = isGoogleUser ? "" : deletePassword;
      await deleteAccount(passwordToSend, deleteTwoFactorCode, deleteReason);

      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }

      setNotificationMessage("Account deleted successfully. Redirecting...");
      setShowNotification(true);

      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (error: any) {
      console.error("Failed to delete account:", error);
      setIsLoading(false);
      const errorMessage = error.message || error.toString();

      if (deleteIsGoogleUser && (errorMessage.includes("password") || errorMessage.includes("Password"))) {
        setDeleteError("This account uses Google sign-in. Please try again or contact support if the problem continues.");
      } else if (!deleteIsGoogleUser && (errorMessage.includes("Invalid password") || errorMessage.includes("password"))) {
        setDeleteError("Incorrect password. Please try again.");
      } else if (errorMessage.includes("Invalid 2FA code") || errorMessage.includes("Invalid verification code")) {
        setDeleteError("Invalid or expired verification code. Please request a new code.");
      } else if (errorMessage.includes("active or recent order")) {
        setDeleteError("You have active orders. Please cancel or complete them before deleting your account.");
      } else if (errorMessage.includes("open position")) {
        setDeleteError("You have open positions. Please close all positions before deleting your account.");
      } else if (errorMessage.includes("active subscription")) {
        setDeleteError("You have active subscriptions. Please cancel them before deleting your account.");
      } else if (errorMessage.includes("Session expired") || errorMessage.includes("Unauthorized")) {
        setDeleteError("Your session has expired. Please log in again.");
        setTimeout(() => {
          router.push("/onboarding/sign-up?tab=login");
        }, 2000);
      } else {
        setDeleteError(errorMessage || "Failed to delete account. Please try again or contact support.");
      }
    }
  };

  const handleCancel = () => {
    router.push("/");
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-slate-950 to-black px-3 sm:px-4 py-8 sm:py-12">
      {/* Toast Notification */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-[500] bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-top-2 duration-300">
          {notificationMessage}
        </div>
      )}

      <div className="relative w-full max-w-lg mx-2 sm:mx-4 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 rounded-lg sm:rounded-2xl border border-[var(--primary)]/20 shadow-[0_0_50px_rgba(var(--primary-rgb),0.15)] overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-3 sm:p-4">
          {/* Warning Icon */}
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-[var(--primary)]/20 blur rounded-full"></div>
              <svg className="w-8 sm:w-10 h-8 sm:h-10 text-[var(--primary)] relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg sm:text-2xl font-bold text-white text-center mb-1 sm:mb-2">
            {isLoggedIn === false
              ? "Delete Your Account"
              : deleteStep === 1
              ? "Delete Account?"
              : "Enter Verification Code"}
          </h3>

          {/* Logged-out state */}
          {isLoggedIn === false && (
            <>
              <div className="bg-[var(--primary)]/10 border border-[var(--primary)]/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 mt-4 sm:mt-6 shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]">
                <p className="text-[var(--primary)] text-xs sm:text-sm font-semibold mb-1">⚠️ This action cannot be undone!</p>
                <p className="text-slate-300 text-xs sm:text-sm">All your data, trading history, and connections will be permanently deleted.</p>
              </div>

              <p className="text-slate-300 text-xs sm:text-sm mb-4 sm:mb-6">
                To delete your account, please log in first. After logging in, return to this page or
                use <span className="text-white font-medium">Profile → Settings → Delete Account</span> in the app.
              </p>

              <p className="text-slate-400 text-xs sm:text-sm mb-4 sm:mb-6">
                Can&apos;t access your account? Email{" "}
                <a href="mailto:support@quantivahq.com" className="text-[var(--primary-light)] hover:underline">
                  support@quantivahq.com
                </a>{" "}
                with the subject &quot;Account Deletion Request&quot; and we&apos;ll process it within 7 business days.
              </p>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Link
                  href="/"
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-white font-medium text-sm sm:text-base transition-all duration-200 text-center"
                >
                  Cancel
                </Link>
                <Link
                  href="/onboarding/sign-up?tab=login"
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] hover:from-[var(--primary-hover)] hover:to-[var(--primary-light)] text-white font-bold text-sm sm:text-base transition-all duration-200 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)] text-center"
                >
                  Log in to continue
                </Link>
              </div>
            </>
          )}

          {/* Loading session check */}
          {isLoggedIn === null && (
            <div className="my-6 flex items-center justify-center gap-2 text-slate-400 text-sm">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Checking session...
            </div>
          )}

          {/* Logged-in state — exact same UI as settings modal */}
          {isLoggedIn === true && (
            <>
              {/* Step Indicator */}
              <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
                <div className={`h-1.5 sm:h-2 w-6 sm:w-8 rounded-full transition-all ${deleteStep === 1 ? "bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" : "bg-slate-700"}`}></div>
                <div className={`h-1.5 sm:h-2 w-6 sm:w-8 rounded-full transition-all ${deleteStep === 2 ? "bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" : "bg-slate-700"}`}></div>
              </div>

              {/* Warning Message - Show on Step 1 */}
              {deleteStep === 1 && (
                <>
                  <div className="bg-[var(--primary)]/10 border border-[var(--primary)]/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]">
                    <p className="text-[var(--primary)] text-xs sm:text-sm font-semibold mb-1">⚠️ This action cannot be undone!</p>
                    <p className="text-slate-300 text-xs sm:text-sm">All your data, trading history, and connections will be permanently deleted.</p>
                  </div>

                  {deleteIsGoogleUser === null ? (
                    <div className="mb-4 sm:mb-6 flex items-center justify-center gap-2 text-slate-400 text-sm">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Checking account...
                    </div>
                  ) : (
                    <>
                      {!deleteIsGoogleUser && (
                        <>
                          {/* Password Input - only for non-Google users */}
                          <div className="mb-3 sm:mb-4">
                            <label className="block text-slate-300 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                              Password <span className="text-[var(--primary)]">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type={showDeletePassword ? "text" : "password"}
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                placeholder="Enter password"
                                disabled={isLoading}
                                className="w-full px-3 py-2 pr-10 rounded-md bg-slate-800/70 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]/50 text-xs sm:text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                              <button
                                type="button"
                                onClick={() => setShowDeletePassword(!showDeletePassword)}
                                disabled={isLoading}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[var(--primary)] transition-colors disabled:opacity-50"
                                tabIndex={-1}
                              >
                                {showDeletePassword ? (
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Reason Input (Optional) */}
                      <div className="mb-4 sm:mb-6">
                        <label className="block text-slate-300 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                          Why are you leaving? (Optional)
                        </label>
                        <textarea
                          value={deleteReason}
                          onChange={(e) => setDeleteReason(e.target.value)}
                          placeholder="Feedback (optional)"
                          maxLength={500}
                          rows={2}
                          disabled={isLoading}
                          className="w-full px-3 py-2 rounded-md bg-slate-800/70 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]/50 text-xs sm:text-sm transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <p className="text-slate-400 text-[10px] sm:text-xs mt-0.5 text-right">
                          {deleteReason.length}/500
                        </p>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Step 2 - Verification Code */}
              {deleteStep === 2 && (
                <>
                  <div className="bg-gradient-to-br from-[var(--primary-light)]/10 to-[var(--primary)]/10 border border-[var(--primary-light)]/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 shadow-[0_0_20px_rgba(var(--primary-light-rgb),0.1)]">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <svg className="w-4 sm:w-5 h-4 sm:h-5 text-[var(--primary-light)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <div>
                        <p className="text-[var(--primary-light)] text-xs sm:text-sm font-medium">Verification code sent!</p>
                        <p className="text-slate-300 text-xs sm:text-sm mt-1">
                          Check your email ({userEmail}) for the 6-digit code.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2FA Code Input */}
                  <div className="mb-4 sm:mb-6">
                    <label className="block text-slate-300 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                      Enter 6-digit verification code <span className="text-[var(--primary)]">*</span>
                    </label>
                    <input
                      type="text"
                      value={deleteTwoFactorCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        if (value.length <= 6) {
                          setDeleteTwoFactorCode(value);
                        }
                      }}
                      placeholder="000000"
                      maxLength={6}
                      disabled={isLoading}
                      autoFocus
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-slate-800/70 border border-slate-600 text-white text-center text-xl sm:text-2xl tracking-widest placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                      onClick={handleSendVerificationCode}
                      disabled={isLoading}
                      className="text-[var(--primary)] hover:text-[var(--primary-hover)] text-xs sm:text-sm mt-2 transition-colors disabled:opacity-50"
                    >
                      Didn&apos;t receive code? Resend
                    </button>
                  </div>
                </>
              )}

              {/* Error Message */}
              {deleteError && (
                <div className="mb-3 sm:mb-4 p-2 sm:p-3 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/30">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <svg className="w-4 sm:w-5 h-4 sm:h-5 text-[var(--primary)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-[var(--primary)]/90 text-xs sm:text-sm">{deleteError}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {deleteStep === 2 && (
                  <button
                    onClick={() => {
                      setDeleteStep(1);
                      setDeleteTwoFactorCode("");
                      setDeleteError("");
                    }}
                    disabled={isLoading}
                    className="px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-white font-medium text-sm sm:text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-white font-medium text-sm sm:text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteStep === 1 ? handleSendVerificationCode : handleConfirmDeleteAccount}
                  disabled={
                    isLoading ||
                    (deleteStep === 1
                      ? deleteIsGoogleUser === null || (!deleteIsGoogleUser && !deletePassword)
                      : !deleteTwoFactorCode)
                  }
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] hover:from-[var(--primary-hover)] hover:to-[var(--primary-light)] text-white font-bold text-sm sm:text-base transition-all duration-200 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-[var(--primary)] disabled:hover:to-[var(--primary-hover)] disabled:shadow-none"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 sm:h-5 w-4 sm:w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {deleteStep === 1 ? "Processing..." : "Deleting..."}
                    </span>
                  ) : (
                    deleteStep === 1
                      ? deleteIsGoogleUser === true
                        ? "Send verification code"
                        : "Delete Account"
                      : "Delete My Account"
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
