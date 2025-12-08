/**
 * Utility functions for mapping CoinGecko symbols to exchange trading pairs
 */

/**
 * Maps a CoinGecko symbol to an exchange trading pair
 * @param symbol - CoinGecko symbol (e.g., "BTC", "ETH")
 * @param quoteCurrency - Quote currency (default: "USDT")
 * @returns Trading pair symbol (e.g., "BTCUSDT")
 */
export function mapSymbolToTradingPair(
  symbol: string,
  quoteCurrency: string = "USDT"
): string {
  return `${symbol.toUpperCase()}${quoteCurrency}`;
}

/**
 * Extracts base symbol from a trading pair
 * @param tradingPair - Trading pair (e.g., "BTCUSDT")
 * @param quoteCurrency - Quote currency (default: "USDT")
 * @returns Base symbol (e.g., "BTC")
 */
export function extractBaseSymbol(
  tradingPair: string,
  quoteCurrency: string = "USDT"
): string {
  if (tradingPair.endsWith(quoteCurrency)) {
    return tradingPair.slice(0, -quoteCurrency.length);
  }
  return tradingPair;
}

/**
 * Handles exchange-specific symbol mapping if needed
 * @param symbol - CoinGecko symbol
 * @param exchange - Exchange name ("binance" | "bybit")
 * @returns Trading pair symbol
 */
export function getExchangeTradingPair(
  symbol: string,
  exchange: "binance" | "bybit" = "binance"
): string {
  // Both Binance and Bybit use the same format: SYMBOLUSDT
  // Add any exchange-specific logic here if needed in the future
  return mapSymbolToTradingPair(symbol);
}

