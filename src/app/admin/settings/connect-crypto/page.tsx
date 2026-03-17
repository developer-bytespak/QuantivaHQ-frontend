"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { SettingsBackButton } from "@/components/settings/settings-back-button";

const ADMIN_EXCHANGE_KEY = "quantivahq_admin_selected_exchange";

export default function AdminConnectCryptoPage() {
  const router = useRouter();

  const handleSelect = (exchange: "binance" | "bybit") => {
    if (typeof window !== "undefined") sessionStorage.setItem(ADMIN_EXCHANGE_KEY, exchange);
    router.push("/admin/settings/connect-api-keys");
  };

  return (
    <div className="space-y-6">
      <SettingsBackButton backHref="/admin/settings/exchange-configuration" />
      <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/50 p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">Choose Crypto Exchange</h1>
        <p className="text-sm text-slate-400 mb-6">Select the exchange you want to connect (admin).</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => handleSelect("binance")}
            className="rounded-xl border-2 border-[--color-border] bg-[--color-surface-alt]/60 p-4 sm:p-6 hover:border-[#fc4f02]/50 hover:shadow-lg text-left transition-all"
          >
            <div className="flex flex-col items-center text-center">
              <Image src="/binance logo.png" alt="Binance" width={48} height={48} className="h-12 w-12 object-contain mb-3" />
              <h3 className="font-semibold text-white mb-1">Binance</h3>
              <p className="text-sm text-slate-300">Largest crypto exchange. Trade with deep liquidity.</p>
            </div>
          </button>
          <button
            onClick={() => handleSelect("bybit")}
            className="rounded-xl border-2 border-[--color-border] bg-[--color-surface-alt]/60 p-4 sm:p-6 hover:border-[#fc4f02]/50 hover:shadow-lg text-left transition-all"
          >
            <div className="flex flex-col items-center text-center">
              <Image src="/bybit logo.png" alt="Bybit" width={48} height={48} className="h-12 w-12 object-contain mb-3" />
              <h3 className="font-semibold text-white mb-1">Bybit</h3>
              <p className="text-sm text-slate-300">Derivatives and spot with competitive fees.</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
