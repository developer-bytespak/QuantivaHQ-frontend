"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const BINANCE_TABS = [
  { label: "All Transactions", href: "/admin/binance/transactions" },
  { label: "Deposits", href: "/admin/binance/deposits" },
  { label: "Withdrawals", href: "/admin/binance/withdrawals" },
  { label: "Analytics", href: "/admin/binance/analytics" },
];

export default function AdminBinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap border-b border-[--color-border]">
        {BINANCE_TABS.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (pathname?.startsWith(tab.href + "/") ?? false);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-3 text-sm font-medium capitalize transition-colors ${
                isActive
                  ? "!text-[#fc4f02] bg-[#fc4f02]/20 border-b-2 border-[#fc4f02]"
                  : "!text-white/80 hover:!text-white"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}
