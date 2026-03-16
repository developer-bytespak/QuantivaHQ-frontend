"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SettingsBackButton } from "@/components/settings/settings-back-button";
import { useNotification, Notification } from "@/components/common/notification";
import { adminExchangesService } from "@/lib/api/admin-exchanges.service";

const ADMIN_EXCHANGE_KEY = "quantivahq_admin_selected_exchange";

export default function AdminConnectApiKeysPage() {
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();
  const [exchange, setExchange] = useState<"binance" | "bybit" | "alpaca" | null>(null);
  const [exchangeId, setExchangeId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [enableTrading, setEnableTrading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const ex = typeof window !== "undefined" ? sessionStorage.getItem(ADMIN_EXCHANGE_KEY) : null;
    if (ex === "binance" || ex === "bybit" || ex === "alpaca") {
      setExchange(ex);
    } else {
      setExchange("binance");
    }
  }, []);

  useEffect(() => {
    if (!exchange) return;
    const name = exchange === "alpaca" ? "Alpaca" : exchange === "bybit" ? "Bybit" : "Binance";
    const type = exchange === "alpaca" ? "stocks" : "crypto";
    adminExchangesService
      .ensureExchange(name, type)
      .then((data) => {
        setExchangeId(data.exchange_id);
      })
      .catch(() => {
        setErrors({ general: "Could not load exchange. Try again." });
      })
      .finally(() => setLoading(false));
  }, [exchange]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!apiKey.trim()) e.apiKey = "API Key is required";
    else if (apiKey.trim().length < 10) e.apiKey = "API Key seems invalid";
    if (!secretKey.trim()) e.secretKey = "Secret Key is required";
    else if (secretKey.trim().length < 10) e.secretKey = "Secret Key seems invalid";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !exchangeId || !exchange) return;
    setSubmitting(true);
    setErrors({});
    try {
      await adminExchangesService.createConnection({
        exchange_id: exchangeId,
        api_key: apiKey.trim(),
        api_secret: secretKey.trim(),
        enable_trading: enableTrading,
      });
      if (typeof window !== "undefined") sessionStorage.removeItem(ADMIN_EXCHANGE_KEY);
      showNotification("Exchange connected successfully", "success");
      router.push("/admin/settings/exchange-configuration");
    } catch (err: unknown) {
      const msg = (err as { message?: string; response?: { status?: number } })?.message ?? "Connection failed.";
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        setErrors({ general: "Admin exchange connection may require backend support for admin auth. Please try from the main app if needed." });
      } else {
        setErrors({ general: msg });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const exchangeName = exchange === "alpaca" ? "Alpaca" : exchange === "bybit" ? "Bybit" : "Binance";

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#fc4f02] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notification && <Notification message={notification.message} type={notification.type} onClose={hideNotification} />}
      <SettingsBackButton backHref="/admin/settings/exchange-configuration" />

      <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/50 p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">Enter API Keys</h1>
        <p className="text-sm text-slate-400 mb-6">Connect your {exchangeName} account (admin).</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{errors.general}</div>
          )}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">API Key *</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); if (errors.apiKey) setErrors({ ...errors, apiKey: "" }); }}
              placeholder={`${exchangeName} API Key`}
              className="w-full rounded-lg border border-[--color-border] bg-[--color-surface-alt] px-4 py-2.5 text-white placeholder-slate-500 focus:border-[#fc4f02] focus:outline-none"
            />
            {errors.apiKey && <p className="text-red-400 text-xs mt-1">{errors.apiKey}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Secret Key *</label>
            <input
              type="password"
              value={secretKey}
              onChange={(e) => { setSecretKey(e.target.value); if (errors.secretKey) setErrors({ ...errors, secretKey: "" }); }}
              placeholder={`${exchangeName} Secret Key`}
              className="w-full rounded-lg border border-[--color-border] bg-[--color-surface-alt] px-4 py-2.5 text-white placeholder-slate-500 focus:border-[#fc4f02] focus:outline-none"
            />
            {errors.secretKey && <p className="text-red-400 text-xs mt-1">{errors.secretKey}</p>}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enableTrading"
              checked={enableTrading}
              onChange={(e) => setEnableTrading(e.target.checked)}
              className="rounded border-[--color-border] text-[#fc4f02] focus:ring-[#fc4f02]"
            />
            <label htmlFor="enableTrading" className="text-sm text-slate-300">Enable trading</label>
          </div>
          <button
            type="submit"
            disabled={submitting || !exchangeId}
            className="w-full rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 py-2.5 font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Connecting…" : "Connect"}
          </button>
        </form>
      </div>
    </div>
  );
}
