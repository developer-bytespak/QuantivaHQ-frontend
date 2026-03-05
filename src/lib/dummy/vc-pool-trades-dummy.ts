/**
 * Dummy trade data for VC Pool: active trades, history, investment by coin, total P/L.
 * Use until real trade APIs are connected.
 */

export type TradeStatus = "open" | "closed";

export interface VcPoolTradeDummy {
  trade_id: string;
  pair: string;           // e.g. "BTC/USDT"
  side: "buy" | "sell";
  amount_quote: number;   // in USDT or pool coin
  amount_base: number;   // base asset amount
  coin: string;          // quote currency (USDT, BUSD, etc.)
  entry_price: number;
  exit_price?: number;   // only when closed
  current_price?: number; // for open trades
  pnl: number;           // profit/loss in quote currency
  pnl_percent: number;
  opened_at: string;     // ISO
  closed_at?: string;
  status: TradeStatus;
  strategy_name?: string;
}

export interface InvestmentByCoin {
  coin: string;
  total_invested: number;
  total_current_value: number;
  pnl: number;
  pnl_percent: number;
}

export interface PoolTradesSummary {
  active_trades: VcPoolTradeDummy[];
  history_trades: VcPoolTradeDummy[];
  investment_by_coin: InvestmentByCoin[];
  total_invested: number;
  total_current_value: number;
  total_pnl: number;
  total_pnl_percent: number;
}

const DUMMY_ACTIVE: Omit<VcPoolTradeDummy, "trade_id" | "opened_at" | "coin">[] = [
  { pair: "BTC/USDT", side: "buy", amount_quote: 5000, amount_base: 0.072, entry_price: 69444, current_price: 71200, pnl: 125.28, pnl_percent: 2.53, status: "open", strategy_name: "Trend Following" },
  { pair: "ETH/USDT", side: "buy", amount_quote: 3000, amount_base: 0.94, entry_price: 3191, current_price: 3340, pnl: 140.1, pnl_percent: 4.67, status: "open", strategy_name: "Trend Following" },
  { pair: "SOL/USDT", side: "buy", amount_quote: 1500, amount_base: 7.2, entry_price: 208.3, current_price: 218, pnl: 69.84, pnl_percent: 4.66, status: "open", strategy_name: "Momentum" },
];

const DUMMY_HISTORY: Omit<VcPoolTradeDummy, "trade_id" | "opened_at" | "closed_at" | "coin">[] = [
  { pair: "BTC/USDT", side: "sell", amount_quote: 4500, amount_base: 0.065, entry_price: 69230, exit_price: 69230, pnl: 112.5, pnl_percent: 2.5, status: "closed", strategy_name: "Trend Following" },
  { pair: "ETH/USDT", side: "buy", amount_quote: 2500, amount_base: 0.78, entry_price: 3205, exit_price: 3280, pnl: 58.5, pnl_percent: 2.34, status: "closed", strategy_name: "DCA" },
  { pair: "SOL/USDT", side: "sell", amount_quote: 1200, amount_base: 5.8, entry_price: 206.9, exit_price: 202, pnl: -28.42, pnl_percent: -2.37, status: "closed", strategy_name: "Scalping" },
  { pair: "BNB/USDT", side: "buy", amount_quote: 2000, amount_base: 3.2, entry_price: 625, exit_price: 638, pnl: 41.6, pnl_percent: 2.08, status: "closed", strategy_name: "DCA" },
  { pair: "XRP/USDT", side: "sell", amount_quote: 800, amount_base: 1400, entry_price: 0.571, exit_price: 0.565, pnl: -8.4, pnl_percent: -1.05, status: "closed", strategy_name: "Scalping" },
];

function seedFromPoolId(poolId: string): number {
  return poolId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
}

function buildActiveTrades(poolId: string, coin: string): VcPoolTradeDummy[] {
  const seed = seedFromPoolId(poolId);
  const now = new Date();
  return DUMMY_ACTIVE.map((t, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (3 - i) * 2);
    return {
      ...t,
      trade_id: `active-${poolId}-${i}-${seed}`,
      coin,
      opened_at: d.toISOString(),
    } as VcPoolTradeDummy;
  });
}

function buildHistoryTrades(poolId: string, coin: string): VcPoolTradeDummy[] {
  const seed = seedFromPoolId(poolId);
  return DUMMY_HISTORY.map((t, i) => {
    const closed = new Date();
    closed.setDate(closed.getDate() - (10 + i * 3));
    const opened = new Date(closed);
    opened.setDate(opened.getDate() - 5);
    return {
      ...t,
      trade_id: `hist-${poolId}-${i}-${seed}`,
      coin,
      opened_at: opened.toISOString(),
      closed_at: closed.toISOString(),
    } as VcPoolTradeDummy;
  });
}

/** Get full dummy trades summary for a pool (active + history + by-coin summary). */
export function getDummyPoolTradesSummary(poolId: string, poolCoin: string = "USDT"): PoolTradesSummary {
  const active = buildActiveTrades(poolId, poolCoin);
  const history = buildHistoryTrades(poolId, poolCoin);

  const totalInvestedActive = active.reduce((s, t) => s + t.amount_quote, 0);
  const totalValueActive = active.reduce((s, t) => s + (t.amount_quote + (t.pnl || 0)), 0);
  const pnlActive = active.reduce((s, t) => s + t.pnl, 0);
  const pnlHistory = history.reduce((s, t) => s + t.pnl, 0);
  const totalPnl = pnlActive + pnlHistory;
  const totalInvested = totalInvestedActive + history.reduce((s, t) => s + t.amount_quote, 0);
  const totalCurrentValue = totalValueActive + history.reduce((s, t) => s + t.amount_quote + t.pnl, 0);

  const investmentByCoin: InvestmentByCoin[] = [
    {
      coin: poolCoin,
      total_invested: totalInvested,
      total_current_value: totalCurrentValue,
      pnl: totalPnl,
      pnl_percent: totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0,
    },
  ];

  return {
    active_trades: active,
    history_trades: history,
    investment_by_coin: investmentByCoin,
    total_invested: totalInvested,
    total_current_value: totalCurrentValue,
    total_pnl: totalPnl,
    total_pnl_percent: totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0,
  };
}
