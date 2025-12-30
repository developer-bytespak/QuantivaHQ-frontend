"use client";

import { useState, useEffect } from "react";
import { SettingsBackButton } from "@/components/settings/settings-back-button";

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export default function NotificationsPage() {
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: "email",
      label: "Email Notifications",
      description: "Receive notifications via email",
      enabled: true,
    },
    {
      id: "push",
      label: "Push Notifications",
      description: "Receive push notifications on your device",
      enabled: true,
    },
    {
      id: "trades",
      label: "Trade Alerts",
      description: "Get notified when your trades are executed",
      enabled: true,
    },
    {
      id: "price",
      label: "Price Alerts",
      description: "Receive alerts when prices reach your targets",
      enabled: false,
    },
    {
      id: "news",
      label: "Market News",
      description: "Get updates on important market news",
      enabled: true,
    },
    {
      id: "security",
      label: "Security Alerts",
      description: "Important security and account updates",
      enabled: true,
    },
    {
      id: "promotions",
      label: "Promotions & Offers",
      description: "Receive updates about promotions and special offers",
      enabled: false,
    },
  ]);

  useEffect(() => {
    // Load saved notification settings
    const saved = localStorage.getItem("quantivahq_notification_settings");
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const toggleSetting = (id: string) => {
    const updated = settings.map((setting) =>
      setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
    );
    setSettings(updated);
    localStorage.setItem("quantivahq_notification_settings", JSON.stringify(updated));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <SettingsBackButton />
      
      <div className="bg-gradient-to-br from-[--color-surface-alt]/90 to-[--color-surface-alt]/70 backdrop-blur-xl border border-[--color-border] rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-lg">
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fc4f02]/10 border border-[#fc4f02]/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 sm:w-6 h-5 sm:h-6 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-3xl font-bold text-white">Notifications</h1>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {settings.map((setting) => (
            <div
              key={setting.id}
              className="bg-[--color-surface]/50 border border-[--color-border]/50 rounded-lg sm:rounded-xl p-4 sm:p-6 hover:border-[#fc4f02]/30 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-1">{setting.label}</h3>
                  <p className="text-xs sm:text-sm text-slate-400">{setting.description}</p>
                </div>
                <button
                  onClick={() => toggleSetting(setting.id)}
                  className={`relative inline-flex h-5 sm:h-6 w-10 sm:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#fc4f02]/50 focus:ring-offset-2 focus:ring-offset-[--color-surface] flex-shrink-0 ${
                    setting.enabled ? "bg-[#fc4f02]" : "bg-slate-600"
                  }`}
                >
                  <span
                    className={`inline-block h-3 sm:h-4 w-3 sm:w-4 transform rounded-full bg-white transition-transform ${
                      setting.enabled ? "translate-x-5 sm:translate-x-6" : "translate-x-0.5 sm:translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg sm:rounded-xl">
          <div className="flex items-start gap-2 sm:gap-3">
            <svg className="w-4 sm:w-5 h-4 sm:h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-xs sm:text-sm text-blue-300 font-medium mb-1">Notification Preferences</p>
              <p className="text-xs text-blue-400/80">
                You can manage your notification preferences here. Changes are saved automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

