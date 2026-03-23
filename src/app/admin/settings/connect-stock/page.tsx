"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { SettingsBackButton } from "@/components/settings/settings-back-button";

const ADMIN_EXCHANGE_KEY = "quantivahq_admin_selected_exchange";

function ExchangeCard({
  name,
  description,
  logo,
  gradient,
  onSelect,
}: {
  name: string;
  description: string;
  logo: React.ReactNode;
  gradient: string;
  onSelect: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative overflow-hidden rounded-xl border-2 border-[--color-border] bg-[--color-surface-alt]/60 backdrop-blur transition-all duration-300 p-4 sm:p-6 hover:border-[#10b981]/50 hover:shadow-lg hover:shadow-[#10b981]/20 w-full max-w-md mx-auto"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-opacity duration-300 ${isHovered ? "opacity-10" : "opacity-0"}`} />
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="mb-3 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center group-hover:scale-110 transition-transform">
          {logo}
        </div>
        <h3 className="mb-2 text-base font-semibold text-white">{name}</h3>
        <p className="text-sm text-slate-300">{description}</p>
      </div>
    </button>
  );
}

export default function AdminConnectStockPage() {
  const router = useRouter();

  const handleSelect = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(ADMIN_EXCHANGE_KEY, "alpaca");
    }
    router.push("/admin/settings/connect-api-keys");
  };

  return (
    <div className="space-y-6">
      <SettingsBackButton backHref="/admin/settings/exchange-configuration" />
      <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/50 p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">Choose Stock Broker</h1>
        <p className="text-sm text-slate-400 mb-6">Select the broker you want to connect (admin).</p>
        <div className="flex justify-center">
          <ExchangeCard
            name="Alpaca"
            description="Commission-free stock trading API. Access US stocks with simple API integration."
            gradient="from-[#fcba03] to-[#fda300]"
            logo={
              <div className="flex h-full w-full items-center justify-center p-2">
                <Image src="/alpaca_logo.png" alt="Alpaca" width={64} height={64} className="h-full w-full object-contain" />
              </div>
            }
            onSelect={handleSelect}
          />
        </div>
      </div>
    </div>
  );
}
