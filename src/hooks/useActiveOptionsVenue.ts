"use client";

import { useEffect, useRef } from "react";
import { useExchange } from "@/context/ExchangeContext";
import { optionsService } from "@/lib/api/options.service";
import {
  useOptionsStore,
  type OptionsApprovalLevel,
  type OptionsVenue,
} from "@/state/options-store";

/**
 * Derive the active options venue from the user's active exchange
 * connection (via ExchangeContext) and push it into the Zustand options
 * store. Also fetches the Alpaca options approval level so the UI can gate
 * multi-leg entry points.
 *
 * Mapping:
 *   connectionType === "crypto" → BINANCE (crypto options)
 *   connectionType === "stocks" → ALPACA  (US equity options)
 *
 * The page mounts this hook once; it writes `venue`, `connectionId`, and
 * `approvalLevel` into the store and wipes prior per-venue data on change
 * so we never render BTC chain rows under a stock venue (or vice versa).
 */
export function useActiveOptionsVenue() {
  const { connectionId, connectionType } = useExchange();
  const resetForVenueChange = useOptionsStore((s) => s.resetForVenueChange);
  const currentVenue = useOptionsStore((s) => s.venue);
  const currentConnectionId = useOptionsStore((s) => s.connectionId);
  const prevKey = useRef<string>("");

  useEffect(() => {
    if (!connectionId || !connectionType) return;
    const venue: OptionsVenue = connectionType === "stocks" ? "ALPACA" : "BINANCE";
    const key = `${venue}:${connectionId}`;

    // No-op if nothing changed.
    if (prevKey.current === key && currentVenue === venue && currentConnectionId === connectionId) {
      return;
    }
    prevKey.current = key;

    let cancelled = false;
    (async () => {
      let approvalLevel: OptionsApprovalLevel = 3; // Binance default
      let isPaper = false;
      if (venue === "ALPACA") {
        try {
          const approval = await optionsService.getApprovalStatus(connectionId);
          approvalLevel = (approval?.level ?? 0) as OptionsApprovalLevel;
          // isPaper isn't currently returned; approval endpoint will surface it
          // in a follow-up when needed for the paper/live pill.
          isPaper = Boolean((approval as any)?.isPaper);
        } catch {
          approvalLevel = 0;
        }
      }
      if (cancelled) return;
      resetForVenueChange({
        venue,
        connectionId,
        isPaper,
        approvalLevel,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [connectionId, connectionType, resetForVenueChange, currentVenue, currentConnectionId]);
}
