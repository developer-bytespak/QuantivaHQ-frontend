"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { exchangesService, Connection } from "@/lib/api/exchanges.service";

interface ExchangeContextType {
  connectionType: "crypto" | "stocks" | null;
  connectionId: string | null;
  activeConnection: Connection | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const ExchangeContext = createContext<ExchangeContextType | undefined>(undefined);

export function ExchangeProvider({ children }: { children: ReactNode }) {
  const [connectionType, setConnectionType] = useState<"crypto" | "stocks" | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [activeConnection, setActiveConnection] = useState<Connection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFetched, setIsFetched] = useState(false);

  const fetchConnectionInfo = async () => {
    // Prevent multiple fetches
    if (isFetched) return;
    
    setIsLoading(true);
    setError(null);
    try {
      console.log("🔄 Fetching active connection...");
      const response = await exchangesService.getActiveConnection();
      const connection = response.data as Connection;
      
      setConnectionId(connection.connection_id);
      setActiveConnection(connection);
      setConnectionType(connection.exchange?.type || "crypto");
      console.log(`✅ Connection loaded: ${connection.exchange?.type || "crypto"}`);
      setIsFetched(true);
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
      // Default to crypto on error
      setConnectionType("crypto");
      setIsFetched(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch connection info once on mount
  useEffect(() => {
    fetchConnectionInfo();
  }, []);

  const value: ExchangeContextType = {
    connectionType,
    connectionId,
    activeConnection,
    isLoading,
    error,
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

