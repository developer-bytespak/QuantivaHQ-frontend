"use client";

import { useState, useEffect } from "react";
import { binanceTestnetService } from "@/lib/api/binance-testnet.service";
import { X, Loader2 } from "lucide-react";

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
  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "filled" | "canceled" | "positions">("positions");
  const [closingPosition, setClosingPosition] = useState<string | null>(null);
  const [closeError, setCloseError] = useState<string | null>(null);

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

  // Close position handler - sells the full position at market price
  const handleClosePosition = async (symbol: string, quantity: number) => {
    try {
      setClosingPosition(symbol);
      setCloseError(null);

      // Place a MARKET SELL order to close the position
      await binanceTestnetService.placeOrder({
        symbol,
        side: "SELL",
        type: "MARKET",
        quantity,
      });

      // Refresh orders after closing
      await fetchOrders();
    } catch (err: any) {
      console.error("Failed to close position:", err);
      setCloseError(err?.message || "Failed to close position");
    } finally {
      setClosingPosition(null);
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

  // Calculate open positions (filled BUYs without matching SELLs)
  const calculateOpenPositions = () => {
    const positions = new Map<string, { quantity: number; avgPrice: number; totalCost: number }>();
    
    // Sort orders by timestamp
    const sortedByTime = [...orders].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    
    for (const order of sortedByTime) {
      if (order.status !== 'FILLED') continue;
      
      const symbol = order.symbol;
      const qty = order.executedQuantity || order.quantity;
      const price = order.price || 0;
      
      if (!positions.has(symbol)) {
        positions.set(symbol, { quantity: 0, avgPrice: 0, totalCost: 0 });
      }
      
      const pos = positions.get(symbol)!;
      
      if (order.side === 'BUY') {
        const newTotalCost = pos.totalCost + (qty * price);
        const newQuantity = pos.quantity + qty;
        pos.avgPrice = newQuantity > 0 ? newTotalCost / newQuantity : 0;
        pos.quantity = newQuantity;
        pos.totalCost = newTotalCost;
      } else {
        // SELL reduces position
        pos.quantity -= qty;
        if (pos.quantity <= 0) {
          pos.quantity = 0;
          pos.totalCost = 0;
          pos.avgPrice = 0;
        } else {
          pos.totalCost = pos.quantity * pos.avgPrice;
        }
      }
    }
    
    // Return only positions with quantity > 0
    return Array.from(positions.entries())
      .filter(([_, pos]) => pos.quantity > 0)
      .map(([symbol, pos]) => ({ symbol, ...pos }));
  };

  const openPositions = calculateOpenPositions();

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
                { key: "positions", label: "Positions" },
                { key: "all", label: "All Orders" },
                { key: "open", label: "Pending" },
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
                <span className="ml-2 text-xs opacity-70">
                  ({key === "all" ? orders.length :
                    key === "positions" ? openPositions.length :
                    orders.filter(
                      (o) =>
                        (key === "open" && (o.status === "NEW" || o.status === "PARTIALLY_FILLED")) ||
                        (key === "filled" && o.status === "FILLED") ||
                        (key === "canceled" && o.status === "CANCELED")
                    ).length})
                </span>
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
          ) : sortedOrders.length === 0 && filterStatus !== "positions" ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-slate-400">
                {filterStatus === "all"
                  ? "No orders found"
                  : `No ${filterStatus} orders found`}
              </p>
            </div>
          ) : filterStatus === "positions" ? (
            // Show Open Positions view
            openPositions.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-slate-400">No open positions</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {closeError && (
                  <div className="mx-6 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-400">⚠️ {closeError}</p>
                  </div>
                )}
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300">
                        Symbol
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300">
                        Quantity
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300">
                        Avg Entry Price
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300">
                        Total Cost
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {openPositions.map((pos, idx) => (
                      <tr
                        key={`${pos.symbol}-${idx}`}
                        className="border-b border-white/[0.04] hover:bg-white/[0.04] transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-white">
                          {pos.symbol}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">
                          {pos.quantity.toFixed(4)}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">
                          ${pos.avgPrice.toFixed(4)}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">
                          ${pos.totalCost.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="px-2 py-1 rounded-md text-xs font-semibold text-orange-400 bg-orange-400/10">
                            HOLDING
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => handleClosePosition(pos.symbol, pos.quantity)}
                            disabled={closingPosition === pos.symbol}
                            className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                          >
                            {closingPosition === pos.symbol ? (
                              <>
                                <Loader2 size={12} className="animate-spin" />
                                Closing...
                              </>
                            ) : (
                              "Close Position"
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
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
        {(orders.length > 0 || openPositions.length > 0) && (
          <div className="border-t border-white/[0.08] bg-white/[0.02] px-6 py-4 flex gap-6 flex-wrap">
            <div className="border-r border-white/10 pr-6">
              <p className="text-xs text-slate-400">Open Positions</p>
              <p className="text-lg font-bold text-orange-400">
                {openPositions.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Total Orders</p>
              <p className="text-lg font-bold text-white">{orders.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Pending</p>
              <p className="text-lg font-bold text-blue-400">
                {orders.filter((o) => o.status === "NEW" || o.status === "PARTIALLY_FILLED").length}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Filled</p>
              <p className="text-lg font-bold text-green-400">
                {orders.filter((o) => o.status === "FILLED").length}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Canceled</p>
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
