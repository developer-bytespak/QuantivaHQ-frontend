"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { exchangesService, Connection } from "@/lib/api/exchanges.service";

interface ExchangeContextType {
  connectionType: "crypto" | "stocks" | null;
  connectionId: string | null;
  activeConnection: Connection | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const ExchangeContext = createContext<ExchangeContextType | undefined>(undefined);

export function ExchangeProvider({ children }: { children: ReactNode }) {
  const [connectionType, setConnectionType] = useState<"crypto" | "stocks" | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [activeConnection, setActiveConnection] = useState<Connection | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConnectionInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log("🔄 Fetching active connection...");
      const response = await exchangesService.getActiveConnection();
      const connection = response.data as Connection;
      
      setConnectionId(connection.connection_id);
      setActiveConnection(connection);
      setConnectionType(connection.exchange?.type || "crypto");
      console.log(`✅ Connection loaded: ${connection.exchange?.type || "crypto"}`);
    } catch (err: any) {
      // Silently handle 401 (not logged in) and 404 (no connection) - both are expected
      if (
        err?.status !== 401 &&
        err?.statusCode !== 401 &&
        err?.status !== 404 &&
        err?.statusCode !== 404
      ) {
        console.error("❌ Failed to fetch active connection:", err);
      }
      // When no connection: explicitly set connectionId to null, default to crypto
      setConnectionId(null);
      setActiveConnection(null);
      setConnectionType("crypto");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch connection info once on mount
  useEffect(() => {
    fetchConnectionInfo();
  }, []);

  const value: ExchangeContextType = {
    connectionType,
    connectionId,
    activeConnection,
    isLoading,
    refetch: fetchConnectionInfo,
  };

  return (
    <ExchangeContext.Provider value={value}>
      {children}
    </ExchangeContext.Provider>
  );
}

/**
 * Custom hook to access exchange connection info globally
 * Usage: const { connectionType, connectionId, activeConnection } = useExchange();
 */
export function useExchange(): ExchangeContextType {
  const context = useContext(ExchangeContext);
  if (context === undefined) {
    throw new Error("useExchange must be used within ExchangeProvider");
  }
  return context;
}

