"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SettingsBackButton } from "@/components/settings/settings-back-button";
import { useNotification, Notification } from "@/components/common/notification";
import { adminLogout, adminChangePassword } from "@/lib/api/vcpool-admin";
import { z } from "zod";

const adminChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters long"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });

type AdminChangePasswordForm = z.infer<typeof adminChangePasswordSchema>;

export default function AdminSecurityPage() {
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState<AdminChangePasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleLogout = async () => {
    try {
      await adminLogout();
    } catch {
      // ignore
    }
    router.replace("/admin/login");
  };

  const handleChangePassword = async () => {
    setFormErrors({});

    const validationResult = adminChangePasswordSchema.safeParse(passwordData);
    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        errors[field] = err.message;
      });
      setFormErrors(errors);
      return;
    }

    setIsChangingPassword(true);
    try {
      await adminChangePassword({
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      showNotification("Password changed successfully", "success");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowChangePassword(false);
      setFormErrors({});
    } catch (error: unknown) {
      const err = error as { message?: string };
      let errorMessage = "Failed to change password. Please try again.";
      if (err?.message?.includes("Invalid current password") || err?.message?.toLowerCase().includes("current password")) {
        errorMessage = "Current password is incorrect.";
        setFormErrors({ currentPassword: "Current password is incorrect" });
      } else if (err?.message) {
        errorMessage = err.message;
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
    });
    setShowChangePassword(false);
    setFormErrors({});
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

      <SettingsBackButton backHref="/admin/settings" />
      <div className="bg-gradient-to-br from-[--color-surface-alt]/90 to-[--color-surface-alt]/70 backdrop-blur-xl border border-[--color-border] rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-lg">
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fc4f02]/10 border border-[#fc4f02]/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 sm:w-6 h-5 sm:h-6 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-3xl font-bold text-white">Security</h1>
        </div>
        <div className="space-y-4">
          {/* Change Password */}
          <div className="bg-[--color-surface]/50 border border-[--color-border]/50 rounded-lg sm:rounded-xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-1">
                  {showChangePassword ? "Change Password" : "Password"}
                </h3>
                <p className="text-sm text-slate-400">
                  Update your admin account password. Use a strong password with at least 8 characters.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (showChangePassword) {
                    handleCancelPasswordChange();
                  } else {
                    setShowChangePassword(true);
                  }
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-[--color-surface] border border-[--color-border] text-white text-sm font-medium hover:border-[#fc4f02]/50 transition-colors"
              >
                {showChangePassword ? "Cancel" : "Change Password"}
              </button>
            </div>

            {showChangePassword && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, currentPassword: e.target.value });
                      if (formErrors.currentPassword) setFormErrors({ ...formErrors, currentPassword: "" });
                    }}
                    disabled={isChangingPassword}
                    className={`w-full px-3 sm:px-4 py-2 rounded-lg bg-[--color-surface] border ${
                      formErrors.currentPassword ? "border-red-500" : "border-[--color-border]"
                    } text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#fc4f02]/50 disabled:opacity-50`}
                    placeholder="Enter current password"
                  />
                  {formErrors.currentPassword && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.currentPassword}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, newPassword: e.target.value });
                      if (formErrors.newPassword) setFormErrors({ ...formErrors, newPassword: "" });
                    }}
                    disabled={isChangingPassword}
                    className={`w-full px-3 sm:px-4 py-2 rounded-lg bg-[--color-surface] border ${
                      formErrors.newPassword ? "border-red-500" : "border-[--color-border]"
                    } text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#fc4f02]/50 disabled:opacity-50`}
                    placeholder="Enter new password (min 8 characters)"
                  />
                  {formErrors.newPassword && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.newPassword}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value });
                      if (formErrors.confirmPassword) setFormErrors({ ...formErrors, confirmPassword: "" });
                    }}
                    disabled={isChangingPassword}
                    onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
                    className={`w-full px-3 sm:px-4 py-2 rounded-lg bg-[--color-surface] border ${
                      formErrors.confirmPassword ? "border-red-500" : "border-[--color-border]"
                    } text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#fc4f02]/50 disabled:opacity-50`}
                    placeholder="Confirm new password"
                  />
                  {formErrors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.confirmPassword}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fd6a00] text-white text-sm font-medium hover:from-[#fd6a00] hover:to-[#fd8a00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isChangingPassword ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Admin session / Logout */}
          <div className="bg-[--color-surface]/50 border border-[--color-border]/50 rounded-lg sm:rounded-xl p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Admin session</h3>
            <p className="text-sm text-slate-400 mb-4">
              You are signed in to the admin panel. Log out when you finish managing pools and settings.
            </p>
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 font-medium hover:bg-red-500/30 transition-colors"
            >
              Log out
            </button>
          </div>

          <div className="p-3 sm:p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg sm:rounded-xl">
            <p className="text-xs sm:text-sm text-blue-300">
              Keep your admin password secure and change it periodically. Do not share it with anyone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
