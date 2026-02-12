"use client";

import { ReactNode } from "react";
import useSubscriptionStore from "@/state/subscription-store";
import { FeatureType, PlanTier } from "@/mock-data/subscription-dummy-data";

interface FeatureGuardProps {
  feature: FeatureType;
  children: ReactNode;
  fallback?: ReactNode;
  allowedTiers?: PlanTier[];
}

export function FeatureGuard({
  feature,
  children,
  fallback,
  allowedTiers,
}: FeatureGuardProps) {
  const { currentSubscription, canAccessFeature, isFeatureLimitReached } =
    useSubscriptionStore();

  // Check if subscription is loaded
  if (!currentSubscription) {
    return fallback ? <>{fallback}</> : null;
  }

  // Check if user's tier is in allowedTiers (if specified)
  if (allowedTiers && !allowedTiers.includes(currentSubscription.tier)) {
    return fallback ? <>{fallback}</> : null;
  }

  // Check if feature is accessible
  if (!canAccessFeature(feature)) {
    return fallback ? <>{fallback}</> : null;
  }

  // Check if feature limit is reached
  if (isFeatureLimitReached(feature)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

interface LockedFeatureProps {
  featureName: string;
  requiredTier?: PlanTier;
  message?: string;
}

export function LockedFeatureOverlay({ featureName, requiredTier, message }: LockedFeatureProps) {
  const { currentSubscription, setShowUpgradeModal } = useSubscriptionStore();

  if (!currentSubscription) {
    return null;
  }

  const defaultMessage = `${featureName} is only available in ${requiredTier || "PRO"} plan and above`;

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
        <div className="text-center px-4">
          <h3 className="text-white font-semibold mb-2">🔒 Feature Locked</h3>
          <p className="text-sm text-slate-300 mb-3">{message || defaultMessage}</p>
          {currentSubscription.tier !== PlanTier.ELITE && (
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="px-4 py-2 bg-[#fc4f02] text-white rounded-lg hover:bg-[#e04502] transition-colors text-sm font-semibold"
            >
              Upgrade Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
