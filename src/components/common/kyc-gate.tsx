"use client";

import { ReactNode, isValidElement, cloneElement, useMemo } from "react";
import useKycStore from "@/state/kyc-store";

/**
 * Gates action buttons (trade, deposit, withdraw, VC pool, copy trade) behind
 * KYC approval. If the user is not yet approved, the child button is rendered
 * disabled with a tooltip explaining why.
 *
 * Usage:
 *   <KycGate feature="trade">
 *     <button onClick={placeOrder}>Buy</button>
 *   </KycGate>
 */

export type KycGatedFeature =
  | "trade"
  | "deposit"
  | "withdraw"
  | "vc_pool"
  | "copy_trade";

const FEATURE_MESSAGE: Record<KycGatedFeature, string> = {
  trade: "Complete identity verification to start trading.",
  deposit: "Complete identity verification to make deposits.",
  withdraw: "Complete identity verification to withdraw funds.",
  vc_pool: "Complete identity verification to join a VC Pool.",
  copy_trade: "Complete identity verification to use copy trading.",
};

export function useKycGuard() {
  const status = useKycStore((s) => s.status);
  const isApproved = status === "approved";
  return {
    isApproved,
    isBlocked: !isApproved,
    status,
  };
}

interface KycGateProps {
  feature: KycGatedFeature;
  children: ReactNode;
  /** When true, render children normally even if blocked (for non-action views). */
  renderEvenIfBlocked?: boolean;
}

export function KycGate({ feature, children, renderEvenIfBlocked = false }: KycGateProps) {
  const { isApproved } = useKycGuard();
  const message = FEATURE_MESSAGE[feature];

  const gated = useMemo(() => {
    if (isApproved || renderEvenIfBlocked) return children;
    if (!isValidElement(children)) return children;
    const existing = (children.props as Record<string, unknown>) || {};
    return cloneElement(children as any, {
      ...existing,
      disabled: true,
      title: message,
      "aria-disabled": true,
      onClick: (e: any) => {
        e?.preventDefault?.();
        e?.stopPropagation?.();
      },
      className: `${(existing as any).className ?? ""} opacity-50 cursor-not-allowed`.trim(),
    });
  }, [isApproved, renderEvenIfBlocked, children, message]);

  return <>{gated}</>;
}
