/**
 * Exchange API calls using admin JWT (admin settings → Connect / API keys).
 * Stores and shows connections from admin's perspective (linked user).
 */

import { adminAxios } from "./vcpool-admin/client";
import type {
  Exchange,
  CreateConnectionDto,
  Connection,
} from "./exchanges.service";

export const adminExchangesService = {
  async getExchanges(): Promise<Exchange[]> {
    const { data } = await adminAxios.get<Exchange[]>("/exchanges");
    return data;
  },

  async ensureExchange(
    name: string,
    type: "crypto" | "stocks"
  ): Promise<Exchange> {
    const exchanges = await this.getExchanges();
    const existing = exchanges.find((e) => e.name === name);
    if (existing) return existing;
    const { data } = await adminAxios.post<Exchange>("/exchanges", {
      name,
      type,
      supports_oauth: false,
    });
    return data;
  },

  async getConnections(): Promise<Connection[]> {
    try {
      const { data } = await adminAxios.get<{
        success?: boolean;
        data?: Connection[];
      }>("/exchanges/my-connections");
      const list = data?.data ?? (Array.isArray(data) ? data : []);
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  },

  async getActiveConnectionByType(type: "crypto" | "stocks"): Promise<{
    success: boolean;
    data: { connection_id: string; exchange: Exchange; status: string };
  } | null> {
    try {
      const { data } = await adminAxios.get<{
        success: boolean;
        data: { connection_id: string; exchange: Exchange; status: string };
      }>(`/exchanges/connections/active?type=${type}`);
      return data ?? null;
    } catch {
      return null;
    }
  },

  async createConnection(
    payload: CreateConnectionDto
  ): Promise<{ connection_id: string; status: string }> {
    const { data } = await adminAxios.post<{
      data?: { connection_id: string; status: string };
      connection_id?: string;
      status?: string;
    }>("/exchanges/connections", payload);
    if (data?.data) return data.data;
    return {
      connection_id: (data as { connection_id: string }).connection_id ?? "",
      status: (data as { status: string }).status ?? "active",
    };
  },

  async updateConnection(
    connectionId: string,
    body: {
      api_key: string;
      api_secret: string;
      password?: string;
      passphrase?: string;
    }
  ): Promise<unknown> {
    const { data } = await adminAxios.put(
      `/exchanges/connections/${connectionId}`,
      body
    );
    return data;
  },

  async deleteConnection(connectionId: string): Promise<void> {
    await adminAxios.delete(`/exchanges/connections/${connectionId}`);
  },
};
