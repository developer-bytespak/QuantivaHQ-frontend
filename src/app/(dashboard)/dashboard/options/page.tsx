"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useExchange } from "@/context/ExchangeContext";
import useSubscriptionStore from "@/state/subscription-store";
import { FeatureType } from "@/mock-data/subscription-dummy-data";
import { useOptionsStore } from "@/state/options-store";
import { useOptionsSocket } from "@/hooks/useOptionsSocket";
import { useActiveOptionsVenue } from "@/hooks/useActiveOptionsVenue";
import { optionsService } from "@/lib/api/options.service";
import { exchangesService } from "@/lib/api/exchanges.service";
import type { OptionContract } from "@/lib/api/options.service";
import {
  OptionsChainTable,
  GreeksPanel,
  OptionOrderForm,
  OptionsPositionsTable,
  OptionsOrdersTable,
  ExpiryTabs,
  OptionsEducationModal,
  OptionsAISignals,
  IvRankBadge,
  PayoffDiagram,
  PortfolioGreeksDashboard,
  OrderBookPanel,
  SellPositionModal,
  MultiLegOrderModal,
} from "@/components/options";
import { MarketHoursBanner } from "@/components/options/MarketHoursBanner";
import { Level3GateBanner } from "@/components/options/Level3GateBanner";
import type { AiOptionsSignal, IvHistoryPoint, PortfolioGreeks, OptionDepth, OptionsPosition } from "@/lib/api/options.service";

// ── ELITE Gate Component ─────────────────────────────────────────────────────

function EliteGate() {
  const { setShowUpgradeModal } = useSubscriptionStore();
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md rounded-2xl border border-white/[0.06] bg-[#12121a] p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary)]/10">
          <svg className="h-8 w-8 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-bold text-slate-100">ELITE Plus Feature</h2>
        <p className="mb-6 text-sm text-slate-400">
          Options trading with AI-powered recommendations is exclusively available on the ELITE Plus plan.
        </p>
        <button
          onClick={() => setShowUpgradeModal(true)}
          className="rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] px-6 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
        >
          Upgrade to ELITE Plus
        </button>
      </div>
    </div>
  );
}

// ── Tab Types ────────────────────────────────────────────────────────────────

type OptionsTab = "chain" | "positions" | "orders" | "ai-signals";

const TABS: { key: OptionsTab; label: string }[] = [
  { key: "chain", label: "Options Chain" },
  { key: "positions", label: "Positions" },
  { key: "orders", label: "Orders" },
  { key: "ai-signals", label: "AI Signals" },
];

// ── Main Page ────────────────────────────────────────────────────────────────

