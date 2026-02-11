"use client";

import { useState, useEffect } from "react";
import { SettingsBackButton } from "@/components/settings/settings-back-button";
import { useNotification, Notification } from "@/components/common/notification";
import { requestPasswordChangeCode, changePassword } from "@/lib/api/auth";
import { changePasswordSchema } from "@/lib/validation/onboarding";

export default function SecurityPage() {
  const { notification, showNotification, hideNotification } = useNotification();
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorCode: "",
  });
  const [twoFactorCodeRequested, setTwoFactorCodeRequested] = useState(false);
  const [isRequestingCode, setIsRequestingCode] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRequest2FACode = async () => {
    // Validate password fields first
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      showNotification("Please fill in all password fields first", "error");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showNotification("New passwords do not match", "error");
      return;
    }
    if (passwordData.newPassword.length < 8) {
      showNotification("Password must be at least 8 characters long", "error");
      return;
    }

    setIsRequestingCode(true);
    setFormErrors({});

    try {
      // First verify the current password
      const { verifyPassword } = await import("@/lib/api/auth");
      await verifyPassword(passwordData.currentPassword);
      
      // If password is correct, request 2FA code
      await requestPasswordChangeCode();
      setTwoFactorCodeRequested(true);
      showNotification("2FA code sent to your email", "success");
    } catch (error: any) {
      console.error("Failed to request 2FA code:", error);
      let errorMessage = "Failed to request 2FA code. Please try again.";
      
      // Check for invalid password error
      if (error.message?.includes("Invalid password") || error.message?.includes("correct password")) {
        errorMessage = "Current password is incorrect";
        setFormErrors({ currentPassword: "Current password is incorrect" });
      } else if (error.message?.includes("Unauthorized") || error.message?.includes("401")) {
        errorMessage = "Your session has expired. Please log out and log in again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showNotification(errorMessage, "error");
    } finally {
      setIsRequestingCode(false);
    }
  };

  const handleChangePassword = async () => {
    // Clear all errors first
    setFormErrors({});

    // Validate form using Zod schema
    const validationResult = changePasswordSchema.safeParse(passwordData);
    
    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.errors.forEach((error) => {
        const field = error.path[0] as string;
        // Only show 2FA error if we're actually in the 2FA step
        if (field === "twoFactorCode" && !twoFactorCodeRequested) {
          return; // Skip this error if we haven't requested code yet
        }
        errors[field] = error.message;
      });
      setFormErrors(errors);
      
      // Show a user-friendly notification for the first error
      const firstError = Object.values(errors)[0];
      if (firstError) {
        showNotification(firstError, "error");
      }
      return;
    }

    if (!twoFactorCodeRequested) {
      showNotification("Please request a 2FA code first", "error");
      return;
    }

    setIsChangingPassword(true);

    try {
      await changePassword({
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        twoFactorCode: passwordData.twoFactorCode,
      });

      showNotification("Password changed successfully", "success");
      
      // Reset form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        twoFactorCode: "",
      });
      setTwoFactorCodeRequested(false);
      setFormErrors({});
    } catch (error: any) {
      console.error("Failed to change password:", error);
      let errorMessage = "Failed to change password. Please try again.";
      
      // Extract the actual error message from backend
      const backendMessage = error.message || "";
      
      // Check for specific error messages from backend
      if (backendMessage.includes("Invalid 2FA code")) {
        errorMessage = "Invalid 2FA code. Please check your email and try again.";
        setFormErrors({ twoFactorCode: "Invalid 2FA code" });
        // Clear the 2FA code so user needs to re-enter
        setPasswordData({ ...passwordData, twoFactorCode: "" });
      } else if (backendMessage.includes("Invalid current password")) {
        errorMessage = "Current password is incorrect";
        setFormErrors({ currentPassword: "Current password is incorrect" });
      } else if (backendMessage.includes("Session expired") || backendMessage.includes("log in again")) {
        errorMessage = "Your session has expired. Please log out and log in again.";
      } else if (backendMessage) {
        errorMessage = backendMessage;
      }
      
      showNotification(errorMessage, "error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Auto-focus first OTP input when 2FA code is requested
  useEffect(() => {
    if (twoFactorCodeRequested) {
      const firstInput = document.getElementById("otp-digit-0");
      if (firstInput) {
        setTimeout(() => {
          firstInput.focus();
        }, 100);
      }
    }
  }, [twoFactorCodeRequested]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, action?: "next" | "request-code" | "submit", nextFieldId?: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (action === "request-code" && !twoFactorCodeRequested) {
        handleRequest2FACode();
      } else if (action === "submit" && twoFactorCodeRequested) {
        handleChangePassword();
      } else if (nextFieldId) {
        const nextField = document.getElementById(nextFieldId);
        if (nextField) {
          nextField.focus();
        }
      }
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}
      <SettingsBackButton />
      
      <div className="bg-gradient-to-br from-[--color-surface-alt]/90 to-[--color-surface-alt]/70 backdrop-blur-xl border border-[--color-border] rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-lg">
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fc4f02]/10 border border-[#fc4f02]/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 sm:w-6 h-5 sm:h-6 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-3xl font-bold text-white">Change Password</h1>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Password Section */}
          <div className="bg-gradient-to-br from-[--color-surface]/60 to-[--color-surface]/30 border border-[--color-border]/50 rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-xl">
            <div className="mb-6">
              <p className="text-sm text-slate-400">Enter your current password and choose a new secure password</p>
            </div>

            <div className="space-y-5 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2.5">Current Password</label>
                <div className="relative">
                  <input
                    id="current-password-input"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, currentPassword: e.target.value });
                      if (formErrors.currentPassword) {
                        setFormErrors({ ...formErrors, currentPassword: "" });
                      }
                    }}
                    onKeyDown={(e) => handleKeyDown(e, "next", "new-password-input")}
                    disabled={isRequestingCode || isChangingPassword}
                    className={`w-full px-4 py-3 pr-12 rounded-xl bg-[--color-surface]/80 border-2 ${
                      formErrors.currentPassword ? "border-red-500" : "border-[--color-border]/50"
                    } text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#fc4f02]/50 focus:border-[#fc4f02]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200`}
                    placeholder="Enter your current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    {showCurrentPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                  {formErrors.currentPassword && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.currentPassword}</p>
                  )}
                </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2.5">New Password</label>
                <div className="relative">
                  <input
                    id="new-password-input"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, newPassword: e.target.value });
                      if (formErrors.newPassword) {
                        setFormErrors({ ...formErrors, newPassword: "" });
                      }
                    }}
                    onKeyDown={(e) => handleKeyDown(e, "next", "confirm-password-input")}
                    disabled={isRequestingCode || isChangingPassword}
                    className={`w-full px-4 py-3 pr-12 rounded-xl bg-[--color-surface]/80 border-2 ${
                      formErrors.newPassword ? "border-red-500" : "border-[--color-border]/50"
                    } text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#fc4f02]/50 focus:border-[#fc4f02]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200`}
                    placeholder="Enter new password (min 8 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    {showNewPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                  {formErrors.newPassword && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.newPassword}</p>
                  )}
                </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2.5">Confirm New Password</label>
                <div className="relative">
                  <input
                    id="confirm-password-input"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value });
                      if (formErrors.confirmPassword) {
                        setFormErrors({ ...formErrors, confirmPassword: "" });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (twoFactorCodeRequested) {
                          const twoFactorInput = document.getElementById("two-factor-input");
                          if (twoFactorInput) {
                            twoFactorInput.focus();
                          }
                        } else {
                          handleRequest2FACode();
                        }
                      }
                    }}
                    disabled={isRequestingCode || isChangingPassword}
                    className={`w-full px-4 py-3 pr-12 rounded-xl bg-[--color-surface]/80 border-2 ${
                      formErrors.confirmPassword ? "border-red-500" : "border-[--color-border]/50"
                    } text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#fc4f02]/50 focus:border-[#fc4f02]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200`}
                    placeholder="Confirm your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {formErrors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.confirmPassword}</p>
                )}
              </div>

              {!twoFactorCodeRequested ? (
                <button
                  onClick={handleRequest2FACode}
                  disabled={isRequestingCode || isChangingPassword}
                  className="w-full px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fd6a00] text-white text-sm font-semibold hover:from-[#fd6a00] hover:to-[#fd8a00] hover:shadow-lg hover:shadow-[#fc4f02]/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isRequestingCode ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Requesting code...
                      </>
                    ) : (
                      "Request 2FA Code"
                    )}
                  </button>
              ) : (
                <>
                  <div className="p-5 sm:p-6 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/30 rounded-xl shadow-lg backdrop-blur-sm">
                      <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <div className="flex-shrink-0 w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                          <svg className="w-4 sm:w-5 h-4 sm:h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-blue-300 mb-1">
                            Verification code sent
                          </p>
                          <p className="text-xs text-blue-400/80">
                            A 2FA code has been sent to your email. Please enter it below to complete the password change.
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-3 text-center">
                          2FA Verification Code
                        </label>
                        <div className="flex justify-center gap-1 sm:gap-2 mb-2">
                          {[0, 1, 2, 3, 4, 5].map((index) => (
                            <input
                              key={index}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={passwordData.twoFactorCode[index] || ""}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, "");
                                const newCode = passwordData.twoFactorCode.split("");
                                
                                if (value) {
                                  // User is entering a digit
                                  newCode[index] = value;
                                  const updatedCode = newCode.join("").slice(0, 6);
                                  setPasswordData({ ...passwordData, twoFactorCode: updatedCode });
                                  
                                  // Clear 2FA error when user is typing
                                  if (formErrors.twoFactorCode) {
                                    const newErrors = { ...formErrors };
                                    delete newErrors.twoFactorCode;
                                    setFormErrors(newErrors);
                                  }
                                  
                                  // Auto-focus next input
                                  if (index < 5 && value) {
                                    const nextInput = document.getElementById(`otp-digit-${index + 1}`);
                                    if (nextInput) {
                                      nextInput.focus();
                                    }
                                  }
                                  
                                  // Auto-submit when 6 digits are entered (only if no other errors)
                                  if (updatedCode.length === 6 && !formErrors.currentPassword && !formErrors.newPassword && !formErrors.confirmPassword) {
                                    setTimeout(() => {
                                      handleChangePassword();
                                    }, 100);
                                  }
                                } else {
                                  // User is clearing the input
                                  newCode[index] = "";
                                  const updatedCode = newCode.join("");
                                  setPasswordData({ ...passwordData, twoFactorCode: updatedCode });
                                  
                                  // Clear 2FA error when user is editing
                                  if (formErrors.twoFactorCode) {
                                    const newErrors = { ...formErrors };
                                    delete newErrors.twoFactorCode;
                                    setFormErrors(newErrors);
                                  }
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Backspace") {
                                  if (passwordData.twoFactorCode[index]) {
                                    // If current input has a value, clear it
                                    const newCode = passwordData.twoFactorCode.split("");
                                    newCode[index] = "";
                                    setPasswordData({ ...passwordData, twoFactorCode: newCode.join("") });
                                  } else if (index > 0) {
                                    // If current input is empty, move to previous and clear it
                                    const newCode = passwordData.twoFactorCode.split("");
                                    newCode[index - 1] = "";
                                    setPasswordData({ ...passwordData, twoFactorCode: newCode.join("") });
                                    const prevInput = document.getElementById(`otp-digit-${index - 1}`);
                                    if (prevInput) {
                                      prevInput.focus();
                                    }
                                  }
                                } else if (e.key === "Enter" && passwordData.twoFactorCode.length === 6) {
                                  e.preventDefault();
                                  handleChangePassword();
                                }
                              }}
                              onPaste={(e) => {
                                e.preventDefault();
                                const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                                if (pastedData) {
                                  setPasswordData({ ...passwordData, twoFactorCode: pastedData });
                                  // Clear 2FA error when pasting
                                  if (formErrors.twoFactorCode) {
                                    const newErrors = { ...formErrors };
                                    delete newErrors.twoFactorCode;
                                    setFormErrors(newErrors);
                                  }
                                  if (pastedData.length === 6) {
                                    const lastInput = document.getElementById(`otp-digit-5`);
                                    if (lastInput) {
                                      lastInput.focus();
                                    }
                                  } else {
                                    const nextInput = document.getElementById(`otp-digit-${pastedData.length}`);
                                    if (nextInput) {
                                      nextInput.focus();
                                    }
                                  }
                                }
                              }}
                              disabled={isChangingPassword}
                              id={`otp-digit-${index}`}
                              className={`w-12 sm:w-14 h-14 sm:h-16 rounded-xl bg-[--color-surface]/80 border-2 ${
                                formErrors.twoFactorCode 
                                  ? "border-red-500" 
                                  : passwordData.twoFactorCode[index]
                                    ? "border-blue-500/70 shadow-lg shadow-blue-500/20"
                                    : "border-[--color-border]/50"
                              } text-white text-center text-xl sm:text-2xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200`}
                            />
                          ))}
                        </div>
                        {formErrors.twoFactorCode && (
                          <p className="text-red-500 text-xs mt-2 text-center">{formErrors.twoFactorCode}</p>
                        )}
                        <p className="text-xs text-slate-400 text-center mt-3">
                          Enter the 6-digit code from your email
                        </p>
                      </div>
                    </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleRequest2FACode}
                      disabled={isRequestingCode || isChangingPassword}
                      className="flex-1 px-4 py-3 rounded-xl bg-[--color-surface]/80 border-2 border-[--color-border]/50 text-white text-sm font-medium hover:border-[#fc4f02]/50 hover:bg-[--color-surface] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Resend Code
                    </button>
                    <button
                      onClick={handleChangePassword}
                      disabled={isChangingPassword || isRequestingCode || passwordData.twoFactorCode.length !== 6}
                      className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fd6a00] text-white text-sm font-semibold hover:from-[#fd6a00] hover:to-[#fd8a00] hover:shadow-lg hover:shadow-[#fc4f02]/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isChangingPassword ? (
                          <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Updating...
                          </>
                        ) : (
                          "Update Password"
                        )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

