"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from "react";
import { exchangesService, Connection } from "@/lib/api/exchanges.service";
import { adminExchangesService } from "@/lib/api/admin-exchanges.service";
import { hasAdminToken } from "@/lib/api/vcpool-admin/client";

interface ExchangeContextType {
  connectionType: "crypto" | "stocks" | null;
  connectionId: string | null;
  activeConnection: Connection | null;
  allConnections: Connection[];
  isLoading: boolean;
  refetch: () => Promise<void>;
  selectedDashboardType: "crypto" | "stocks" | null;
  setSelectedDashboardType: (type: "crypto" | "stocks") => void;
  hasBothConnections: boolean;
}

const ExchangeContext = createContext<ExchangeContextType | undefined>(undefined);

const DASHBOARD_TYPE_KEY = "quantivahq_dashboard_type";

function isAdminArea(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.pathname.startsWith("/admin");
}

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
  const [allConnections, setAllConnections] = useState<Connection[]>([]);

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

  const fetchConnectionForType = useCallback(
    async (type: "crypto" | "stocks") => {
      const useAdmin = isAdminArea() && hasAdminToken();
      try {
        if (useAdmin) {
          const res = await adminExchangesService.getActiveConnectionByType(type);
          if (res?.data) {
            applyConnection(res.data as unknown as Connection);
          } else {
            applyConnection(null);
          }
        } else {
          const response = await exchangesService.getActiveConnectionByType(type);
          applyConnection(response.data as Connection);
        }
      } catch {
        applyConnection(null);
      }
    },
    [applyConnection]
  );

  const fetchConnectionInfo = useCallback(async () => {
    setIsLoading(true);
    const useAdmin = isAdminArea() && hasAdminToken();
    try {
      if (useAdmin) {
        const fetched = await adminExchangesService.getConnections();
        setAllConnections(fetched);
        const activeCrypto = fetched.find(
          (c: Connection) => c.status === "active" && c.exchange?.type === "crypto"
        );
        const activeStocks = fetched.find(
          (c: Connection) => c.status === "active" && c.exchange?.type === "stocks"
        );
        const hasBoth = !!activeCrypto && !!activeStocks;
        setHasBothConnections(hasBoth);

        if (hasBoth) {
          const saved = getSavedDashboardType() || "crypto";
          setSelectedDashboardTypeState(saved);
          if (typeof window !== "undefined") {
            localStorage.setItem(DASHBOARD_TYPE_KEY, saved);
          }
          await fetchConnectionForType(saved);
        } else if (activeCrypto || activeStocks) {
          setSelectedDashboardTypeState(null);
          const single = (activeCrypto || activeStocks) as Connection;
          applyConnection(single);
        } else {
          setSelectedDashboardTypeState(null);
          applyConnection(null);
        }
      } else {
        // getConnections returns [] on any error (401, network, etc.) so this never throws
        const fetched = await exchangesService.getConnections();
        setAllConnections(fetched);
        const activeCrypto = fetched.find(
          (c: Connection) => c.status === "active" && c.exchange?.type === "crypto"
        );
        const activeStocks = fetched.find(
          (c: Connection) => c.status === "active" && c.exchange?.type === "stocks"
        );
        const hasBoth = !!activeCrypto && !!activeStocks;
        setHasBothConnections(hasBoth);

        if (hasBoth) {
          const saved = getSavedDashboardType() || "crypto";
          setSelectedDashboardTypeState(saved);
          if (typeof window !== "undefined") {
            localStorage.setItem(DASHBOARD_TYPE_KEY, saved);
          }
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
      }
    } catch {
      applyConnection(null);
      setAllConnections([]);
      setHasBothConnections(false);
      setSelectedDashboardTypeState(null);
    } finally {
      setIsLoading(false);
    }
  }, [applyConnection, fetchConnectionForType]);

  useEffect(() => {
    fetchConnectionInfo();
  }, [fetchConnectionInfo]);

  const setSelectedDashboardType = useCallback((type: "crypto" | "stocks") => {
    localStorage.setItem(DASHBOARD_TYPE_KEY, type);
    window.location.reload();
  }, []);

  const value = useMemo<ExchangeContextType>(() => ({
    connectionType,
    connectionId,
    activeConnection,
    allConnections,
    isLoading,
    refetch: fetchConnectionInfo,
    selectedDashboardType,
    setSelectedDashboardType,
    hasBothConnections,
  }), [connectionType, connectionId, activeConnection, allConnections,
       isLoading, fetchConnectionInfo, selectedDashboardType,
       setSelectedDashboardType, hasBothConnections]);

  return (
    <ExchangeContext.Provider value={value}>
      {children}
    </ExchangeContext.Provider>
  );
}

/**
 * Custom hook to access exchange connection info globally
 * Usage: const { connectionType, connectionId, activeConnection, allConnections, hasBothConnections, selectedDashboardType, setSelectedDashboardType } = useExchange();
 */
export function useExchange(): ExchangeContextType {
  const context = useContext(ExchangeContext);
  if (context === undefined) {
    throw new Error("useExchange must be used within ExchangeProvider");
  }
  return context;
}
