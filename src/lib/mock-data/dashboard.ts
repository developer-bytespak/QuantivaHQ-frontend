import type { Position } from "@/state/trading-store";

export const mockPositions: Position[] = [
  {
    id: "pos-eth-usdt",
    symbol: "ETH/USDT",
    side: "long",
    entryPrice: 2885.32,
    currentPrice: 2952.11,
    pnl: 680.24,
    leverage: 3,
  },
  {
    id: "pos-nvda",
    symbol: "NVDA",
    side: "long",
    entryPrice: 857.22,
    currentPrice: 884.51,
    pnl: 540.12,
    leverage: 1,
  },
  {
    id: "pos-btc-usdt",
    symbol: "BTC/USDT",
    side: "short",
    entryPrice: 67123.0,
    currentPrice: 66210.4,
    pnl: 720.58,
    leverage: 2,
  },
];

export const mockSignals = [
  {
    id: "sig-eth-5m",
    symbol: "ETH/USDT",
    confidence: 0.84,
    timeframe: "5m",
    direction: "long" as const,
  },
  {
    id: "sig-tsla-1h",
    symbol: "TSLA",
    confidence: 0.72,
    timeframe: "1h",
    direction: "short" as const,
  },
  {
    id: "sig-sol-15m",
    symbol: "SOL/USDT",
    confidence: 0.67,
    timeframe: "15m",
    direction: "long" as const,
  },
];
