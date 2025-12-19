/**
 * Utility functions for paper trading operations
 */

/**
 * Map asset symbol to Binance testnet trading pair
 */
export function mapToTestnetSymbol(assetSymbol: string): string {
  if (!assetSymbol) return '';
  
  // Remove all spaces and slashes first
  let cleanSymbol = assetSymbol.replace(/\s+/g, '').replace(/\//g, '').toUpperCase();
  
  // If already ends with USDT, return as-is
  if (cleanSymbol.endsWith('USDT')) return cleanSymbol;
  
  // Remove USDT if it appears anywhere and re-add at the end
  cleanSymbol = cleanSymbol.replace(/USDT/g, '');
  
  // Add USDT suffix
  return `${cleanSymbol}USDT`;
}

/**
 * Calculate position size based on balance and risk percentage
 */
export function calculatePositionSize(
  balance: number,
  riskPercent: number,
  currentPrice: number
): { quantity: number; totalCost: number; units: string } {
  const investmentAmount = (balance * riskPercent) / 100;
  const rawQuantity = investmentAmount / currentPrice;
  
  // Round to 8 decimal places (Binance standard)
  // But also ensure we don't have trailing zeros
  const quantity = Math.floor(rawQuantity * 100000000) / 100000000;
  
  return {
    quantity,
    totalCost: investmentAmount,
    units: quantity.toFixed(8).replace(/\.?0+$/, '') // Remove trailing zeros
  };
}

/**
 * Calculate stop loss and take profit prices
 */
export function calculatePrices(
  entryPrice: number,
  stopLossPercent: number,
  takeProfitPercent: number,
  side: 'BUY' | 'SELL'
): {
  stopLossPrice: number;
  takeProfitPrice: number;
  maxLoss: number;
  potentialGain: number;
} {
  let stopLossPrice: number;
  let takeProfitPrice: number;
  
  if (side === 'BUY') {
    stopLossPrice = entryPrice * (1 - Math.abs(stopLossPercent) / 100);
    takeProfitPrice = entryPrice * (1 + Math.abs(takeProfitPercent) / 100);
  } else {
    stopLossPrice = entryPrice * (1 + Math.abs(stopLossPercent) / 100);
    takeProfitPrice = entryPrice * (1 - Math.abs(takeProfitPercent) / 100);
  }
  
  const maxLoss = Math.abs(entryPrice - stopLossPrice);
  const potentialGain = Math.abs(takeProfitPrice - entryPrice);
  
  return {
    stopLossPrice: parseFloat(stopLossPrice.toFixed(2)),
    takeProfitPrice: parseFloat(takeProfitPrice.toFixed(2)),
    maxLoss: parseFloat(maxLoss.toFixed(2)),
    potentialGain: parseFloat(potentialGain.toFixed(2))
  };
}

/**
 * Format currency value
 */
export function formatCurrency(value: any): string {
  if (value === null || value === undefined || value === '—' || value === '') return '—';
  const n = Number(String(value));
  if (isNaN(n)) return String(value);
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2
  }).format(n);
}

/**
 * Format number in compact notation
 */
export function formatNumberCompact(value: any): string {
  if (value === null || value === undefined || value === '—' || value === '') return '—';
  const n = Number(String(value));
  if (isNaN(n)) return String(value);
  return new Intl.NumberFormat(undefined, {
    notation: 'compact',
    maximumFractionDigits: 2
  }).format(n);
}

/**
 * Format percentage
 */
export function formatPercent(value: any): string {
  if (value === null || value === undefined || value === '—' || value === '') return '—';
  const s = String(value).trim();
  if (s.endsWith('%')) return s;
  const n = Number(s);
  if (isNaN(n)) return s;
  return `${n.toFixed(2)}%`;
}

/**
 * Parse percentage string to number
 */
export function parsePercent(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace('%', '').trim();
  return parseFloat(cleaned) || 0;
}

/**
 * Extract entry price from signal data
 */
export function getEntryPrice(signal: any): number {
  const realtimePrice = signal.realtime_data?.price;
  const price = realtimePrice ?? signal.price ?? signal.last_price ?? signal.entryPrice ?? 0;
  return Number(price);
}

/**
 * Calculate risk/reward ratio
 */
export function calculateRiskRewardRatio(maxLoss: number, potentialGain: number): string {
  if (maxLoss === 0) return '—';
  const ratio = potentialGain / maxLoss;
  return `1:${ratio.toFixed(2)}`;
}
