export const paperTradingDummy = {
  positions: [
    { symbol: 'AAPL', quantity: 12, entryPrice: 173.5, currentPrice: 176.2, pnlPercent: 1.58, unrealizedPnl: 32.4 },
    { symbol: 'TSLA', quantity: 2, entryPrice: 196.0, currentPrice: 182.7, pnlPercent: -6.76, unrealizedPnl: -26.6 },
    { symbol: 'NVDA', quantity: 5, entryPrice: 480.0, currentPrice: 502.1, pnlPercent: 4.60, unrealizedPnl: 110.5 },
    { symbol: 'MSFT', quantity: 8, entryPrice: 300.0, currentPrice: 305.3, pnlPercent: 1.77, unrealizedPnl: 42.4 },
    { symbol: 'SOL', quantity: 50, entryPrice: 95.0, currentPrice: 94.3, pnlPercent: -0.74, unrealizedPnl: -35.0 },
    { symbol: 'DOT', quantity: 200, entryPrice: 4.5, currentPrice: 4.9, pnlPercent: 8.89, unrealizedPnl: 80.0 },
    { symbol: 'ADA', quantity: 1000, entryPrice: 0.33, currentPrice: 0.31, pnlPercent: -6.06, unrealizedPnl: -20.0 }
  ],
  leaderboard: [
    { user: 'TraderJoe', profit: 1245.5, winrate: 72, trades: 48 },
    { user: 'Alpha', profit: 980.1, winrate: 68, trades: 36 },
    { user: 'QuantivaPro', profit: 742.3, winrate: 63, trades: 29 },
    { user: 'HFT_Bot', profit: 601.0, winrate: 59, trades: 112 },
    { user: 'Novice', profit: 120.0, winrate: 50, trades: 12 }
  ],
  orders: [
    { id: 'ord_1', symbol: 'AAPL', side: 'buy', type: 'limit', quantity: 10, price: 172.5, status: 'OPEN', created_at: '2026-03-16T12:00:00Z' },
    { id: 'ord_2', symbol: 'TSLA', side: 'sell', type: 'market', quantity: 1, price: 183.0, status: 'NEW', created_at: '2026-03-16T13:00:00Z' }
  ]
};
