"use client";

import { useState, useEffect } from "react";
import { adminGetSettings, adminUpdateBinance } from "@/lib/api/vcpool-admin";
import { useNotification, Notification } from "@/components/common/notification";
import { SettingsBackButton } from "@/components/settings/settings-back-button";

const NETWORK_OPTIONS = [
  { value: "TRC20", label: "TRC20 (Tron)" },
  { value: "ERC20", label: "ERC20 (Ethereum)" },
  { value: "BEP20", label: "BEP20 (BSC)" },
] as const;

type Network = (typeof NETWORK_OPTIONS)[number]["value"];

export default function AdminSettingsBinancePage() {
  const { notification, showNotification, hideNotification } =
    useNotification();
  const [walletAddress, setWalletAddress] = useState("");
  const [paymentNetwork, setPaymentNetwork] = useState<Network>("TRC20");
  const [connectedExchange, setConnectedExchange] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminGetSettings()
      .then((data) => {
        setWalletAddress(data.wallet_address ?? data.binance_uid ?? "");
        const stored = (data.payment_network ?? "TRC20").toUpperCase();
        const valid = NETWORK_OPTIONS.find((n) => n.value === stored);
        setPaymentNetwork(valid ? (stored as Network) : "TRC20");
        setConnectedExchange(data.connected_exchange_name ?? null);
      })
      .catch((err: unknown) => {
        showNotification(
          (err as { message?: string })?.message ?? "Failed to load",
          "error"
        );
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminUpdateBinance({
        wallet_address: walletAddress.trim(),
        payment_network: paymentNetwork,
      });
      showNotification("Wallet address updated", "success");
    } catch (err: unknown) {
      showNotification(
        (err as { message?: string })?.message ?? "Failed to update",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#fc4f02] border-t-transparent" />
      </div>
    );
  }

  const isBinanceUS = connectedExchange === "Binance.US";
  const showBepWarningForUS = isBinanceUS && paymentNetwork === "BEP20";

  return (
    <div className="space-y-6">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}
      <SettingsBackButton backHref="/admin/settings" />
      <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-slate-400">Connected exchange:</span>
          {connectedExchange ? (
            <span className="rounded-full bg-[#fc4f02]/15 px-3 py-1 text-xs font-medium text-[#fc4f02]">
              {connectedExchange}
            </span>
          ) : (
            <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-300">
              No active connection — connect Binance / Binance.US in Exchange
              Configuration first.
            </span>
          )}
        </div>

        <h2 className="text-lg font-semibold text-white mb-2">
          Deposit Wallet Address
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          This wallet address is shown to users for on-chain USDT payments.
          Pool members will withdraw USDT to this address — Binance Pay / UID
          transfers cannot be detected and will not count.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="wallet-address"
              className="mb-1 block text-sm text-slate-300"
            >
              Wallet Address
            </label>
            <input
              id="wallet-address"
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder={
                paymentNetwork === "TRC20" ? "T..." : "0x..."
              }
              className="w-full rounded-xl border border-[--color-border] bg-[--color-background] px-4 py-2.5 text-white font-mono placeholder:text-slate-500 focus:border-[#fc4f02] focus:outline-none focus:ring-1 focus:ring-[#fc4f02]"
              disabled={saving}
            />
            <p className="mt-1 text-xs text-slate-500">
              Use the deposit address from your {connectedExchange ?? "exchange"} account
              for the {paymentNetwork} network.
            </p>
          </div>
          <div>
            <label
              htmlFor="payment-network"
              className="mb-1 block text-sm text-slate-300"
            >
              Network
            </label>
            <select
              id="payment-network"
              value={paymentNetwork}
              onChange={(e) => setPaymentNetwork(e.target.value as Network)}
              className="w-full rounded-xl border border-[--color-border] bg-[--color-background] px-4 py-2.5 text-white focus:border-[#fc4f02] focus:outline-none focus:ring-1 focus:ring-[#fc4f02]"
              disabled={saving}
            >
              {NETWORK_OPTIONS.map((n) => (
                <option key={n.value} value={n.value}>
                  {n.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              TRC20 is the cheapest cross-platform option. ERC20 also works on
              both Binance.com and Binance.US.
            </p>
            {showBepWarningForUS && (
              <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                ⚠ BEP20 (BSC) USDT support on Binance.US is inconsistent. Pool
                members on Binance.com or other wallets may not be able to
                withdraw to your address on this network. TRC20 or ERC20 is
                safer.
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={saving || !walletAddress.trim()}
            className="rounded-xl bg-[#fc4f02] px-5 py-2.5 font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
}
