"use client";

import { Fragment } from "react";
import type { OptionsOrder } from "@/lib/api/options.service";
import { Tooltip } from "./Tooltip";

// ── Types ────────────────────────────────────────────────────────────────────

interface OptionsOrdersTableProps {
  orders: OptionsOrder[];
  isLoading?: boolean;
}

interface OrderGroup {
  groupId: string | null;
  legs: OptionsOrder[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Collapse adjacent legs that share a `groupId` into a single group entry.
 * Single-leg orders become groups of one. Original ordering is preserved so
 * the "newest first" sort the backend gives us survives intact.
 *
 * The backend returns one row per leg of a multi-leg (mleg) trade — without
 * grouping the user sees e.g. an Iron Condor as 4 disconnected rows. With
 * grouping the four legs render under one "Multi-leg trade · 4 legs" header.
 */
function groupOrders(orders: OptionsOrder[]): OrderGroup[] {
  const groups: OrderGroup[] = [];
  const seen = new Set<string>();
  for (const order of orders) {
    if (!order.groupId) {
      groups.push({ groupId: null, legs: [order] });
      continue;
    }
    if (seen.has(order.groupId)) continue;
    seen.add(order.groupId);
    groups.push({
      groupId: order.groupId,
      legs: orders.filter((o) => o.groupId === order.groupId),
    });
  }
  return groups;
}

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

const GRID_COLS = "minmax(180px,2fr) 80px 80px 80px 90px 110px minmax(120px,1.5fr)";

// ── Component ────────────────────────────────────────────────────────────────

export function OptionsOrdersTable({ orders, isLoading }: OptionsOrdersTableProps) {
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
  const groups = groupOrders(orders);

  // One leg of an mleg group renders as a normal row but with a "Leg N/M"
  // badge prefix on the contract cell so it's clear which leg of the trade
  // it is. Solo (single-leg) orders skip the badge.
  const renderRow = (
    order: OptionsOrder,
    legCtx?: { legNum: number; legTotal: number },
  ) => {
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
        style={{ gridTemplateColumns: GRID_COLS }}
      >
        {/* Contract */}
        <div className="text-left">
          <div className="flex items-center gap-1.5 font-mono text-slate-200">
            {legCtx && (
              <span className="rounded-sm bg-[var(--primary)]/15 px-1 py-px font-mono text-[9px] font-semibold uppercase text-[var(--primary)]">
                Leg {legCtx.legNum}/{legCtx.legTotal}
              </span>
            )}
            {order.underlying || "—"}
          </div>
          <div className="text-[10px] text-slate-500">
            ${Number(order.strike || 0).toLocaleString()} ·{" "}
            {order.expiry
              ? new Date(order.expiry).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : "—"}
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
      </div>
    );
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-[--color-border]">
      <div className="text-xs" style={{ minWidth: "800px" }}>
        {/* Header */}
        <div
          className="grid items-center gap-2 border-b border-[--color-border] bg-[--color-surface]/40 px-3 py-2.5 font-medium uppercase text-slate-400"
          style={{ gridTemplateColumns: GRID_COLS }}
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
        </div>

        {/* Rows — single-leg orders render directly; multi-leg groups render
            under a header strip with a left accent so their N legs read as
            one logical trade rather than N unrelated rows. */}
        {groups.map((g) => {
          if (g.legs.length === 1 && !g.groupId) {
            return <Fragment key={g.legs[0].orderId}>{renderRow(g.legs[0])}</Fragment>;
          }
          const lead = g.legs[0];
          return (
            <div
              key={g.groupId ?? lead.orderId}
              className="border-b border-[--color-border]/30 border-l-2 border-l-[var(--primary)]/40 bg-[var(--primary)]/[0.03]"
            >
              <div className="flex items-center justify-between px-3 pt-2 pb-1 text-[10px] font-medium uppercase tracking-wider">
                <span className="text-[var(--primary)]">
                  Multi-leg trade · {g.legs.length} legs
                </span>
                <span className="text-slate-500">
                  {lead.underlying} ·{" "}
                  {new Date(lead.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              {g.legs.map((leg, i) => (
                <Fragment key={leg.orderId}>
                  {renderRow(leg, { legNum: i + 1, legTotal: g.legs.length })}
                </Fragment>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
