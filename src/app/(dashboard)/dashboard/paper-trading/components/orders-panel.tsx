"use client";

import { useState, useEffect } from "react";
import { binanceTestnetService } from "@/lib/api/binance-testnet.service";
import { X } from "lucide-react";

interface Order {
  orderId: number;
  symbol: string;
  side: "BUY" | "SELL";
  type: "LIMIT" | "MARKET";
  quantity: number;
  price: number;
  status: "NEW" | "PARTIALLY_FILLED" | "FILLED" | "CANCELED" | "REJECTED" | "EXPIRED";
  executedQuantity: number;
  cumulativeQuoteAssetTransacted?: number | null;
  timestamp?: number;
  updateTime?: number;
}

interface OrdersPanelProps {
  onClose: () => void;
  refreshTrigger?: number;
}

export function OrdersPanel({ onClose, refreshTrigger }: OrdersPanelProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "filled" | "canceled">("all");

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 60000); // Refresh every 1 minute
    return () => clearInterval(interval);
  }, []);

  // Instant refresh when refreshTrigger changes
  useEffect(() => {
    if (typeof refreshTrigger === "number") {
      fetchOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Backend now aggregates all symbols - single API call returns orders across all trading pairs
      const allOrders = await binanceTestnetService.getAllOrders(undefined, 100);
      
      // Sort by most recent first
      const sortedOrders = (allOrders || []).sort(
        (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
      );

      setOrders(sortedOrders);
    } catch (err: any) {
      console.error("Failed to fetch orders:", err);
      setError(err?.message || "Failed to fetch orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter orders based on status
  const filteredOrders = orders.filter((order) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "open") return order.status === "NEW" || order.status === "PARTIALLY_FILLED";
    if (filterStatus === "filled") return order.status === "FILLED";
    if (filterStatus === "canceled") return order.status === "CANCELED";
    return true;
  });

  // Sort by most recent first
  const sortedOrders = [...filteredOrders].sort(
    (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NEW":
      case "PARTIALLY_FILLED":
        return "text-blue-400 bg-blue-400/10";
      case "FILLED":
        return "text-green-400 bg-green-400/10";
      case "CANCELED":
        return "text-red-400 bg-red-400/10";
      case "REJECTED":
        return "text-red-500 bg-red-500/10";
      case "EXPIRED":
        return "text-yellow-400 bg-yellow-400/10";
      default:
        return "text-slate-400 bg-slate-400/10";
    }
  };

  const getSideColor = (side: string) => {
    return side === "BUY" ? "text-green-400" : "text-red-400";
  };

  const formatPrice = (price: number | null | undefined) => {
    if (!price) return "—";
    return Number(price).toFixed(2);
  };

  const formatQuantity = (qty: number) => {
    return Number(qty).toFixed(4);
  };

  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp) return "—";
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-6xl max-h-[90vh] rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.12] backdrop-blur-xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] p-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Order History</h2>
            <p className="text-sm text-slate-400 mt-1">
              View all your Binance testnet orders
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-white/5 hover:bg-white/10 p-2 text-slate-400 hover:text-white transition-all"
            title="Close panel"
          >
            <X size={24} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="border-b border-white/[0.08] px-6 py-4">
          <div className="flex gap-2 flex-wrap">
            {(
              [
                { key: "all", label: "All Orders" },
                { key: "open", label: "Open" },
                { key: "filled", label: "Filled" },
                { key: "canceled", label: "Canceled" },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilterStatus(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterStatus === key
                    ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/30"
                    : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {label}
                {key !== "all" && (
                  <span className="ml-2 text-xs opacity-70">
                    ({filteredOrders.filter(
                      (o) =>
                        (key === "open" && (o.status === "NEW" || o.status === "PARTIALLY_FILLED")) ||
                        (key === "filled" && o.status === "FILLED") ||
                        (key === "canceled" && o.status === "CANCELED")
                    ).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-slate-400">Loading orders...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-red-400 mb-2">⚠️ {error}</p>
                <button
                  onClick={fetchOrders}
                  className="mt-4 px-4 py-2 rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white text-sm font-medium hover:shadow-lg hover:shadow-[#fc4f02]/30 transition-all"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : sortedOrders.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-slate-400">
                {filterStatus === "all"
                  ? "No orders found"
                  : `No ${filterStatus} orders found`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300">
                      Symbol
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300">
                      Side
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300">
                      Quantity
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300">
                      Price
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300">
                      Executed
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300">
                      Time
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300">
                      Order ID
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedOrders.map((order, idx) => (
                    <tr
                      key={`${order.orderId}-${idx}`}
                      className="border-b border-white/[0.04] hover:bg-white/[0.04] transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-white">
                        {order.symbol}
                      </td>
                      <td className={`px-6 py-4 text-sm font-semibold ${getSideColor(order.side)}`}>
                        {order.side}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {order.type}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {formatQuantity(order.quantity)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        ${formatPrice(order.price)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {formatQuantity(order.executedQuantity)} / {formatQuantity(order.quantity)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {formatDate(order.timestamp)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        #{order.orderId}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        {sortedOrders.length > 0 && (
          <div className="border-t border-white/[0.08] bg-white/[0.02] px-6 py-4 flex gap-6 flex-wrap">
            <div>
              <p className="text-xs text-slate-400">Total Orders</p>
              <p className="text-lg font-bold text-white">{orders.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Open Orders</p>
              <p className="text-lg font-bold text-blue-400">
                {orders.filter((o) => o.status === "NEW" || o.status === "PARTIALLY_FILLED").length}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Filled Orders</p>
              <p className="text-lg font-bold text-green-400">
                {orders.filter((o) => o.status === "FILLED").length}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Canceled Orders</p>
              <p className="text-lg font-bold text-red-400">
                {orders.filter((o) => o.status === "CANCELED").length}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
