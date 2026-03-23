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
} from "@/components/options";

// ── ELITE Gate Component ─────────────────────────────────────────────────────

function EliteGate() {
  const { setShowUpgradeModal } = useSubscriptionStore();
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md rounded-2xl border border-white/[0.06] bg-[#12121a] p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fc4f02]/10">
          <svg className="h-8 w-8 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-bold text-slate-100">ELITE Feature</h2>
        <p className="mb-6 text-sm text-slate-400">
          Options trading with AI-powered recommendations is exclusively available on the ELITE plan.
        </p>
        <button
          onClick={() => setShowUpgradeModal(true)}
          className="rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-6 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-105"
        >
          Upgrade to ELITE
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

  // Education modal — open by default on every visit
  const [showEducation, setShowEducation] = useState(true);

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
  }, [connectionId, hasAccess]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch chain when underlying changes ─────────────────────────────────

  const fetchChain = useCallback(async () => {
    if (!connectionId || !store.selectedUnderlying) return;
    store.setIsLoadingChain(true);
    store.setError(null);
    try {
      const response = await optionsService.getOptionsChain(store.selectedUnderlying, connectionId);
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

  // ── Fetch account balance ───────────────────────────────────────────────

  useEffect(() => {
    if (!connectionId || !hasAccess) return;
    (async () => {
      store.setIsLoadingAccount(true);
      try {
        // Use the same exchange balance API as top trades — reads the real spot USDT wallet
        const res = await exchangesService.getBalance(connectionId);
        const assets = res.data?.assets ?? [];
        const usdt = assets.find((a) => a.symbol === "USDT");
        const available = usdt ? parseFloat(usdt.free || "0") : 0;
        const total = usdt ? parseFloat(usdt.total || usdt.free || "0") : 0;
        store.setAccount({ availableBalance: available, totalBalance: total, unrealizedPnl: 0, marginBalance: 0 });
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
          const greeks = await optionsService.getGreeks(contract.symbol, connectionId);
          store.setSelectedContractGreeks(greeks);
        } catch {
          store.setSelectedContractGreeks(null);
        }
      }
    },
    [connectionId], // eslint-disable-line react-hooks/exhaustive-deps
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
                  ? "text-[#fc4f02]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#fc4f02]" />
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
      <OptionsEducationModal open={showEducation} onClose={() => setShowEducation(false)} />

      {/* Tab Content */}
      <div>
        {/* ── Chain Tab ────────────────────────────────────────── */}
        {activeTab === "chain" && (
          <div className="space-y-4">
            {/* Coin selector with dropdown + price */}
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

            {/* Place Order — at the bottom */}
            <OptionOrderForm
              selectedContract={store.selectedContract}
              orderForm={store.orderForm}
              onFormChange={(form) => store.setOrderForm(form)}
              onSubmit={handlePlaceOrder}
              isPlacing={store.isPlacingOrder}
              accountBalance={store.account?.availableBalance}
            />
          </div>
        )}

        {/* ── Positions Tab ────────────────────────────────────── */}
        {activeTab === "positions" && (
          <OptionsPositionsTable
            positions={store.positions}
            isLoading={store.isLoadingPositions}
          />
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
                    ? "bg-[#fc4f02]/10 text-[#fc4f02]"
                    : "text-slate-300 hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{u.symbol}</span>
                  <span className="text-[10px] text-slate-500">{u.contractCount} contracts</span>
                </div>
                {selected === u.symbol && (
                  <svg className="h-4 w-4 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
