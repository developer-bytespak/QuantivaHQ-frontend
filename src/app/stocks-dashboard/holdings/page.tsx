/// <reference types="react" />
/// <reference types="react-dom" />
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { exchangesService, DashboardData, Position } from "@/lib/api/exchanges.service";

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

const sectors = [
  { name: "Technology", percentage: 28.5, color: "bg-blue-500" },
  { name: "Healthcare", percentage: 18.2, color: "bg-green-500" },
  { name: "Financials", percentage: 15.7, color: "bg-orange-500" },
  { name: "Consumer", percentage: 12.3, color: "bg-purple-500" },
  { name: "Industrials", percentage: 9.8, color: "bg-red-500" },
  { name: "Others", percentage: 15.5, color: "bg-slate-400" },
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
  
  // State for fetching holdings from backend
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasInitialized = useRef(false);

  // Fetch active connection
  const fetchActiveConnection = useCallback(async () => {
    try {
      const response = await exchangesService.getActiveConnection();
      setConnectionId(response.data.connection_id);
      return response.data.connection_id;
    } catch (err: any) {
      if (err?.status !== 401 && err?.statusCode !== 401) {
        console.error("Failed to fetch active connection:", err);
      }
      setError("No active connection found. Please connect your broker.");
      setIsLoading(false);
      return null;
    }
  }, []);

  // Fetch dashboard data (includes positions)
  const fetchDashboardData = useCallback(async (connId: string) => {
    try {
      setIsLoading(true);
      const response = await exchangesService.getDashboard(connId);
      setDashboardData(response.data);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch holdings:", err);
      setError(err.message || "Failed to load holdings data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (hasInitialized.current) return;
    
    const initialize = async () => {
      hasInitialized.current = true;
      const connId = await fetchActiveConnection();
      if (connId) {
        await fetchDashboardData(connId);
      }
    };
    
    initialize();
  }, [fetchActiveConnection, fetchDashboardData]);

  // Convert API positions to Holding format
  const holdingsData: Holding[] = dashboardData?.positions?.map((pos: Position) => ({
    symbol: pos.symbol,
    name: pos.symbol, // API doesn't return full name, use symbol for now
    quantity: pos.quantity,
    avgCost: pos.entryPrice,
    currentPrice: pos.currentPrice,
    marketValue: pos.quantity * pos.currentPrice,
    pl: pos.unrealizedPnl,
    plPercent: pos.pnlPercent,
    dayChange: 0, // API doesn't provide daily change, default to 0
    weight: dashboardData?.portfolio?.totalValue 
      ? ((pos.quantity * pos.currentPrice) / dashboardData.portfolio.totalValue) * 100 
      : 0,
    type: "Stocks" as const, // Default to Stocks, can be enhanced later
    sector: "Unknown", // API doesn't provide sector, can be enhanced later
  })) || [];

  // Calculate top holdings
  const topHoldings = holdingsData
    .sort((a, b) => b.marketValue - a.marketValue)
    .slice(0, 5)
    .map(h => ({
      symbol: h.symbol,
      percentage: h.weight,
      value: h.marketValue,
    }));

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
          <div className="flex gap-1 rounded-lg  bg-[--color-surface]/60 p-1">
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
          <div className="flex gap-1 rounded-lg  bg-[--color-surface]/60 p-1">
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

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#fc4f02] border-r-transparent"></div>
            <p className="mt-4 text-sm text-slate-400">Loading your holdings...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-6 text-center">
          <p className="text-red-400 font-medium">{error}</p>
          <button
            onClick={() => {
              if (connectionId) fetchDashboardData(connectionId);
            }}
            className="mt-4 rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-6 py-2 text-sm font-semibold text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* Holdings Cards */}
      {!isLoading && !error && holdingsData.length === 0 && (
        <div className="rounded-xl bg-white/5 p-8 text-center">
          <p className="text-slate-400">No holdings found. Start trading to see your positions here.</p>
        </div>
      )}

      {!isLoading && !error && holdingsData.length > 0 && grouping === "Sector" && groupedHoldings ? (
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
                    className="group relative rounded-2xl  bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-5 backdrop-blur shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] cursor-pointer transition-all duration-300 hover:scale-[1.02] "
                  >
                    <div className="flex flex-col h-full justify-between">
                      {/* Header Section */}
                      <div className="flex items-start justify-between mb-5">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/30 to-blue-600/20 text-base font-bold text-white shadow-lg shadow-blue-500/20">
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
                      <div className="relative grid grid-cols-2 gap-4 pt-6">
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-[#fc4f02]/30"></div>
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
                      <div className="relative mt-6 pt-4">
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-[#fc4f02]/30"></div>
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
            className="group relative rounded-2xl  bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-5 backdrop-blur shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] cursor-pointer transition-all duration-300 hover:scale-[1.02] "
          >
            <div className="flex flex-col h-full justify-between">
              {/* Header Section */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-2 flex-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/30 to-blue-600/20 text-base font-bold text-white shadow-lg shadow-blue-500/20">
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
              <div className="relative grid grid-cols-2 gap-4 pt-6">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-[#fc4f02]/30"></div>
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
              <div className="relative mt-6 pt-4">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-[#fc4f02]/30"></div>
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

          </div>
        ))}
      </div>
      )}

      {/* Dashboard Widgets - Only show if we have holdings */}
      {!isLoading && !error && holdingsData.length > 0 && (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sector Allocation Pie Chart */}
        <div className="rounded-2xl  bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)]">
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
        <div className="rounded-2xl  bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 pt-10 pb-10 pr-10 pl-6 backdrop-blur shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)]">
          <h3 className="mb-8 text-sm font-semibold text-white">Top Holdings</h3>
          <div className="space-y-3">
            {topHoldings.map((holding, index) => (
              <div
                key={holding.symbol}
                className="group relative flex items-center justify-between rounded-lg px-4 py-4 transition-all duration-300 hover:bg-[--color-surface]/60 hover:scale-[1.02] cursor-pointer"
              >
                <div className="flex items-center gap-3 flex-1">
                  {/* Rank Badge */}
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/20 text-sm font-bold text-[#fc4f02]  flex-shrink-0">
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
          <div className="relative mt-8 pt-8">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-[#fc4f02]/30"></div>
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
        <div className="rounded-2xl  bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-8 backdrop-blur shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)]">
          <h3 className="mb-6 text-sm font-semibold text-white">Performance Metrics</h3>
          <div className="space-y-5">
            {/* Total Return */}
            <div className="group rounded-lg /50 bg-[--color-surface]/30 p-4 transition-all duration-300 hover:border-green-500/30 hover:bg-[--color-surface]/50">
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
            <div className="group rounded-lg /50 bg-[--color-surface]/30 p-4 transition-all duration-300 hover:border-green-500/30 hover:bg-[--color-surface]/50">
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
            <div className="group rounded-lg /50 bg-[--color-surface]/30 p-4 transition-all duration-300 hover:border-blue-500/30 hover:bg-[--color-surface]/50">
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
            <div className="group rounded-lg /50 bg-[--color-surface]/30 p-4 transition-all duration-300 hover:border-red-500/30 hover:bg-[--color-surface]/50">
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
            <div className="group rounded-lg /50 bg-[--color-surface]/30 p-4 transition-all duration-300 hover:border-purple-500/30 hover:bg-[--color-surface]/50">
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
      )}

      {/* Holding Details Overlay */}
      {showOverlay && selectedHolding && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowOverlay(false)}
        >
          <div
            className="relative mx-4 w-full max-w-2xl rounded-2xl  bg-gradient-to-br from-[--color-surface-alt]/95 to-[--color-surface-alt]/90 p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] backdrop-blur"
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
                <div className="rounded-xl  bg-[--color-surface]/60 p-4">
                  <p className="text-xs text-slate-400">Quantity</p>
                  <p className="mt-1 text-xl font-bold text-white">{selectedHolding.quantity} shares</p>
                </div>
                <div className="rounded-xl  bg-[--color-surface]/60 p-4">
                  <p className="text-xs text-slate-400">Current Price</p>
                  <p className="mt-1 text-xl font-bold text-white">${selectedHolding.currentPrice.toFixed(2)}</p>
                </div>
                <div className="rounded-xl  bg-[--color-surface]/60 p-4">
                  <p className="text-xs text-slate-400">Average Cost</p>
                  <p className="mt-1 text-xl font-bold text-white">${selectedHolding.avgCost.toFixed(2)}</p>
                </div>
                <div className="rounded-xl  bg-[--color-surface]/60 p-4">
                  <p className="text-xs text-slate-400">Market Value</p>
                  <p className="mt-1 text-xl font-bold text-white">${selectedHolding.marketValue.toLocaleString()}</p>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="space-y-4 rounded-xl  bg-[--color-surface]/60 p-4">
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
                <button className="flex-1 rounded-xl  bg-[--color-surface] px-4 py-3 text-sm font-semibold text-white transition-all duration-300  hover:bg-[--color-surface-alt]">
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

