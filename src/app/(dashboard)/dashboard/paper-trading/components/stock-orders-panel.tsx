"use client";

import { useState, useEffect } from "react";
import { alpacaPaperTradingService, type AlpacaOrder, type AlpacaPosition } from "@/lib/api/alpaca-paper-trading.service";
import { X, RefreshCw, TrendingUp, TrendingDown, AlertCircle, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface StockOrdersPanelProps {
  onClose: () => void;
  refreshTrigger?: number;
}

type TabType = "orders" | "positions" | "activities";
type OrderFilter = "all" | "open" | "filled" | "canceled";

export function StockOrdersPanel({ onClose, refreshTrigger }: StockOrdersPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("orders");
  const [orders, setOrders] = useState<AlpacaOrder[]>([]);
  const [positions, setPositions] = useState<AlpacaPosition[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderFilter, setOrderFilter] = useState<OrderFilter>("all");
  const [cancelingOrder, setCancelingOrder] = useState<string | null>(null);
  const [closingPosition, setClosingPosition] = useState<string | null>(null);

  // Fetch data on mount and refresh
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Refresh when trigger changes
  useEffect(() => {
    if (typeof refreshTrigger === "number" && refreshTrigger > 0) {
      fetchData();
    }
  }, [refreshTrigger]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [ordersData, positionsData, activitiesData] = await Promise.all([
        alpacaPaperTradingService.getOrders({ status: "all", limit: 100, direction: "desc" }),
        alpacaPaperTradingService.getPositions(),
        alpacaPaperTradingService.getActivities({ page_size: 50 }).catch(() => []), // Activities might fail
      ]);

      setOrders(ordersData || []);
      setPositions(positionsData || []);
      setActivities(activitiesData || []);
    } catch (err: any) {
      console.error("Failed to fetch Alpaca data:", err);
      setError(err?.message || "Failed to fetch data from Alpaca");
    } finally {
      setLoading(false);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    if (orderFilter === "all") return true;
    if (orderFilter === "open") return ["new", "accepted", "pending_new", "partially_filled"].includes(order.status.toLowerCase());
    if (orderFilter === "filled") return order.status.toLowerCase() === "filled";
    if (orderFilter === "canceled") return ["canceled", "expired", "rejected"].includes(order.status.toLowerCase());
    return true;
  });

  // Cancel order handler
  const handleCancelOrder = async (orderId: string) => {
    try {
      setCancelingOrder(orderId);
      await alpacaPaperTradingService.cancelOrder(orderId);
      // Refresh orders
      const ordersData = await alpacaPaperTradingService.getOrders({ status: "all", limit: 100, direction: "desc" });
      setOrders(ordersData || []);
    } catch (err: any) {
      console.error("Failed to cancel order:", err);
      setError(err?.message || "Failed to cancel order");
    } finally {
      setCancelingOrder(null);
    }
  };

  // Close position handler
  const handleClosePosition = async (symbol: string) => {
    try {
      setClosingPosition(symbol);
      await alpacaPaperTradingService.closePosition(symbol);
      // Refresh positions
      const [positionsData, ordersData] = await Promise.all([
        alpacaPaperTradingService.getPositions(),
        alpacaPaperTradingService.getOrders({ status: "all", limit: 100, direction: "desc" }),
      ]);
      setPositions(positionsData || []);
      setOrders(ordersData || []);
    } catch (err: any) {
      console.error("Failed to close position:", err);
      setError(err?.message || "Failed to close position");
    } finally {
      setClosingPosition(null);
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const statusLower = status.toLowerCase();
    let bgColor = "bg-slate-500/20 text-slate-400";
    let Icon = Clock;

    if (["new", "accepted", "pending_new"].includes(statusLower)) {
      bgColor = "bg-blue-500/20 text-blue-400";
      Icon = Clock;
    } else if (statusLower === "partially_filled") {
      bgColor = "bg-yellow-500/20 text-yellow-400";
      Icon = Loader2;
    } else if (statusLower === "filled") {
      bgColor = "bg-emerald-500/20 text-emerald-400";
      Icon = CheckCircle;
    } else if (["canceled", "expired", "rejected"].includes(statusLower)) {
      bgColor = "bg-red-500/20 text-red-400";
      Icon = XCircle;
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${bgColor}`}>
        <Icon className="w-3 h-3" />
        {status.toUpperCase()}
      </span>
    );
  };

  // Format helpers
  const formatPrice = (price: string | number | null) => {
    if (!price) return "—";
    const num = typeof price === "string" ? parseFloat(price) : price;
    return `$${num.toFixed(2)}`;
  };

  const formatQuantity = (qty: string | number) => {
    const num = typeof qty === "string" ? parseFloat(qty) : qty;
    return num.toFixed(num >= 1 ? 0 : 4);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString();
  };

  const formatPL = (pl: string | number) => {
    const num = typeof pl === "string" ? parseFloat(pl) : pl;
    const isPositive = num >= 0;
    return (
      <span className={isPositive ? "text-emerald-400" : "text-red-400"}>
        {isPositive ? "+" : ""}{formatPrice(num)}
      </span>
    );
  };

  const formatPLPercent = (plpc: string | number) => {
    const num = typeof plpc === "string" ? parseFloat(plpc) : plpc;
    const percent = num * 100;
    const isPositive = percent >= 0;
    return (
      <span className={isPositive ? "text-emerald-400" : "text-red-400"}>
        {isPositive ? "+" : ""}{percent.toFixed(2)}%
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-6xl max-h-[90vh] rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/50 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-xl">📈</span> Alpaca Paper Trading
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Real-time orders, positions & activities
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="rounded-lg bg-slate-700/50 hover:bg-slate-700 px-3 py-2 text-slate-300 hover:text-white transition-all flex items-center gap-2 text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={onClose}
              className="rounded-lg bg-slate-700/50 hover:bg-slate-700 p-2 text-slate-400 hover:text-white transition-all"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-700/50 px-6">
          {[
            { key: "orders", label: "Orders", count: orders.length },
            { key: "positions", label: "Positions", count: positions.length },
            { key: "activities", label: "Activities", count: activities.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              className={`px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
                activeTab === tab.key
                  ? "border-blue-500 text-white"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
              <span className="ml-2 text-xs opacity-70">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && !orders.length && !positions.length ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
                <p className="text-slate-400">Loading Alpaca data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <p className="text-red-400 mb-2">{error}</p>
                <button
                  onClick={fetchData}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Orders Tab */}
              {activeTab === "orders" && (
                <div>
                  {/* Order Filters */}
                  <div className="px-6 py-4 border-b border-slate-700/30 flex gap-2 flex-wrap">
                    {(["all", "open", "filled", "canceled"] as OrderFilter[]).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setOrderFilter(filter)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          orderFilter === filter
                            ? "bg-blue-500 text-white"
                            : "bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700"
                        }`}
                      >
                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        <span className="ml-1.5 opacity-70">
                          ({orders.filter((o) => {
                            if (filter === "all") return true;
                            if (filter === "open") return ["new", "accepted", "pending_new", "partially_filled"].includes(o.status.toLowerCase());
                            if (filter === "filled") return o.status.toLowerCase() === "filled";
                            if (filter === "canceled") return ["canceled", "expired", "rejected"].includes(o.status.toLowerCase());
                            return true;
                          }).length})
                        </span>
                      </button>
                    ))}
                  </div>

                  {filteredOrders.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-slate-400">
                      No {orderFilter === "all" ? "" : orderFilter} orders found
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-700/30 bg-slate-800/30">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Symbol</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Side</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Qty</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Price</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Filled</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Time</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredOrders.map((order) => (
                            <tr key={order.id} className="border-b border-slate-700/20 hover:bg-slate-800/30 transition-colors">
                              <td className="px-4 py-3 text-sm font-medium text-white">{order.symbol}</td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`font-semibold ${order.side.toLowerCase() === "buy" ? "text-emerald-400" : "text-red-400"}`}>
                                  {order.side.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-300">{order.type || order.order_type}</td>
                              <td className="px-4 py-3 text-sm text-slate-300">{formatQuantity(order.qty)}</td>
                              <td className="px-4 py-3 text-sm text-slate-300">
                                {order.filled_avg_price ? formatPrice(order.filled_avg_price) : (order.limit_price ? formatPrice(order.limit_price) : "Market")}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-300">
                                {formatQuantity(order.filled_qty)} / {formatQuantity(order.qty)}
                              </td>
                              <td className="px-4 py-3">
                                <StatusBadge status={order.status} />
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-400">{formatDate(order.created_at)}</td>
                              <td className="px-4 py-3">
                                {["new", "accepted", "pending_new", "partially_filled"].includes(order.status.toLowerCase()) && (
                                  <button
                                    onClick={() => handleCancelOrder(order.id)}
                                    disabled={cancelingOrder === order.id}
                                    className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30 transition-all disabled:opacity-50"
                                  >
                                    {cancelingOrder === order.id ? "..." : "Cancel"}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Positions Tab */}
              {activeTab === "positions" && (
                <div>
                  {positions.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-slate-400">
                      No open positions
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-700/30 bg-slate-800/30">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Symbol</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Shares</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Avg Entry</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Current</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Market Value</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">P/L</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">P/L %</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Today</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {positions.map((position) => {
                            const unrealizedPL = parseFloat(position.unrealized_pl);
                            const isProfit = unrealizedPL >= 0;
                            
                            return (
                              <tr key={position.asset_id} className="border-b border-slate-700/20 hover:bg-slate-800/30 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    {isProfit ? (
                                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                                    ) : (
                                      <TrendingDown className="w-4 h-4 text-red-400" />
                                    )}
                                    <span className="font-medium text-white">{position.symbol}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-300">
                                  {formatQuantity(position.qty)}
                                  <span className="text-xs text-slate-500 ml-1">({position.side})</span>
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-300">{formatPrice(position.avg_entry_price)}</td>
                                <td className="px-4 py-3 text-sm text-white font-medium">{formatPrice(position.current_price)}</td>
                                <td className="px-4 py-3 text-sm text-slate-300">{formatPrice(position.market_value)}</td>
                                <td className="px-4 py-3 text-sm">{formatPL(position.unrealized_pl)}</td>
                                <td className="px-4 py-3 text-sm">{formatPLPercent(position.unrealized_plpc)}</td>
                                <td className="px-4 py-3 text-sm">{formatPLPercent(position.change_today)}</td>
                                <td className="px-4 py-3">
                                  <button
                                    onClick={() => handleClosePosition(position.symbol)}
                                    disabled={closingPosition === position.symbol}
                                    className="px-2 py-1 rounded bg-slate-600/50 text-slate-300 text-xs hover:bg-slate-600 transition-all disabled:opacity-50"
                                  >
                                    {closingPosition === position.symbol ? "..." : "Close"}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Positions Summary */}
                  {positions.length > 0 && (
                    <div className="px-6 py-4 border-t border-slate-700/30 bg-slate-800/30">
                      <div className="flex gap-6 flex-wrap text-sm">
                        <div>
                          <span className="text-slate-400">Total Market Value:</span>
                          <span className="ml-2 font-semibold text-white">
                            {formatPrice(positions.reduce((sum, p) => sum + parseFloat(p.market_value), 0))}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Total P/L:</span>
                          <span className="ml-2 font-semibold">
                            {formatPL(positions.reduce((sum, p) => sum + parseFloat(p.unrealized_pl), 0))}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Today's P/L:</span>
                          <span className="ml-2 font-semibold">
                            {formatPL(positions.reduce((sum, p) => sum + parseFloat(p.unrealized_intraday_pl), 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Activities Tab */}
              {activeTab === "activities" && (
                <div>
                  {activities.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-slate-400">
                      No recent activities
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-700/30">
                      {activities.map((activity, idx) => (
                        <div key={idx} className="px-6 py-4 hover:bg-slate-800/30 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${
                                activity.activity_type === "FILL" ? "bg-emerald-500" :
                                activity.activity_type === "DIV" ? "bg-blue-500" :
                                "bg-slate-500"
                              }`} />
                              <div>
                                <p className="text-sm font-medium text-white">
                                  {activity.activity_type}
                                  {activity.symbol && <span className="ml-2 text-slate-400">{activity.symbol}</span>}
                                </p>
                                {activity.side && (
                                  <p className="text-xs text-slate-400">
                                    {activity.side} {activity.qty} @ {formatPrice(activity.price)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              {activity.net_amount && (
                                <p className="text-sm font-medium">
                                  {formatPL(activity.net_amount)}
                                </p>
                              )}
                              <p className="text-xs text-slate-500">
                                {formatDate(activity.transaction_time || activity.date)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Stats */}
        <div className="border-t border-slate-700/50 bg-slate-800/30 px-6 py-4">
          <div className="flex gap-6 flex-wrap text-sm">
            <div>
              <p className="text-xs text-slate-500">Total Orders</p>
              <p className="text-lg font-bold text-white">{orders.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Open Orders</p>
              <p className="text-lg font-bold text-blue-400">
                {orders.filter((o) => ["new", "accepted", "pending_new", "partially_filled"].includes(o.status.toLowerCase())).length}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Filled Orders</p>
              <p className="text-lg font-bold text-emerald-400">
                {orders.filter((o) => o.status.toLowerCase() === "filled").length}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Open Positions</p>
              <p className="text-lg font-bold text-purple-400">{positions.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

