/**
 * Stocks Market API Service (Option B).
 *
 * Wraps the new paginated endpoints introduced for the expanded stock universe.
 * The old /api/stocks-market/stocks endpoint is still in use by other surfaces
 * (e.g. dashboard preview) — this file does NOT replace it, it adds new endpoints.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface MarketStock {
  rank: number;
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  marketCap: number | null;
  volume24h: number;
  dataSource?: string;
}

export interface PaginatedStocksResponse {
  items: MarketStock[];
  total: number;
  page: number;
  limit: number;
  timestamp: string;
}

export interface StockIndex {
  code: string;
  display_name: string;
  provider: string;
  is_derived: boolean;
  stock_count: number;
}

export interface GetPaginatedStocksParams {
  page?: number;
  limit?: number;
  index?: string | null;
  search?: string;
  sector?: string;
}

/**
 * GET /api/stocks-market/stocks-paginated
 * Returns a single page of stocks. Backend enforces Option B feature flag,
 * so non-flagged users always receive S&P 500 regardless of the `index` param.
 */
export async function getPaginatedStocks(
  params: GetPaginatedStocksParams = {},
): Promise<PaginatedStocksResponse> {
  const { page = 1, limit = 50, index, search, sector } = params;
  const query = new URLSearchParams();
  query.append("page", String(page));
  query.append("limit", String(limit));
  if (index) query.append("index", index);
  if (search) query.append("search", search);
  if (sector) query.append("sector", sector);

  const url = `${API_BASE_URL}/api/stocks-market/stocks-paginated?${query.toString()}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    throw new Error(`Failed to fetch paginated stocks: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * GET /api/stocks-market/indexes
 * Returns the list of indexes the current user is allowed to see.
 * Non-flagged users get only S&P 500. Flagged users get all 8.
 */
export async function getStockIndexes(): Promise<StockIndex[]> {
  const url = `${API_BASE_URL}/api/stocks-market/indexes`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    throw new Error(`Failed to fetch indexes: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
