"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  getPaginatedStocks,
  GetPaginatedStocksParams,
  PaginatedStocksResponse,
} from "@/lib/api/stocks-market.service";

/**
 * Hook for fetching one page of stocks from the new paginated endpoint.
 * Uses React Query for automatic deduplication + 60s caching, so rapid
 * search keystrokes or page-change clicks don't fire multiple identical
 * requests.
 */
export function useStocksPaginated(
  params: GetPaginatedStocksParams,
  options: { enabled?: boolean } = {},
) {
  return useQuery<PaginatedStocksResponse>({
    queryKey: [
      "stocks-paginated",
      params.page ?? 1,
      params.limit ?? 50,
      params.index ?? null,
      params.search ?? "",
      params.sector ?? "",
    ],
    queryFn: () => getPaginatedStocks(params),
    enabled: options.enabled ?? true,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}
