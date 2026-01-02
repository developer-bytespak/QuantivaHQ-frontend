"use client";

import { useState } from "react";

interface CoinDetailHeaderProps {
  coinSymbol: string;
  coinData?: {
    currentPrice: number;
    changePercent24h: number;
    tradingPair?: string;
  };
  stockData?: {
    symbol: string;
    name: string;
    price: number;
    changePercent24h: number;
  };
  connectionType: "crypto" | "stocks" | null;
  activeTab: "Price" | "Info" | "Trading Data";
  onTabChange: (tab: "Price" | "Info" | "Trading Data") => void;
  onBack: () => void;
}

export default function CoinDetailHeader({
  coinSymbol,
  coinData,
  stockData,
  connectionType,
  activeTab,
  onTabChange,
  onBack,
}: CoinDetailHeaderProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  const tabs: Array<"Price" | "Info" | "Trading Data"> = [
    "Price",
    "Info",
    "Trading Data",
  ];

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="rounded-lg border border-[--color-border] bg-[--color-surface] p-2 text-white transition-colors hover:border-[#fc4f02]/50"
          >
            <svg
              className="h-5 w-5"
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
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">
              {connectionType === "stocks" 
                ? `${stockData?.symbol || coinSymbol} Stock`
                : `${coinSymbol}/USDT`
              }
            </h1>
            <button className="text-slate-400 hover:text-white">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="rounded-lg border border-[--color-border] bg-[--color-surface] p-2 text-white transition-colors hover:border-[#fc4f02]/50">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </button>
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className={`rounded-lg border border-[--color-border] bg-[--color-surface] p-2 transition-colors hover:border-[#fc4f02]/50 ${
              isFavorite ? "text-[#fc4f02]" : "text-white"
            }`}
          >
            <svg
              className="h-5 w-5"
              fill={isFavorite ? "currentColor" : "none"}
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`relative whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "text-[#fc4f02]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#fc4f02]" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

