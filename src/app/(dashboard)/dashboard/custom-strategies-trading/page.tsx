"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { alpacaCryptoService } from "@/lib/api/alpaca-crypto.service";
import { alpacaPaperTradingService, type AlpacaDashboard } from "@/lib/api/alpaca-paper-trading.service";
import { apiRequest } from "@/lib/api/client";
import { exchangesService } from "@/lib/api/exchanges.service";
import { StrategyCard } from "../paper-trading/components/strategy-card";
import { AutoTradeModal } from "../paper-trading/components/auto-trade-modal";
import { ManualTradeModal } from "../paper-trading/components/manual-trade-modal";
import { StockAutoTradeModal } from "../paper-trading/components/stock-auto-trade-modal";
import { StockManualTradeModal } from "../paper-trading/components/stock-manual-trade-modal";

// --- Formatting helpers ---
const formatCurrency = (v: any) => {
  if (v === null || v === undefined || v === "—" || v === "") return "—";
  const n = Number(String(v));
  if (isNaN(n)) return String(v);
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
};

interface StrategyMetrics {
  total_signals: number;
  buy_signals: number;
  sell_signals: number;
  hold_signals: number;
  avg_confidence: number;
  avg_score: number;
}

interface UserStrategy {
  strategy_id: string;
  name: string;
  description?: string;
  type?: string; // "user" for custom strategies
  asset_type?: string; // "crypto" or "stock" 
  risk_level: string;
  is_active: boolean;
  timeframe?: string;
  stop_loss_value?: number;
  take_profit_value?: number;
  target_assets?: string[];
  entry_rules?: any[];
  exit_rules?: any[];
  created_at: string;
  updated_at?: string;
  metrics: StrategyMetrics;
  signals?: any[];
}

interface Trade {
  id: number;
  assetId?: string;
  symbol?: string;
  pair: string;
  type: "BUY" | "SELL";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  ext: string;
  entry: string;
  stopLoss: string;
  progressMin: number;
  progressMax: number;
  progressValue: number;
  entryPrice: string;
  stopLossPrice: string;
  takeProfit1: string;
  target: string;
  insights: string[];
  profit: string;
  profitValue: number;
  volume: string;
  volumeValue: number;
  winRate: string;
  winRateValue: number;
  hoursAgo: number;
  trend_score?: number;
  trend_direction?: "TRENDING_UP" | "TRENDING_DOWN" | "STABLE";
  score_change?: number;
  volume_ratio?: number;
  volume_status?: "NORMAL" | "VOLUME_SURGE" | "MASSIVE_SURGE";
  realtime_data?: any;
}

