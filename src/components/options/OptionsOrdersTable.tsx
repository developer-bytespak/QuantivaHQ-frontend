"use client";

import type { OptionsOrder } from "@/lib/api/options.service";
import { Tooltip } from "./Tooltip";

// ── Types ────────────────────────────────────────────────────────────────────

interface OptionsOrdersTableProps {
  orders: OptionsOrder[];
  isLoading?: boolean;
  onCancel?: (order: OptionsOrder) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: "bg-yellow-500/15", text: "text-yellow-400", label: "PENDING" },
    filled: { bg: "bg-green-500/15", text: "text-green-400", label: "FILLED" },
    partially_filled: { bg: "bg-blue-500/15", text: "text-blue-400", label: "PARTIAL" },
    cancelled: { bg: "bg-slate-500/15", text: "text-slate-400", label: "CANCELLED" },
    rejected: { bg: "bg-red-500/15", text: "text-red-400", label: "REJECTED" },
    expired: { bg: "bg-slate-500/15", text: "text-slate-500", label: "EXPIRED" },
  };
  const s = map[status] ?? { bg: "bg-slate-500/15", text: "text-slate-400", label: status.toUpperCase() };
  return (
    <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

// Grid template: 7 columns (Action column added conditionally)
const BASE_GRID_COLS = "minmax(180px,2fr) 80px 80px 80px 90px 110px minmax(120px,1.5fr)";
const GRID_COLS_WITH_ACTION = `${BASE_GRID_COLS} 100px`;

// ── Component ────────────────────────────────────────────────────────────────

export function OptionsOrdersTable({ orders, isLoading, onCancel }: OptionsOrdersTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
        <span className="ml-3 text-sm text-slate-400">Loading orders…</span>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-sm text-slate-500">
        <svg className="mb-3 h-8 w-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        No orders found.
      </div>
    );
  }

  const nowTs = Date.now();

  // Show Action column only if at least one order is cancellable (pending + handler provided)
  const showAction = !!onCancel && orders.some((o) => {
    const expTs = o.expiry ? new Date(o.expiry).getTime() : null;
    const stalePending =
      ["pending", "submitting", "partially_filled"].includes(o.status) &&
      expTs !== null &&
      !isNaN(expTs) &&
      expTs < nowTs;
    const eff = stalePending ? "expired" : o.status;
    return eff === "pending";
  });

  const gridCols = showAction ? GRID_COLS_WITH_ACTION : BASE_GRID_COLS;
  const minWidth = showAction ? "900px" : "800px";

  return (
    <div className="overflow-x-auto rounded-xl border border-[--color-border]">
      <div className="text-xs" style={{ minWidth }}>
        {/* Header */}
        <div
          className="grid items-center gap-2 border-b border-[--color-border] bg-[--color-surface]/40 px-3 py-2.5 font-medium uppercase text-slate-400"
          style={{ gridTemplateColumns: gridCols }}
        >
          <div className="text-left">
            <Tooltip content="The options contract — underlying asset, strike price, and expiration date" position="top">
              <span>Contract</span>
            </Tooltip>
          </div>
          <div className="text-left">
            <Tooltip content="CALL = right to buy the asset at strike. PUT = right to sell at strike." position="top">
              <span>Type</span>
            </Tooltip>
          </div>
          <div className="text-left">
            <Tooltip content="BUY = acquiring the option (pay premium). SELL = writing the option (receive premium)." position="top">
              <span>Side</span>
            </Tooltip>
          </div>
          <div className="text-right">
            <Tooltip content="Number of contracts in this order" position="top">
              <span>Qty</span>
            </Tooltip>
          </div>
          <div className="text-right">
            <Tooltip content="Your limit price (premium per contract) for this order" position="top">
              <span>Price</span>
            </Tooltip>
          </div>
          <div className="text-center">
            <Tooltip content="Order status: Pending (waiting to fill), Filled (executed), Partial, Cancelled, or Rejected" position="top">
              <span>Status</span>
            </Tooltip>
          </div>
          <div className="text-right">Time</div>
          {showAction && <div className="text-center">Action</div>}
        </div>

        {/* Rows */}
        {orders.map((order) => {
          const expiryTs = order.expiry ? new Date(order.expiry).getTime() : null;
          const isStalePending =
            ["pending", "submitting", "partially_filled"].includes(order.status) &&
            expiryTs !== null &&
            !isNaN(expiryTs) &&
            expiryTs < nowTs;
          const effectiveStatus = isStalePending ? "expired" : order.status;

          return (
            <div
              key={order.orderId}
              className="grid items-center gap-2 border-b border-[--color-border]/30 px-3 py-2.5 transition-colors hover:bg-[--color-surface]/40"
              style={{ gridTemplateColumns: gridCols }}
            >
              {/* Contract */}
              <div className="text-left">
                <div className="font-mono text-slate-200">{order.underlying || "—"}</div>
                <div className="text-[10px] text-slate-500">
                  ${Number(order.strike || 0).toLocaleString()} · {order.expiry ? new Date(order.expiry).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                </div>
              </div>

              {/* Type */}
              <div className="text-left">
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                    order.optionType === "CALL"
                      ? "bg-green-500/15 text-green-400"
                      : "bg-red-500/15 text-red-400"
                  }`}
                >
                  {order.optionType}
                </span>
              </div>

              {/* Side */}
              <div className="text-left">
                <span
                  className={`text-xs font-medium ${
                    order.side === "BUY" ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {order.side}
                </span>
              </div>

              {/* Qty */}
              <div className="text-right font-mono text-slate-300">{order.quantity}</div>

              {/* Price */}
              <div className="text-right font-mono text-slate-300">{order.price.toFixed(2)}</div>

              {/* Status */}
              <div className="text-center">{statusBadge(effectiveStatus)}</div>

              {/* Time */}
              <div className="text-right text-slate-500">
                {new Date(order.createdAt).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>

              {/* Action (only when column is shown) */}
              {showAction && (
                <div className="text-center">
                  {effectiveStatus === "pending" && onCancel && (
                    <button
                      onClick={() => onCancel(order)}
                      className="rounded-md bg-red-500/10 px-2 py-1 text-[10px] font-medium text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
