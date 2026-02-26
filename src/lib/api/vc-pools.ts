import { apiRequest } from "./client";

export interface VcPoolSummary {
  pool_id: string;
  name: string;
  description: string | null;
  coin_type: string;
  contribution_amount: string;
  max_members: number;
  available_seats: number;
  duration_days: number;
  pool_fee_percent: string;
  payment_window_minutes: number;
  admin_binance_uid: string | null;
  created_at: string;
}

export interface VcPoolsListResponse {
  pools: VcPoolSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface VcPoolDetails extends VcPoolSummary {
  verified_members_count: number;
  reserved_seats_count: number;
  status: string;
  started_at: string | null;
  end_date: string | null;
}

export async function getAvailableVcPools(
  page = 1,
  limit = 20
): Promise<VcPoolsListResponse> {
  const search = new URLSearchParams();
  search.set("page", String(page));
  search.set("limit", String(limit));

  return apiRequest<never, VcPoolsListResponse>({
    path: `/api/vc-pools/available?${search.toString()}`,
    method: "GET",
    credentials: "include",
  });
}

export async function getVcPoolById(id: string): Promise<VcPoolDetails> {
  return apiRequest<never, VcPoolDetails>({
    path: `/api/vc-pools/${id}`,
    method: "GET",
    credentials: "include",
  });
}