export default function CustomStrategiesTradingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Mode: "paper" for testnet/paper trading, "live" for real trading
  const mode = searchParams.get("mode") || "paper";
  const isPaperMode = mode === "paper";

  // Connection type detection
  const [connectionType, setConnectionType] = useState<"crypto" | "stocks" | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);

  // Account data
  const [balance, setBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);

  // Custom strategies
  const [strategies, setStrategies] = useState<UserStrategy[]>([]);
  const [loadingStrategies, setLoadingStrategies] = useState(true);
  const [strategiesError, setStrategiesError] = useState<string | null>(null);

  // Active tab for strategies
  const [activeTab, setActiveTab] = useState(0);

  // Signals for each strategy
  const [strategySignals, setStrategySignals] = useState<Record<string, any[]>>({});
  const [loadingSignals, setLoadingSignals] = useState<Record<string, boolean>>({});
  const [signalsError, setSignalsError] = useState<Record<string, string>>({});
  const [lastRefresh, setLastRefresh] = useState<Record<string, Date>>({});
  const [generatingSignals, setGeneratingSignals] = useState<string | null>(null);
  const [strategyAges, setStrategyAges] = useState<Record<string, { isNew: boolean; minutesOld: number }>>({});

  // Trade modals
  const [showAutoTradeModal, setShowAutoTradeModal] = useState(false);
  const [showManualTradeModal, setShowManualTradeModal] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState<Trade | null>(null);
  const [marketOpen, setMarketOpen] = useState(true);

  // View modal for signal details
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const isStocksConnection = connectionType === "stocks";

  // Check connection type on mount
  useEffect(() => {
    let isMounted = true;

    const checkConnection = async () => {
      try {
        const response = await exchangesService.getActiveConnection();
        if (isMounted) {
          // ✅ Backend correction: Check exchange.name for type detection
          const exchangeName = response.data?.exchange?.name;
          const connType = exchangeName === "Alpaca" ? "stocks" : 
                          (exchangeName === "Binance" || exchangeName === "Bybit") ? "crypto" : null;
          setConnectionType(connType);
        }
      } catch (error: any) {
        console.error("Failed to check connection type:", error);
        if (isMounted) {
          setConnectionType(null);
        }
      } finally {
        if (isMounted) {
          setIsCheckingConnection(false);
        }
      }
    };

    checkConnection();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch balance based on mode and connection type
  useEffect(() => {
    const fetchBalance = async () => {
      if (!connectionType) return;
      
      setLoadingBalance(true);
      try {
        if (isPaperMode) {
          // Paper trading mode - use testnet services
          if (isStocksConnection) {
            const dashboard = await alpacaPaperTradingService.getDashboard();
            setBalance(parseFloat(dashboard.account?.cash || "0"));
            setMarketOpen(dashboard.clock?.isOpen || false);
          } else {
            const balanceData = await alpacaCryptoService.getAccountBalance();
            setBalance(balanceData.totalBalanceUSD || 0);
          }
        } else {
          // Live trading mode - use main exchange APIs
          if (isStocksConnection) {
            // For live stocks, still using Alpaca but could be different account
            const dashboard = await alpacaPaperTradingService.getDashboard();
            setBalance(parseFloat(dashboard.account?.cash || "0"));
            setMarketOpen(dashboard.clock?.isOpen || false);
          } else {
            // For live crypto - would use main Binance API
            // For now, using same Alpaca paper for demo
            const balanceData = await alpacaCryptoService.getAccountBalance();
            setBalance(balanceData.totalBalanceUSD || 0);
          }
        }
      } catch (error: any) {
        console.error("Failed to fetch balance:", error);
        setBalance(0);
      } finally {
        setLoadingBalance(false);
      }
    };

    if (connectionType) {
      fetchBalance();
    }
  }, [connectionType, isPaperMode, isStocksConnection]);

  // Fetch custom strategies function
  const fetchStrategies = async () => {
    // Only fetch when connection type is determined
    if (connectionType === null) return;
    
    setLoadingStrategies(true);
    setStrategiesError(null);
    try {
      // Use asset_type filter based on connection type (same as my-strategies page)
      const assetType = connectionType === "stocks" ? "stock" : connectionType === "crypto" ? "crypto" : null;
      const queryParam = assetType ? `?asset_type=${assetType}` : "";
      const data = await apiRequest<never, UserStrategy[]>({
        path: `/strategies/my-strategies${queryParam}`,
        method: "GET",
      });
      console.log("📊 Fetched strategies:", data);
      console.log("🔌 Connection type:", connectionType, "Asset type filter:", assetType);
      if (!Array.isArray(data)) {
        setStrategies([]);
      } else {
        // Log each strategy's type and details
        data.forEach(s => {
          console.log(`Strategy "${s.name}" (${s.strategy_id}): type=${s.type}, asset_type=${s.asset_type || 'undefined'}, active=${s.is_active}`);
          console.log(`📊 Strategy target assets:`, s.target_assets);
          console.log(`📈 Strategy metrics:`, s.metrics);
          
          // Calculate strategy age to determine if it's new
          const createdAt = new Date(s.created_at);
          const now = new Date();
          const minutesOld = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60));
          const isNew = minutesOld < 15; // Consider "new" if less than 15 minutes old
          
          setStrategyAges(prev => ({
            ...prev,
            [s.strategy_id]: { isNew, minutesOld }
          }));
          
          console.log(`📅 Strategy "${s.name}" is ${minutesOld} minutes old (new: ${isNew})`);
        });
        setStrategies(data);
      }
    } catch (err: any) {
      console.error("Failed to load strategies:", err);
      setStrategiesError(err?.message ?? String(err));
    } finally {
      setLoadingStrategies(false);
    }
  };

  // Fetch custom strategies on connection type change
  useEffect(() => {
    fetchStrategies();
  }, [connectionType]);

  // Fetch signals for the first strategy immediately when strategies load
  useEffect(() => {
    if (strategies.length > 0 && connectionType) {
      const firstStrategy = strategies[0];
      console.log(`🚀 Auto-loading signals for first strategy: ${firstStrategy.name} (${firstStrategy.strategy_id})`);
      
      // Set active tab to 0 if not set
      if (activeTab >= strategies.length) {
        setActiveTab(0);
      }
      
      // Load signals for the first strategy immediately
      if (!strategySignals[firstStrategy.strategy_id] && !loadingSignals[firstStrategy.strategy_id]) {
        console.log(`🔄 Auto-fetching signals for ${firstStrategy.strategy_id}`);
        fetchStrategySignals(firstStrategy.strategy_id);
      }
    }
  }, [strategies, connectionType]);

  // Fetch signals for a strategy
  const fetchStrategySignals = async (strategyId: string, isRefresh = false) => {
    console.log(`🔍 Fetching signals for strategy ${strategyId}, connection: ${connectionType}, isRefresh: ${isRefresh}`);
    
    if (!isRefresh) {
      setLoadingSignals((p) => ({ ...p, [strategyId]: true }));
    }
    setSignalsError((p) => ({ ...p, [strategyId]: "" }));

    try {
      // First check if any signals exist for this strategy
      // For stock strategies: don't send realtime=true (backend now handles gracefully but not needed)
      const isStockStrategy = connectionType === "stocks";
      const queryParams = isStockStrategy 
        ? "latest_only=true" 
        : "latest_only=true&realtime=true";
      
      const signals = await apiRequest<never, any[]>({
        path: `/strategies/my-strategies/${strategyId}/signals?${queryParams}`,
        method: "GET",
      });
      
      console.log(`📡 Received ${signals?.length || 0} signals for strategy ${strategyId}:`, signals);
      
      // Debug: Check which assets the signals are for
      if (signals && signals.length > 0) {
        const signalAssets = signals.map(s => ({
          asset_id: s.asset_id,
          symbol: s.asset?.symbol || s.asset_id,
          action: s.action,
          score: s.final_score
        }));
        console.log(`📈 Signal breakdown by asset:`, signalAssets);
        
        // Check if signals match target assets
        const strategy = strategies.find(s => s.strategy_id === strategyId);
        if (strategy?.target_assets) {
          console.log(`🎯 Expected assets:`, strategy.target_assets);
          console.log(`📊 Actual signal assets:`, signalAssets.map(s => s.symbol));
          
          const missingAssets = strategy.target_assets.filter(target => 
            !signalAssets.some(signal => signal.symbol === target || signal.asset_id === target)
          );
          if (missingAssets.length > 0) {
            console.log(`⚠️ Missing signals for assets:`, missingAssets);
            console.log(`🔧 SOLUTION: The strategy target assets were created with old hardcoded symbols.`);
            console.log(`🔧 You need to either:`);
            console.log(`   1. Recreate the strategy with real backend assets, OR`);
            console.log(`   2. Check what symbols your backend actually supports for signal generation`);
          }
        }
        
        // DEBUG: Check what assets are actually available in backend
        console.log(`🔍 Checking what assets are actually available in backend...`);
        try {
          const backendAssets = await apiRequest<never, any[]>({
            path: `/assets?asset_type=stock&limit=50`,
            method: "GET",
          });
          console.log(`📋 Available backend stock assets:`, backendAssets?.map(a => a.symbol || a.asset_id)?.slice(0, 10));
          
          if (strategy?.target_assets) {
            const availableTargets = strategy.target_assets.filter(target =>
              backendAssets?.some(asset => (asset.symbol === target || asset.asset_id === target))
            );
            console.log(`✅ Target assets that exist in backend:`, availableTargets);
            console.log(`❌ Target assets that DON'T exist in backend:`, strategy.target_assets.filter(t => !availableTargets.includes(t)));
          }
        } catch (e) {
          console.log(`❌ Could not fetch backend assets:`, e);
        }
      }
      
      if (!signals || signals.length === 0) {
        console.log(`⚠️ No signals found for strategy ${strategyId}.`);
        const strategy = strategies.find(s => s.strategy_id === strategyId);
        const ageInfo = strategyAges[strategyId];
        
        if (strategy && ageInfo?.isNew) {
          console.log(`🆕 Strategy "${strategy.name}" is new (${ageInfo.minutesOld} minutes old) - signals not generated yet`);
          setSignalsError((p) => ({ ...p, [strategyId]: "NEW_STRATEGY" }));
        } else if (strategy && (!strategy.metrics?.total_signals || strategy.metrics.total_signals === 0)) {
          console.log(`🔔 Strategy "${strategy.name}" has never generated signals`);
          setSignalsError((p) => ({ ...p, [strategyId]: "NO_SIGNALS_EVER" }));
        } else {
          console.log(`🔔 Strategy may have had signals before but none currently available`);
          setSignalsError((p) => ({ ...p, [strategyId]: "NO_CURRENT_SIGNALS" }));
        }
      } else {
        // Clear any previous errors if we got signals
        setSignalsError((p) => ({ ...p, [strategyId]: "" }));
      }
      
      setStrategySignals((p) => ({ ...p, [strategyId]: signals || [] }));
      setLastRefresh((p) => ({ ...p, [strategyId]: new Date() }));
    } catch (err: any) {
      console.error(`❌ Failed to load signals for strategy ${strategyId}:`, err);
      setSignalsError((p) => ({
        ...p,
        [strategyId]: err?.message || String(err),
      }));
      setStrategySignals((p) => ({ ...p, [strategyId]: [] }));
    } finally {
      setLoadingSignals((p) => ({ ...p, [strategyId]: false }));
    }
  };

  // Generate signals for a strategy (like in my-strategies page)
  const handleGenerateSignals = async (strategyId: string) => {
    const strategy = strategies.find(s => s.strategy_id === strategyId);
    console.log(`🚀 Generating signals for strategy:`, {
      name: strategy?.name,
      id: strategyId,
      target_assets: strategy?.target_assets,
      asset_count: strategy?.target_assets?.length || 0
    });
    
    setGeneratingSignals(strategyId);
    try {
      const result = await apiRequest<never, any>({
        path: `/strategies/my-strategies/${strategyId}/generate-signals`,
        method: "POST",
        timeout: 300000, // 5 minutes - signal generation can take time especially for multiple assets
      });
      console.log(`🎯 Generate signals result:`, result);
      
      if (result.signals && result.signals.length > 0) {
        const generatedAssets = result.signals.map((s: any) => s.asset?.symbol || s.asset_id);
        console.log(`✅ Generated signals for assets:`, generatedAssets);
        alert(`Generated ${result.signals?.length || 0} signals for: ${generatedAssets.join(', ')}`);
      } else {
        alert(`Generated ${result.signals?.length || 0} signals successfully!`);
      }
      
      // Refresh signals for this strategy
      fetchStrategySignals(strategyId, true);
    } catch (err: any) {
      console.error(`❌ Generate signals error:`, err);
      alert(`Failed to generate signals: ${err?.message || err}`);
    } finally {
      setGeneratingSignals(null);
    }
  };

  // Fix strategy assets by updating with real backend assets
  const handleFixStrategyAssets = async (strategyId: string) => {
    try {
      setGeneratingSignals(strategyId);
      
      // Get real assets from backend
      const assetType = connectionType === "stocks" ? "stock" : "crypto";
      const backendAssets = await apiRequest<never, any[]>({
        path: `/assets?asset_type=${assetType}&limit=50`,
        method: "GET",
      });
      
      if (!backendAssets || backendAssets.length === 0) {
        alert(`No ${assetType} assets found in backend to update strategy`);
        return;
      }
      
      // Take first 8 as new target assets
      const realSymbols = backendAssets.slice(0, 8).map((asset: any) => asset.symbol || asset.asset_id);
      
      // ✅ Update strategy with real assets using imported function
      const { updateStrategy } = await import("@/lib/api/strategies");
      await updateStrategy(strategyId, {
        target_assets: realSymbols
      });
      
      console.log(`✅ Updated strategy ${strategyId} with real ${assetType} assets:`, realSymbols);
      alert(`✅ Strategy updated with ${realSymbols.length} real ${assetType} assets!\n\nNew assets: ${realSymbols.join(', ')}\n\nGenerating fresh signals...`);
      
      // Refresh strategies and generate signals
      setTimeout(() => {
        fetchStrategies();
        handleGenerateSignals(strategyId);
      }, 1000);
      
    } catch (err: any) {
      console.error("Failed to fix strategy assets:", err);
      alert(`❌ Failed to update strategy assets: ${err.message}`);
    } finally {
      setGeneratingSignals(null);
    }
  };

  // Lazy load signals when tab changes
  useEffect(() => {
    console.log(`🔄 Tab changed effect triggered: activeTab=${activeTab}, strategies.length=${strategies.length}`);
    
    if (strategies.length > 0) {
      const activeStrategy = strategies[activeTab];
      console.log(`🔄 Tab changed to strategy: ${activeStrategy?.name} (${activeStrategy?.strategy_id})`);
      
      if (activeStrategy) {
        const hasSignals = !!strategySignals[activeStrategy.strategy_id];
        const isLoading = !!loadingSignals[activeStrategy.strategy_id];
        
        console.log(`📊 Signal status - hasSignals: ${hasSignals}, isLoading: ${isLoading}`);
        
        if (!hasSignals && !isLoading) {
          console.log(`📡 Loading signals for new active strategy: ${activeStrategy.strategy_id}`);
          fetchStrategySignals(activeStrategy.strategy_id);
        } else if (hasSignals) {
          const existingSignals = strategySignals[activeStrategy.strategy_id];
          console.log(`💾 Using cached signals for ${activeStrategy.strategy_id}: ${existingSignals?.length || 0} signals`);
        }
      }
    }
  }, [strategies, activeTab]);

  // Auto-refresh signals every 60 seconds (like pre-built strategies)
  useEffect(() => {
    if (strategies.length === 0) return;

    const interval = setInterval(() => {
      const activeStrategy = strategies[activeTab];
      if (activeStrategy) {
        fetchStrategySignals(activeStrategy.strategy_id, true);
      }
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [strategies, activeTab]);

  // Map signals to trade format (matches pre-built format)
  const mapSignalsToTrades = (signals: any[], strategy: UserStrategy): Trade[] => {
    if (!signals || signals.length === 0) return [];

    // Get strategy's default stop loss and take profit values
    const strategyStopLoss = strategy?.stop_loss_value ?? 5;
    const strategyTakeProfit = strategy?.take_profit_value ?? 10;

    return signals.map((signal, idx) => {
      const asset = signal.asset || {};
      // Get clean symbol - handle both crypto (with USDT suffix) and stocks
      const rawSymbol = asset.symbol || asset.asset_id || signal.asset_id || "Unknown";
      const isStock = isStocksConnection || asset.asset_type === "stock";
      
      // Debug log for first signal to see structure
      if (idx === 0) {
        console.log(`🔍 Sample signal structure for ${isStock ? 'STOCK' : 'CRYPTO'}:`, signal);
        console.log(`🔍 Asset data:`, asset);
        console.log(`🔍 Price fields: realtime_data.price=${signal.realtime_data?.price}, price_usd=${signal.price_usd}, price=${signal.price}, last_price=${signal.last_price}, entry_price=${signal.entry_price}`);
      }
      
      // For crypto: remove USDT suffix. For stocks: use as-is
      const cleanSymbol = isStock 
        ? rawSymbol.trim() 
        : rawSymbol.replace(/USDT$/i, '').trim();
      
      // Format pair based on asset type
      const pair = isStock 
        ? `${cleanSymbol} / USD` 
        : `${cleanSymbol} / USDT`;
      
      const score = Number(signal.final_score ?? 0);
      const confidence: Trade["confidence"] =
        score >= 0.7 ? "HIGH" : score >= 0.4 ? "MEDIUM" : "LOW";

      // Get realtime data, treating 0 as invalid (API returned no data)
      const realtimePrice = signal.realtime_data?.price && signal.realtime_data.price > 0 
        ? signal.realtime_data.price 
        : null;
      const realtimeVolume = signal.realtime_data?.volume24h && signal.realtime_data.volume24h > 0
        ? signal.realtime_data.volume24h
        : null;
      const realtimePriceChange = signal.realtime_data?.priceChangePercent ?? null;

      // Enhanced price extraction for stocks - try more fields
      const entryPrice = isStock ? (
        // For stocks, try these fields in order
        realtimePrice 
        ?? (signal.entry_price && signal.entry_price > 0 ? signal.entry_price : null)
        ?? (signal.current_price && signal.current_price > 0 ? signal.current_price : null)
        ?? (asset.price && asset.price > 0 ? asset.price : null)
        ?? (asset.current_price && asset.current_price > 0 ? asset.current_price : null)
        ?? (signal.price_usd && signal.price_usd > 0 ? signal.price_usd : null)
        ?? (signal.price && signal.price > 0 ? signal.price : null)
        ?? (signal.last_price && signal.last_price > 0 ? signal.last_price : null)
        ?? 100  // Fallback for stocks - 100 USD placeholder
      ) : (
        // For crypto, use existing logic
        realtimePrice 
        ?? (signal.price_usd && signal.price_usd > 0 ? signal.price_usd : null)
        ?? (signal.price && signal.price > 0 ? signal.price : null)
        ?? (signal.last_price && signal.last_price > 0 ? signal.last_price : null)
        ?? 0
      );

      // Log the final entry price for debugging
      if (idx === 0) {
        console.log(`💰 Final entry price for ${cleanSymbol}: ${entryPrice}`);
      }

      // Use signal values if available, otherwise use strategy defaults
      const stopLoss = signal.stop_loss ?? `-${strategyStopLoss}%`;
      const takeProfit = signal.take_profit ?? `+${strategyTakeProfit}%`;

      // Calculate hours ago from signal timestamp
      const signalTimestamp = signal.timestamp || signal.poll_timestamp || signal.created_at || signal.generated_at;
      let hoursAgo = 0;
      if (signalTimestamp) {
        const signalDate = new Date(signalTimestamp);
        const now = new Date();
        hoursAgo = Math.floor((now.getTime() - signalDate.getTime()) / (1000 * 60 * 60));
      }

      return {
        id: idx + 1,
        assetId: signal.asset_id ?? asset.asset_id ?? cleanSymbol,
        symbol: cleanSymbol,
        pair,
        type: (signal.action && signal.action.toUpperCase() === "SELL" ? "SELL" : "BUY") as "BUY" | "SELL",
        confidence,
        ext: String(entryPrice),
        entry: String(entryPrice),
        stopLoss,
        progressMin: 0,
        progressMax: 100,
        progressValue: Math.min(100, Math.max(0, Math.floor(score * 100))),
        entryPrice: String(entryPrice),
        stopLossPrice: stopLoss,
        takeProfit1: takeProfit,
        target: "",
        insights: signal.reasons || [],
        profit: realtimePriceChange ? `${Number(realtimePriceChange).toFixed(2)}%` : "0%",
        profitValue: Number(realtimePriceChange ?? 0) || 0,
        volume: realtimeVolume ? String(Number(realtimeVolume).toLocaleString()) : "—",
        volumeValue: Number(realtimeVolume ?? 0) || 0,
        winRate: "—",
        winRateValue: 0,
        hoursAgo,
        trend_score: Number(signal.trend_score ?? 0) || 0,
        trend_direction: signal.trend_direction ?? "STABLE",
        score_change: Number(signal.score_change ?? 0) || 0,
        volume_ratio: Number(signal.volume_ratio ?? 1) || 1,
        volume_status: signal.volume_status ?? "NORMAL",
        realtime_data: signal.realtime_data,
      };
    }).filter((trade, idx) => {
      // Log any trades that might be getting filtered out
      if (!trade.symbol || trade.symbol === "Unknown") {
        console.log(`⚠️ Trade ${idx + 1} has no symbol:`, trade);
        return false;
      }
      
      // For stocks, don't filter out trades with 100 USD placeholder price
      if (isStocksConnection && trade.entryPrice === "100") {
        console.log(`📈 Stock trade ${trade.symbol} using placeholder price`);
      }
      
      return true; // Keep all valid trades
    });
  };

  // Get current strategy and its trades
  const currentStrategy = strategies[activeTab];
  const currentSignals = currentStrategy
    ? strategySignals[currentStrategy.strategy_id] || []
    : [];
  
  console.log(`📊 Current strategy: ${currentStrategy?.name}, signals count: ${currentSignals.length}`);
  if (currentSignals.length > 0) {
    console.log('📈 Sample signal:', currentSignals[0]);
    console.log('🎯 All signal actions:', currentSignals.map(s => ({ symbol: s.asset?.symbol || s.asset_id, action: s.action, score: s.final_score })));
  }
  
  const currentTrades = currentStrategy
    ? mapSignalsToTrades(currentSignals, currentStrategy)
    : [];
    
  console.log(`🎯 Mapped to ${currentTrades.length} trades`);
  if (currentTrades.length > 0) {
    console.log('💼 Sample trade:', currentTrades[0]);
    console.log('💰 All trade symbols:', currentTrades.map(t => ({ symbol: t.symbol, price: t.entryPrice, type: t.type })));
  } else if (currentSignals.length > 0) {
    console.log('❌ Signals exist but no trades mapped - checking mapping function...');
  }

  // Trade handlers
  const handleAutoTrade = (trade: Trade) => {
    setSelectedSignal(trade);
    setShowAutoTradeModal(true);
  };

  const handleManualTrade = (trade: Trade) => {
    setSelectedSignal(trade);
    setShowManualTradeModal(true);
  };

  const handleViewDetails = (trade: Trade) => {
    setSelectedSignal(trade);
    setShowDetailsModal(true);
  };

  const refreshBalanceAndOrders = async () => {
    // Refresh balance after trade
    if (isStocksConnection) {
      try {
        const dashboard = await alpacaPaperTradingService.getDashboard();
        setBalance(parseFloat(dashboard.account?.cash || "0"));
      } catch (e) {
        console.error("Failed to refresh balance:", e);
      }
    } else {
      try {
        const balanceData = await alpacaCryptoService.getAccountBalance();
        setBalance(balanceData.totalBalanceUSD || 0);
      } catch (e) {
        console.error("Failed to refresh balance:", e);
      }
    }
  };

  // Loading state
  if (isCheckingConnection || loadingStrategies) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#fc4f02]/30 border-t-[#fc4f02] mb-4"></div>
          <p className="text-slate-300 font-medium">Loading custom strategies...</p>
        </div>
      </div>
    );
  }

  // No connection state
  if (!connectionType) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/10 flex items-center justify-center">
          <svg className="w-10 h-10 text-[#fc4f02]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Connect Exchange First</h2>
        <p className="text-slate-400 mb-6">
          Please connect your exchange account to start trading with custom strategies.
        </p>
        <Link
          href="/dashboard/settings/exchanges"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white font-semibold hover:shadow-xl hover:shadow-[#fc4f02]/30 transition-all"
        >
          Connect Exchange
        </Link>
      </div>
    );
  }

  // No strategies state
  if (strategies.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/10 flex items-center justify-center">
          <svg className="w-10 h-10 text-[#fc4f02]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">No Custom Strategies Yet</h2>
        <p className="text-slate-400 mb-6">
          Create your first custom strategy to start generating signals and trading.
        </p>
        <Link
          href="/dashboard/my-strategies/create?from=custom-strategies-trading"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white font-semibold hover:shadow-xl hover:shadow-[#fc4f02]/30 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Strategy
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Header */}
      <div className="relative rounded-2xl bg-gradient-to-br from-[#fc4f02]/20 via-[#fda300]/10 to-transparent p-6 border border-[#fc4f02]/20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#fc4f02]/30 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative">
          {/* Back Button */}
          <Link
            href={`/dashboard/my-strategies?from=${isPaperMode ? "paper-trading" : "top-trades"}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-[#fda300] transition-colors mb-3 group"
          >
            <svg
              className="w-4 h-4 text-white group-hover:-translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-white/90 group-hover:text-[#fda300]">Back to My Strategies</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#fc4f02] to-[#fda300] flex items-center justify-center shadow-lg shadow-[#fc4f02]/30">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                    Custom Strategy Trading
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        isPaperMode
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-green-500/20 text-green-400"
                      }`}
                    >
                      {isPaperMode ? "📄 Paper Trading" : "💰 Live Trading"}
                    </span>
                    <span className="text-slate-400 text-sm">
                      {isStocksConnection ? "Stocks" : "Crypto"}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-slate-400 max-w-lg">
                Execute trades using signals from your custom AI-powered strategies
              </p>
            </div>

            {/* Balance Display */}
            <div className="bg-white/5 rounded-xl px-5 py-3 border border-white/10">
              <p className="text-xs text-slate-400 mb-1">Available Balance</p>
              <p className="text-2xl font-bold text-white">
                {loadingBalance ? (
                  <span className="inline-block w-24 h-7 bg-white/10 rounded animate-pulse"></span>
                ) : (
                  formatCurrency(balance)
                )}
              </p>
              {isStocksConnection && (
                <p className={`text-xs mt-1 ${marketOpen ? "text-green-400" : "text-yellow-400"}`}>
                  Market {marketOpen ? "Open" : "Closed"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Strategy Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
        {strategies.map((strategy, idx) => (
          <button
            key={strategy.strategy_id}
            onClick={() => setActiveTab(idx)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm whitespace-nowrap transition-all duration-200 ${
              activeTab === idx
                ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/30"
                : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>{strategy.name}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-xs ${
                activeTab === idx ? "bg-white/20" : "bg-white/10"
              }`}
            >
              {strategy.metrics?.total_signals || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Current Strategy Info & Refresh */}
      {currentStrategy && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white">{currentStrategy.name}</h3>
              {currentStrategy.is_active && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Active
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-1">
              {currentStrategy.description || "No description"}
            </p>
            <p className="text-slate-400 mb-6 text-center">
              <span className="font-medium">Target Assets ({currentStrategy?.target_assets?.length || 0}):</span><br/>
              <span className="text-sm text-slate-500">
                {currentStrategy?.target_assets?.join(', ') || 'No target assets configured'}
              </span>
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs justify-center">
              <span className="text-emerald-400">
                {currentStrategy.metrics?.buy_signals || 0} BUY
              </span>
              <span className="text-red-400">
                {currentStrategy.metrics?.sell_signals || 0} SELL
              </span>
              <span className="text-slate-400">
                {currentStrategy.metrics?.hold_signals || 0} HOLD
              </span>
              <span className="text-slate-500">
                {currentStrategy.target_assets?.length || 0} assets
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Last Updated */}
            {lastRefresh[currentStrategy.strategy_id] && (
              <div className="text-xs text-slate-500">
                Updated {new Date(lastRefresh[currentStrategy.strategy_id]).toLocaleTimeString()}
              </div>
            )}
            {/* Generate Signals Button */}
            <button
              onClick={() => handleGenerateSignals(currentStrategy.strategy_id)}
              disabled={generatingSignals === currentStrategy.strategy_id}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white text-sm hover:shadow-lg hover:shadow-[#fc4f02]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="Generate new signals"
            >
              <svg 
                className={`w-4 h-4 ${generatingSignals === currentStrategy.strategy_id ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {generatingSignals === currentStrategy.strategy_id ? 'Generating...' : 'Generate Signals'}
            </button>
            {/* Refresh Button */}
            <button
              onClick={() => fetchStrategySignals(currentStrategy.strategy_id, true)}
              disabled={loadingSignals[currentStrategy.strategy_id]}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/10 hover:text-white disabled:opacity-50 transition-all"
              title="Refresh signals"
            >
              <svg 
                className={`w-4 h-4 ${loadingSignals[currentStrategy.strategy_id] ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            {/* Fix Assets Button - Shows when missing signals */}
            {currentStrategy?.target_assets && currentSignals.length > 0 && currentSignals.length < currentStrategy.target_assets.length && (
              <button
                onClick={() => handleFixStrategyAssets(currentStrategy.strategy_id)}
                disabled={generatingSignals === currentStrategy.strategy_id}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm hover:shadow-lg hover:shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title={`Fix strategy assets - ${currentStrategy.target_assets.length - currentSignals.length} assets missing signals`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Fix Assets ({currentStrategy.target_assets.length - currentSignals.length} missing)
              </button>
            )}
            {/* Auto-refresh indicator */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              Auto-refresh 60s
            </div>
          </div>
        </div>
      )}

      {/* Signals Grid */}
      <div>
        {loadingSignals[currentStrategy?.strategy_id] ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-white/5 animate-pulse"
              ></div>
            ))}
          </div>
        ) : signalsError[currentStrategy?.strategy_id] === "NEW_STRATEGY" ? (
          <div className="text-center py-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-blue-400 mb-2">🎉 Strategy Created Successfully!</h3>
            <p className="text-blue-300 mb-4 max-w-md mx-auto">
              Your {isStocksConnection ? 'stock' : 'crypto'} strategy "{currentStrategy?.name}" is ready!
            </p>
            <div className="bg-blue-500/10 rounded-lg p-4 mb-6 max-w-lg mx-auto">
              <div className="flex items-center justify-center gap-2 text-blue-400 text-sm mb-2">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                <span className="font-medium">Signals generate automatically every 10 minutes</span>
              </div>
              <p className="text-blue-300 text-xs">
                Your first signals should appear within the next {Math.max(1, 10 - (strategyAges[currentStrategy?.strategy_id]?.minutesOld || 0))} minutes.
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => currentStrategy && handleGenerateSignals(currentStrategy.strategy_id)}
                disabled={generatingSignals === currentStrategy?.strategy_id}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 transition-all"
              >
                <svg className={`w-5 h-5 ${generatingSignals === currentStrategy?.strategy_id ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {generatingSignals === currentStrategy?.strategy_id ? 'Generating Signals...' : 'Generate Signals Now'}
              </button>
              <div className="text-xs text-blue-400">
                Or wait for automatic generation (next cycle in ~{Math.max(1, 10 - (strategyAges[currentStrategy?.strategy_id]?.minutesOld || 0) % 10)} min)
              </div>
            </div>
          </div>
        ) : signalsError[currentStrategy?.strategy_id] === "NO_SIGNALS_EVER" ? (
          <div className="text-center py-16 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-amber-400 mb-2">No Signals Generated</h3>
            <p className="text-amber-300 mb-4 max-w-md mx-auto">
              This strategy hasn't generated any signals yet. This could mean:
            </p>
            <div className="bg-amber-500/10 rounded-lg p-4 mb-6 max-w-md mx-auto">
              <ul className="text-amber-300 text-sm space-y-1 text-left">
                <li>• No {isStocksConnection ? 'stocks' : 'crypto assets'} match your strategy criteria</li>
                <li>• Strategy rules are too restrictive</li>
                <li>• Signal generation may have encountered errors</li>
              </ul>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => currentStrategy && handleGenerateSignals(currentStrategy.strategy_id)}
                disabled={generatingSignals === currentStrategy?.strategy_id}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium hover:shadow-lg hover:shadow-amber-500/30 disabled:opacity-50 transition-all"
              >
                <svg className={`w-5 h-5 ${generatingSignals === currentStrategy?.strategy_id ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {generatingSignals === currentStrategy?.strategy_id ? 'Generating...' : 'Try Generate Signals'}
              </button>
              <div className="text-xs text-amber-400">
                Strategy age: {strategyAges[currentStrategy?.strategy_id]?.minutesOld || 0} minutes
              </div>
            </div>
          </div>
        ) : signalsError[currentStrategy?.strategy_id] && signalsError[currentStrategy?.strategy_id] !== "NO_CURRENT_SIGNALS" ? (
          <div className="text-center py-16 rounded-2xl bg-red-500/10 border border-red-500/20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-400 mb-2">Failed to Load Signals</h3>
            <p className="text-red-300 mb-4 max-w-md mx-auto text-sm">
              {signalsError[currentStrategy?.strategy_id]}
            </p>
            <button
              onClick={() => currentStrategy && fetchStrategySignals(currentStrategy.strategy_id, true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm hover:bg-red-500/30 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry
            </button>
          </div>
        ) : currentTrades.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {currentTrades.map((trade, idx) => (
              <StrategyCard
                key={trade.id}
                signal={trade}
                index={idx}
                onAutoTrade={() => handleAutoTrade(trade)}
                onManualTrade={() => handleManualTrade(trade)}
                onViewDetails={() => handleViewDetails(trade)}
                isStockMode={isStocksConnection}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 rounded-2xl bg-white/5 border border-white/5">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#fc4f02]/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-[#fc4f02]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Current Signals</h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              {isStocksConnection 
                ? "No stock signals available right now. Market conditions may not match your strategy criteria."
                : "No crypto signals available right now. Market conditions may not match your strategy criteria."
              }
            </p>
            <div className="space-y-4">
              <button
                onClick={() => currentStrategy && handleGenerateSignals(currentStrategy.strategy_id)}
                disabled={generatingSignals === currentStrategy?.strategy_id}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white font-medium hover:shadow-lg hover:shadow-[#fc4f02]/30 disabled:opacity-50 transition-all"
              >
                <svg className={`w-5 h-5 ${generatingSignals === currentStrategy?.strategy_id ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {generatingSignals === currentStrategy?.strategy_id ? 'Generating Signals...' : 'Generate Fresh Signals'}
              </button>
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                Auto-refresh enabled • Signals generate every 10 minutes
              </div>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Raw signals: {currentSignals.length} | Connection: {connectionType} | Strategy type: {currentStrategy?.asset_type || currentStrategy?.type}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Auto Trade Modal */}
      {showAutoTradeModal && selectedSignal && (
        isStocksConnection ? (
          <StockAutoTradeModal
            signal={selectedSignal}
            balance={balance}
            onClose={() => setShowAutoTradeModal(false)}
            onSuccess={refreshBalanceAndOrders}
            marketOpen={marketOpen}
            strategy={currentStrategy}
          />
        ) : (
          <AutoTradeModal
            signal={selectedSignal}
            balance={balance}
            onClose={() => setShowAutoTradeModal(false)}
            onSuccess={refreshBalanceAndOrders}
            strategy={currentStrategy}
          />
        )
      )}

      {/* Manual Trade Modal */}
      {showManualTradeModal && selectedSignal && (
        isStocksConnection ? (
          <StockManualTradeModal
            signal={selectedSignal}
            balance={balance}
            onClose={() => setShowManualTradeModal(false)}
            onSuccess={refreshBalanceAndOrders}
            marketOpen={marketOpen}
          />
        ) : (
          <ManualTradeModal
            signal={selectedSignal}
            balance={balance}
            onClose={() => setShowManualTradeModal(false)}
            onSuccess={refreshBalanceAndOrders}
          />
        )
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedSignal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 border border-white/10">
            <button
              onClick={() => setShowDetailsModal(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-bold text-white mb-4">{selectedSignal.pair}</h3>

            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-slate-400">Type</span>
                <span
                  className={`font-semibold ${
                    selectedSignal.type === "BUY" ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {selectedSignal.type}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-slate-400">Confidence</span>
                <span className="text-white font-medium">{selectedSignal.confidence}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-slate-400">Entry Price</span>
                <span className="text-white font-medium">
                  {formatCurrency(selectedSignal.entryPrice)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-slate-400">Stop Loss</span>
                <span className="text-red-400 font-medium">{selectedSignal.stopLoss}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-slate-400">Take Profit</span>
                <span className="text-emerald-400 font-medium">{selectedSignal.takeProfit1}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">24h Change</span>
                <span
                  className={`font-medium ${
                    selectedSignal.profitValue >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {selectedSignal.profit}
                </span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleAutoTrade(selectedSignal);
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white font-semibold hover:shadow-lg hover:shadow-[#fc4f02]/30"
              >
                Auto Trade
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleManualTrade(selectedSignal);
                }}
                className="flex-1 py-2.5 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20"
              >
                Manual Trade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
