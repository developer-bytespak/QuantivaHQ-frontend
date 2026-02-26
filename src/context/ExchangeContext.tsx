"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { exchangesService, Connection } from "@/lib/api/exchanges.service";

interface ExchangeContextType {
  connectionType: "crypto" | "stocks" | null;
  connectionId: string | null;
  activeConnection: Connection | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
  selectedDashboardType: "crypto" | "stocks" | null;
  setSelectedDashboardType: (type: "crypto" | "stocks") => void;
  hasBothConnections: boolean;
}

const ExchangeContext = createContext<ExchangeContextType | undefined>(undefined);

const DASHBOARD_TYPE_KEY = "quantivahq_dashboard_type";

function getSavedDashboardType(): "crypto" | "stocks" | null {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem(DASHBOARD_TYPE_KEY);
  if (saved === "crypto" || saved === "stocks") return saved;
  return null;
}

export function ExchangeProvider({ children }: { children: ReactNode }) {
  const [connectionType, setConnectionType] = useState<"crypto" | "stocks" | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [activeConnection, setActiveConnection] = useState<Connection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDashboardType, setSelectedDashboardTypeState] = useState<"crypto" | "stocks" | null>(null);
  const [hasBothConnections, setHasBothConnections] = useState(false);

  const applyConnection = useCallback((connection: Connection | null) => {
    if (connection) {
      setConnectionId(connection.connection_id);
      setActiveConnection(connection);
      setConnectionType(connection.exchange?.type || "crypto");
    } else {
      setConnectionId(null);
      setActiveConnection(null);
      setConnectionType("crypto");
    }
  }, []);

  const fetchConnectionForType = useCallback(async (type: "crypto" | "stocks") => {
    try {
      const response = await exchangesService.getActiveConnectionByType(type);
      applyConnection(response.data as Connection);
    } catch {
      applyConnection(null);
    }
  }, [applyConnection]);

  const fetchConnectionInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      // getConnections returns [] on any error (401, network, etc.) so this never throws
      const allConnections = await exchangesService.getConnections();
      const activeCrypto = allConnections.find(
        (c: Connection) => c.status === "active" && c.exchange?.type === "crypto"
      );
      const activeStocks = allConnections.find(
        (c: Connection) => c.status === "active" && c.exchange?.type === "stocks"
      );
      const hasBoth = !!activeCrypto && !!activeStocks;
      setHasBothConnections(hasBoth);

      if (hasBoth) {
        const saved = getSavedDashboardType() || "crypto";
        setSelectedDashboardTypeState(saved);
        localStorage.setItem(DASHBOARD_TYPE_KEY, saved);
        await fetchConnectionForType(saved);
      } else if (activeCrypto || activeStocks) {
        setSelectedDashboardTypeState(null);
        const single = (activeCrypto || activeStocks) as Connection;
        applyConnection(single);
      } else {
        // No connections returned (could be 401 / no account). Fall back to getActiveConnection.
        setSelectedDashboardTypeState(null);
        try {
          const response = await exchangesService.getActiveConnection();
          applyConnection(response.data as Connection);
        } catch {
          applyConnection(null);
        }
      }
    } catch (err: any) {
      applyConnection(null);
      setHasBothConnections(false);
      setSelectedDashboardTypeState(null);
    } finally {
      setIsLoading(false);
    }
  }, [applyConnection, fetchConnectionForType]);

  useEffect(() => {
    fetchConnectionInfo();
  }, []);

  const setSelectedDashboardType = useCallback((type: "crypto" | "stocks") => {
    localStorage.setItem(DASHBOARD_TYPE_KEY, type);
    window.location.reload();
  }, []);

  const value: ExchangeContextType = {
    connectionType,
    connectionId,
    activeConnection,
    isLoading,
    refetch: fetchConnectionInfo,
    selectedDashboardType,
    setSelectedDashboardType,
    hasBothConnections,
  };

  return (
    <ExchangeContext.Provider value={value}>
      {children}
    </ExchangeContext.Provider>
  );
}

/**
 * Custom hook to access exchange connection info globally
 * Usage: const { connectionType, connectionId, activeConnection, hasBothConnections, selectedDashboardType, setSelectedDashboardType } = useExchange();
 */
export function useExchange(): ExchangeContextType {
  const context = useContext(ExchangeContext);
  if (context === undefined) {
    throw new Error("useExchange must be used within ExchangeProvider");
  }
  return context;
}
