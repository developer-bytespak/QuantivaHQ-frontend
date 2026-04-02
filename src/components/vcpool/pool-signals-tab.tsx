"use client";

import { useEffect, useState } from "react";
import {
  adminGetPreBuiltStrategies,
  adminGetTrendingAssetsWithInsights,
  adminCreateTrade,
  type AdminPreBuiltStrategy,
  type AdminTrendingAsset,
  type AdminPoolDetails,
  type AdminOpenTradeRequest,
} from "@/lib/api/vcpool-admin";

// --- Format helpers (match Top Trades) ---
function formatUsdt(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
}

function formatCurrency(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(v);
}

function formatNumberCompact(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 2 }).format(v);
}

// --- Signal row type (asset with signal, normalized for display; same as Top Trades) ---
interface SignalRow {
  asset_id: string;
  symbol: string;
  display_name: string;
  pair: string;
  action: "BUY" | "SELL" | "HOLD";
  entry_price: number;
  confidence: number;
  signal_id: string;
  trend_score?: number;
  stop_loss?: number;
  take_profit_1?: number;
  price_usd: number;
  price_change_24h?: number;
  volume_24h?: number;
}

// --- VCPool Auto Trade Modal: amount in USDT only (prefilled from signal) ---
function VCPoolAutoTradeModal({
  open,
  onClose,
  onSubmit,
  saving,
  signal,
  pool,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (body: AdminOpenTradeRequest) => void;
  saving: boolean;
  signal: SignalRow | null;
  pool: AdminPoolDetails | null;
}) {
  const [amountUsdt, setAmountUsdt] = useState("");

  if (!open || !signal) return null;

  const entryPrice = signal.entry_price;
  const amount = Number(amountUsdt);
  const quantity = entryPrice > 0 && amount > 0 ? amount / entryPrice : 0;
  const poolValue = pool?.current_pool_value_usdt != null ? Number(pool.current_pool_value_usdt) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!(amount > 0) || !(entryPrice > 0)) return;
    const qty = amount / entryPrice;
    onSubmit({
      asset_pair: signal.pair.replace(" / USDT", "USDT").replace(" / USD", "USD"),
      action: signal.action === "SELL" ? "SELL" : "BUY",
      quantity: qty,
      entry_price_usdt: entryPrice,
      notes: `From signal ${signal.signal_id} · ${amount} USDT`,
    });
    onClose();
    setAmountUsdt("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[--color-border] bg-[--color-surface] shadow-xl">
        <div className="flex items-center justify-between border-b border-[--color-border] px-5 py-4">
          <h3 className="text-lg font-semibold text-white">Auto trade (amount)</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="rounded-lg bg-[--color-surface-alt] px-3 py-2 text-sm text-slate-300">
            <p className="font-medium text-white">{signal.pair}</p>
            <p className="mt-0.5">
              {signal.action} · Entry: {formatUsdt(signal.entry_price)} USDT · Confidence: {(signal.confidence * 100).toFixed(0)}%
            </p>
          </div>
          {poolValue != null && (
            <p className="text-xs text-slate-400">
              Pool value: {formatUsdt(poolValue)} USDT
            </p>
          )}
          <label className="block text-sm text-slate-400">
            Amount to invest (USDT)
            <input
              type="number"
              step="any"
              min={0}
              value={amountUsdt}
              onChange={(e) => setAmountUsdt(e.target.value)}
              placeholder="e.g. 100"
              className="mt-1.5 w-full rounded-lg border border-[--color-border] bg-[--color-surface-alt] px-3 py-2.5 text-sm text-white placeholder:text-slate-500"
              autoFocus
            />
          </label>
          {amount > 0 && entryPrice > 0 && (
            <p className="text-xs text-slate-400">
              Quantity: {quantity.toFixed(6)}
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || !(amount > 0)}
              className="flex-1 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Placing…" : "Place trade"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-[--color-border] px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5 disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- VCPool Manual Trade Modal: amount in USDT, editable fields ---
function VCPoolManualTradeModal({
  open,
  onClose,
  onSubmit,
  saving,
  signal,
  pool,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (body: AdminOpenTradeRequest) => void;
  saving: boolean;
  signal: SignalRow | null;
  pool: AdminPoolDetails | null;
}) {
  const [assetPair, setAssetPair] = useState(signal?.pair.replace(" / USDT", "USDT").replace(" / USD", "USD") ?? "BTCUSDT");
  const [action, setAction] = useState<"BUY" | "SELL">(
    signal?.action === "BUY" || signal?.action === "SELL" ? signal.action : "BUY"
  );
  const [entryPrice, setEntryPrice] = useState(signal?.entry_price != null ? String(signal.entry_price) : "");
  const [amountUsdt, setAmountUsdt] = useState("");

  useEffect(() => {
    if (signal) {
      setAssetPair(signal.pair.replace(" / USDT", "USDT").replace(" / USD", "USD"));
      setAction(signal.action === "BUY" || signal.action === "SELL" ? signal.action : "BUY");
      setEntryPrice(signal.entry_price != null ? String(signal.entry_price) : "");
    }
  }, [signal]);

  if (!open) return null;

  const entry = Number(entryPrice);
  const amount = Number(amountUsdt);
  const quantity = entry > 0 && amount > 0 ? amount / entry : 0;
  const poolValue = pool?.current_pool_value_usdt != null ? Number(pool.current_pool_value_usdt) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetPair.trim() || !(entry > 0) || !(amount > 0)) return;
    onSubmit({
      asset_pair: assetPair.trim(),
      action,
      quantity: amount / entry,
      entry_price_usdt: entry,
      notes: `Manual pool trade · ${amount} USDT`,
    });
    onClose();
    setAmountUsdt("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[--color-border] bg-[--color-surface] shadow-xl">
        <div className="flex items-center justify-between border-b border-[--color-border] px-5 py-4">
          <h3 className="text-lg font-semibold text-white">Manual trade (amount)</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {poolValue != null && (
            <p className="text-xs text-slate-400">
              Pool value: {formatUsdt(poolValue)} USDT
            </p>
          )}
          <label className="block text-sm text-slate-400">
            Asset pair
            <input
              type="text"
              value={assetPair}
              onChange={(e) => setAssetPair(e.target.value)}
              placeholder="e.g. BTCUSDT"
              className="mt-1.5 w-full rounded-lg border border-[--color-border] bg-[--color-surface-alt] px-3 py-2.5 text-sm text-white placeholder:text-slate-500"
            />
          </label>
          <label className="block text-sm text-slate-400">
            Action
            <select
              value={action}
              onChange={(e) => setAction(e.target.value as "BUY" | "SELL")}
              className="mt-1.5 w-full rounded-lg border border-[--color-border] bg-[--color-surface-alt] px-3 py-2.5 text-sm text-white"
            >
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </label>
          <label className="block text-sm text-slate-400">
            Entry price (USDT)
            <input
              type="number"
              step="any"
              min="0"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              placeholder="e.g. 60000"
              className="mt-1.5 w-full rounded-lg border border-[--color-border] bg-[--color-surface-alt] px-3 py-2.5 text-sm text-white placeholder:text-slate-500"
            />
          </label>
          <label className="block text-sm text-slate-400">
            Amount to invest (USDT)
            <input
              type="number"
              step="any"
              min={0}
              value={amountUsdt}
              onChange={(e) => setAmountUsdt(e.target.value)}
              placeholder="e.g. 100"
              className="mt-1.5 w-full rounded-lg border border-[--color-border] bg-[--color-surface-alt] px-3 py-2.5 text-sm text-white placeholder:text-slate-500"
            />
          </label>
          {amount > 0 && entry > 0 && (
            <p className="text-xs text-slate-400">
              Quantity: {quantity.toFixed(6)}
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || !assetPair.trim() || !(entry > 0) || !(amount > 0)}
              className="flex-1 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Placing…" : "Place trade"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-[--color-border] px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5 disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Map API asset to SignalRow (all assets, same as Top Trades; action can be BUY/SELL/HOLD) ---
function assetToSignalRow(asset: AdminTrendingAsset): SignalRow {
  const sig = asset.signal;
  const symbol = asset.symbol ?? asset.display_name ?? asset.asset_id;
  const pair = asset.asset_type === "stock"
    ? `${symbol} / USD`
    : (symbol.endsWith("USDT") ? symbol : `${symbol}USDT`);
  const action = (sig?.action === "BUY" || sig?.action === "SELL" ? sig.action : "HOLD") as "BUY" | "SELL" | "HOLD";
  const entryPrice = sig?.entry_price ?? asset.price_usd ?? 0;
  return {
    asset_id: asset.asset_id,
    symbol,
    display_name: asset.display_name ?? symbol,
    pair,
    action,
    entry_price: entryPrice > 0 ? entryPrice : asset.price_usd ?? 0,
    confidence: sig?.confidence ?? 0,
    signal_id: sig?.signal_id ?? asset.asset_id,
    trend_score: asset.trend_score,
    stop_loss: sig?.stop_loss,
    take_profit_1: sig?.take_profit_1,
    price_usd: asset.price_usd ?? 0,
    price_change_24h: asset.price_change_24h,
    volume_24h: asset.volume_24h,
  };
}

export interface PoolSignalsTabProps {
  poolId: string;
  pool: AdminPoolDetails | null;
  onTradePlaced?: () => void;
}

const ITEMS_PER_PAGE = 8;

export function PoolSignalsTab({ poolId, pool, onTradePlaced }: PoolSignalsTabProps) {
  const [strategies, setStrategies] = useState<AdminPreBuiltStrategy[]>([]);
  const [strategiesLoading, setStrategiesLoading] = useState(true);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
  const [assets, setAssets] = useState<AdminTrendingAsset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoTradeSignal, setAutoTradeSignal] = useState<SignalRow | null>(null);
  const [manualTradeSignal, setManualTradeSignal] = useState<SignalRow | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const canTrade = pool?.status === "active";

  useEffect(() => {
    let mounted = true;
    (async () => {
      setStrategiesLoading(true);
      try {
        const list = await adminGetPreBuiltStrategies("crypto");
        if (mounted) {
          setStrategies(list);
          if (list.length > 0 && !selectedStrategyId) {
            setSelectedStrategyId(list[0].strategy_id);
          }
        }
      } catch {
        if (mounted) setStrategies([]);
      } finally {
        if (mounted) setStrategiesLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!selectedStrategyId) {
      setAssets([]);
      return;
    }
    let mounted = true;
    setAssetsLoading(true);
    adminGetTrendingAssetsWithInsights(selectedStrategyId, 500)
      .then((res) => {
        const list = Array.isArray(res?.assets) ? res.assets : [];
        if (mounted) setAssets(list);
      })
      .catch(() => {
        if (mounted) setAssets([]);
      })
      .finally(() => {
        if (mounted) setAssetsLoading(false);
      });
    return () => { mounted = false; };
  }, [selectedStrategyId]);

  const signalRows: SignalRow[] = assets.map((a) => assetToSignalRow(a));
  const totalPages = Math.max(1, Math.ceil(signalRows.length / ITEMS_PER_PAGE));
  const paginatedRows = signalRows.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStrategyId, assets.length]);

  const handlePlaceTrade = async (body: AdminOpenTradeRequest) => {
    setSaving(true);
    try {
      await adminCreateTrade(poolId, body);
      onTradePlaced?.();
      setAutoTradeSignal(null);
      setManualTradeSignal(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-400">
        Same signals as Top Trades. Select a strategy, then use <strong>Auto trade</strong> or <strong>Manual trade</strong> and enter the <strong>amount (USDT)</strong> to invest from the pool.
      </p>

      {!canTrade && pool && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {pool.status === "draft"
            ? "Publish the pool first."
            : pool.status === "open" || pool.status === "full"
            ? "Fill all seats, then start the pool (Trades tab) to enable trading."
            : "Trading is only allowed when the pool is open, full, and started (active)."}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-slate-400">Strategy</label>
        <select
          value={selectedStrategyId ?? ""}
          onChange={(e) => setSelectedStrategyId(e.target.value || null)}
          className="rounded-xl border border-[--color-border] bg-[--color-surface-alt] px-3 py-2 text-sm text-white"
        >
          {strategiesLoading ? (
            <option value="">Loading…</option>
          ) : (
            strategies.map((s) => (
              <option key={s.strategy_id} value={s.strategy_id}>
                {s.name}
              </option>
            ))
          )}
        </select>
      </div>

      {assetsLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-[--color-border] bg-[--color-surface]/50 py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
          <span className="text-sm text-slate-400">Loading signals…</span>
        </div>
      ) : signalRows.length === 0 ? (
        <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/50 py-16 text-center">
          <p className="text-sm text-slate-400">No signals for this strategy.</p>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
            {paginatedRows.map((row) => (
              <div
                key={row.asset_id}
                className="rounded-lg sm:rounded-2xl bg-gradient-to-br from-white/[0.07] to-transparent p-4 sm:p-6 backdrop-blur border border-white/[0.06]"
              >
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                    <span
                      className={`rounded-lg px-3 py-1 text-sm font-semibold text-white ${
                        row.action === "BUY"
                          ? "bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)]"
                          : row.action === "SELL"
                          ? "bg-gradient-to-r from-red-500 to-red-600"
                          : "bg-slate-600/80"
                      }`}
                    >
                      {row.action}
                    </span>
                    <span className="text-sm font-medium text-white">{row.pair}</span>
                    <span className="rounded-full px-2 py-0.5 text-xs text-slate-300 bg-slate-600/80">
                      {(row.confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-slate-400">
                      Price {row.price_usd > 0 ? formatCurrency(row.price_usd) : "—"}
                      {row.price_change_24h != null && (
                        <span className={row.price_change_24h >= 0 ? "text-emerald-400 ml-1" : "text-red-400 ml-1"}>
                          {row.price_change_24h >= 0 ? "+" : ""}{row.price_change_24h.toFixed(2)}%
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-400">Entry</span>
                      <span className="font-medium text-white">
                        {row.entry_price > 0 ? formatCurrency(row.entry_price) : "—"}
                      </span>
                    </div>
                    {(row.stop_loss != null || row.take_profit_1 != null) && (
                      <div className="flex flex-wrap gap-3 text-sm">
                        {row.stop_loss != null && (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">SL</span>
                            <span className="font-medium text-white">{formatCurrency(row.stop_loss)}</span>
                          </div>
                        )}
                        {row.take_profit_1 != null && (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">TP</span>
                            <span className="font-medium text-white">{formatCurrency(row.take_profit_1)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {row.volume_24h != null && row.volume_24h > 0 && (
                    <div className="text-xs text-slate-400">
                      Volume: {formatNumberCompact(row.volume_24h)}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => row.action !== "HOLD" && setAutoTradeSignal(row)}
                      disabled={saving || row.action === "HOLD" || !canTrade}
                      title={
                        !canTrade
                          ? "Start the pool (when full) to enable trading"
                          : row.action === "HOLD"
                          ? "Auto trade only for BUY/SELL signals"
                          : undefined
                      }
                      className="flex-1 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[rgba(var(--primary-rgb),0.3)]/20 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Auto trade
                    </button>
                    <button
                      type="button"
                      onClick={() => canTrade && setManualTradeSignal(row)}
                      disabled={saving || !canTrade}
                      title={!canTrade ? "Start the pool (when full) to enable trading" : undefined}
                      className="rounded-xl bg-[--color-surface] px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Manual trade
                    </button>
                  </div>
                  {!canTrade && (
                    <p className="text-xs text-amber-400/90">
                      {pool?.status === "open" || pool?.status === "full"
                        ? "Fill all seats, then start the pool in the Trades tab to trade."
                        : "Trading only when pool is open, full, and started (active)."}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="rounded-lg bg-[--color-surface] px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <span className="text-sm text-slate-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-lg bg-[--color-surface] px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      <VCPoolAutoTradeModal
        open={!!autoTradeSignal}
        onClose={() => setAutoTradeSignal(null)}
        onSubmit={handlePlaceTrade}
        saving={saving}
        signal={autoTradeSignal}
        pool={pool}
      />
      <VCPoolManualTradeModal
        open={!!manualTradeSignal}
        onClose={() => setManualTradeSignal(null)}
        onSubmit={handlePlaceTrade}
        saving={saving}
        signal={manualTradeSignal}
        pool={pool}
      />
    </div>
  );
}
