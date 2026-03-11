"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { adminGetSettings, adminUpdateBinance } from "@/lib/api/vcpool-admin";
import {
  useNotification,
  Notification,
} from "@/components/common/notification";
import { AdminSettingsBackButton } from "@/components/settings/admin-settings-back-button";

const BINANCE_CONNECTED_DATE_KEY = "quantivahq_admin_binance_connected_date";

export default function AdminSettingsBinancePage() {
  const { notification, showNotification, hideNotification } =
    useNotification();
  const [walletAddress, setWalletAddress] = useState("");
  const [paymentNetwork, setPaymentNetwork] = useState("BSC");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiKeyErrors, setApiKeyErrors] = useState<Record<string, string>>({});
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [connectedDate, setConnectedDate] = useState<string | null>(null);

  const hasConnection = !!(
    walletAddress?.trim() ||
    (typeof window !== "undefined" && localStorage.getItem(BINANCE_CONNECTED_DATE_KEY))
  );

  const loadSettings = () => {
    adminGetSettings()
      .then((data) => {
        setWalletAddress(data.wallet_address ?? data.binance_uid ?? "");
        setPaymentNetwork(data.payment_network ?? "BSC");
        const stored = typeof window !== "undefined"
          ? localStorage.getItem(BINANCE_CONNECTED_DATE_KEY)
          : null;
        setConnectedDate(stored);
      })
      .catch((err: unknown) => {
        showNotification(
          (err as { message?: string })?.message ?? "Failed to load",
          "error"
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateForm = () => {
    const err: Record<string, string> = {};
    if (apiKey.trim() && apiKey.trim().length < 10) err.api_key = "API Key must be at least 10 characters";
    if (apiSecret.trim() && apiSecret.trim().length < 10) err.api_secret = "API Secret must be at least 10 characters";
    if (apiKey.trim() && !apiSecret.trim()) err.api_secret = "API Secret is required when updating API Key";
    if (apiSecret.trim() && !apiKey.trim()) err.api_key = "API Key is required when updating API Secret";
    setApiKeyErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    setApiKeyErrors({});
    try {
      await adminUpdateBinance({
        ...(walletAddress.trim() && {
          wallet_address: walletAddress.trim(),
          payment_network: paymentNetwork.trim(),
        }),
        ...(apiKey.trim() && apiSecret.trim() && {
          api_key: apiKey.trim(),
          api_secret: apiSecret.trim(),
        }),
      });
      const dateStr = new Date().toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
      if (typeof window !== "undefined") {
        localStorage.setItem(BINANCE_CONNECTED_DATE_KEY, dateStr);
      }
      setConnectedDate(dateStr);
      showNotification("Credentials saved successfully", "success");
      setApiKey("");
      setApiSecret("");
      setCredentialsModalOpen(false);
      loadSettings();
    } catch (err: unknown) {
      showNotification(
        (err as { message?: string })?.message ?? "Failed to save",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const displayDate = connectedDate ?? (walletAddress?.trim() ? "Configured" : null);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#fc4f02] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}
      <AdminSettingsBackButton />

      {/* Exchange Connections card - same layout as user */}
      <div className="bg-gradient-to-br from-[--color-surface-alt]/90 to-[--color-surface-alt]/70 backdrop-blur-xl border border-[--color-border] rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-lg space-y-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fc4f02]/10 border border-[#fc4f02]/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 sm:w-6 h-5 sm:h-6 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-white">Exchange Connections</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Manage your crypto exchange connection</p>
          </div>
        </div>

        {/* Crypto Exchange section */}
        <div className="bg-gradient-to-br from-[#fc4f02]/10 to-[#fc4f02]/5 border border-[#fc4f02]/20 rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-1 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Crypto Exchange
          </h2>
          <p className="text-sm text-slate-400 mb-5">
            {hasConnection ? "Connected to Binance" : "Connect a crypto exchange to start trading"}
          </p>

          {hasConnection ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-[--color-surface]/30 border border-[--color-border]/50 rounded-lg sm:rounded-xl p-3 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#f7931a] text-white">
                  <span className="text-lg font-bold">B</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm sm:text-base font-semibold text-white">Binance</p>
                  <p className="text-xs text-slate-400">
                    Connected {displayDate ?? "—"}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => setCredentialsModalOpen(true)}
                  className="px-4 py-2 rounded-lg border border-[#fc4f02]/40 text-[#fc4f02] text-sm font-semibold hover:bg-[#fc4f02]/10 transition-all duration-200"
                >
                  Switch Credentials
                </button>
                <button
                  type="button"
                  onClick={() => setCredentialsModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white text-sm font-semibold hover:shadow-lg hover:shadow-[#fc4f02]/30 transition-all duration-300"
                >
                  Switch Exchange
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-[--color-surface]/30 border border-[--color-border]/50 rounded-lg sm:rounded-xl p-3 sm:p-5">
              <p className="text-sm text-slate-400">No crypto exchange connected yet</p>
              <button
                type="button"
                onClick={() => setCredentialsModalOpen(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white text-sm font-semibold hover:shadow-lg hover:shadow-[#fc4f02]/30 transition-all duration-300"
              >
                Connect
              </button>
            </div>
          )}

          {hasConnection && (
            <div className="mt-3 flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-900/30 border border-green-500/30 text-green-400">
                Active
              </span>
              <span className="text-xs text-slate-500">
                Connected {displayDate ?? "—"}
              </span>
              <button
                type="button"
                onClick={() => setCredentialsModalOpen(true)}
                className="ml-auto text-slate-400 hover:text-white transition-colors"
                aria-label="Open credentials"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Credentials modal: Wallet + API Key/Secret (Switch Credentials / Switch Exchange / Connect) */}
      {credentialsModalOpen && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-lg sm:rounded-2xl border border-[--color-border] bg-[--color-surface] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="border-b border-[--color-border] bg-[--color-surface]/80 backdrop-blur-sm p-4 sm:p-6 flex items-start justify-between flex-shrink-0">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-2xl font-bold text-white">
                  {hasConnection ? "Update credentials" : "Connect Binance"}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Deposit wallet for user payments & API keys for trading
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCredentialsModalOpen(false);
                  setApiKeyErrors({});
                }}
                className="text-slate-400 hover:text-white transition-colors flex-shrink-0"
                aria-label="Close"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveCredentials} className="overflow-y-auto p-4 sm:p-6 space-y-4 flex-1">
              <div>
                <label className="mb-1 block text-sm text-slate-300">Wallet Address (BSC)</label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full rounded-xl border border-[--color-border] bg-[--color-background] px-4 py-2.5 text-white font-mono placeholder:text-slate-500 focus:border-[#fc4f02] focus:outline-none focus:ring-1 focus:ring-[#fc4f02]"
                  disabled={saving}
                />
                <p className="text-xs text-slate-500 mt-1">For on-chain USDT (BEP-20) payments from users</p>
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-300">Network</label>
                <select
                  value={paymentNetwork}
                  onChange={(e) => setPaymentNetwork(e.target.value)}
                  className="w-full rounded-xl border border-[--color-border] bg-[--color-background] px-4 py-2.5 text-white focus:border-[#fc4f02] focus:outline-none focus:ring-1 focus:ring-[#fc4f02]"
                  disabled={saving}
                >
                  <option value="BSC">BSC (BEP-20)</option>
                </select>
              </div>

              <div className="rounded-lg border border-[#fc4f02]/30 bg-[#fc4f02]/10 p-3">
                <p className="text-[#fc4f02] text-xs font-semibold flex items-center gap-2">Security</p>
                <p className="text-slate-300 text-xs mt-1">API keys are encrypted. We never show your secret after saving.</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    if (apiKeyErrors.api_key) setApiKeyErrors((p) => ({ ...p, api_key: "" }));
                  }}
                  placeholder="Enter Binance API key (optional if only updating wallet)"
                  className={`w-full rounded-xl border bg-[--color-background] px-4 py-2.5 text-white font-mono placeholder:text-slate-500 focus:outline-none focus:ring-1 ${
                    apiKeyErrors.api_key ? "border-red-500/50 focus:ring-red-500" : "border-[--color-border] focus:border-[#fc4f02] focus:ring-[#fc4f02]"
                  }`}
                  disabled={saving}
                />
                {apiKeyErrors.api_key && <p className="mt-1 text-xs text-red-400">{apiKeyErrors.api_key}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">API Secret</label>
                <input
                  type="password"
                  value={apiSecret}
                  onChange={(e) => {
                    setApiSecret(e.target.value);
                    if (apiKeyErrors.api_secret) setApiKeyErrors((p) => ({ ...p, api_secret: "" }));
                  }}
                  placeholder="Enter Binance API secret"
                  className={`w-full rounded-xl border bg-[--color-background] px-4 py-2.5 text-white font-mono placeholder:text-slate-500 focus:outline-none focus:ring-1 ${
                    apiKeyErrors.api_secret ? "border-red-500/50 focus:ring-red-500" : "border-[--color-border] focus:border-[#fc4f02] focus:ring-[#fc4f02]"
                  }`}
                  disabled={saving}
                />
                {apiKeyErrors.api_secret && <p className="mt-1 text-xs text-red-400">{apiKeyErrors.api_secret}</p>}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCredentialsModalOpen(false);
                    setApiKeyErrors({});
                  }}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-[--color-border] bg-[--color-surface] hover:bg-[--color-surface-alt] disabled:opacity-50 text-white text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