export default function OptionsPage() {
  const { connectionId } = useExchange();
  const { canAccessFeature } = useSubscriptionStore();

  // Check ELITE access
  const hasAccess = canAccessFeature(FeatureType.OPTIONS_TRADING);

  // Store
  const store = useOptionsStore();

  // Populate store.venue / store.approvalLevel from the user's active
  // exchange connection (crypto → Binance options, stocks → Alpaca options).
  useActiveOptionsVenue();

  // Local tab state (simpler than store for page-only concern)
  const [activeTab, setActiveTab] = useState<OptionsTab>("chain");

  // Errors live in the global options store and the banner sits above the
  // tab content, so a chain-tab error would otherwise leak into Positions /
  // Orders / AI Signals after the user switches tabs. Clear on tab change.
  useEffect(() => {
    store.setError(null);
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Education modal — only show once per user (persisted in localStorage)
  const [showEducation, setShowEducation] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem("quantivahq_options_guide_seen");
  });

  // WebSocket for live chain updates
  const { chainUpdate, isConnected: wsConnected } = useOptionsSocket({
    underlying: store.selectedUnderlying,
    connectionId,
    enabled: hasAccess && activeTab === "chain",
  });

  // Merge WS updates into store — only when an underlying is actively selected
  useEffect(() => {
    if (chainUpdate && chainUpdate.length > 0 && store.selectedUnderlying) {
      store.setOptionsChain(chainUpdate);
    }
  }, [chainUpdate]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch underlyings on mount ──────────────────────────────────────────

  useEffect(() => {
    if (!connectionId || !hasAccess) return;
    (async () => {
      try {
        const underlyings = await optionsService.getAvailableUnderlyings(connectionId);
        store.setAvailableUnderlyings(underlyings);
        // Auto-select first underlying if none selected
        if (!store.selectedUnderlying && underlyings.length > 0) {
          store.setSelectedUnderlying(underlyings[0].symbol);
        }
      } catch (err: any) {
        store.setError(err.message ?? "Failed to load underlyings");
      }
    })();
  }, [connectionId, hasAccess, store.venue]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch chain when underlying changes ─────────────────────────────────

  const fetchChain = useCallback(async () => {
    if (!connectionId || !store.selectedUnderlying) return;
    const capturedUnderlying = store.selectedUnderlying;
    store.setIsLoadingChain(true);
    store.setError(null);
    try {
      const response = await optionsService.getOptionsChain(capturedUnderlying, connectionId);
      // Abort stale write: underlying changed (venue reset, user re-selection) while in-flight
      if (useOptionsStore.getState().selectedUnderlying !== capturedUnderlying) return;
      store.setOptionsChain(response.contracts);
      store.setExpiryDates(response.expiryDates);
      // Backfill spot price into availableUnderlyings — critical for Alpaca where
      // getAvailableUnderlyings seeds indexPrice: 0 (no static price list endpoint).
      if (response.underlyingPrice > 0) {
        store.updateUnderlyingPrice(capturedUnderlying, response.underlyingPrice);
      }
      // Auto-select first expiry
      if (response.expiryDates.length > 0 && !store.selectedExpiry) {
        store.setSelectedExpiry(response.expiryDates[0]);
      }
    } catch (err: any) {
      if (useOptionsStore.getState().selectedUnderlying === capturedUnderlying) {
        store.setError(err.message ?? "Failed to load options chain");
      }
    } finally {
      store.setIsLoadingChain(false);
    }
  }, [connectionId, store.selectedUnderlying]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (hasAccess && activeTab === "chain") fetchChain();
  }, [store.selectedUnderlying, hasAccess, activeTab, fetchChain]);

  // ── Auto-select contract from pending signal after chain loads ─────────

  useEffect(() => {
    const signal = pendingSignalRef.current;
    if (!signal || store.optionsChain.length === 0 || store.isLoadingChain) return;
    pendingSignalRef.current = null;

    const leg = signal.legs[0];
    if (!leg) return;

    const matching = store.optionsChain.find(
      (c) => c.type === leg.type && Math.abs(c.strike - leg.strike) < 1,
    );
    if (matching) {
      handleSelectContract(matching);
      if (matching.expiry) store.setSelectedExpiry(matching.expiry.split("T")[0]);
    }
  }, [store.optionsChain, store.isLoadingChain]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch account balance ───────────────────────────────────────────────

  useEffect(() => {
    if (!connectionId || !hasAccess) return;
    (async () => {
      store.setIsLoadingAccount(true);
      try {
        // Use the Options margin wallet (USDT funded for options trading), not spot wallet
        const account = await optionsService.getBalance(connectionId);
        store.setAccount(account);
      } catch {
        // Non-critical
      } finally {
        store.setIsLoadingAccount(false);
      }
    })();
  }, [connectionId, hasAccess]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch positions ─────────────────────────────────────────────────────

  const fetchPositions = useCallback(async () => {
    if (!connectionId) return;
    store.setIsLoadingPositions(true);
    try {
      const positions = await optionsService.getPositions(connectionId);
      store.setPositions(positions);
    } catch (err: any) {
      store.setError(err.message ?? "Failed to load positions");
    } finally {
      store.setIsLoadingPositions(false);
    }
  }, [connectionId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (hasAccess && connectionId) fetchPositions();
  }, [hasAccess, connectionId, fetchPositions]);

  // ── Fetch orders ────────────────────────────────────────────────────────

  const fetchOrders = useCallback(async () => {
    store.setIsLoadingOrders(true);
    try {
      const orders = await optionsService.getOrders(undefined, 50, store.venue);
      store.setOrders(orders);
    } catch (err: any) {
      store.setError(err.message ?? "Failed to load orders");
    } finally {
      store.setIsLoadingOrders(false);
    }
  }, [store.venue]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (hasAccess && activeTab === "orders") fetchOrders();
  }, [activeTab, hasAccess, fetchOrders]);

  // ── Fetch AI signals ───────────────────────────────────────────

  const fetchAiSignals = useCallback(async () => {
    store.setIsLoadingAiSignals(true);
    try {
      // Fetch all signals — filtering by coin is done client-side in the component
      const signals = await optionsService.getAiSignals(undefined, undefined, store.venue);
      store.setAiSignals(signals);
    } catch (err: any) {
      store.setError(err.message ?? "Failed to load AI signals");
    } finally {
      store.setIsLoadingAiSignals(false);
    }
  }, [store.venue]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (hasAccess && activeTab === "ai-signals") fetchAiSignals();
  }, [activeTab, hasAccess, fetchAiSignals]);

  // ── IV Rank data ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!store.selectedUnderlying || !hasAccess) return;
    optionsService.getIvRank(store.selectedUnderlying, store.venue).then((data) => {
      store.setIvRankData(data);
    }).catch(() => {});
  }, [store.selectedUnderlying, store.venue, hasAccess]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── IV History (loaded on demand) ──────────────────────────────────────

  const [ivHistory, setIvHistory] = useState<IvHistoryPoint[]>([]);
  const [isLoadingIvHistory, setIsLoadingIvHistory] = useState(false);

  const loadIvHistory = useCallback(async () => {
    if (!store.selectedUnderlying) return;
    setIsLoadingIvHistory(true);
    try {
      const history = await optionsService.getIvHistory(store.selectedUnderlying, 90, store.venue);
      setIvHistory(history);
    } catch {} finally {
      setIsLoadingIvHistory(false);
    }
  }, [store.selectedUnderlying, store.venue]);

  // Reset IV history when underlying changes
  useEffect(() => { setIvHistory([]); }, [store.selectedUnderlying]);

  // ── Order book (loaded when contract selected) ─────────────────────────

  const [orderBookDepth, setOrderBookDepth] = useState<OptionDepth | null>(null);
  const [isLoadingDepth, setIsLoadingDepth] = useState(false);
  const selectedContractSymbol = store.selectedContract?.symbol ?? null;

  useEffect(() => {
    if (!selectedContractSymbol) {
      setOrderBookDepth(null);
      return;
    }
    setIsLoadingDepth(true);
    optionsService.getDepth(selectedContractSymbol, 10)
      .then(setOrderBookDepth)
      .catch(() => setOrderBookDepth(null))
      .finally(() => setIsLoadingDepth(false));
  }, [selectedContractSymbol]);

  // ── Portfolio Greeks (loaded on positions tab) ─────────────────────────

  const [portfolioGreeks, setPortfolioGreeks] = useState<PortfolioGreeks | null>(null);
  const [isLoadingPortfolioGreeks, setIsLoadingPortfolioGreeks] = useState(false);

  useEffect(() => {
    if (!hasAccess || activeTab !== "positions") return;
    setIsLoadingPortfolioGreeks(true);
    optionsService.getPortfolioGreeks(store.venue)
      .then(setPortfolioGreeks)
      .catch(() => setPortfolioGreeks(null))
      .finally(() => setIsLoadingPortfolioGreeks(false));
  }, [activeTab, hasAccess, store.venue]);

  // ── Position History ───────────────────────────────────────────────────

  const [positionHistory, setPositionHistory] = useState<OptionsPosition[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const loadPositionHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const history = await optionsService.getPositionHistory(store.venue);
      setPositionHistory(history);
    } catch {} finally {
      setIsLoadingHistory(false);
    }
  }, [store.venue]);

  useEffect(() => {
    if (showHistory && positionHistory.length === 0) loadPositionHistory();
  }, [showHistory, positionHistory.length, loadPositionHistory]);

  // ── Sell position modal ────────────────────────────────────────────────────

  const [sellModalPos, setSellModalPos] = useState<OptionsPosition | null>(null);

  // ── Multi-leg order modal (opened from AI Signals CTA) ─────────────────────

  const [mlegSignal, setMlegSignal] = useState<AiOptionsSignal | null>(null);

  // ── Toast for place-order success messages from the API ───────────────────

  const [orderToast, setOrderToast] = useState<string | null>(null);
  useEffect(() => {
    if (!orderToast) return;
    const t = setTimeout(() => setOrderToast(null), 4000);
    return () => clearTimeout(t);
  }, [orderToast]);

  // ── Pending signal execution — auto-select contract after chain loads ──

  const pendingSignalRef = useRef<AiOptionsSignal | null>(null);

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleSelectContract = useCallback(
    async (contract: OptionContract) => {
      store.setSelectedContract(contract);
      store.setOrderForm({
        optionType: contract.type,
        price: contract.askPrice, // Default to ask for BUY
      });

      // Fetch greeks for selected contract
      if (connectionId) {
        try {
          const greeks = await optionsService.getGreeks(contract.symbol);
          store.setSelectedContractGreeks(greeks);
        } catch {
          store.setSelectedContractGreeks(null);
        }
      }
    },
    [connectionId, store.positions], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handlePlaceOrder = useCallback(async () => {
    if (!connectionId || !store.selectedContract) return;
    store.setIsPlacingOrder(true);
    store.setError(null);
    try {
      const result = await optionsService.placeOrder({
        connectionId,
        contractSymbol: store.selectedContract.symbol,
        underlying: store.selectedContract.underlying,
        strike: store.selectedContract.strike,
        expiry: store.selectedContract.expiry,
        optionType: store.orderForm.optionType,
        side: store.orderForm.side,
        quantity: store.orderForm.quantity,
        price: store.orderForm.price,
      });
      if (result.message) setOrderToast(result.message);
      // Refresh orders and positions
      fetchOrders();
      fetchPositions();
      // Reset form
      store.setSelectedContract(null);
      store.setSelectedContractGreeks(null);
    } catch (err: any) {
      store.setError(err.message ?? "Order placement failed");
    } finally {
      store.setIsPlacingOrder(false);
    }
  }, [connectionId, store.selectedContract, store.orderForm, fetchOrders, fetchPositions]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sell-to-Close Handler ───────────────────────────────────────────────

  const handleClosePosition = useCallback((pos: OptionsPosition) => {
    setSellModalPos(pos);
  }, []);

  // ── Execute Signal Handler ─────────────────────────────────────────────

  const handleExecuteSignal = useCallback(
    (signal: AiOptionsSignal) => {
      if (signal.legs.length === 0) return;

      // Multi-leg signals → open the dedicated mleg confirmation modal.
      // Only Alpaca has atomic mleg execution; on Binance we'd need to fire
      // legs sequentially (leg-risk), which we explicitly don't support.
      if (signal.legs.length > 1) {
        if (store.venue !== "ALPACA") {
          setOrderToast(
            "Multi-leg signals can only be executed on Alpaca. Binance users must place legs individually.",
          );
          return;
        }
        const missingSymbol = signal.legs.some((l) => !l.symbol);
        if (missingSymbol) {
          setOrderToast("Signal is missing contract symbols — cannot be executed directly.");
          return;
        }
        setMlegSignal(signal);
        return;
      }

      // Single-leg signal.
      const leg = signal.legs[0];

      // SELL-to-open single-leg (e.g. short_put) is blocked by our
      // sell-to-close-only rule. Surface that instead of silently routing
      // to the Chain where the form would reject it.
      if (leg.side !== "BUY") {
        setOrderToast(
          "This strategy sells a contract to open a naked-short — not supported. Use a spread instead.",
        );
        return;
      }

      // Single-leg BUY — existing Chain-redirect flow.
      pendingSignalRef.current = signal;
      store.setOrderForm({
        optionType: leg.type,
        side: "BUY",
        quantity: 1,
        price: 0, // set when contract is auto-selected (askPrice)
      });
      store.setSelectedUnderlying(signal.underlying);
      store.setSelectedExpiry(null);
      setActiveTab("chain");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.venue],
  );

  // ── No Connection Guard ─────────────────────────────────────────────────

  if (!connectionId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md rounded-2xl border border-white/[0.06] bg-[#12121a] p-8 text-center">
          <h2 className="mb-2 text-lg font-bold text-slate-100">Connect Exchange First</h2>
          <p className="text-sm text-slate-400">
            You need an active Binance exchange connection to trade options.
          </p>
        </div>
      </div>
    );
  }

  // ── ELITE Gate ──────────────────────────────────────────────────────────

  if (!hasAccess) {
    return <EliteGate />;
  }

  // ── Render ──────────────────────────────────────────────────────────────

  // Find current underlying data for price display
  const currentUnderlying = store.availableUnderlyings.find(
    (u) => u.symbol === store.selectedUnderlying,
  );

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 px-4 py-2 sm:px-6 sm:py-3">
      {/* Header + Tabs together */}
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl">
              Options Trading
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              AI-powered options recommendations ·{" "}
              {store.venue === "ALPACA" ? "Alpaca US Equity Options" : "Binance Crypto Options"}
              {store.isPaper && store.venue === "ALPACA" ? " · Paper" : ""}
            </p>
          </div>

          {/* Status indicators + guide button */}
          <div className="flex items-center gap-3">
            {/* Guide button */}
            <button
              onClick={() => setShowEducation(true)}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-slate-200"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Guide
            </button>
            <div className="flex items-center gap-1.5">
              <div
                className={`h-2 w-2 rounded-full ${
                  wsConnected ? "bg-green-400 shadow-[0_0_6px_rgba(34,197,94,0.5)]" : "bg-slate-600"
                }`}
              />
              <span className="text-[10px] text-slate-500">
                {wsConnected ? "Live" : "Polling"}
              </span>
            </div>

          </div>
        </div>

        {/* Tabs — directly under heading */}
        <div className="mt-4 flex items-center gap-1 border-b border-white/[0.06] pb-px">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "text-[var(--primary)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[var(--primary)]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Alpaca-only banners: market hours + Level 3 approval nudge.
          Binance crypto options trade 24/7 and have no approval flow, so
          these only render when the active venue is ALPACA. */}
      {store.venue === "ALPACA" && (
        <div className="space-y-2">
          <MarketHoursBanner connectionId={connectionId} />
          <Level3GateBanner level={store.approvalLevel} />
        </div>
      )}

      {/* Error banner */}
      {store.error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-sm text-red-400">
          {store.error}
          <button
            onClick={() => store.setError(null)}
            className="ml-2 text-red-500 hover:text-red-300"
          >
            ✕
          </button>
        </div>
      )}

      {/* Success toast — surfaces API `message` on order placement */}
      {orderToast && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 text-sm text-emerald-300">
          {orderToast}
          <button
            onClick={() => setOrderToast(null)}
            className="ml-2 text-emerald-500 hover:text-emerald-300"
          >
            ✕
          </button>
        </div>
      )}

      {/* Education Modal */}
      <OptionsEducationModal open={showEducation} onClose={() => {
        setShowEducation(false);
        localStorage.setItem("quantivahq_options_guide_seen", "1");
      }} />

      {/* Tab Content */}
      <div>
        {/* ── Chain Tab ────────────────────────────────────────── */}
        {activeTab === "chain" && (
          <div className="space-y-4">
            {/* Coin selector with dropdown + price + IV Rank */}
            <div className="flex flex-wrap items-center gap-4">
              <CoinSelector
                underlyings={store.availableUnderlyings}
                selected={store.selectedUnderlying}
                currentPrice={currentUnderlying?.indexPrice ?? 0}
                venue={store.venue}
                onSelect={(symbol) => {
                  store.setSelectedUnderlying(symbol);
                  store.setSelectedExpiry(null);
                  store.setSelectedContract(null);
                  store.setSelectedContractGreeks(null);
                }}
              />
              <IvRankBadge
                ivRankData={store.ivRankData}
                ivHistory={ivHistory}
                isLoadingHistory={isLoadingIvHistory}
                onLoadHistory={loadIvHistory}
              />
            </div>

            {/* Expiry tabs + chain table — only when a symbol is selected */}
            {store.selectedUnderlying ? (
              <>
                <ExpiryTabs
                  expiryDates={store.expiryDates}
                  selectedExpiry={store.selectedExpiry}
                  onSelect={(e) => store.setSelectedExpiry(e)}
                />

                <OptionsChainTable
                  contracts={store.optionsChain}
                  selectedExpiry={store.selectedExpiry}
                  onSelectContract={handleSelectContract}
                  selectedContractSymbol={store.selectedContract?.symbol}
                  isLoading={store.isLoadingChain}
                  spotPrice={currentUnderlying?.indexPrice ?? 0}
                />
              </>
            ) : (
              <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <p className="text-sm text-slate-500">
                  Select a {store.venue === "ALPACA" ? "symbol" : "coin"} above to view the options chain
                </p>
              </div>
            )}

            {/* Greeks — inline row */}
            <GreeksPanel
              greeks={store.selectedContractGreeks}
              contractSymbol={store.selectedContract?.symbol}
            />

            {/* Payoff diagram — shows when contract selected */}
            {store.selectedContract && currentUnderlying && currentUnderlying.indexPrice > 0 && (
              <PayoffDiagram
                legs={[{
                  type: store.selectedContract.type,
                  side: store.orderForm.side,
                  strike: store.selectedContract.strike,
                  premium: store.orderForm.price || store.selectedContract.askPrice,
                }]}
                spotPrice={currentUnderlying.indexPrice}
              />
            )}

            {/* Order form + Order book side by side */}
            <div className="grid gap-4 lg:grid-cols-[1fr,300px]">
              <OptionOrderForm
                selectedContract={store.selectedContract}
                orderForm={store.orderForm}
                onFormChange={(form) => store.setOrderForm(form)}
                onSubmit={handlePlaceOrder}
                isPlacing={store.isPlacingOrder}
                accountBalance={store.account?.availableBalance}
                venue={store.venue}
              />
              {store.selectedContract && (
                <OrderBookPanel depth={orderBookDepth} isLoading={isLoadingDepth} />
              )}
            </div>
          </div>
        )}

        {/* ── Positions Tab ────────────────────────────────────── */}
        {activeTab === "positions" && (
          <div className="space-y-4">
            {/* Portfolio Greeks summary */}
            <PortfolioGreeksDashboard
              data={portfolioGreeks}
              isLoading={isLoadingPortfolioGreeks}
            />

            {/* Open/History toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistory(false)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  !showHistory
                    ? "bg-[var(--primary)] text-white"
                    : "border border-white/[0.08] bg-white/[0.03] text-slate-400 hover:bg-white/[0.06]"
                }`}
              >
                Open Positions
              </button>
              <button
                onClick={() => setShowHistory(true)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  showHistory
                    ? "bg-[var(--primary)] text-white"
                    : "border border-white/[0.08] bg-white/[0.03] text-slate-400 hover:bg-white/[0.06]"
                }`}
              >
                History
              </button>
            </div>

            {showHistory ? (
              <OptionsPositionsTable
                positions={positionHistory}
                isLoading={isLoadingHistory}
                showClosed
              />
            ) : (
              <OptionsPositionsTable
                positions={store.positions}
                isLoading={store.isLoadingPositions}
                onClose={handleClosePosition}
              />
            )}
          </div>
        )}

        {/* ── Orders Tab ───────────────────────────────────────── */}
        {activeTab === "orders" && (
          <OptionsOrdersTable
            orders={store.orders}
            isLoading={store.isLoadingOrders}
          />
        )}

        {/* ── AI Signals Tab ───────────────────────────────────── */}
        {activeTab === "ai-signals" && (
          <OptionsAISignals
            signals={store.aiSignals}
            isLoading={store.isLoadingAiSignals}
            onExecute={handleExecuteSignal}
          />
        )}      </div>

      {/* Sell-to-close modal */}
      {sellModalPos && connectionId && (
        <SellPositionModal
          position={sellModalPos}
          connectionId={connectionId}
          venue={store.venue}
          onClose={() => setSellModalPos(null)}
          onSuccess={(message) => {
            setSellModalPos(null);
            if (message) setOrderToast(message);
            fetchPositions();
            fetchOrders();
          }}
        />
      )}

      {/* Multi-leg order confirmation — opens from AI Signals CTA */}
      {connectionId && (
        <MultiLegOrderModal
          isOpen={!!mlegSignal}
          signal={mlegSignal}
          connectionId={connectionId}
          venue={store.venue}
          onClose={() => setMlegSignal(null)}
          onSuccess={(message) => {
            setMlegSignal(null);
            if (message) setOrderToast(message);
            fetchPositions();
            fetchOrders();
          }}
        />
      )}
    </div>
  );
}

