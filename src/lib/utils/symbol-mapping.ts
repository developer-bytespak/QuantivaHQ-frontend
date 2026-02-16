/**
 * Utility functions for mapping CoinGecko symbols to exchange trading pairs
 * 
 * NOTE: Dynamic filtering is now handled in the market page using CoinGecko's 
 * Binance exchange endpoint. This file now focuses on basic symbol transformations.
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
  const upperSymbol = symbol.toUpperCase();
  return `${upperSymbol}${quoteCurrency}`;
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
  return mapSymbolToTradingPair(symbol);
}

/**
 * Validates if a trading pair is valid
 * Note: Actual validation against exchange's available pairs is done in market page
 * using CoinGecko's Binance exchange endpoint
 * @param symbol - Base symbol
 * @param quoteCurrency - Quote currency (default: "USDT")
 * @returns True if basic format is valid
 */
export function isValidTradingPair(symbol: string, quoteCurrency: string = "USDT"): boolean {
  // Basic validation: symbol should not be empty
  return !!(symbol && symbol.trim().length > 0);
}

/**
 * Utility function to check symbol validity
 * Returns minimal information - actual exchange validation is handled at market page level
 */
export function getSymbolIssue(symbol: string): {
  isValid: boolean;
  issue?: string;
  suggestion?: string;
} {
  const upperSymbol = symbol.toUpperCase();
  
  if (!upperSymbol || upperSymbol.trim().length === 0) {
    return {
      isValid: false,
      issue: 'empty_symbol',
      suggestion: 'Symbol cannot be empty'
    };
  }
  
  return {
    isValid: true
  };
}

