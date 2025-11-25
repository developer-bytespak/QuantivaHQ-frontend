/// <reference types="react" />
/// <reference types="react-dom" />
"use client";

import { useState } from "react";

interface Holding {
  symbol: string;
  name: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  pl: number;
  plPercent: number;
  dayChange: number;
  weight: number;
  type: "Stocks" | "ETFs";
  sector: string;
}

const holdingsData: Holding[] = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    quantity: 150,
    avgCost: 168.50,
    currentPrice: 182.45,
    marketValue: 27367,
    pl: 2092,
    plPercent: 8.20,
    dayChange: 0.62,
    weight: 11.0,
    type: "Stocks",
    sector: "Technology",
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    quantity: 120,
    avgCost: 195.30,
    currentPrice: 203.64,
    marketValue: 24437,
    pl: 1000,
    plPercent: 4.27,
    dayChange: 0.45,
    weight: 9.8,
    type: "Stocks",
    sector: "Technology",
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    quantity: 80,
    avgCost: 245.60,
    currentPrice: 254.86,
    marketValue: 20389,
    pl: 741,
    plPercent: 3.77,
    dayChange: 1.23,
    weight: 8.2,
    type: "Stocks",
    sector: "Technology",
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    quantity: 140,
    avgCost: 120.50,
    currentPrice: 122.93,
    marketValue: 17210,
    pl: 340,
    plPercent: 2.02,
    dayChange: 0.28,
    weight: 6.9,
    type: "Stocks",
    sector: "Technology",
  },
  {
    symbol: "AMZN",
    name: "Amazon.com Inc.",
    quantity: 90,
    avgCost: 148.20,
    currentPrice: 150.93,
    marketValue: 13584,
    pl: 246,
    plPercent: 1.84,
    dayChange: 0.51,
    weight: 5.5,
    type: "Stocks",
    sector: "Consumer",
  },
  {
    symbol: "SPY",
    name: "SPDR S&P 500 ETF Trust",
    quantity: 200,
    avgCost: 420.50,
    currentPrice: 435.20,
    marketValue: 87040,
    pl: 2940,
    plPercent: 3.49,
    dayChange: 0.85,
    weight: 35.0,
    type: "ETFs",
    sector: "Financials",
  },
  {
    symbol: "QQQ",
    name: "Invesco QQQ Trust",
    quantity: 150,
    avgCost: 380.30,
    currentPrice: 392.45,
    marketValue: 58868,
    pl: 1823,
    plPercent: 3.19,
    dayChange: 0.92,
    weight: 23.6,
    type: "ETFs",
    sector: "Technology",
  },
  {
    symbol: "JNJ",
    name: "Johnson & Johnson",
    quantity: 100,
    avgCost: 165.80,
    currentPrice: 168.50,
    marketValue: 16850,
    pl: 270,
    plPercent: 1.63,
    dayChange: 0.35,
    weight: 6.8,
    type: "Stocks",
    sector: "Healthcare",
  },
];

const sectors = [
  { name: "Technology", percentage: 28.5, color: "bg-blue-500" },
  { name: "Healthcare", percentage: 18.2, color: "bg-green-500" },
  { name: "Financials", percentage: 15.7, color: "bg-orange-500" },
  { name: "Consumer", percentage: 12.3, color: "bg-purple-500" },
  { name: "Industrials", percentage: 9.8, color: "bg-red-500" },
  { name: "Others", percentage: 15.5, color: "bg-slate-400" },
];

const topHoldings = [
  { symbol: "AAPL", percentage: 11.0, value: 27366 },
  { symbol: "MSFT", percentage: 9.8, value: 24437 },
  { symbol: "NVDA", percentage: 8.2, value: 20389 },
  { symbol: "GOOGL", percentage: 6.9, value: 17210 },
  { symbol: "AMZN", percentage: 5.5, value: 13584 },
];

