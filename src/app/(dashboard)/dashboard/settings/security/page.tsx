"use client";

import { useState, useEffect } from "react";
import { SettingsBackButton } from "@/components/settings/settings-back-button";
import { useNotification, Notification } from "@/components/common/notification";
import { requestPasswordChangeCode, changePassword } from "@/lib/api/auth";
import { changePasswordSchema } from "@/lib/validation/onboarding";

export default function SecurityPage() {
  const { notification, showNotification, hideNotification } = useNotification();
  const [showChangePassword, setShowChangePassword] = useState(false);
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
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

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
      await requestPasswordChangeCode();
      setTwoFactorCodeRequested(true);
      showNotification("2FA code sent to your email", "success");
    } catch (error: any) {
      console.error("Failed to request 2FA code:", error);
      let errorMessage = "Failed to request 2FA code. Please try again.";
      
      if (error.message?.includes("Unauthorized") || error.message?.includes("401")) {
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
    setFormErrors({});

    // Validate form using Zod schema
    const validationResult = changePasswordSchema.safeParse(passwordData);
    
    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.errors.forEach((error) => {
        const field = error.path[0] as string;
        errors[field] = error.message;
      });
      setFormErrors(errors);
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
      setShowChangePassword(false);
      setFormErrors({});
    } catch (error: any) {
      console.error("Failed to change password:", error);
      let errorMessage = "Failed to change password. Please try again.";
      
      if (error.message?.includes("Invalid current password")) {
        errorMessage = "Current password is incorrect";
        setFormErrors({ currentPassword: "Current password is incorrect" });
      } else if (error.message?.includes("Invalid 2FA code") || error.message?.includes("2FA")) {
        errorMessage = "Invalid 2FA code. Please check your email and try again.";
        setFormErrors({ twoFactorCode: "Invalid 2FA code" });
      } else if (error.message?.includes("Unauthorized") || error.message?.includes("401")) {
        errorMessage = "Your session has expired. Please log out and log in again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showNotification(errorMessage, "error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      twoFactorCode: "",
    });
    setTwoFactorCodeRequested(false);
    setShowChangePassword(false);
    setFormErrors({});
  };

  const toggleTwoFactor = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    // Here you would typically make an API call to enable/disable 2FA
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
    <div className="space-y-6">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}
      <SettingsBackButton />
      
      <div className="bg-gradient-to-br from-[--color-surface-alt]/90 to-[--color-surface-alt]/70 backdrop-blur-xl border border-[--color-border] rounded-2xl p-8 shadow-lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fc4f02]/10 border border-[#fc4f02]/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Security</h1>
        </div>

        <div className="space-y-6">
          {/* Password Section */}
          <div className="bg-[--color-surface]/50 border border-[--color-border]/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white mb-1">Password</h2>
                <p className="text-sm text-slate-400">Change your account password</p>
              </div>
              <button
                onClick={() => {
                  if (showChangePassword) {
                    handleCancelPasswordChange();
                  } else {
                    setShowChangePassword(true);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-[--color-surface] border border-[--color-border] text-white hover:border-[#fc4f02]/50 transition-all duration-200"
              >
                {showChangePassword ? "Cancel" : "Change Password"}
              </button>
            </div>

            {showChangePassword && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Current Password</label>
                  <input
                    id="current-password-input"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, currentPassword: e.target.value });
                      if (formErrors.currentPassword) {
                        setFormErrors({ ...formErrors, currentPassword: "" });
                      }
                    }}
                    onKeyDown={(e) => handleKeyDown(e, "next", "new-password-input")}
                    disabled={isRequestingCode || isChangingPassword}
                    className={`w-full px-4 py-2 rounded-lg bg-[--color-surface] border ${
                      formErrors.currentPassword ? "border-red-500" : "border-[--color-border]"
                    } text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#fc4f02]/50 disabled:opacity-50 disabled:cursor-not-allowed`}
                    placeholder="Enter current password"
                  />
                  {formErrors.currentPassword && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.currentPassword}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                  <input
                    id="new-password-input"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, newPassword: e.target.value });
                      if (formErrors.newPassword) {
                        setFormErrors({ ...formErrors, newPassword: "" });
                      }
                    }}
                    onKeyDown={(e) => handleKeyDown(e, "next", "confirm-password-input")}
                    disabled={isRequestingCode || isChangingPassword}
                    className={`w-full px-4 py-2 rounded-lg bg-[--color-surface] border ${
                      formErrors.newPassword ? "border-red-500" : "border-[--color-border]"
                    } text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#fc4f02]/50 disabled:opacity-50 disabled:cursor-not-allowed`}
                    placeholder="Enter new password (min 8 characters)"
                  />
                  {formErrors.newPassword && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.newPassword}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Confirm New Password</label>
                  <input
                    id="confirm-password-input"
                    type="password"
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
                    className={`w-full px-4 py-2 rounded-lg bg-[--color-surface] border ${
                      formErrors.confirmPassword ? "border-red-500" : "border-[--color-border]"
                    } text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#fc4f02]/50 disabled:opacity-50 disabled:cursor-not-allowed`}
                    placeholder="Confirm new password"
                  />
                  {formErrors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.confirmPassword}</p>
                  )}
                </div>

                {!twoFactorCodeRequested ? (
                  <button
                    onClick={handleRequest2FACode}
                    disabled={isRequestingCode || isChangingPassword}
                    className="w-full px-6 py-2 rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fd6a00] text-white font-medium hover:from-[#fd6a00] hover:to-[#fd8a00] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                    <div className="p-5 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/30 rounded-xl shadow-lg backdrop-blur-sm">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-300 mb-1">
                            Verification code sent
                          </p>
                          <p className="text-xs text-blue-400/80">
                            A 2FA code has been sent to your email. Please enter it below to complete the password change.
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-3 text-center">
                          2FA Verification Code
                        </label>
                        <div className="flex justify-center gap-2 mb-2">
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
                                  
                                  // Auto-focus next input
                                  if (index < 5 && value) {
                                    const nextInput = document.getElementById(`otp-digit-${index + 1}`);
                                    if (nextInput) {
                                      nextInput.focus();
                                    }
                                  }
                                  
                                  // Auto-submit when 6 digits are entered
                                  if (updatedCode.length === 6) {
                                    setTimeout(() => {
                                      handleChangePassword();
                                    }, 100);
                                  }
                                } else {
                                  // User is clearing the input
                                  newCode[index] = "";
                                  const updatedCode = newCode.join("");
                                  setPasswordData({ ...passwordData, twoFactorCode: updatedCode });
                                }
                                
                                if (formErrors.twoFactorCode) {
                                  setFormErrors({ ...formErrors, twoFactorCode: "" });
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
                              className={`w-12 h-14 rounded-lg bg-[--color-surface] border-2 ${
                                formErrors.twoFactorCode 
                                  ? "border-red-500" 
                                  : passwordData.twoFactorCode[index]
                                    ? "border-blue-500/50"
                                    : "border-[--color-border]"
                              } text-white text-center text-2xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200`}
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
                    <div className="flex gap-3">
                      <button
                        onClick={handleRequest2FACode}
                        disabled={isRequestingCode || isChangingPassword}
                        className="flex-1 px-4 py-2 rounded-lg bg-[--color-surface] border border-[--color-border] text-white hover:border-[#fc4f02]/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        Resend Code
                      </button>
                      <button
                        onClick={handleChangePassword}
                        disabled={isChangingPassword || isRequestingCode}
                        className="flex-1 px-6 py-2 rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fd6a00] text-white font-medium hover:from-[#fd6a00] hover:to-[#fd8a00] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            )}
          </div>

          {/* Two-Factor Authentication */}
          <div className="bg-[--color-surface]/50 border border-[--color-border]/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white mb-1">Two-Factor Authentication</h2>
                <p className="text-sm text-slate-400">Add an extra layer of security to your account</p>
              </div>
              <button
                onClick={toggleTwoFactor}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#fc4f02]/50 focus:ring-offset-2 focus:ring-offset-[--color-surface] ${
                  twoFactorEnabled ? "bg-[#fc4f02]" : "bg-slate-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    twoFactorEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            {twoFactorEnabled && (
              <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm text-green-300">Two-factor authentication is enabled</p>
              </div>
            )}
          </div>

          {/* Active Sessions */}
          <div className="bg-[--color-surface]/50 border border-[--color-border]/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Active Sessions</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-[--color-surface] border border-[--color-border]/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">Current Session</p>
                  <p className="text-sm text-slate-400">Windows • Chrome • Last active: Now</p>
                </div>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-[--color-surface] border border-[--color-border]/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">Mobile Device</p>
                  <p className="text-sm text-slate-400">iOS • Safari • Last active: 2 hours ago</p>
                </div>
                <button className="px-3 py-1 text-sm rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all duration-200">
                  Revoke
                </button>
              </div>
            </div>
          </div>

          {/* Security Tips */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <p className="text-sm text-blue-300 font-medium mb-2">Security Tips</p>
                <ul className="text-xs text-blue-400/80 space-y-1">
                  <li>• Use a strong, unique password</li>
                  <li>• Enable two-factor authentication for better security</li>
                  <li>• Review and revoke access from unknown devices</li>
                  <li>• Never share your password with anyone</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

