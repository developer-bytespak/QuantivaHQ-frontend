"use client";

import { useQuery } from "@tanstack/react-query";
import { getStockIndexes, StockIndex } from "@/lib/api/stocks-market.service";

/**
 * Hook for fetching the indexes dropdown options.
 * Backend feature-flag-gates this: non-Option-B users see only S&P 500.
 */
export function useStockIndexes(options: { enabled?: boolean } = {}) {
  return useQuery<StockIndex[]>({
    queryKey: ["stock-indexes"],
    queryFn: getStockIndexes,
    enabled: options.enabled ?? true,
    staleTime: 5 * 60_000,
  });
}
