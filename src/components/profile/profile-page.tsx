"use client";

import { useState, useEffect } from "react";
import { authService } from "@/lib/auth/auth.service";
import { ProfileSettings } from "./profile-settings";

interface Coin {
  id: string;
  name: string;
  symbol: string;
  amount: number;
  value: number;
  change: number;
  trend: "up" | "down";
  icon: string;
}

interface Stock {
  id: string;
  name: string;
  symbol: string;
  shares: number;
  value: number;
  change: number;
  trend: "up" | "down";
  icon: string;
}

// Helper function for consistent number formatting
const formatNumber = (num: number, decimals: number = 2): string => {
  return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const formatCryptoAmount = (num: number): string => {
  // For crypto amounts, show up to 6 decimal places but remove trailing zeros
  const str = num.toFixed(6);
  return str.replace(/\.?0+$/, "");
};

export function ProfilePage() {
  const [mounted, setMounted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [userName, setUserName] = useState<string>("User");
  const [userEmail, setUserEmail] = useState<string>("user@example.com");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [holdingValue, setHoldingValue] = useState<number>(2509.75);
  const [investedValue, setInvestedValue] = useState<number>(1618.75);
  const [availableUSD, setAvailableUSD] = useState<number>(1589);
  const [portfolioChange, setPortfolioChange] = useState<number>(9.77);

  // Mock data - replace with actual API calls
  const [coins, setCoins] = useState<Coin[]>([
    {
      id: "1",
      name: "Ethereum",
      symbol: "ETH",
      amount: 0.0004586,
      value: 1085.18,
      change: -21.0,
      trend: "down",
      icon: "🔷",
    },
    {
      id: "2",
      name: "Cardano",
      symbol: "ADA",
      amount: 56.89,
      value: 886.127,
      change: 16.31,
      trend: "up",
      icon: "🔵",
    },
    {
      id: "3",
      name: "TRON",
      symbol: "TRX",
      amount: 10.589,
      value: 50.529,
      change: -16.58,
      trend: "down",
      icon: "🔴",
    },
    {
      id: "4",
      name: "Dogecoin",
      symbol: "DOGE",
      amount: 5.485,
      value: 589.39,
      change: 120.0,
      trend: "up",
      icon: "🟡",
    },
  ]);

  const [stocks, setStocks] = useState<Stock[]>([
    {
      id: "1",
      name: "Apple Inc.",
      symbol: "AAPL",
      shares: 10,
      value: 1850.50,
      change: 5.23,
      trend: "up",
      icon: "🍎",
    },
    {
      id: "2",
      name: "Microsoft Corp.",
      symbol: "MSFT",
      shares: 5,
      value: 1825.75,
      change: -2.15,
      trend: "down",
      icon: "🪟",
    },
    {
      id: "3",
      name: "Tesla Inc.",
      symbol: "TSLA",
      shares: 15,
      value: 3450.00,
      change: 12.45,
      trend: "up",
      icon: "⚡",
    },
    {
      id: "4",
      name: "Amazon.com Inc.",
      symbol: "AMZN",
      shares: 8,
      value: 1420.80,
      change: -3.67,
      trend: "down",
      icon: "📦",
    },
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const loadUserData = async () => {
      try {
        const user = await authService.getCurrentUser();
        setUserName(user.username);
        setUserEmail(user.email);
        localStorage.setItem("quantivahq_user_name", user.username);
        localStorage.setItem("quantivahq_user_email", user.email);
      } catch (error) {
        const name = localStorage.getItem("quantivahq_user_name") || "User";
        const email = localStorage.getItem("quantivahq_user_email") || "user@example.com";
        setUserName(name);
        setUserEmail(email);
      }

      const savedImage = localStorage.getItem("quantivahq_profile_image");
      if (savedImage) {
        setProfileImage(savedImage);
      }
    };

    loadUserData();
  }, [mounted]);

  // Generate mini trend graph SVG
  const TrendGraph = ({ trend, id }: { trend: "up" | "down"; id: string }) => {
    const points = trend === "up"
      ? "0,20 5,15 10,18 15,12 20,10 25,8 30,5"
      : "0,5 5,8 10,10 15,12 20,15 25,18 30,20";
    const color = trend === "up" ? "#10b981" : "#ef4444";
    const fillPoints = trend === "up"
      ? "0,20 5,15 10,18 15,12 20,10 25,8 30,5 30,20 0,20"
      : "0,5 5,8 10,10 15,12 20,15 25,18 30,20 30,20 0,20";
    const gradientId = `gradient-${trend}-${id}`;

    return (
      <svg width="40" height="24" viewBox="0 0 30 20" className="flex-shrink-0">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={fillPoints}
          fill={`url(#${gradientId})`}
        />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  if (showSettings) {
    return <ProfileSettings onBack={() => setShowSettings(false)} />;
  }

  // Prevent hydration mismatch by not rendering formatted numbers until mounted
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#c93d02] via-[#d45a00] to-[#d46a00] p-8 shadow-xl">
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-6">Portfolio</h1>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-white/80 mb-1">Holding value</p>
                  <div className="flex items-baseline gap-3">
                    <p className="text-4xl font-bold text-white">$0.00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-[--color-surface-alt]/90 to-[--color-surface-alt]/70 backdrop-blur-xl border border-[--color-border] rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-6">Your Coins</h2>
          </div>
          <div className="bg-gradient-to-br from-[--color-surface-alt]/90 to-[--color-surface-alt]/70 backdrop-blur-xl border border-[--color-border] rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-6">Your Stocks</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#c93d02] via-[#d45a00] to-[#d46a00] p-8 shadow-xl">
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-6">Portfolio</h1>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-white/80 mb-1">Holding value</p>
                <div className="flex items-baseline gap-3">
                  <p className="text-4xl font-bold text-white">${formatNumber(holdingValue)}</p>
                  <span className={`text-lg font-semibold ${portfolioChange >= 0 ? "text-green-300" : "text-red-300"}`}>
                    {portfolioChange >= 0 ? "+" : ""}{portfolioChange.toFixed(2)}%
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 mt-6">
                <div>
                  <p className="text-sm text-white/80 mb-1">Invested value</p>
                  <p className="text-xl font-semibold text-white">${formatNumber(investedValue)}</p>
                </div>
                <div>
                  <p className="text-sm text-white/80 mb-1">Available USD</p>
                  <p className="text-xl font-semibold text-white">${formatNumber(availableUSD)}</p>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="ml-4 p-3 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-200 hover:scale-105"
            aria-label="Settings"
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Coins and Stocks Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Your Coins Section */}
        <div className="bg-gradient-to-br from-[--color-surface-alt]/90 to-[--color-surface-alt]/70 backdrop-blur-xl border border-[--color-border] rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-6">Your Coins</h2>
          <div className="space-y-4">
            {coins.map((coin) => (
              <div
                key={coin.id}
                className="flex items-center justify-between p-4 rounded-xl bg-[--color-surface]/50 border border-[--color-border]/50 hover:border-[#fc4f02]/30 hover:bg-[--color-surface]/70 transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#fc4f02]/20 to-[#fc4f02]/10 border border-[#fc4f02]/20 flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">
                    {coin.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-white truncate">{coin.name}</p>
                    <p className="text-sm text-slate-400">{formatCryptoAmount(coin.amount)} {coin.symbol}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 ml-4">
                  <TrendGraph trend={coin.trend} id={coin.id} />
                  <div className="text-right">
                    <p className="text-base font-semibold text-white">${formatNumber(coin.value)}</p>
                    <p className={`text-sm font-medium ${coin.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {coin.change >= 0 ? "+" : ""}{coin.change.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Your Stocks Section */}
        <div className="bg-gradient-to-br from-[--color-surface-alt]/90 to-[--color-surface-alt]/70 backdrop-blur-xl border border-[--color-border] rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-6">Your Stocks</h2>
          <div className="space-y-4">
            {stocks.map((stock) => (
              <div
                key={stock.id}
                className="flex items-center justify-between p-4 rounded-xl bg-[--color-surface]/50 border border-[--color-border]/50 hover:border-[#fc4f02]/30 hover:bg-[--color-surface]/70 transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1d4ed8]/20 to-[#3b82f6]/10 border border-[#1d4ed8]/20 flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">
                    {stock.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-white truncate">{stock.name}</p>
                    <p className="text-sm text-slate-400">{stock.shares} shares ({stock.symbol})</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 ml-4">
                  <TrendGraph trend={stock.trend} id={stock.id} />
                  <div className="text-right">
                    <p className="text-base font-semibold text-white">${formatNumber(stock.value)}</p>
                    <p className={`text-sm font-medium ${stock.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {stock.change >= 0 ? "+" : ""}{stock.change.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

