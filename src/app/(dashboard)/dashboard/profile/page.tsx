"use client";

import { useState, useEffect } from "react";

export default function ProfilePage() {
  const [userName, setUserName] = useState<string>("User");
  const [userEmail, setUserEmail] = useState<string>("user@example.com");
  const [userInitial, setUserInitial] = useState<string>("U");
  const [personalInfo, setPersonalInfo] = useState<any>(null);
  const [selectedExchange, setSelectedExchange] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>("");
  const [editEmail, setEditEmail] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const name = localStorage.getItem("quantivahq_user_name") || "User";
      const email = localStorage.getItem("quantivahq_user_email") || "user@example.com";
      const exchange = localStorage.getItem("quantivahq_selected_exchange") || "";
      const personalInfoStr = localStorage.getItem("quantivahq_personal_info");
      
      setUserName(name);
      setUserEmail(email);
      setEditName(name);
      setEditEmail(email);
      setUserInitial(name.charAt(0).toUpperCase());
      setSelectedExchange(exchange);
      
      if (personalInfoStr) {
        try {
          setPersonalInfo(JSON.parse(personalInfoStr));
        } catch (e) {
          console.error("Failed to parse personal info", e);
        }
      }
    }
  }, []);

  const handleEdit = () => {
    setEditName(userName);
    setEditEmail(userEmail);
    setIsEditing(true);
    setSaveSuccess(false);
  };

  const handleCancel = () => {
    setEditName(userName);
    setEditEmail(userEmail);
    setIsEditing(false);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!editName.trim() || !editEmail.trim()) {
      return;
    }

    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      // Update localStorage
      localStorage.setItem("quantivahq_user_name", editName.trim());
      localStorage.setItem("quantivahq_user_email", editEmail.trim());
      
      // Update state
      setUserName(editName.trim());
      setUserEmail(editEmail.trim());
      setUserInitial(editName.trim().charAt(0).toUpperCase());
      
      setIsEditing(false);
      setIsSaving(false);
      setSaveSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    }, 500);
  };

  const tradingStats = [
    { label: "Total Trades", value: "1,247", change: "+12%", positive: true },
    { label: "Win Rate", value: "68.5%", change: "+2.3%", positive: true },
    { label: "Avg. Return", value: "4.2%", change: "+0.8%", positive: true },
    { label: "Total Volume", value: "$2.4M", change: "+15%", positive: true },
  ];

  const accountInfo = [
    { label: "Account Type", value: selectedExchange ? selectedExchange.charAt(0).toUpperCase() + selectedExchange.slice(1) : "Not Set" },
    { label: "Member Since", value: "Jan 2024" },
    { label: "Verification Status", value: "Verified", verified: true },
    { label: "Account Tier", value: "Pro", tier: true },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
        <p className="mt-1 text-sm text-slate-400">Manage your account information and trading preferences</p>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="rounded-xl border border-green-500/50 bg-green-500/10 p-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-500/20">
              <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-400">Profile updated successfully!</p>
            </div>
            <button
              onClick={() => setSaveSuccess(false)}
              className="text-green-400 hover:text-green-300"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-xl shadow-blue-900/10">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#fc4f02] to-[#fda300] text-2xl font-bold text-white shadow-lg shadow-[#fc4f02]/30">
            {userInitial}
          </div>
          <div className="flex-1 text-center sm:text-left">
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-xl border-2 border-[--color-border] bg-[--color-surface] px-3 py-2 text-sm text-white placeholder-slate-500 transition-all duration-300 focus:border-[#fc4f02] focus:outline-none focus:ring-4 focus:ring-[#fc4f02]/20"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Email Address</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full rounded-xl border-2 border-[--color-border] bg-[--color-surface] px-3 py-2 text-sm text-white placeholder-slate-500 transition-all duration-300 focus:border-[#fc4f02] focus:outline-none focus:ring-4 focus:ring-[#fc4f02]/20"
                    placeholder="Enter your email"
                  />
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-white">{userName}</h2>
                <p className="mt-1 text-sm text-slate-400">{userEmail}</p>
                {personalInfo && (
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 sm:justify-start">
                    {personalInfo.countryOfResidence && (
                      <span className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 002 2h2.945M11 20v-5a2 2 0 012-2h4a2 2 0 012 2v5M7 7h.01M7 3h.01M21 3h.01M21 7h.01M21 11h.01M7 11h.01" />
                        </svg>
                        {personalInfo.countryOfResidence}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Verified Account
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="rounded-xl border border-[--color-border] bg-[--color-surface] px-4 py-2 text-sm font-medium text-white transition-all hover:border-slate-500/50 hover:bg-[--color-surface-alt] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !editName.trim() || !editEmail.trim()}
                  className="rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#fc4f02]/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={handleEdit}
                className="rounded-xl border border-[--color-border] bg-[--color-surface] px-4 py-2 text-sm font-medium text-white transition-all hover:border-[#fc4f02]/50 hover:bg-[--color-surface-alt]"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Trading Statistics */}
      <div className="rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-xl shadow-blue-900/10">
        <h2 className="mb-4 text-lg font-semibold text-white">Trading Statistics</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tradingStats.map((stat, index) => (
            <div key={index} className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
              <p className="mb-1 text-xs text-slate-400">{stat.label}</p>
              <p className="mb-2 text-2xl font-bold text-white">{stat.value}</p>
              <div className="flex items-center gap-1">
                <span className={`text-xs font-medium ${stat.positive ? "text-green-400" : "text-red-400"}`}>
                  {stat.change}
                </span>
                <span className="text-xs text-slate-500">vs last month</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Account Information & Settings Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Account Information */}
        <div className="rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-xl shadow-blue-900/10">
          <h2 className="mb-4 text-lg font-semibold text-white">Account Information</h2>
          <div className="space-y-4">
            {accountInfo.map((info, index) => (
              <div key={index} className="flex items-center justify-between border-b border-[--color-border] pb-3 last:border-0 last:pb-0">
                <span className="text-sm text-slate-400">{info.label}</span>
                <div className="flex items-center gap-2">
                  {info.verified && (
                    <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {info.tier && (
                    <span className="rounded-full bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-2 py-0.5 text-xs font-semibold text-white">
                      {info.value}
                    </span>
                  )}
                  {!info.verified && !info.tier && (
                    <span className="text-sm font-medium text-white">{info.value}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Connected Exchanges */}
        <div className="rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-xl shadow-blue-900/10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Connected Exchanges</h2>
            <button className="text-xs text-[#fc4f02] hover:text-[#fda300] transition-colors">
              Connect New
            </button>
          </div>
          <div className="space-y-3">
            {selectedExchange ? (
              <div className="flex items-center justify-between rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/20">
                    <span className="text-lg font-bold text-[#fc4f02]">
                      {selectedExchange.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {selectedExchange.charAt(0).toUpperCase() + selectedExchange.slice(1)}
                    </p>
                    <p className="text-xs text-slate-400">Connected</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-400"></div>
                  <span className="text-xs text-green-400">Active</span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4 text-center">
                <p className="text-sm text-slate-400">No exchanges connected</p>
                <button className="mt-2 text-xs text-[#fc4f02] hover:text-[#fda300] transition-colors">
                  Connect your first exchange
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Security Settings */}
        <div className="rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-xl shadow-blue-900/10">
          <h2 className="mb-4 text-lg font-semibold text-white">Security</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
              <div>
                <p className="font-medium text-white">Password</p>
                <p className="text-xs text-slate-400">Last changed 30 days ago</p>
              </div>
              <button className="rounded-lg border border-[--color-border] bg-[--color-surface] px-3 py-1.5 text-xs font-medium text-white transition-all hover:border-[#fc4f02]/50 hover:bg-[--color-surface-alt]">
                Change
              </button>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
              <div>
                <p className="font-medium text-white">Two-Factor Authentication</p>
                <p className="text-xs text-slate-400">Add an extra layer of security</p>
              </div>
              <button className="rounded-lg border border-[--color-border] bg-[--color-surface] px-3 py-1.5 text-xs font-medium text-white transition-all hover:border-[#fc4f02]/50 hover:bg-[--color-surface-alt]">
                Enable
              </button>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
              <div>
                <p className="font-medium text-white">API Keys</p>
                <p className="text-xs text-slate-400">Manage your exchange API keys</p>
              </div>
              <button className="rounded-lg border border-[--color-border] bg-[--color-surface] px-3 py-1.5 text-xs font-medium text-white transition-all hover:border-[#fc4f02]/50 hover:bg-[--color-surface-alt]">
                Manage
              </button>
            </div>
          </div>
        </div>

        {/* Trading Preferences */}
        <div className="rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-xl shadow-blue-900/10">
          <h2 className="mb-4 text-lg font-semibold text-white">Trading Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
              <div>
                <p className="font-medium text-white">Risk Level</p>
                <p className="text-xs text-slate-400">Current: Medium</p>
              </div>
              <button className="rounded-lg border border-[--color-border] bg-[--color-surface] px-3 py-1.5 text-xs font-medium text-white transition-all hover:border-[#fc4f02]/50 hover:bg-[--color-surface-alt]">
                Adjust
              </button>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
              <div>
                <p className="font-medium text-white">Auto-Trading</p>
                <p className="text-xs text-slate-400">AI-powered automated trading</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" className="peer sr-only" defaultChecked />
                <div className="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-gradient-to-r peer-checked:from-[#fc4f02] peer-checked:to-[#fda300] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#fc4f02]/20"></div>
              </label>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
              <div>
                <p className="font-medium text-white">Email Notifications</p>
                <p className="text-xs text-slate-400">Trade alerts and updates</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" className="peer sr-only" defaultChecked />
                <div className="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-gradient-to-r peer-checked:from-[#fc4f02] peer-checked:to-[#fda300] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#fc4f02]/20"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-xl shadow-blue-900/10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
          <button className="text-xs text-[#fc4f02] hover:text-[#fda300] transition-colors">
            View All
          </button>
        </div>
        <div className="space-y-3">
          {[
            { action: "Account verified", time: "2 days ago", icon: "check", bgColor: "bg-green-500/20", iconColor: "text-green-400" },
            { action: "API key connected", time: "5 days ago", icon: "key", bgColor: "bg-blue-500/20", iconColor: "text-blue-400" },
            { action: "Password changed", time: "30 days ago", icon: "lock", bgColor: "bg-slate-500/20", iconColor: "text-slate-400" },
            { action: "Profile updated", time: "45 days ago", icon: "user", bgColor: "bg-slate-500/20", iconColor: "text-slate-400" },
          ].map((activity, index) => (
            <div key={index} className="flex items-center gap-3 rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${activity.bgColor}`}>
                {activity.icon === "check" && (
                  <svg className={`h-4 w-4 ${activity.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {activity.icon === "key" && (
                  <svg className={`h-4 w-4 ${activity.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                )}
                {activity.icon === "lock" && (
                  <svg className={`h-4 w-4 ${activity.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
                {activity.icon === "user" && (
                  <svg className={`h-4 w-4 ${activity.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{activity.action}</p>
                <p className="text-xs text-slate-400">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

