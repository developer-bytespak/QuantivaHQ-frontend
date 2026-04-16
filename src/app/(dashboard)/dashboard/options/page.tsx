"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useExchange } from "@/context/ExchangeContext";
import useSubscriptionStore from "@/state/subscription-store";
import { FeatureType } from "@/mock-data/subscription-dummy-data";
import { useOptionsStore } from "@/state/options-store";
import { useOptionsSocket } from "@/hooks/useOptionsSocket";
import { optionsService } from "@/lib/api/options.service";
import { exchangesService } from "@/lib/api/exchanges.service";
import type { OptionsOrder, OptionContract } from "@/lib/api/options.service";
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
} from "@/components/options";
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

  // Local tab state (simpler than store for page-only concern)
  const [activeTab, setActiveTab] = useState<OptionsTab>("chain");

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

  // Merge WS updates into store
  useEffect(() => {
    if (chainUpdate && chainUpdate.length > 0) {
      store.setOptionsChain(chainUpdate);
    }
  }, [chainUpdate]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch underlyings on mount ──────────────────────────────────────────

  useEffect(() => {
    if (!connectionId || !hasAccess) return;
    (async () => {
      try {
        const underlyings = await optionsService.getAvailableUnderlyings();
        store.setAvailableUnderlyings(underlyings);
        // Auto-select first underlying if none selected
        if (!store.selectedUnderlying && underlyings.length > 0) {
          store.setSelectedUnderlying(underlyings[0].symbol);
        }
      } catch (err: any) {
        store.setError(err.message ?? "Failed to load underlyings");
      }
    })();
  }, [connectionId, hasAccess]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch chain when underlying changes ─────────────────────────────────

  const fetchChain = useCallback(async () => {
    if (!connectionId || !store.selectedUnderlying) return;
    store.setIsLoadingChain(true);
    store.setError(null);
    try {
      const response = await optionsService.getOptionsChain(store.selectedUnderlying);
      store.setOptionsChain(response.contracts);
      store.setExpiryDates(response.expiryDates);
      // Auto-select first expiry
      if (response.expiryDates.length > 0 && !store.selectedExpiry) {
        store.setSelectedExpiry(response.expiryDates[0]);
      }
    } catch (err: any) {
      store.setError(err.message ?? "Failed to load options chain");
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

    const leg = signal.legs[0];
    if (!leg) { pendingSignalRef.current = null; return; }

    // Find matching contract: same type + closest strike
    const matching = store.optionsChain.find(
      (c) => c.type === leg.type && Math.abs(c.strike - leg.strike) < 1,
    );

    if (matching) {
      handleSelectContract(matching);
      // Set the correct expiry tab
      if (matching.expiry) {
        const expiryDate = matching.expiry.split("T")[0];
        store.setSelectedExpiry(expiryDate);
      }
    }

    pendingSignalRef.current = null;
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
    if (hasAccess && activeTab === "positions") fetchPositions();
  }, [activeTab, hasAccess, fetchPositions]);

  // ── Fetch orders ────────────────────────────────────────────────────────

  const fetchOrders = useCallback(async () => {
    store.setIsLoadingOrders(true);
    try {
      const orders = await optionsService.getOrders(undefined, 50);
      store.setOrders(orders);
    } catch (err: any) {
      store.setError(err.message ?? "Failed to load orders");
    } finally {
      store.setIsLoadingOrders(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (hasAccess && activeTab === "orders") fetchOrders();
  }, [activeTab, hasAccess, fetchOrders]);

  // ── Fetch AI signals ───────────────────────────────────────────

  const fetchAiSignals = useCallback(async () => {
    store.setIsLoadingAiSignals(true);
    try {
      // Fetch all signals — filtering by coin is done client-side in the component
      const signals = await optionsService.getAiSignals();
      store.setAiSignals(signals);
    } catch (err: any) {
      store.setError(err.message ?? "Failed to load AI signals");
    } finally {
      store.setIsLoadingAiSignals(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (hasAccess && activeTab === "ai-signals") fetchAiSignals();
  }, [activeTab, hasAccess, fetchAiSignals]);

  // ── IV Rank data ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!store.selectedUnderlying || !hasAccess) return;
    optionsService.getIvRank(store.selectedUnderlying).then((data) => {
      store.setIvRankData(data);
    }).catch(() => {});
  }, [store.selectedUnderlying, hasAccess]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── IV History (loaded on demand) ──────────────────────────────────────

  const [ivHistory, setIvHistory] = useState<IvHistoryPoint[]>([]);
  const [isLoadingIvHistory, setIsLoadingIvHistory] = useState(false);

  const loadIvHistory = useCallback(async () => {
    if (!store.selectedUnderlying) return;
    setIsLoadingIvHistory(true);
    try {
      const history = await optionsService.getIvHistory(store.selectedUnderlying, 90);
      setIvHistory(history);
    } catch {} finally {
      setIsLoadingIvHistory(false);
    }
  }, [store.selectedUnderlying]);

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
    optionsService.getPortfolioGreeks()
      .then(setPortfolioGreeks)
      .catch(() => setPortfolioGreeks(null))
      .finally(() => setIsLoadingPortfolioGreeks(false));
  }, [activeTab, hasAccess]);

  // ── Position History ───────────────────────────────────────────────────

  const [positionHistory, setPositionHistory] = useState<OptionsPosition[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const loadPositionHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const history = await optionsService.getPositionHistory();
      setPositionHistory(history);
    } catch {} finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (showHistory && positionHistory.length === 0) loadPositionHistory();
  }, [showHistory, positionHistory.length, loadPositionHistory]);

  // ── User position qty for sell-to-close ─────────────────────────────

  const [userPositionQty, setUserPositionQty] = useState<number | null>(null);

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

      // Check if user has an open position for this contract (sell-to-close context)
      const matchingPosition = store.positions.find(
        (p) => p.contractSymbol === contract.symbol && p.isOpen,
      );
      setUserPositionQty(matchingPosition ? matchingPosition.quantity : null);

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
      await optionsService.placeOrder({
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

  const handleCancelOrder = useCallback(
    async (order: OptionsOrder) => {
      if (!connectionId || !order.binanceOrderId) return;
      try {
        await optionsService.cancelOrder({
          connectionId,
          contractSymbol: order.contractSymbol,
          orderId: order.binanceOrderId,
        });
        fetchOrders();
      } catch (err: any) {
        store.setError(err.message ?? "Failed to cancel order");
      }
    },
    [connectionId, fetchOrders], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── Close Position Handler ──────────────────────────────────────────────

  const handleClosePosition = useCallback(
    (pos: OptionsPosition) => {
      // Pre-fill order form with opposite side and switch to chain tab
      const contract = store.optionsChain.find((c) => c.symbol === pos.contractSymbol);
      if (contract) {
        store.setSelectedContract(contract);
      }
      store.setOrderForm({
        optionType: pos.optionType,
        side: pos.quantity > 0 ? "SELL" : "BUY", // close long = sell, close short = buy
        quantity: Math.abs(pos.quantity),
        price: pos.currentPremium || 0,
      });
      // Set position qty so the order form knows this is a sell-to-close
      setUserPositionQty(Math.abs(pos.quantity));
      setActiveTab("chain");
    },
    [store.optionsChain], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── Execute Signal Handler ─────────────────────────────────────────────

  const handleExecuteSignal = useCallback(
    (signal: AiOptionsSignal) => {
      if (signal.legs.length === 0) return;
      const leg = signal.legs[0];

      // Store pending signal so the auto-select effect can match it after chain loads
      pendingSignalRef.current = signal;

      // Pre-fill order form
      store.setOrderForm({
        optionType: leg.type,
        side: leg.side,
        quantity: 1,
        price: 0, // Will be set when contract is auto-selected (askPrice)
      });

      // Switch underlying (triggers chain reload) and switch to chain tab
      store.setSelectedUnderlying(signal.underlying);
      store.setSelectedExpiry(null); // Reset so it picks the right expiry
      setActiveTab("chain");
    },
    [], // eslint-disable-line react-hooks/exhaustive-deps
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
              AI-powered options recommendations · Binance Options
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

            {/* Expiry tabs — full width */}
            <ExpiryTabs
              expiryDates={store.expiryDates}
              selectedExpiry={store.selectedExpiry}
              onSelect={(e) => store.setSelectedExpiry(e)}
            />

            {/* Chain table — full width */}
            <OptionsChainTable
              contracts={store.optionsChain}
              selectedExpiry={store.selectedExpiry}
              onSelectContract={handleSelectContract}
              selectedContractSymbol={store.selectedContract?.symbol}
              isLoading={store.isLoadingChain}
            />

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
                userPositionQty={userPositionQty}
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
            onCancel={handleCancelOrder}
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
    </div>
  );
}

// ── Coin Selector Component ──────────────────────────────────────────────────

function CoinSelector({
  underlyings,
  selected,
  currentPrice,
  onSelect,
}: {
  underlyings: { symbol: string; indexPrice: number; contractCount: number }[];
  selected: string | null;
  currentPrice: number;
  onSelect: (symbol: string) => void;
}) {
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
          <span className="text-base font-bold text-slate-100">{selected ?? "Select"}</span>
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
                  <span className="text-[10px] text-slate-500">{u.contractCount} contracts</span>
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
          <span className="text-[11px] text-slate-500">Index Price</span>
        </div>
      )}
    </div>
  );
}