// Pie Chart Component for Sector Allocation
function SectorPieChart({ 
  data, 
  hoveredSector, 
  onSectorHover 
}: { 
  data: typeof sectors;
  hoveredSector: string | null;
  onSectorHover: (sectorName: string | null) => void;
}) {
  const size = 280;
  const radius = size / 2 - 10;
  const center = size / 2;
  
  // Map Tailwind colors to hex values
  const colorMap: Record<string, string> = {
    "bg-blue-500": "#3b82f6",
    "bg-green-500": "#10b981",
    "bg-orange-500": "#f97316",
    "bg-purple-500": "#a855f7",
    "bg-red-500": "#ef4444",
    "bg-slate-400": "#94a3b8",
  };

  let currentAngle = -90; // Start at top
  
  const segments = data.map((sector) => {
    const percentage = sector.percentage;
    const angle = (percentage / 100) * 360;
    
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    const x1 = center + radius * Math.cos(startAngleRad);
    const y1 = center + radius * Math.sin(startAngleRad);
    const x2 = center + radius * Math.cos(endAngleRad);
    const y2 = center + radius * Math.sin(endAngleRad);
    
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    const pathData = [
      `M ${center} ${center}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      "Z",
    ].join(" ");
    
    currentAngle += angle;
    
    const isHovered = hoveredSector === sector.name;
    
    return {
      path: pathData,
      color: colorMap[sector.color] || "#94a3b8",
      name: sector.name,
      percentage,
      isHovered,
    };
  });

  const totalPercentage = data.reduce((sum, s) => sum + s.percentage, 0);
  const hoveredData = segments.find(s => s.isHovered);
  const displayPercentage = hoveredData ? hoveredData.percentage : totalPercentage;
  const displayText = hoveredData ? hoveredData.name : "Total";

  return (
    <div className="relative">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        {segments.map((segment, index) => {
          const isHovered = segment.isHovered;
          const isDimmed = hoveredSector && hoveredSector !== segment.name;
          
          return (
            <g key={index}>
              <path
                d={segment.path}
                fill={segment.color}
                opacity={isHovered ? 1 : isDimmed ? 0.4 : 0.9}
                className="transition-all duration-300 cursor-pointer"
                stroke={isHovered ? "rgba(255, 255, 255, 0.5)" : "rgba(15, 23, 42, 0.8)"}
                strokeWidth={isHovered ? 3 : 2}
                filter={isHovered ? "url(#glow)" : undefined}
                onMouseEnter={() => onSectorHover(segment.name)}
                onMouseLeave={() => onSectorHover(null)}
              />
            </g>
          );
        })}
        {/* Glow filter for hover effect */}
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {/* Center circle */}
        <circle
          cx={center}
          cy={center}
          r={radius * 0.5}
          fill="rgb(15, 23, 42)"
          stroke="rgba(148, 163, 184, 0.2)"
          strokeWidth="2"
        />
        <g transform={`translate(${center}, ${center}) rotate(90)`}>
          <text
            x="0"
            y="-5"
            textAnchor="middle"
            fill="white"
            fontSize="24"
            fontWeight="bold"
            fontFamily="system-ui"
            className="transition-all duration-300"
          >
            {displayPercentage.toFixed(1)}%
          </text>
          <text
            x="0"
            y="12"
            textAnchor="middle"
            fill={hoveredData ? hoveredData.color : "#94a3b8"}
            fontSize="12"
            fontFamily="system-ui"
            className="transition-all duration-300"
          >
            {displayText}
          </text>
        </g>
      </svg>
    </div>
  );
}

export default function HoldingsPage() {
  const [filter, setFilter] = useState<"All" | "Stocks" | "ETFs">("All");
  const [grouping, setGrouping] = useState<"None" | "Sector">("None");
  const [showOverlay, setShowOverlay] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);
  const [hoveredSector, setHoveredSector] = useState<string | null>(null);

  // Filter holdings based on selected filter
  const filteredHoldings = holdingsData.filter((holding) => {
    if (filter === "All") return true;
    return holding.type === filter;
  });

  // Group holdings by sector if grouping is enabled
  const groupedHoldings = grouping === "Sector"
    ? filteredHoldings.reduce((acc, holding) => {
        const sector = holding.sector;
        if (!acc[sector]) {
          acc[sector] = [];
        }
        acc[sector].push(holding);
        return acc;
      }, {} as Record<string, Holding[]>)
    : null;

  // Get sorted sector names for display
  const sectorNames = groupedHoldings
    ? Object.keys(groupedHoldings).sort()
    : [];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-400">Manage and track your stock portfolio</p>
        </div>

        <div className="flex gap-3">
          {/* Grouping Toggle */}
          <div className="flex gap-1 rounded-lg border border-[--color-border] bg-[--color-surface]/60 p-1">
            <button
              onClick={() => setGrouping("None")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                grouping === "None"
                  ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              No grouping
            </button>
            <button
              onClick={() => setGrouping("Sector")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                grouping === "Sector"
                  ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sector grouping
            </button>
          </div>

          {/* Filter */}
          <div className="flex gap-1 rounded-lg border border-[--color-border] bg-[--color-surface]/60 p-1">
            <button
              onClick={() => setFilter("All")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                filter === "All"
                  ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("Stocks")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                filter === "Stocks"
                  ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Stocks
            </button>
            <button
              onClick={() => setFilter("ETFs")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                filter === "ETFs"
                  ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              ETFs
            </button>
          </div>
        </div>
      </div>

      {/* Holdings Cards */}
      {grouping === "Sector" && groupedHoldings ? (
        // Grouped by Sector
        <div className="space-y-8">
          {sectorNames.map((sector) => (
            <div key={sector} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">{sector}</h3>
                <span className="text-sm text-slate-400">
                  {groupedHoldings[sector].length} {groupedHoldings[sector].length === 1 ? "holding" : "holdings"}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {groupedHoldings[sector].map((holding) => (
                  <div
                    key={holding.symbol}
                    onClick={() => {
                      setSelectedHolding(holding);
                      setShowOverlay(true);
                    }}
                    className="group relative rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-xl shadow-blue-900/10 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-[#fc4f02]/30 hover:shadow-2xl hover:shadow-[#fc4f02]/10"
                  >
                    <div className="flex flex-col h-full justify-between">
                      {/* Header Section */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/30 to-blue-600/20 text-lg font-bold text-white shadow-lg shadow-blue-500/20">
                            {holding.symbol[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-white truncate">{holding.symbol}</h3>
                            <p className="text-xs text-slate-400 truncate mt-0.5">{holding.name}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-xs font-medium text-slate-500">{holding.weight.toFixed(1)}%</span>
                              <span className="text-xs text-slate-600">•</span>
                              <span className="text-xs text-slate-500">{holding.type}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="flex items-center gap-2">
                            <p className="text-base font-bold text-white">${holding.currentPrice.toFixed(2)}</p>
                            <div className="h-2 w-2 rounded-full bg-green-400 shadow-sm shadow-green-400/50"></div>
                          </div>
                          <p className="text-sm font-semibold text-green-400 mt-1">+{holding.dayChange.toFixed(2)}%</p>
                        </div>
                      </div>
                      
                      {/* Metrics Grid */}
                      <div className="grid grid-cols-2 gap-4 pt-6 border-t border-[--color-border]/50">
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Quantity</p>
                          <p className="text-xl font-bold text-white">{holding.quantity}</p>
                          <p className="text-xs text-slate-500">shares</p>
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Market Value</p>
                          <p className="text-xl font-bold text-white">${holding.marketValue.toLocaleString()}</p>
                          <p className="text-xs text-slate-500">total value</p>
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">P/L</p>
                          <p className="text-xl font-bold text-green-400">+${holding.pl.toLocaleString()}</p>
                          <p className="text-xs text-green-400/70">{holding.plPercent.toFixed(2)}% gain</p>
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Avg Cost</p>
                          <p className="text-xl font-bold text-white">${holding.avgCost.toFixed(2)}</p>
                          <p className="text-xs text-slate-500">per share</p>
                        </div>
                      </div>

                      {/* Progress Indicator */}
                      <div className="mt-6 pt-4 border-t border-[--color-border]/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-slate-400">Performance</span>
                          <span className="text-xs font-bold text-green-400">+{holding.plPercent.toFixed(2)}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                            style={{ width: `${Math.min(holding.plPercent * 10, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Hover Effect Border */}
                    <div className="absolute inset-0 rounded-2xl border-2 border-[#fc4f02]/0 group-hover:border-[#fc4f02]/20 transition-all duration-300 pointer-events-none" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Not grouped - show all filtered holdings
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredHoldings.map((holding) => (
          <div
            key={holding.symbol}
            onClick={() => {
              setSelectedHolding(holding);
              setShowOverlay(true);
            }}
            className="group relative rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-xl shadow-blue-900/10 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-[#fc4f02]/30 hover:shadow-2xl hover:shadow-[#fc4f02]/10"
          >
            <div className="flex flex-col h-full justify-between">
              {/* Header Section */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/30 to-blue-600/20 text-lg font-bold text-white shadow-lg shadow-blue-500/20">
                    {holding.symbol[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-white truncate">{holding.symbol}</h3>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{holding.name}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs font-medium text-slate-500">{holding.weight.toFixed(1)}%</span>
                      <span className="text-xs text-slate-600">•</span>
                      <span className="text-xs text-slate-500">{holding.type}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-bold text-white">${holding.currentPrice.toFixed(2)}</p>
                    <div className="h-2 w-2 rounded-full bg-green-400 shadow-sm shadow-green-400/50"></div>
                  </div>
                  <p className="text-sm font-semibold text-green-400 mt-1">+{holding.dayChange.toFixed(2)}%</p>
                </div>
              </div>
              
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-[--color-border]/50">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Quantity</p>
                  <p className="text-xl font-bold text-white">{holding.quantity}</p>
                  <p className="text-xs text-slate-500">shares</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Market Value</p>
                  <p className="text-xl font-bold text-white">${holding.marketValue.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">total value</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">P/L</p>
                  <p className="text-xl font-bold text-green-400">+${holding.pl.toLocaleString()}</p>
                  <p className="text-xs text-green-400/70">{holding.plPercent.toFixed(2)}% gain</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Avg Cost</p>
                  <p className="text-xl font-bold text-white">${holding.avgCost.toFixed(2)}</p>
                  <p className="text-xs text-slate-500">per share</p>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="mt-6 pt-4 border-t border-[--color-border]/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-400">Performance</span>
                  <span className="text-xs font-bold text-green-400">+{holding.plPercent.toFixed(2)}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.min(holding.plPercent * 10, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Hover Effect Border */}
            <div className="absolute inset-0 rounded-2xl border-2 border-[#fc4f02]/0 group-hover:border-[#fc4f02]/20 transition-all duration-300 pointer-events-none" />
          </div>
        ))}
      </div>
      )}

      {/* Dashboard Widgets */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sector Allocation Pie Chart */}
        <div className="rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-xl shadow-blue-900/10">
          <h3 className="mb-6 text-sm font-semibold text-white">Sector Allocation</h3>
          <div className="flex flex-col items-center">
            {/* Pie Chart */}
            <div className="mb-6">
              <SectorPieChart 
                data={sectors} 
                hoveredSector={hoveredSector}
                onSectorHover={setHoveredSector}
              />
            </div>
            {/* Legend */}
            <div className="w-full">
              {sectors.map((sector, index) => {
                const colorMap: Record<string, string> = {
                  "bg-blue-500": "#3b82f6",
                  "bg-green-500": "#10b981",
                  "bg-orange-500": "#f97316",
                  "bg-purple-500": "#a855f7",
                  "bg-red-500": "#ef4444",
                  "bg-slate-400": "#94a3b8",
                };
                const isHovered = hoveredSector === sector.name;
                return (
                  <div key={sector.name}>
                    <div
                      onMouseEnter={() => setHoveredSector(sector.name)}
                      onMouseLeave={() => setHoveredSector(null)}
                      className={`group flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-300 cursor-pointer ${
                        isHovered
                          ? "bg-[--color-surface]/80 shadow-lg shadow-black/20 scale-[1.02]"
                          : "bg-transparent hover:bg-[--color-surface]/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                            isHovered ? "scale-125 ring-2 ring-offset-2 ring-offset-[--color-surface-alt]/80" : ""
                          }`}
                          style={{
                            backgroundColor: colorMap[sector.color] || "#94a3b8",
                            boxShadow: isHovered ? `0 0 12px ${colorMap[sector.color] || "#94a3b8"}80` : "none",
                          }}
                        ></div>
                        <span className={`text-sm font-medium transition-all duration-300 ${
                          isHovered ? "text-white font-semibold" : "text-slate-300"
                        }`}>
                          {sector.name}
                        </span>
                      </div>
                      <span className={`text-sm font-semibold transition-all duration-300 ${
                        isHovered ? "text-white scale-110" : "text-white"
                      }`}>
                        {sector.percentage}%
                      </span>
                    </div>
                    {index < sectors.length - 1 && (
                      <div className="h-px bg-[--color-border]/30 mx-4 my-1"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Holdings */}
        <div className="rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 pt-10 pb-10 pr-10 pl-6 backdrop-blur shadow-xl shadow-blue-900/10">
          <h3 className="mb-8 text-sm font-semibold text-white">Top Holdings</h3>
          <div className="space-y-3">
            {topHoldings.map((holding, index) => (
              <div
                key={holding.symbol}
                className="group relative flex items-center justify-between rounded-lg px-4 py-4 transition-all duration-300 hover:bg-[--color-surface]/60 hover:scale-[1.02] cursor-pointer"
              >
                <div className="flex items-center gap-3 flex-1">
                  {/* Rank Badge */}
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/20 text-sm font-bold text-[#fc4f02] border border-[#fc4f02]/30 flex-shrink-0">
                    {index + 1}
                  </div>
                  {/* Symbol */}
                  <div className="flex-1 min-w-0">
                    <span className="text-base font-bold text-white">{holding.symbol}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  {/* Percentage with Progress Bar */}
                  <div className="flex items-center gap-2 min-w-[90px]">
                    <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden max-w-[60px]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#fc4f02] to-[#fda300] transition-all duration-500"
                        style={{ width: `${(holding.percentage / 11) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-white min-w-[45px] text-right">{holding.percentage}%</span>
                  </div>
                  {/* Value */}
                  <div className="text-right min-w-[95px]">
                    <div className="text-base font-semibold text-white">${holding.value.toLocaleString()}</div>
                  </div>
                </div>
                {/* Hover Indicator */}
                <div className="absolute left-0 top-1/2 h-0 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-[#fc4f02] to-[#fda300] opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:h-8" />
              </div>
            ))}
          </div>
          <div className="mt-8 border-t border-[--color-border] pt-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-300">Moderate Concentration</p>
              <div className="h-2 w-32 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600" style={{ width: "41.4%" }} />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-400">Top 5 = <span className="text-white font-semibold">41.4%</span> of portfolio</p>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-8 backdrop-blur shadow-xl shadow-blue-900/10">
          <h3 className="mb-6 text-sm font-semibold text-white">Performance Metrics</h3>
          <div className="space-y-5">
            {/* Total Return */}
            <div className="group rounded-lg border border-[--color-border]/50 bg-[--color-surface]/30 p-4 transition-all duration-300 hover:border-green-500/30 hover:bg-[--color-surface]/50">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/20">
                  <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Return</div>
              </div>
              <div className="text-2xl font-bold text-green-400">+24.2%</div>
              <div className="mt-1 text-sm font-medium text-slate-300">+$48,340</div>
            </div>

            {/* vs S&P 500 */}
            <div className="group rounded-lg border border-[--color-border]/50 bg-[--color-surface]/30 p-4 transition-all duration-300 hover:border-green-500/30 hover:bg-[--color-surface]/50">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/20">
                  <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="text-xs font-medium uppercase tracking-wider text-slate-400">vs S&P 500</div>
              </div>
              <div className="text-2xl font-bold text-green-400">+8.7%</div>
              <div className="mt-1 text-sm font-medium text-slate-300">outperformance</div>
            </div>

            {/* Sharpe Ratio */}
            <div className="group rounded-lg border border-[--color-border]/50 bg-[--color-surface]/30 p-4 transition-all duration-300 hover:border-blue-500/30 hover:bg-[--color-surface]/50">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
                  <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="text-xs font-medium uppercase tracking-wider text-slate-400">Sharpe Ratio</div>
              </div>
              <div className="text-2xl font-bold text-white">1.42</div>
            </div>

            {/* Max Drawdown */}
            <div className="group rounded-lg border border-[--color-border]/50 bg-[--color-surface]/30 p-4 transition-all duration-300 hover:border-red-500/30 hover:bg-[--color-surface]/50">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/20">
                  <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                </div>
                <div className="text-xs font-medium uppercase tracking-wider text-slate-400">Max Drawdown</div>
              </div>
              <div className="text-2xl font-bold text-red-400">-12.3%</div>
            </div>

            {/* Win Rate */}
            <div className="group rounded-lg border border-[--color-border]/50 bg-[--color-surface]/30 p-4 transition-all duration-300 hover:border-purple-500/30 hover:bg-[--color-surface]/50">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20">
                  <svg className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-xs font-medium uppercase tracking-wider text-slate-400">Win Rate</div>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold text-white">67%</div>
                <div className="h-2 w-24 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-600" style={{ width: "67%" }} />
                </div>
              </div>
              <div className="mt-1 text-sm font-medium text-slate-300">of trades</div>
            </div>
          </div>
        </div>
      </div>

      {/* Holding Details Overlay */}
      {showOverlay && selectedHolding && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowOverlay(false)}
        >
          <div
            className="relative mx-4 w-full max-w-2xl rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/95 to-[--color-surface-alt]/90 p-6 shadow-2xl shadow-black/50 backdrop-blur"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedHolding.name}</h2>
                <p className="mt-1 text-sm text-slate-400">{selectedHolding.symbol}</p>
              </div>
              <button
                onClick={() => setShowOverlay(false)}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-[--color-surface] hover:text-white"
                aria-label="Close"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Holding Details */}
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
                  <p className="text-xs text-slate-400">Quantity</p>
                  <p className="mt-1 text-xl font-bold text-white">{selectedHolding.quantity} shares</p>
                </div>
                <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
                  <p className="text-xs text-slate-400">Current Price</p>
                  <p className="mt-1 text-xl font-bold text-white">${selectedHolding.currentPrice.toFixed(2)}</p>
                </div>
                <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
                  <p className="text-xs text-slate-400">Average Cost</p>
                  <p className="mt-1 text-xl font-bold text-white">${selectedHolding.avgCost.toFixed(2)}</p>
                </div>
                <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
                  <p className="text-xs text-slate-400">Market Value</p>
                  <p className="mt-1 text-xl font-bold text-white">${selectedHolding.marketValue.toLocaleString()}</p>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="space-y-4 rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
                <h3 className="text-sm font-semibold text-white">Performance</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400">Profit/Loss</p>
                    <p className="mt-1 text-lg font-bold text-green-400">
                      +${selectedHolding.pl.toLocaleString()} ({selectedHolding.plPercent.toFixed(2)}%)
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Daily Change</p>
                    <p className="mt-1 text-lg font-bold text-green-400">+{selectedHolding.dayChange.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Portfolio Weight</p>
                    <p className="mt-1 text-lg font-bold text-white">{selectedHolding.weight.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Total Investment</p>
                    <p className="mt-1 text-lg font-bold text-white">
                      ${(selectedHolding.quantity * selectedHolding.avgCost).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button className="flex-1 rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#fc4f02]/40">
                  Buy More
                </button>
                <button className="flex-1 rounded-xl border border-[--color-border] bg-[--color-surface] px-4 py-3 text-sm font-semibold text-white transition-all duration-300 hover:border-[#fc4f02]/50 hover:bg-[--color-surface-alt]">
                  Sell
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

