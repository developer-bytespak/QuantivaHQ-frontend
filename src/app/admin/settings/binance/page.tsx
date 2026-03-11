"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { adminGetSettings, adminUpdateBinance } from "@/lib/api/vcpool-admin";
import {
  useNotification,
  Notification,
} from "@/components/common/notification";

export default function AdminSettingsBinancePage() {
  const { notification, showNotification, hideNotification } =
    useNotification();
  const [walletAddress, setWalletAddress] = useState("");
  const [paymentNetwork, setPaymentNetwork] = useState("BSC");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminGetSettings()
      .then((data) => {
        setWalletAddress(data.wallet_address ?? data.binance_uid ?? "");
        setPaymentNetwork(data.payment_network ?? "BSC");
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
        payment_network: paymentNetwork.trim(),
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

  return (
    <div className="space-y-6">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}
      <Link
        href="/admin/settings"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Settings
      </Link>
      <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-6">
        <h2 className="text-lg font-semibold text-white mb-2">
          Deposit Wallet Address
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          This wallet address is shown to users for on-chain USDT payments
          (BSC / BEP-20). Users will withdraw USDT to this address.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="wallet-address"
              className="mb-1 block text-sm text-slate-300"
            >
              Wallet Address (BSC)
            </label>
            <input
              id="wallet-address"
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x..."
              className="w-full rounded-xl border border-[--color-border] bg-[--color-background] px-4 py-2.5 text-white font-mono placeholder:text-slate-500 focus:border-[#fc4f02] focus:outline-none focus:ring-1 focus:ring-[#fc4f02]"
              disabled={saving}
            />
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
              onChange={(e) => setPaymentNetwork(e.target.value)}
              className="w-full rounded-xl border border-[--color-border] bg-[--color-background] px-4 py-2.5 text-white focus:border-[#fc4f02] focus:outline-none focus:ring-1 focus:ring-[#fc4f02]"
              disabled={saving}
            >
              <option value="BSC">BSC (BEP-20)</option>
            </select>
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
