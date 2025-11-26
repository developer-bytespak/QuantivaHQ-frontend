"use client";

import { ReactNode } from "react";
import { TradingChartBackground } from "./trading-chart-background";

interface HomepageLayoutProps {
  children: ReactNode;
}

export function HomepageLayout({ children }: HomepageLayoutProps) {
  return (
    <div className="relative min-h-screen bg-black">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" style={{ animationDelay: "0.5s" }} />
      </div>

      {/* Subtle trading chart background throughout */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-5">
        <TradingChartBackground opacity={0.08} />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

