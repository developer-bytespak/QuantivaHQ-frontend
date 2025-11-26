"use client";

import { useEffect, useState } from "react";

interface PriceData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export function PriceTicker({ className = "" }: { className?: string }) {
  const [prices, setPrices] = useState<PriceData[]>([]);

  useEffect(() => {
    // Initial price data
    const initialPrices: PriceData[] = [
      { symbol: "BTC/USD", price: 43250.50, change: 1250.30, changePercent: 2.98 },
      { symbol: "ETH/USD", price: 2650.75, change: -45.20, changePercent: -1.68 },
      { symbol: "AAPL", price: 178.45, change: 2.15, changePercent: 1.22 },
      { symbol: "TSLA", price: 245.80, change: -5.30, changePercent: -2.11 },
      { symbol: "NVDA", price: 485.20, change: 12.50, changePercent: 2.64 },
      { symbol: "MSFT", price: 378.90, change: 3.25, changePercent: 0.87 },
      { symbol: "SPY", price: 452.30, change: 1.80, changePercent: 0.40 },
      { symbol: "QQQ", price: 385.60, change: -2.10, changePercent: -0.54 },
    ];

    setPrices(initialPrices);

    // Simulate price updates
    const interval = setInterval(() => {
      setPrices((prev) =>
        prev.map((price) => {
          const volatility = price.symbol.includes("/") ? 0.02 : 0.01; // Crypto more volatile
          const change = (Math.random() - 0.5) * volatility * price.price;
          const newPrice = Math.max(price.price * 0.5, Math.min(price.price * 1.5, price.price + change));
          const changePercent = ((newPrice - price.price) / price.price) * 100;
          
          return {
            ...price,
            price: newPrice,
            change: newPrice - price.price,
            changePercent,
          };
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Top Price Ticker */}
      <div className="absolute top-20 left-0 right-0 flex gap-8 text-xs font-mono text-slate-500 opacity-60 overflow-hidden">
        <div className="flex gap-8 animate-scroll-left whitespace-nowrap">
          {prices.map((price, index) => (
            <div key={`top-${index}`} className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-slate-400">{price.symbol}</span>
              <span className="text-white">${price.price.toFixed(2)}</span>
              <span className={price.change >= 0 ? "text-[#10b981]" : "text-[#ef4444]"}>
                {price.change >= 0 ? "+" : ""}
                {price.changePercent.toFixed(2)}%
              </span>
            </div>
          ))}
          {/* Duplicate for seamless loop */}
          {prices.map((price, index) => (
            <div key={`top-dup-${index}`} className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-slate-400">{price.symbol}</span>
              <span className="text-white">${price.price.toFixed(2)}</span>
              <span className={price.change >= 0 ? "text-[#10b981]" : "text-[#ef4444]"}>
                {price.change >= 0 ? "+" : ""}
                {price.changePercent.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Price Ticker (reversed) */}
      <div className="absolute bottom-20 left-0 right-0 flex gap-8 text-xs font-mono text-slate-500 opacity-60 overflow-hidden">
        <div className="flex gap-8 animate-scroll-right whitespace-nowrap">
          {prices.slice().reverse().map((price, index) => (
            <div key={`bottom-${index}`} className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-slate-400">{price.symbol}</span>
              <span className="text-white">${price.price.toFixed(2)}</span>
              <span className={price.change >= 0 ? "text-[#10b981]" : "text-[#ef4444]"}>
                {price.change >= 0 ? "+" : ""}
                {price.changePercent.toFixed(2)}%
              </span>
            </div>
          ))}
          {/* Duplicate for seamless loop */}
          {prices.slice().reverse().map((price, index) => (
            <div key={`bottom-dup-${index}`} className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-slate-400">{price.symbol}</span>
              <span className="text-white">${price.price.toFixed(2)}</span>
              <span className={price.change >= 0 ? "text-[#10b981]" : "text-[#ef4444]"}>
                {price.change >= 0 ? "+" : ""}
                {price.changePercent.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Side Price Displays */}
      <div className="absolute top-1/3 right-8 space-y-4 text-xs font-mono opacity-50">
        {prices.slice(0, 4).map((price, index) => (
          <div key={`side-${index}`} className="flex flex-col items-end gap-1">
            <div className="text-slate-400">{price.symbol}</div>
            <div className="text-white font-semibold">${price.price.toFixed(2)}</div>
            <div className={price.change >= 0 ? "text-[#10b981]" : "text-[#ef4444]"}>
              {price.change >= 0 ? "▲" : "▼"} {Math.abs(price.changePercent).toFixed(2)}%
            </div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-1/3 left-8 space-y-4 text-xs font-mono opacity-50">
        {prices.slice(4).map((price, index) => (
          <div key={`side-left-${index}`} className="flex flex-col gap-1">
            <div className="text-slate-400">{price.symbol}</div>
            <div className="text-white font-semibold">${price.price.toFixed(2)}</div>
            <div className={price.change >= 0 ? "text-[#10b981]" : "text-[#ef4444]"}>
              {price.change >= 0 ? "▲" : "▼"} {Math.abs(price.changePercent).toFixed(2)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