// ── Coin Selector Component ──────────────────────────────────────────────────

function CoinSelector({
  underlyings,
  selected,
  currentPrice,
  venue,
  onSelect,
}: {
  underlyings: { symbol: string; indexPrice: number; contractCount: number }[];
  selected: string | null;
  currentPrice: number;
  venue?: string;
  onSelect: (symbol: string) => void;
}) {
  const isAlpaca = venue === "ALPACA";
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selectedData = underlyings.find((u) => u.symbol === selected);

  return (
    <div className="flex items-center gap-4">
      {/* Dropdown */}
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 transition-colors hover:bg-white/[0.06]"
        >
          <span className="text-base font-bold text-slate-100">{selected ?? (isAlpaca ? "Select Symbol" : "Select Coin")}</span>
          <svg
            className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute left-0 top-full z-30 mt-1 w-56 rounded-xl border border-white/[0.08] bg-[#12121a] p-1 shadow-2xl">
            {underlyings.map((u) => (
              <button
                key={u.symbol}
                onClick={() => {
                  onSelect(u.symbol);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  selected === u.symbol
                    ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                    : "text-slate-300 hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{u.symbol}</span>
                  {u.contractCount > 0 && (
                    <span className="text-[10px] text-slate-500">{u.contractCount} contracts</span>
                  )}
                </div>
                {selected === u.symbol && (
                  <svg className="h-4 w-4 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Current price */}
      {selectedData && selectedData.indexPrice > 0 && (
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold tabular-nums text-slate-100">
            ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-500">{isAlpaca ? "Last Price" : "Index Price"}</span>
        </div>
      )}
    </div>
  );
}
