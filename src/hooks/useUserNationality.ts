"use client";

import { useState, useEffect } from "react";
import { apiRequest } from "../lib/api/client";

interface UserNationality {
  nationality: string | null;
  isUS: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch and check user's nationality from the backend
 * Determines if user is a US national for Binance vs Binance.US routing
 */
export function useUserNationality(): UserNationality {
  const [state, setState] = useState<UserNationality>({
    nationality: null,
    isUS: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchNationality() {
      try {
        const response = await apiRequest<never, {
          nationality?: string | null;
        }>({
          path: "/users/me",
          method: "GET",
        });

        const nationality = response.nationality || null;
        const isUS = isUSNational(nationality);

        setState({
          nationality,
          isUS,
          loading: false,
          error: null,
        });
      } catch (error: any) {
        console.error("Failed to fetch user nationality:", error);
        setState({
          nationality: null,
          isUS: false,
          loading: false,
          error: error.message || "Failed to fetch user data",
        });
      }
    }

    fetchNationality();
  }, []);

  return state;
}

/**
 * Helper function to check if nationality string indicates US national
 */
export function isUSNational(nationality: string | null): boolean {
  if (!nationality) return false;

  const normalized = nationality.toLowerCase().trim();
  const usVariants = ["us", "usa", "united states", "united states of america"];

  return usVariants.includes(normalized);
}
