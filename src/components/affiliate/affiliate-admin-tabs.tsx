"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "All affiliates", href: "/super/admin/affiliates" },
  { label: "Applications", href: "/super/admin/affiliates/applications" },
  { label: "Payouts", href: "/super/admin/affiliates/payouts" },
  { label: "Program settings", href: "/super/admin/affiliates/settings" },
];

export function AffiliateAdminTabs() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="mb-6 flex gap-2 overflow-x-auto border-b border-slate-800/80 pb-px">
      {TABS.map((t) => {
        const isActive =
          pathname === t.href ||
          // detail pages (/super/admin/affiliates/<id>) should still highlight "All affiliates"
          (t.href === "/super/admin/affiliates" &&
            /^\/super\/admin\/affiliates\/[^/]+$/.test(pathname));
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition ${
              isActive
                ? "border-[#fc4f02] text-white"
                : "border-transparent text-slate-400 hover:border-slate-700 hover:text-white"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
