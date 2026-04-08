"use client";

// Binance eapi depth returns bids/asks as [["price","qty"], ...] or {price,quantity}[]
// Normalize both formats safely.

interface OrderBookPanelProps {
  depth: any | null; // raw from API — shape may vary
  isLoading: boolean;
}

interface BookEntry {
  price: number;
  quantity: number;
}

function normalizeEntries(raw: any[]): BookEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (Array.isArray(entry)) {
        return { price: parseFloat(entry[0] || "0"), quantity: parseFloat(entry[1] || "0") };
      }
      if (entry && typeof entry === "object") {
        return { price: Number(entry.price ?? 0), quantity: Number(entry.quantity ?? entry.qty ?? 0) };
      }
      return null;
    })
    .filter((e): e is BookEntry => e !== null && e.price > 0);
}

export function OrderBookPanel({ depth, isLoading }: OrderBookPanelProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-[--color-border] bg-[--color-surface]/60 py-8">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  if (!depth) return null;

  const bids = normalizeEntries(depth.bids).slice(0, 8);
  const asks = normalizeEntries(depth.asks).slice(0, 8);

  if (bids.length === 0 && asks.length === 0) return null;

  const maxBidQty = Math.max(...bids.map((b) => b.quantity), 1);
  const maxAskQty = Math.max(...asks.map((a) => a.quantity), 1);

  const spread = asks.length > 0 && bids.length > 0
    ? asks[0].price - bids[0].price
    : 0;
  const midPrice = asks.length > 0 && bids.length > 0
    ? (asks[0].price + bids[0].price) / 2
    : 0;
  const spreadPct = midPrice > 0 ? (spread / midPrice) * 100 : 0;

  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-300">Order Book</span>
        {spread > 0 && (
          <span className="text-[10px] text-slate-500">
            Spread: <span className="text-slate-300">{spread.toFixed(4)}</span>
            <span className="ml-1 text-slate-500">({spreadPct.toFixed(2)}%)</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Bids */}
        <div>
          <div className="mb-1 flex justify-between text-[9px] uppercase tracking-wide text-slate-500">
            <span>Price</span>
            <span>Qty</span>
          </div>
          {bids.map((b, i) => (
            <div key={i} className="relative flex justify-between py-0.5 text-[11px]">
              <div
                className="absolute inset-y-0 right-0 bg-emerald-500/10"
                style={{ width: `${(b.quantity / maxBidQty) * 100}%` }}
              />
              <span className="relative z-10 font-mono text-emerald-400">{b.price.toFixed(4)}</span>
              <span className="relative z-10 font-mono text-slate-400">{b.quantity.toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Asks */}
        <div>
          <div className="mb-1 flex justify-between text-[9px] uppercase tracking-wide text-slate-500">
            <span>Price</span>
            <span>Qty</span>
          </div>
          {asks.map((a, i) => (
            <div key={i} className="relative flex justify-between py-0.5 text-[11px]">
              <div
                className="absolute inset-y-0 left-0 bg-red-500/10"
                style={{ width: `${(a.quantity / maxAskQty) * 100}%` }}
              />
              <span className="relative z-10 font-mono text-red-400">{a.price.toFixed(4)}</span>
              <span className="relative z-10 font-mono text-slate-400">{a.quantity.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
