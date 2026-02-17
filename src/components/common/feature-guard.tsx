"use client";

import { ReactNode } from "react";
import useSubscriptionStore from "@/state/subscription-store";
import { FeatureType, PlanTier } from "@/mock-data/subscription-dummy-data";
import Link from "next/link";

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
    <div className="absolute inset-0 min-h-[280px] bg-black/60 backdrop-blur-sm rounded-lg flex items-center justify-center z-20">
      <div className="text-center px-4 py-6 w-full max-w-sm">
        <h3 className="text-white font-semibold mb-2 text-base sm:text-lg">🔒 Feature Locked</h3>
        <p className="text-sm text-slate-300 mb-4 break-words leading-relaxed">
          {message || defaultMessage}
        </p>
        {currentSubscription.tier !== PlanTier.ELITE && (
          <Link
            href="/dashboard/settings/subscription"
            className="inline-block px-6 py-2.5 bg-[#fc4f02] text-white rounded-lg hover:bg-[#e04502] transition-colors text-sm font-semibold"
          >
            Upgrade Now
          </Link>
        )}
      </div>
    </div>
  );
}
