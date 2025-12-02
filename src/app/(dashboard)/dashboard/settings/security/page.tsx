"use client";

import { useState } from "react";
import { SettingsBackButton } from "@/components/settings/settings-back-button";
import { useNotification, Notification } from "@/components/common/notification";

export default function SecurityPage() {
  const { notification, showNotification, hideNotification } = useNotification();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const handleChangePassword = () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      showNotification("Please fill in all fields", "error");
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
    // Here you would typically make an API call to change the password
    showNotification("Password changed successfully", "success");
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setShowChangePassword(false);
  };

  const toggleTwoFactor = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    // Here you would typically make an API call to enable/disable 2FA
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, nextFieldId?: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (nextFieldId) {
        const nextField = document.getElementById(nextFieldId);
        if (nextField) {
          nextField.focus();
        }
      } else {
        // If no next field, submit the form
        handleChangePassword();
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
                onClick={() => setShowChangePassword(!showChangePassword)}
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
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    onKeyDown={(e) => handleKeyDown(e, "new-password-input")}
                    className="w-full px-4 py-2 rounded-lg bg-[--color-surface] border border-[--color-border] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#fc4f02]/50"
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                  <input
                    id="new-password-input"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    onKeyDown={(e) => handleKeyDown(e, "confirm-password-input")}
                    className="w-full px-4 py-2 rounded-lg bg-[--color-surface] border border-[--color-border] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#fc4f02]/50"
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Confirm New Password</label>
                  <input
                    id="confirm-password-input"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    onKeyDown={(e) => handleKeyDown(e)}
                    className="w-full px-4 py-2 rounded-lg bg-[--color-surface] border border-[--color-border] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#fc4f02]/50"
                    placeholder="Confirm new password"
                  />
                </div>
                <button
                  onClick={handleChangePassword}
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fd6a00] text-white font-medium hover:from-[#fd6a00] hover:to-[#fd8a00] transition-all duration-200"
                >
                  Update Password
                </button>
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

