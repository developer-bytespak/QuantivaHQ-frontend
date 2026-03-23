"use client";

import { createContext, useContext } from "react";

/**
 * When set, the Top Trade UI is in "admin VC Pool" mode:
 * trade execution sends { vcPoolId, tradeData } via adminCreateTrade(poolId, body)
 * instead of user placeOrder.
 */
export const TopTradeVcPoolContext = createContext<string | null>(null);

export function useTopTradeVcPoolId(): string | null {
  return useContext(TopTradeVcPoolContext);
}
