"use client";

import { ReactNode } from "react";
import { useExchange } from "@/context/ExchangeContext";

export default function VcPoolLayout({ children }: { children: ReactNode }) {
  const { connectionType, isLoading } = useExchange();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#fc4f02] border-t-transparent" />
      </div>
    );
  }

  if (connectionType === "stocks") {
    return (
      <div className="min-h-screen bg-[--color-surface] p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-xl border border-[--color-border] bg-[--color-surface-alt] p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10">
              <svg className="h-8 w-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">VC Pools Not Available</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              VC pools are only available for crypto connections. Switch to a crypto exchange connection to access VC pools.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
